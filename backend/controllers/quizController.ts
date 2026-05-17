import { Request, Response } from 'express';
import QuizResult from '../models/QuizResult';
import CognitiveProfile from '../models/CognitiveProfile';
import aiService from '../services/aiService';
import { adaptiveEngine } from '../services/adaptiveDifficulty';

// Submit quiz result
export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get userId from JWT token (set by auth middleware)
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized - User ID not found' });
      return;
    }

    const { quizType, score, timeTaken, accuracy, answers, difficultyLevel, adaptiveScore } = req.body;

    // Create quiz result with adaptive difficulty tracking
    const result = new QuizResult({
      userId,
      quizType,
      score,
      timeTaken,
      accuracy,
      answers,
      difficultyLevel: difficultyLevel || 'medium',
      adaptiveScore: adaptiveScore || score,
    });

    await result.save();

    // Check if this user has completed 3+ unique quiz types and doesn't already have a profile
    const completedTypes = await QuizResult.find({ userId }).distinct('quizType');
    const userHasProfile = await CognitiveProfile.exists({ userId });
    
    if (completedTypes.length >= 3 && !userHasProfile) {
      try {
        const recentResults = await QuizResult.find({ userId }).sort({ date: -1 }).limit(5);
        const aiData = await aiService.analyzeCognitiveData({
          userId: userId.toString(),
          results: recentResults.map(r => ({
            quizType: r.quizType,
            score: r.score,
            timeTaken: r.timeTaken,
            accuracy: r.accuracy,
            difficultyLevel: r.difficultyLevel || 'medium',
          })) as any
        });

        console.log('🤖 AI response received for quiz submission');
        
        // Persist full cognitive profile including prescriptive fields
        await CognitiveProfile.findOneAndUpdate(
          { userId },
          {
            userId,
            visualMemory: aiData.memory || aiData.visualMemory || 50,
            logicalReasoning: aiData.logicalThinking || aiData.logicalReasoning || 50,
            attentionFocus: aiData.attentionFocus || 50,
            processingSpeed: aiData.processingSpeed || 50,
            readingComprehension: aiData.readingSkill || aiData.readingComprehension || 50,
            learningStyle: aiData.learningStyle || 'visual',
            strengths: aiData.strengths || [],
            weaknesses: aiData.weaknesses || [],
            recommendations: aiData.recommendations || [],
            recommendedVideos: aiData.recommendedVideos || [],
            reportGuidelines: aiData.reportGuidelines || [],
            detailedAnalysisReport: aiData.detailedAnalysisReport || '',
            diagnosticSummary: aiData.diagnosticSummary || '',
            remedialPath: aiData.remedialPath || [],
            overallGrade: aiData.overallGrade || 'Developing Learner',
            createdAt: new Date(),
          },
          { upsert: true, new: true }
        );
        console.log('✅ Cognitive profile generated via quiz submission');
      } catch (aiError) {
        console.error('AI service error (non-fatal):', aiError);
      }
    }

    res.status(201).json({
      message: 'Quiz result submitted successfully',
      result: {
        id: result._id,
        quizType: result.quizType,
        score: result.score,
        accuracy: result.accuracy,
        difficultyLevel: result.difficultyLevel,
        adaptiveScore: result.adaptiveScore,
        date: result.date,
      },
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error while submitting quiz' });
  }
};

// Get quiz results for a user
export const getUserResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const results = await QuizResult.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .populate('userId', 'name age class');

    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available activities
export const getActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const activities = [
      {
        id: 'memory',
        name: 'Visual Memory Challenge',
        description: 'Test your visual memory by remembering objects and identifying them later',
        icon: '🧠',
        color: '#FF6B6B',
        duration: '5 min',
        difficulty: 'Progressive',
        skills: ['Visual Memory', 'Working Memory', 'Recall Ability'],
      },
      {
        id: 'pattern',
        name: 'Pattern Recognition Master',
        description: 'Identify patterns in sequences and predict what comes next',
        icon: '🔍',
        color: '#4ECDC4',
        duration: '5 min',
        difficulty: 'Progressive',
        skills: ['Pattern Recognition', 'Logical Thinking', 'Prediction'],
      },
      {
        id: 'logic',
        name: 'Logic & Reasoning Puzzle',
        description: 'Solve logical puzzles and reasoning problems',
        icon: '💡',
        color: '#FFE66D',
        duration: '5 min',
        difficulty: 'Progressive',
        skills: ['Logical Reasoning', 'Critical Thinking', 'Deduction'],
      },
      {
        id: 'reading',
        name: 'Reading Comprehension Quest',
        description: 'Read passages and answer questions to test understanding',
        icon: '📚',
        color: '#95E1D3',
        duration: '5 min',
        difficulty: 'Progressive',
        skills: ['Reading Comprehension', 'Information Processing', 'Understanding'],
      },
      {
        id: 'speed',
        name: 'Reaction Speed Test',
        description: 'Test how quickly you can respond to visual stimuli',
        icon: '⚡',
        color: '#F38181',
        duration: '3 min',
        difficulty: 'Random',
        skills: ['Reaction Time', 'Processing Speed', 'Attention'],
      },
    ];

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
