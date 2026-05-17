import { Request, Response } from 'express';
import CognitiveProfile from '../models/CognitiveProfile';
import QuizResult from '../models/QuizResult';
import aiService from '../services/aiService';

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

    let aiData;
    
    try {
      aiData = await aiService.analyzeCognitiveData({
        userId: studentId,
        results: activities.map(a => ({
          quizType: a.type,
          score: a.accuracy,
          timeTaken: a.responseTime / 1000,
          accuracy: a.accuracy,
          difficultyLevel: a.difficulty,
        })) as any
      });
      console.log('✅ AI analysis completed successfully');
    } catch (aiError: any) {
      console.error('⚠️ AI Engine error:', aiError.message);
      console.log('Using fallback cognitive analysis...');
      aiData = generateFallbackProfile(activities);
    }

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
      recommendedVideos: aiData.recommendedVideos || [],
      reportGuidelines: aiData.reportGuidelines || [],
      detailedAnalysisReport: aiData.detailedAnalysisReport || '',
      diagnosticSummary: aiData.diagnosticSummary || '',
      remedialPath: aiData.remedialPath || [],
      overallGrade: aiData.overallGrade || 'Developing Learner',
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
        recommendedVideos: profile.recommendedVideos,
        reportGuidelines: profile.reportGuidelines,
        detailedAnalysisReport: profile.detailedAnalysisReport,
        diagnosticSummary: profile.diagnosticSummary,
        remedialPath: profile.remedialPath,
        overallGrade: profile.overallGrade,
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

    let profile = await CognitiveProfile.findOne({ userId })
      .populate('userId', 'name age class');

    if (!profile) {
      // If profile not found, check if they have enough quizzes to generate it
      const testResults = await QuizResult.find({ userId }).sort({ date: -1 }).limit(5);
      
      if (testResults.length >= 3) {
        console.log('Generating missing profile on-the-fly...');
        const aiData = generateFallbackProfile(testResults as any);
        
        const profileData = {
          userId,
          visualMemory: aiData.memory || 50,
          logicalReasoning: aiData.logicalThinking || 50,
          attentionFocus: aiData.attentionFocus || 70,
          processingSpeed: aiData.processingSpeed || 50,
          readingComprehension: aiData.readingSkill || 50,
          learningStyle: aiData.learningStyle || 'visual',
          strengths: aiData.strengths || extractStrengths(aiData),
          weaknesses: aiData.weaknesses || extractWeaknesses(aiData),
          recommendations: aiData.recommendations || [],
          recommendedVideos: aiData.recommendedVideos || [],
          reportGuidelines: aiData.reportGuidelines || [],
          detailedAnalysisReport: aiData.detailedAnalysisReport || '',
          diagnosticSummary: aiData.diagnosticSummary || '',
          remedialPath: aiData.remedialPath || [],
          overallGrade: aiData.overallGrade || 'Developing Learner',
        };

        profile = await CognitiveProfile.findOneAndUpdate(
          { userId },
          { ...profileData, createdAt: new Date() },
          { upsert: true, new: true }
        ).populate('userId', 'name age class');
      } else {
        res.status(404).json({ message: 'Cognitive profile not found' });
        return;
      }
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
        recommendedVideos: profile.recommendedVideos,
        reportGuidelines: profile.reportGuidelines,
        detailedAnalysisReport: profile.detailedAnalysisReport,
        diagnosticSummary: profile.diagnosticSummary,
        remedialPath: profile.remedialPath,
        overallGrade: profile.overallGrade,
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
    recommendedVideos: [],
    reportGuidelines: [],
    detailedAnalysisReport: '',
    diagnosticSummary: '',
    remedialPath: [],
    overallGrade: 'Developing Learner',
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
    { name: 'visual', score: profile.memory || 50 },
    { name: 'logical', score: profile.logicalThinking },
    { name: 'verbal', score: profile.readingSkill },
    { name: 'kinesthetic', score: profile.processingSpeed },
  ];
  
  styles.sort((a, b) => b.score - a.score);
  profile.learningStyle = styles[0].name;

  // Extract strengths and weaknesses
  profile.strengths = [
    `${styles[0].name} learning`,
    `${styles[1].name} learning`
  ];
  profile.weaknesses = [
    `${styles[styles.length - 1].name} learning`,
    `${styles[styles.length - 2].name} learning`
  ];

  // Generate basic recommendations
  profile.recommendations = generateBasicRecommendations(profile);

  // Dynamic Professional Analysis Generation
  const sortedScores = [
    { trait: 'Visual Memory', score: profile.memory, id: 'memory' },
    { trait: 'Logical Reasoning', score: profile.logicalThinking, id: 'logic' },
    { trait: 'Reading Comprehension', score: profile.readingSkill, id: 'reading' },
    { trait: 'Processing Speed', score: profile.processingSpeed, id: 'speed' }
  ].sort((a, b) => b.score - a.score);

  const topTrait = sortedScores[0];
  const lowestTrait = sortedScores[sortedScores.length - 1];

  // 1. Diagnostic Summary
  profile.diagnosticSummary = `Cognitive Evaluation Report for 10-12 Year Old Demographic
  
Primary Cognitive Modality: ${topTrait.trait}-Dominant
Developmental Area of Focus: ${lowestTrait.trait}

The student demonstrates a solid baseline in cognitive development expected for the 4th-6th grade standard. Their primary strength lies in ${topTrait.trait} (${Math.round(topTrait.score)}%), indicating an excellent ability to process and retain information in this domain. Conversely, ${lowestTrait.trait} (${Math.round(lowestTrait.score)}%) presents a high-growth opportunity. Targeted interventions utilizing game-based mechanics and real-world applications are highly recommended.`;

  // 2. Comprehensive Narrative Analysis
  profile.detailedAnalysisReport = `Detailed Cognitive Assessment:
  
1. Logical & Critical Thinking: ${profile.logicalThinking > 65 ? 'The student excels at deductive reasoning, effectively connecting abstract concepts—a crucial skill for advanced mathematics and coding.' : 'The student is developing foundational logical reasoning. Practicing step-by-step problem-solving through puzzles will build resilience in complex subjects.'}

2. Visual & Working Memory: ${profile.memory > 65 ? 'Exceptional visual retention allows the student to grasp spatial concepts and diagrams with ease. This accelerates learning in geometry and the sciences.' : 'Working memory shows room for expansion. Utilizing mnemonic devices and chunking information into smaller bits will significantly enhance recall.'}

3. Reading & Linguistic Comprehension: ${profile.readingSkill > 65 ? 'Strong reading comprehension enables deep engagement with texts, indicating a readiness for higher-level literature and critical analysis.' : 'To elevate reading comprehension, we prescribe active reading strategies—such as pausing to summarize paragraphs and visualizing narrative events.'}

Overall Trajectory: The cognitive profile reflects a dynamic and adaptable young mind. By leveraging their dominant ${topTrait.trait} to support the development of their ${lowestTrait.trait}, the student can achieve a highly balanced and robust academic foundation.`;

  // 3. Remedial Action Plan & YouTube Videos
  const videoDatabase: Record<string, any> = {
    'memory': {
      title: 'Brain Games: Visual Memory Test',
      url: 'https://www.youtube.com/watch?v=y2sS292wFjM',
      improvementTip: 'Play memory-matching games for 10 minutes a day. Try to memorize your grocery list before going to the store!',
      rationale: "Engages the brain's spatial recognition pathways to strengthen short-term retention."
    },
    'logic': {
      title: 'TED-Ed: Can you solve the bridge riddle?',
      url: 'https://www.youtube.com/watch?v=7yDmGnA8Hw0',
      improvementTip: 'Solve one riddle or Sudoku puzzle every evening. Talk through your steps out loud!',
      rationale: 'Develops deductive reasoning and algorithmic thinking using fun, engaging scenarios.'
    },
    'reading': {
      title: 'Crash Course Kids: The Engineering Process',
      url: 'https://www.youtube.com/watch?v=fxJWin195kU',
      improvementTip: 'After reading a chapter of a book, try to draw a comic strip of what just happened.',
      rationale: 'Translating text into visual formats bridges comprehension gaps and deepens understanding.'
    },
    'speed': {
      title: 'SciShow Kids: How Does Your Brain Work?',
      url: 'https://www.youtube.com/watch?v=XCGiltzE0EQ',
      improvementTip: 'Play fast-paced card games like Speed or Snap with friends to train rapid decision-making.',
      rationale: 'Fast-paced visual processing games enhance neural pathway efficiency.'
    }
  };

  const lowestVid = videoDatabase[lowestTrait.id];
  profile.remedialPath = [{
    trait: lowestTrait.trait,
    score: lowestTrait.score,
    videoUrl: lowestVid.url,
    videoTitle: lowestVid.title,
    improvementTip: lowestVid.improvementTip
  }];

  profile.recommendedVideos = [
    { title: lowestVid.title, url: lowestVid.url, rationale: lowestVid.rationale },
    { title: 'The Power of Yet (Growth Mindset)', url: 'https://www.youtube.com/watch?v=J-swZaKN2Ic', rationale: 'Essential psychology concept to encourage persistence and neuroplasticity in 10-12 year olds.' }
  ];

  profile.reportGuidelines = [
    { category: 'For Parents', instruction: `Celebrate their high ${topTrait.trait} score. When they struggle with ${lowestTrait.trait}, remind them that the brain is a muscle that grows stronger with practice.` },
    { category: 'For Teachers', instruction: `Incorporate their dominant learning style (${profile.learningStyle}) when teaching complex subjects. Pair them with peers who excel in ${lowestTrait.trait} for collaborative learning.` }
  ];

  if (topTrait.score > 85) {
    profile.overallGrade = 'Advanced Learner';
  } else if (topTrait.score > 70) {
    profile.overallGrade = 'Confident Learner';
  }

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
