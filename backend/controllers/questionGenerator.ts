import { Request, Response } from 'express';

// Kid-friendly reframe contexts for question rewriting
const REFRAME_CONTEXTS: Record<string, string[]> = {
  pattern: [
    'Batman sees the Bat-Signal flash in a pattern:',
    'Spider-Man swings between buildings following a pattern:',
    'Pikachu zaps targets in a sequence:',
    'Mario collects coins in this order:',
    'Dora follows a map with a number trail:',
  ],
  logic: [
    'In a superhero team meeting:',
    'At Hogwarts School of Magic:',
    'In the Minecraft world:',
    'On a Pokémon adventure:',
    'At the space station:',
  ],
  reading: [
    'Read this story about a brave astronaut:',
    'Read this adventure about a treasure-hunting pirate:',
    'Read this tale about a young wizard:',
    'Read this story about a friendly dinosaur:',
    'Read this adventure about a robot explorer:',
  ],
};

/**
 * Reframe a question by wrapping its content in a fun, kid-friendly context
 * without changing the actual difficulty or the correct answer.
 */
const reframeQuestion = (
  questionContent: string,
  quizType: string,
  questionIndex: number
): string => {
  const contexts = REFRAME_CONTEXTS[quizType];
  if (!contexts || contexts.length === 0) return questionContent;

  const ctx = contexts[questionIndex % contexts.length];

  // For pattern questions, prepend a fun context line
  if (quizType === 'pattern') {
    return `${ctx} ${questionContent}`;
  }
  // For logic questions, wrap with character context
  if (quizType === 'logic') {
    return `${ctx} ${questionContent}`;
  }
  // For reading, we keep passage but add a fun intro
  if (quizType === 'reading') {
    return questionContent; // Passage reframing handled separately
  }
  return questionContent;
};

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
// Supports optional `struggling` query param for question reframing
export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { quizType } = req.params;
    const struggling = req.query.struggling === 'true';
    const questionIndex = parseInt(req.query.questionIndex as string, 10) || 0;
    
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

    const structure = testStructures[quizType];
    if (!structure) {
      res.json({ error: 'Invalid quiz type' });
      return;
    }

    // If the student is struggling, attach reframed text metadata
    if (struggling && ['pattern', 'logic', 'reading'].includes(quizType)) {
      // Example reframed question hints per quiz type
      const reframedHints: Record<string, string[]> = {
        pattern: [
          'Batman sees the Bat-Signal flash in a pattern: Look at how each number changes to find the next one!',
          'Spider-Man swings between buildings following a pattern: What is being added each time?',
          'Pikachu zaps targets in a sequence: Try multiplying instead of adding!',
          'Mario collects coins in this order: Each number is special – they are all squares!',
          'Dora follows a map with a number trail: These are numbers that can only be divided by 1 and themselves!',
        ],
        logic: [
          'In a superhero team meeting: If Batman is a hero, and all heroes are brave, what do we know about Batman?',
          'At Hogwarts School of Magic: If Monday comes every 7 days, when does the next Monday arrive?',
          'In the Minecraft world: Steve is taller than Alex, and Alex is taller than a Creeper. Who is tallest?',
          'On a Pokémon adventure: All fire types are Pokémon. If Charmander is a fire type, is Charmander a Pokémon?',
          'At the space station: If no oxygen means no breathing, and we ARE breathing, what do we know?',
        ],
        reading: [
          'Read this story about a brave astronaut: Focus on what each CHARACTER does in the story.',
          'Read this adventure about a treasure-hunting pirate: Look for NUMBERS and FACTS in the passage.',
          'Read this tale about a young wizard: What is the MAIN IDEA of the passage?',
        ],
      };

      const hints = reframedHints[quizType] || [];
      const reframedText = hints[questionIndex % hints.length] || '';

      res.json({
        ...structure,
        reframed: true,
        reframedText,
        reframedNotification: "🌟 Let's look at this a different way!",
      });
      return;
    }

    res.json(structure);
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ message: 'Server error generating questions' });
  }
};
