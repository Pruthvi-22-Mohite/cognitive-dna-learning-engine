import { Request, Response } from 'express';
import QuizResult from '../models/QuizResult';
import axios from 'axios';

// Submit quiz result
export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get userId from JWT token (set by auth middleware)
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized - User ID not found' });
      return;
    }

    const { quizType, score, timeTaken, accuracy, answers } = req.body;

    // Create quiz result
    const result = new QuizResult({
      userId,
      quizType,
      score,
      timeTaken,
      accuracy,
      answers,
    });

    await result.save();

    // Send to AI engine for analysis if this completes a set of tests
    const recentResults = await QuizResult.find({ userId }).sort({ date: -1 }).limit(5);
    
    if (recentResults.length >= 3) {
      // Forward to AI service for cognitive profile generation
      try {
        const aiServiceUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        await axios.post(`${aiServiceUrl}/analyze`, {
          userId,
          results: recentResults.map(r => ({
            quizType: r.quizType,
            score: r.score,
            timeTaken: r.timeTaken,
            accuracy: r.accuracy,
          })),
        });
      } catch (aiError) {
        console.error('AI service error:', aiError);
        // Don't fail the request if AI service is unavailable
      }
    }

    res.status(201).json({
      message: 'Quiz result submitted successfully',
      result: {
        id: result._id,
        quizType: result.quizType,
        score: result.score,
        accuracy: result.accuracy,
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
        name: 'Memory Challenge',
        description: 'Test your memory with fun patterns!',
        icon: '🧠',
        color: '#FF6B6B',
      },
      {
        id: 'pattern',
        name: 'Pattern Detective',
        description: 'Find the missing pieces in patterns',
        icon: '🔍',
        color: '#4ECDC4',
      },
      {
        id: 'logic',
        name: 'Logic Puzzles',
        description: 'Solve tricky brain teasers',
        icon: '💡',
        color: '#FFE66D',
      },
      {
        id: 'reading',
        name: 'Reading Quest',
        description: 'Read and answer exciting questions',
        icon: '📚',
        color: '#95E1D3',
      },
      {
        id: 'speed',
        name: 'Speed Challenge',
        description: 'Quick thinking under time pressure',
        icon: '⚡',
        color: '#F38181',
      },
    ];

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
