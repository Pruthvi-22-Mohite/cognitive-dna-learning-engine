import { Request, Response } from 'express';
import CognitiveProfile from '../models/CognitiveProfile';

// Get cognitive profile for a user
export const getCognitiveProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const profile = await CognitiveProfile.findOne({ userId });
    
    if (!profile) {
      res.status(404).json({ message: 'Cognitive profile not found. Please complete more activities.' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Get cognitive profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update or create cognitive profile (called by AI service)
export const updateCognitiveProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, logicalThinking, visualLearning, memory, readingSkill, problemSolving, learningStyle, recommendations } = req.body;

    // Check if profile exists
    let profile = await CognitiveProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.logicalThinking = logicalThinking;
      profile.visualLearning = visualLearning;
      profile.memory = memory;
      profile.readingSkill = readingSkill;
      profile.problemSolving = problemSolving;
      profile.learningStyle = learningStyle;
      profile.recommendations = recommendations;
      profile.lastUpdated = new Date();
      
      await profile.save();
    } else {
      // Create new profile
      profile = new CognitiveProfile({
        userId,
        logicalThinking,
        visualLearning,
        memory,
        readingSkill,
        problemSolving,
        learningStyle,
        recommendations,
      });
      
      await profile.save();
    }

    res.json({
      message: 'Cognitive profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Update cognitive profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Get progress over time
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const profiles = await CognitiveProfile.find({ userId }).sort({ lastUpdated: -1 }).limit(10);
    
    res.json(profiles);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
