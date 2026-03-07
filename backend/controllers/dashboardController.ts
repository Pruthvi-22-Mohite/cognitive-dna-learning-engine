import { Request, Response } from 'express';
import QuizResult from '../models/QuizResult';
import CognitiveProfile from '../models/CognitiveProfile';
import axios from 'axios';

interface TestSubmission {
  studentId: string;
  activityType: string;
  accuracy: number;
  responseTime: number;
  attempts: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Submit test result and store in MongoDB
 */
export const submitTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, activityType, accuracy, responseTime, attempts, difficulty } = req.body as TestSubmission;

    // Validate request
    if (!studentId || !activityType || accuracy === undefined) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    console.log('📊 Storing test result:', { studentId, activityType, accuracy });

    // Store test result in MongoDB
    const testResult = new QuizResult({
      userId: studentId,
      quizType: activityType,
      score: accuracy,
      timeTaken: responseTime / 1000, // Convert ms to seconds
      accuracy: accuracy,
      difficultyLevel: difficulty,
      answers: [{ responseTime, attempts }],
    });

    await testResult.save();
    console.log('✅ Test result stored successfully');

    // Check if student has completed all 5 activities
    const allActivities = ['memory', 'pattern', 'logic', 'reading', 'speed'];
    const completedActivities = await QuizResult.find({ userId: studentId }).distinct('quizType');
    
    console.log('📋 Completed activities:', completedActivities);
    console.log('🎯 All activities:', allActivities);

    // If all 5 activities completed, trigger AI analysis
    const allCompleted = allActivities.every(activity => completedActivities.includes(activity));
    
    if (allCompleted) {
      console.log('🎉 All activities completed! Triggering AI analysis...');
      await triggerAIAnalysis(studentId);
    } else {
      console.log(`⏳ ${5 - completedActivities.length} activities remaining`);
    }

    res.status(200).json({
      success: true,
      message: 'Test result submitted successfully',
      testId: testResult._id,
      completedActivities: completedActivities.length,
      totalActivities: 5,
      allCompleted,
    });

  } catch (error: any) {
    console.error('❌ Submit test error:', error);
    res.status(500).json({ 
      message: 'Failed to submit test result',
      error: error.message,
    });
  }
};

/**
 * Get student dashboard data
 */
export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Get all test results for this student
    const testResults = await QuizResult.find({ userId: studentId }).sort({ date: -1 });
    
    // Get cognitive profile if exists
    const cognitiveProfile = await CognitiveProfile.findOne({ userId: studentId });

    // Calculate statistics
    const activitiesCompleted = testResults.length;
    const averageScore = testResults.length > 0
      ? Math.round(testResults.reduce((sum, r) => sum + r.accuracy, 0) / testResults.length)
      : 0;

    // Get unique activities completed
    const completedActivities = [...new Set(testResults.map(r => r.quizType))];

    // Calculate brain badges (unlock based on performance)
    const brainBadges = calculateBrainBadges(testResults);

    // Prepare cognitive scores
    const cognitiveScores = cognitiveProfile ? {
      visualMemory: cognitiveProfile.visualMemory,
      logicalReasoning: cognitiveProfile.logicalReasoning,
      attentionFocus: cognitiveProfile.attentionFocus,
      processingSpeed: cognitiveProfile.processingSpeed,
      readingComprehension: cognitiveProfile.readingComprehension,
    } : null;

    res.status(200).json({
      success: true,
      data: {
        activitiesCompleted,
        averageScore,
        completedActivities,
        brainBadges,
        cognitiveScores,
        learningStyle: cognitiveProfile?.learningStyle || null,
        strengths: cognitiveProfile?.strengths || [],
        weaknesses: cognitiveProfile?.weaknesses || [],
        recommendations: cognitiveProfile?.recommendations || [],
        hasBrainMap: !!cognitiveProfile,
      },
    });

  } catch (error: any) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
};

/**
 * Get recent activity results
 */
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const results = await QuizResult.find({ userId: studentId })
      .sort({ date: -1 })
      .limit(limit)
      .select('quizType score accuracy difficultyLevel date');

    res.json({
      success: true,
      results,
    });

  } catch (error: any) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Trigger AI analysis when all activities completed
 */
const triggerAIAnalysis = async (studentId: string): Promise<void> => {
  try {
    // Get all test results for this student
    const testResults = await QuizResult.find({ userId: studentId })
      .sort({ date: -1 })
      .limit(5); // Most recent attempt for each activity

    if (testResults.length < 5) {
      console.warn('Not enough results for analysis');
      return;
    }

    // Prepare payload for AI engine
    const aiPayload = {
      student_age: 10, // Default age
      activities: testResults.map(r => ({
        quizType: r.quizType,
        score: r.score,
        timeTaken: r.timeTaken,
        accuracy: r.accuracy,
        difficultyLevel: r.difficultyLevel,
      })),
    };

    console.log('🤖 Sending data to AI engine...', aiPayload);

    // Call AI engine
    const aiServiceUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    let aiResponse;

    try {
      aiResponse = await axios.post(`${aiServiceUrl}/analyze`, aiPayload, {
        timeout: 10000,
      });
      console.log('✅ AI analysis completed');
    } catch (aiError: any) {
      console.error('⚠️ AI Engine error:', aiError.message);
      console.log('Using fallback analysis...');
      aiResponse = { data: generateFallbackProfile(testResults) };
    }

    const aiData = aiResponse.data;
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Map AI response to cognitive profile schema
    const profileData = {
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

    // Upsert cognitive profile
    await CognitiveProfile.findOneAndUpdate(
      { userId: studentId },
      { ...profileData, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log('✅ Cognitive profile stored successfully');

  } catch (error: any) {
    console.error('❌ AI analysis trigger error:', error);
  }
};

/**
 * Calculate brain badges based on performance
 */
const calculateBrainBadges = (testResults: any[]) => {
  const badges: any[] = [];
  
  // Group by activity type
  const byType: any = {};
  testResults.forEach(r => {
    if (!byType[r.quizType]) byType[r.quizType] = [];
    byType[r.quizType].push(r);
  });

  // Award badges based on scores
  Object.keys(byType).forEach(type => {
    const bestScore = Math.max(...byType[type].map((r: any) => r.accuracy));
    
    if (bestScore >= 90) {
      badges.push({ type, level: 'gold', icon: '🥇' });
    } else if (bestScore >= 70) {
      badges.push({ type, level: 'silver', icon: '🥈' });
    } else if (bestScore >= 50) {
      badges.push({ type, level: 'bronze', icon: '🥉' });
    }
  });

  return badges;
};

/**
 * Generate fallback profile when AI unavailable
 */
const generateFallbackProfile = (testResults: any[]) => {
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

  // Calculate scores from test results
  testResults.forEach(result => {
    const difficultyMultiplier = result.difficultyLevel === 'hard' ? 1.2 : result.difficultyLevel === 'medium' ? 1.0 : 0.8;
    const adjustedScore = Math.min(100, result.accuracy * difficultyMultiplier);

    switch (result.quizType) {
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

  // Determine learning style
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
 * Generate basic recommendations
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
