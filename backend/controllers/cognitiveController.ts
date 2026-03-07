import { Request, Response } from 'express';
import CognitiveProfile from '../models/CognitiveProfile';
import QuizResult from '../models/QuizResult';
import axios from 'axios';

interface ActivityData {
  type: string;
  accuracy: number;
  responseTime: number;
  attempts: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SubmitResultsRequest {
  studentId: string;
  activities: ActivityData[];
}

/**
 * Submit cognitive test results and generate brain map analysis
 */
export const submitCognitiveResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, activities } = req.body as SubmitResultsRequest;

    // Validate request
    if (!studentId || !activities || activities.length === 0) {
      res.status(400).json({ message: 'Missing required fields: studentId or activities' });
      return;
    }

    console.log('🧠 Processing cognitive analysis for student:', studentId);
    console.log('Activities received:', activities.length);

    // Store raw test results in MongoDB
    const quizResults = activities.map(activity => ({
      userId: studentId,
      quizType: activity.type,
      score: activity.accuracy,
      timeTaken: activity.responseTime / 1000, // Convert ms to seconds
      accuracy: activity.accuracy,
      difficultyLevel: activity.difficulty,
      answers: [{ responseTime: activity.responseTime, attempts: activity.attempts }],
    }));

    await QuizResult.insertMany(quizResults);
    console.log('✅ Stored', quizResults.length, 'quiz results in MongoDB');

    // Prepare data for AI engine
    const aiPayload = {
      activities: activities.map(a => ({
        quizType: a.type,
        score: a.accuracy,
        timeTaken: a.responseTime / 1000,
        accuracy: a.accuracy,
        difficultyLevel: a.difficulty,
      })),
      student_age: 10, // Default age, can be made dynamic
    };

    console.log('🤖 Sending data to AI engine...');
    
    // Call AI engine for cognitive analysis
    const aiServiceUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    let aiResponse;
    
    try {
      aiResponse = await axios.post(`${aiServiceUrl}/analyze`, aiPayload, {
        timeout: 10000, // 10 second timeout
      });
      console.log('✅ AI analysis completed successfully');
    } catch (aiError: any) {
      console.error('⚠️ AI Engine error:', aiError.message);
      console.log('Using fallback cognitive analysis...');
      
      // Fallback: Generate basic cognitive profile without AI
      aiResponse = {
        data: generateFallbackProfile(activities),
      };
    }

    const aiData = aiResponse.data;
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Map AI response to cognitive profile schema
    const cognitiveProfileData = {
      userId: studentId,
      visualMemory: aiData.memory || aiData.visualMemory || 50,
      logicalReasoning: aiData.logicalThinking || aiData.logicalReasoning || 50,
      attentionFocus: aiData.attentionFocus || 70,
      processingSpeed: aiData.processingSpeed || 50,
      readingComprehension: aiData.readingSkill || aiData.readingComprehension || 50,
      learningStyle: aiData.learningStyle || aiData.learningstyle || 'visual',
      strengths: aiData.strengths || extractStrengths(aiData),
      weaknesses: aiData.weaknesses || extractWeaknesses(aiData),
      recommendations: aiData.recommendations || [],
    };

    console.log('💾 Storing cognitive profile...');

    // Upsert cognitive profile (update if exists, create if not)
    const profile = await CognitiveProfile.findOneAndUpdate(
      { userId: studentId },
      { ...cognitiveProfileData, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log('✅ Cognitive profile stored successfully');

    // Return complete cognitive profile to frontend
    res.status(200).json({
      success: true,
      message: 'Cognitive analysis completed successfully',
      profile: {
        visualMemory: profile.visualMemory,
        logicalReasoning: profile.logicalReasoning,
        attentionFocus: profile.attentionFocus,
        processingSpeed: profile.processingSpeed,
        readingComprehension: profile.readingComprehension,
        learningStyle: profile.learningStyle,
        strengths: profile.strengths,
        weaknesses: profile.weaknesses,
        recommendations: profile.recommendations,
        createdAt: profile.createdAt,
      },
    });

  } catch (error: any) {
    console.error('❌ Cognitive analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to generate cognitive profile',
      error: error.message,
    });
  }
};

/**
 * Get cognitive profile for a student
 */
export const getCognitiveProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const profile = await CognitiveProfile.findOne({ userId })
      .populate('userId', 'name age class');

    if (!profile) {
      res.status(404).json({ message: 'Cognitive profile not found' });
      return;
    }

    res.json({
      success: true,
      profile: {
        visualMemory: profile.visualMemory,
        logicalReasoning: profile.logicalReasoning,
        attentionFocus: profile.attentionFocus,
        processingSpeed: profile.processingSpeed,
        readingComprehension: profile.readingComprehension,
        learningStyle: profile.learningStyle,
        strengths: profile.strengths,
        weaknesses: profile.weaknesses,
        recommendations: profile.recommendations,
        createdAt: profile.createdAt,
      },
    });

  } catch (error: any) {
    console.error('Get cognitive profile error:', error);
    res.status(500).json({ message: 'Server error retrieving cognitive profile' });
  }
};

/**
 * Generate fallback cognitive profile when AI engine is unavailable
 */
const generateFallbackProfile = (activities: ActivityData[]) => {
  const profile: any = {
    memory: 50,
    logicalThinking: 50,
    readingSkill: 50,
    processingSpeed: 50,
    attentionFocus: 50,
    learningStyle: 'visual',
    recommendations: [],
    strengths: [],
    weaknesses: [],
  };

  // Calculate scores based on activity performance
  activities.forEach(activity => {
    const difficultyMultiplier = activity.difficulty === 'hard' ? 1.2 : activity.difficulty === 'medium' ? 1.0 : 0.8;
    const adjustedScore = Math.min(100, activity.accuracy * difficultyMultiplier);

    switch (activity.type) {
      case 'memory':
        profile.memory = adjustedScore;
        break;
      case 'pattern':
        profile.logicalThinking = adjustedScore;
        break;
      case 'logic':
        profile.logicalThinking = Math.max(profile.logicalThinking, adjustedScore);
        break;
      case 'reading':
        profile.readingSkill = adjustedScore;
        break;
      case 'speed':
        profile.processingSpeed = adjustedScore;
        break;
    }
  });

  // Determine learning style based on highest score
  const styles = [
    { name: 'visual', score: profile.visualLearning || 50 },
    { name: 'logical', score: profile.logicalThinking },
    { name: 'verbal', score: profile.readingSkill },
    { name: 'kinesthetic', score: profile.processingSpeed },
  ];
  
  styles.sort((a, b) => b.score - a.score);
  profile.learningStyle = styles[0].name;

  // Extract strengths and weaknesses
  profile.strengths = styles.filter(s => s.score >= 70).map(s => `${s.name} learning`);
  profile.weaknesses = styles.filter(s => s.score < 50).map(s => `${s.name} learning`);

  // Generate basic recommendations
  profile.recommendations = generateBasicRecommendations(profile);

  return profile;
};

/**
 * Extract strengths from AI response
 */
const extractStrengths = (aiData: any): string[] => {
  const strengths: string[] = [];
  
  if (aiData.memory > 70) strengths.push('Strong visual memory');
  if (aiData.logicalThinking > 70) strengths.push('Excellent logical reasoning');
  if (aiData.readingSkill > 70) strengths.push('Advanced reading comprehension');
  if (aiData.processingSpeed > 70) strengths.push('Fast information processing');
  if (aiData.attentionFocus > 70) strengths.push('Sustained attention span');

  return strengths.length > 0 ? strengths : ['Balanced cognitive abilities'];
};

/**
 * Extract weaknesses from AI response
 */
const extractWeaknesses = (aiData: any): string[] => {
  const weaknesses: string[] = [];
  
  if (aiData.memory < 50) weaknesses.push('Visual memory development needed');
  if (aiData.logicalThinking < 50) weaknesses.push('Logical reasoning practice recommended');
  if (aiData.readingSkill < 50) weaknesses.push('Reading comprehension support');
  if (aiData.processingSpeed < 50) weaknesses.push('Processing speed exercises');
  if (aiData.attentionFocus < 50) weaknesses.push('Attention training beneficial');

  return weaknesses;
};

/**
 * Generate basic recommendations based on profile
 */
const generateBasicRecommendations = (profile: any): string[] => {
  const recommendations: string[] = [];

  if (profile.memory < 60) {
    recommendations.push('Practice memory games like matching pairs and sequence recall');
  }
  if (profile.logicalThinking < 60) {
    recommendations.push('Engage in puzzle-solving and pattern recognition activities');
  }
  if (profile.readingSkill < 60) {
    recommendations.push('Read daily and discuss stories to improve comprehension');
  }
  if (profile.processingSpeed < 60) {
    recommendations.push('Try timed activities to build quick thinking skills');
  }
  if (profile.attentionFocus < 60) {
    recommendations.push('Practice focused attention with mindfulness exercises');
  }

  // Add learning style-specific recommendations
  switch (profile.learningStyle) {
    case 'visual':
      recommendations.push('Use diagrams, charts, and visual aids for learning');
      break;
    case 'logical':
      recommendations.push('Break problems into logical steps and look for patterns');
      break;
    case 'verbal':
      recommendations.push('Read aloud and discuss concepts to reinforce learning');
      break;
    case 'kinesthetic':
      recommendations.push('Incorporate hands-on activities and movement breaks');
      break;
  }

  return recommendations;
};
