import { Request, Response } from 'express';

// Enhanced cognitive test questions with scientific validity
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

// Generate specific cognitive test questions
export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quizType } = req.params;
    
    // In production, this would fetch from a database or AI-generated questions
    // For now, return metadata about the test structure
    const testStructures: any = {
      memory: {
        type: 'visual_memory',
        phases: ['memorize', 'recall'],
        memorizeDuration: 3000, // 3 seconds
        numTrials: 5,
        difficultyProgression: [4, 4, 5, 5, 6], // items to remember
        scoring: 'percentage_correct',
      },
      pattern: {
        type: 'sequence_completion',
        numQuestions: 5,
        difficultyProgression: 'increasing',
        questionTypes: ['numeric', 'geometric', 'arithmetic', 'fibonacci', 'multiplicative'],
        scoring: 'percentage_correct',
      },
      logic: {
        type: 'logical_reasoning',
        numQuestions: 5,
        questionTypes: [
          'syllogism',
          'transitive_reasoning',
          'conditional_logic',
          'categorical_logic',
          'spatial_reasoning'
        ],
        scoring: 'percentage_correct',
      },
      reading: {
        type: 'reading_comprehension',
        numPassages: 3,
        questionsPerPassage: 1,
        passageLength: 'short',
        topics: ['science', 'nature', 'general_knowledge'],
        scoring: 'percentage_correct',
      },
      speed: {
        type: 'reaction_time',
        numTrials: 5,
        stimulusDelayRange: [2000, 5000], // 2-5 seconds random
        measurementUnit: 'milliseconds',
        scoring: 'inverse_reaction_time',
      },
    };

    res.json(testStructures[quizType] || { error: 'Invalid quiz type' });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ message: 'Server error generating questions' });
  }
};
