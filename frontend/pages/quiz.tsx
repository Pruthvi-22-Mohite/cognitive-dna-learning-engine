import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI, dashboardAPI } from '@/services/api';
import { useAdaptiveQuiz } from '@/hooks/useAdaptiveQuiz';

interface Question {
  id: number;
  type: string;
  content: any;
  correctAnswer: any;
  options?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export default function Quiz() {
  const router = useRouter();
  const { type } = router.query;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [showingStimulus, setShowingStimulus] = useState(false);
  const [memoryItems, setMemoryItems] = useState<string[]>([]);
  const [gridItems, setGridItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'question'>('question');
  const [reframedHint, setReframedHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reaction speed test state
  const [waitingForStimulus, setWaitingForStimulus] = useState(true);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [stimulusColor, setStimulusColor] = useState('');
  const [stimulusPosition, setStimulusPosition] = useState({ top: '50%', left: '50%' });
  const [clickCaptured, setClickCaptured] = useState(false);
  const stimulusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reactionStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Adaptive difficulty hook
  const adaptiveQuiz = useAdaptiveQuiz(type as string);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    generateQuestions(type as string);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // Self-clear if the ref was nulled by handleSubmit
        if (!timerIntervalRef.current) {
          clearInterval(timer);
          return prev;
        }
        if (prev <= 1) {
          clearInterval(timer);
          timerIntervalRef.current = null;
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerIntervalRef.current = timer;

    return () => {
      clearInterval(timer);
      timerIntervalRef.current = null;
    };
  }, [type]);

  // Start timing when question changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestion >= 0) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, questions]);

  const generateQuestions = (quizType: string) => {
    switch (quizType) {
      case 'memory':
        generateVisualMemoryTest();
        break;
      case 'pattern':
        generatePatternRecognitionTest();
        break;
      case 'logic':
        generateLogicPuzzleTest();
        break;
      case 'speed':
        generateReactionSpeedTest();
        break;
      case 'reading':
        generateReadingComprehensionTest();
        break;
      default:
        generatePatternRecognitionTest();
    }
  };

  // 1. VISUAL SPAN WORKING MEMORY TEST (Clinical Standard)
  const generateVisualMemoryTest = () => {
    const objectSets = [
      ['▲', '●', '■', '◆', '★', '⬟'], // Geometric shapes
      ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒'], // Categorical: Fruit
      ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'], // Categorical: Animals
      ['1', '4', '7', '2', '9', '5'], // Alphanumeric
      ['α', 'β', 'γ', 'δ', 'ε', 'ζ'], // Abstract symbols
    ];

    const questions: Question[] = [];
    
    for (let i = 0; i < 5; i++) {
      const itemsToShow = 4 + Math.floor(i / 2); // Increases difficulty: 4, 4, 5, 5, 6
      // Randomly select a set and shuffle the items to jumble the pattern
      const allObjects = [...objectSets[Math.floor(Math.random() * objectSets.length)]].sort(() => Math.random() - 0.5);
      const memoryItems = allObjects.slice(0, itemsToShow);
      const distractors = allObjects.slice(itemsToShow);
      
      // Create grid with memory items + distractors
      const gridItems = [...memoryItems, ...distractors].sort(() => Math.random() - 0.5);
      
      questions.push({
        id: i,
        type: 'memory',
        content: {
          memoryItems,
          gridItems,
          instruction: `Memorize the following ${itemsToShow} target stimuli for 3 seconds.`,
          recallInstruction: 'Select all the target stimuli you were previously shown.',
        },
        correctAnswer: memoryItems,
      });
    }
    
    setQuestions(questions);
    setPhase('memorize');
    setMemoryItems(questions[0].content.memoryItems);
    setGridItems(questions[0].content.gridItems);
    
    // Auto-advance to recall phase after 3 seconds
    setTimeout(() => {
      setPhase('recall');
    }, 3000);
  };

  // 2. PATTERN RECOGNITION TEST - Progressive Difficulty with Adaptive Support
  const generatePatternRecognitionTest = () => {
    const patterns: Question[] = [
      // EASY questions
      {
        id: 0,
        type: 'pattern',
        content: '2, 4, 6, 8, ?',
        options: ['9', '10', '11', '12'],
        correctAnswer: 1, // 10 (+2 pattern)
        difficulty: 'easy',
      },
      {
        id: 1,
        type: 'pattern',
        content: '△ ○ △ ○ △ ?',
        options: ['△', '○', '□', '☆'],
        correctAnswer: 1, // ○ (simple alternating)
        difficulty: 'easy',
      },
      {
        id: 2,
        type: 'pattern',
        content: '5, 10, 15, 20, ?',
        options: ['22', '25', '30', '35'],
        correctAnswer: 1, // 25 (+5 pattern)
        difficulty: 'easy',
      },
      // MEDIUM questions
      {
        id: 3,
        type: 'pattern',
        content: '2, 4, 8, 16, ?',
        options: ['24', '32', '48', '64'],
        correctAnswer: 1, // 32 (×2 pattern)
        difficulty: 'medium',
      },
      {
        id: 4,
        type: 'pattern',
        content: '△ ○ □ △ ○ □ △ ?',
        options: ['△', '○', '□', '☆'],
        correctAnswer: 1, // ○ (3-item cycle)
        difficulty: 'medium',
      },
      {
        id: 5,
        type: 'pattern',
        content: '1, 1, 2, 3, 5, 8, ?',
        options: ['11', '13', '15', '17'],
        correctAnswer: 1, // 13 (Fibonacci)
        difficulty: 'medium',
      },
      // HARD questions
      {
        id: 6,
        type: 'pattern',
        content: '3, 6, 12, 24, 48, ?',
        options: ['72', '84', '96', '108'],
        correctAnswer: 2, // 96 (×2 pattern)
        difficulty: 'hard',
      },
      {
        id: 7,
        type: 'pattern',
        content: '1, 4, 9, 16, 25, ?',
        options: ['30', '32', '36', '40'],
        correctAnswer: 2, // 36 (perfect squares)
        difficulty: 'hard',
      },
      {
        id: 8,
        type: 'pattern',
        content: '2, 3, 5, 7, 11, 13, ?',
        options: ['15', '16', '17', '19'],
        correctAnswer: 2, // 17 (prime numbers)
        difficulty: 'hard',
      },
    ];
    
    setQuestions(patterns.sort(() => Math.random() - 0.5));
  };

  // 3. LOGICAL REASONING TEST (Syllogistic & Deductive Reasoning)
  const generateLogicPuzzleTest = () => {
    const logicQuestions: Question[] = [
      // EASY questions
      {
        id: 0,
        type: 'logic',
        content: 'Premise 1: All mammals are warm-blooded.\nPremise 2: A whale is a mammal.\nConclusion: Therefore, a whale is...',
        options: ['Cold-blooded', 'Warm-blooded', 'A fish', 'Able to breathe underwater'],
        correctAnswer: 1,
        difficulty: 'easy',
      },
      {
        id: 1,
        type: 'logic',
        content: 'Sarah is older than Michael. Michael is older than David. Who is the youngest?',
        options: ['Sarah', 'Michael', 'David', 'Cannot be determined'],
        correctAnswer: 2,
        difficulty: 'easy',
      },
      {
        id: 2,
        type: 'logic',
        content: 'If it rains, the grass becomes wet. The grass is currently dry. What can we conclude?',
        options: ['It is raining', 'It is not raining', 'The grass is growing', 'It rained yesterday'],
        correctAnswer: 1,
        difficulty: 'easy',
      },
      // MEDIUM questions
      {
        id: 3,
        type: 'logic',
        content: 'In a 100-meter sprint, John finished before Lisa but after Tom. Emma finished after Lisa. Who finished first?',
        options: ['John', 'Lisa', 'Tom', 'Emma'],
        correctAnswer: 2,
        difficulty: 'medium',
      },
      {
        id: 4,
        type: 'logic',
        content: 'Rule: Every student in Advanced Math receives a graphing calculator. Fact: Alex is in Advanced Math. Conclusion:',
        options: [
          'Alex receives a graphing calculator',
          'Alex does not like math',
          'Alex might receive a graphing calculator',
          'Alex bought a graphing calculator'
        ],
        correctAnswer: 0,
        difficulty: 'medium',
      },
      {
        id: 5,
        type: 'logic',
        content: 'All "A"s are "B"s. Some "B"s are "C"s. Which of the following MUST be true?',
        options: [
          'All "A"s are "C"s',
          'Some "A"s are "C"s',
          'All "C"s are "B"s',
          'None of the above must be true'
        ],
        correctAnswer: 3,
        difficulty: 'medium',
      },
      // HARD questions
      {
        id: 6,
        type: 'logic',
        content: 'City X is directly north of City Y. City Z is directly south of City Y. City W is directly east of City Z. What is the direction of City X from City Z?',
        options: ['North', 'South', 'East', 'West'],
        correctAnswer: 0,
        difficulty: 'hard',
      },
      {
        id: 7,
        type: 'logic',
        content: 'A factory produces red, blue, and green cars. No green cars have sunroofs. Some blue cars have sunroofs. Which statement is definitely true?',
        options: [
          'All red cars have sunroofs',
          'A car with a sunroof cannot be green',
          'All blue cars have sunroofs',
          'Green cars are faster than blue cars'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
      },
      {
        id: 8,
        type: 'logic',
        content: 'If p implies q, and q implies r, what happens if r is false?',
        options: [
          'p is true',
          'p is false',
          'q is true',
          'p and q can be true or false'
        ],
        correctAnswer: 1,
        difficulty: 'hard',
      },
    ];
    
    setQuestions(logicQuestions.sort(() => Math.random() - 0.5));
  };

  // 4. REACTION SPEED TEST - Precise Measurement
  const generateReactionSpeedTest = () => {
    // Initialize 5 dummy trials if not already set
    setQuestions([
      { id: 0, type: 'speed', content: '', correctAnswer: 0, difficulty: 'medium' },
      { id: 1, type: 'speed', content: '', correctAnswer: 0, difficulty: 'medium' },
      { id: 2, type: 'speed', content: '', correctAnswer: 0, difficulty: 'medium' },
      { id: 3, type: 'speed', content: '', correctAnswer: 0, difficulty: 'medium' },
      { id: 4, type: 'speed', content: '', correctAnswer: 0, difficulty: 'medium' }
    ]);

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setStimulusColor(randomColor);
    
    // Calculate random position (10% to 80% to keep it within bounds)
    const randomTop = 15 + Math.random() * 65;
    const randomLeft = 15 + Math.random() * 65;
    setStimulusPosition({ top: `${randomTop}%`, left: `${randomLeft}%` });
    
    setWaitingForStimulus(true);
    setStimulusVisible(false);
    setClickCaptured(false);
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    
    stimulusTimerRef.current = setTimeout(() => {
      setStimulusVisible(true);
      setWaitingForStimulus(false);
      reactionStartTimeRef.current = Date.now();
    }, delay);
  };

  // 5. READING COMPREHENSION TEST (Clinical Inference & Recall)
  const generateReadingComprehensionTest = () => {
    const readingQuestions: Question[] = [
      {
        id: 0,
        type: 'reading',
        content: {
          passage: 'Honey bees use a unique method of communication known as the "waggle dance." When a forager bee discovers a high-quality food source, it returns to the hive and performs this figure-eight movement. The duration of the waggle portion indicates the distance to the food, while the angle of the dance relative to the vertical line of the honeycomb indicates the direction relative to the sun.',
          question: 'According to the passage, what does the duration of the waggle dance indicate?',
        },
        options: [
          'The type of flower found',
          'The distance to the food source',
          'The direction of the sun',
          'The age of the forager bee'
        ],
        correctAnswer: 1,
      },
      {
        id: 1,
        type: 'reading',
        content: {
          passage: 'Thomas looked out the living room window. The sky had turned a dark shade of grey, and the wind was violently shaking the branches of the oak tree in the front yard. He sighed, walked to the closet, grabbed his heavy yellow raincoat and rubber boots, and placed his umbrella by the front door. He knew his walk to school was going to be challenging.',
          question: 'Based on the context clues, what is Thomas preparing for?',
        },
        options: [
          'A sunny day at the park',
          'A snowstorm',
          'Heavy rain and stormy weather',
          'A school field trip'
        ],
        correctAnswer: 2,
      },
      {
        id: 2,
        type: 'reading',
        content: {
          passage: 'Photosynthesis is a critical biological process utilized by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy. During this process, these organisms take in carbon dioxide and water, and use solar energy to convert them into oxygen and glucose. The glucose provides essential nourishment for the plant, while the released oxygen is vital for the survival of aerobic life on Earth.',
          question: 'What are the two main inputs required for photosynthesis, aside from sunlight?',
        },
        options: [
          'Oxygen and glucose',
          'Carbon dioxide and water',
          'Chemical energy and bacteria',
          'Soil and fertilizer'
        ],
        correctAnswer: 1,
      },
    ];
    
    setQuestions(readingQuestions.sort(() => Math.random() - 0.5));
  };

  const handleReactionClick = () => {
    if (isSubmittingRef.current || isSubmitting) return;
    if (stimulusVisible && !clickCaptured) {
      const reactionTime = Date.now() - reactionStartTimeRef.current;
      setReactionTime(reactionTime);
      setClickCaptured(true);
      setStimulusVisible(false);
      
      // Store reaction time as answer
      const newAnswers = [...answers, { question: currentQuestion, answer: reactionTime, reactionTime }];
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          generateReactionSpeedTest(); // Reset for next trial
        }, 1000);
      } else {
        setTimeout(() => handleSubmit(newAnswers), 1000);
      }
    } else if (waitingForStimulus && !clickCaptured) {
      // Clicked too early - penalty
      setClickCaptured(true);
      setWaitingForStimulus(false);
      setStimulusVisible(false);
      
      const newAnswers = [...answers, { question: currentQuestion, answer: 9999, reactionTime: 9999 }];
      setAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          generateReactionSpeedTest();
        }, 1000);
      } else {
        setTimeout(() => handleSubmit(newAnswers), 1000);
      }
    }
  };

  const handleMemoryItemSelect = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  const submitMemoryAnswer = () => {
    if (isSubmittingRef.current || isSubmitting) return;
    const selectedObjects = selectedItems.map(i => gridItems[i]);
    const newAnswers = [...answers, { 
      question: currentQuestion, 
      answer: selectedObjects,
      correct: memoryItems.every(item => selectedObjects.includes(item)) &&
               selectedObjects.every(item => memoryItems.includes(item))
    }];
    
    setAnswers(newAnswers);
    setSelectedItems([]);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setPhase('memorize');
      setMemoryItems(questions[currentQuestion + 1].content.memoryItems);
      setGridItems(questions[currentQuestion + 1].content.gridItems);
      
      setTimeout(() => {
        setPhase('recall');
      }, 3000);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (isTransitioningRef.current || isSubmittingRef.current || isSubmitting) return;
    isTransitioningRef.current = true;

    const currentQ = questions[currentQuestion];
    const isCorrect = answerIndex === currentQ.correctAnswer;
    
    // Record response time and process adaptive difficulty
    const responseTime = Date.now() - questionStartTimeRef.current;
    const { nextDifficulty, updatedState, updatedAnsweredQuestions } = adaptiveQuiz.processAnswer(currentQ, answerIndex, isCorrect, responseTime);
    
    const newAnswers = [...answers, { 
      question: currentQuestion, 
      answer: answerIndex,
      isCorrect,
      difficulty: currentQ.difficulty,
    }];
    setAnswers(newAnswers);

    // --- Reframing: Show hint if student is struggling ---
    if (updatedState.needsReframing) {
      const reframeHints: Record<string, string[]> = {
        pattern: [
          'Hint: Observe the difference between the first and second numbers. Does the difference remain constant?',
          'Hint: Check if the sequence is increasing by addition or multiplication.',
          'Hint: Try looking at alternating items to see if there are two intersecting patterns.',
          'Hint: Identify the repeating cycle of shapes and determine the current position in the sequence.',
        ],
        logic: [
          'Hint: Map out the relationships. Who is taller/older than whom? Draw a mental timeline.',
          'Hint: Focus strictly on the facts provided in the premises. Do not introduce outside assumptions.',
          'Hint: If A requires B, and B is missing, can A occur?',
          'Hint: Remember: "Some" does not mean "All". Be careful with absolute statements.',
        ],
        reading: [
          'Hint: Scan the passage specifically for the keyword mentioned in the question.',
          'Hint: Consider the character\'s actions and context clues to infer the environmental conditions.',
          'Hint: Identify the cause-and-effect relationship detailed in the sentence.',
        ],
      };
      const quizType = type as string;
      const hints = reframeHints[quizType] || [];
      const hint = hints[currentQuestion % hints.length] || null;
      setReframedHint(hint);
    } else {
      setReframedHint(null);
    }

    // Get next question based on adaptive difficulty, passing the synchronously updated answered list
    const nextQuestion = adaptiveQuiz.getNextQuestion(questions, updatedAnsweredQuestions);
    
    if (nextQuestion) {
      setTimeout(() => {
        setCurrentQuestion(questions.findIndex(q => q.id === nextQuestion.id));
        questionStartTimeRef.current = Date.now(); // Reset timer for next question
        isTransitioningRef.current = false;
      }, 300);
    } else {
      setTimeout(() => handleSubmit(newAnswers), 300);
    }
  };

  const handleSubmit = async (finalAnswers = answers) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // CRITICAL: Stop the main timer immediately on quiz end
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // Stop any pending reaction test timeouts
    if (stimulusTimerRef.current) {
      clearTimeout(stimulusTimerRef.current);
      stimulusTimerRef.current = null;
    }

    let calculatedScore = 0;
    let adaptiveScoreValue = 0;
    
    if (type === 'speed') {
      // For reaction speed, calculate based on average reaction time
      const validReactions = finalAnswers
        .map(a => a.reactionTime)
        .filter(rt => rt < 9999);
      
      if (validReactions.length > 0) {
        const avgReactionTime = validReactions.reduce((a, b) => a + b, 0) / validReactions.length;
        // Score: 200ms = 100%, 500ms = 70%, 1000ms = 40%
        calculatedScore = Math.max(0, Math.min(100, Math.round(120 - (avgReactionTime / 10))));
        setReactionTime(Math.round(avgReactionTime));
        adaptiveScoreValue = calculatedScore; // Speed test doesn't use difficulty adjustment
      }
    } else {
      // Traditional scoring for other tests
      let correctCount = 0;
      finalAnswers.forEach((ans, idx) => {
        if (ans.correct !== undefined) {
          if (ans.correct) correctCount++;
        } else if (ans.answer === questions[idx]?.correctAnswer) {
          correctCount++;
        }
      });
      calculatedScore = Math.round((correctCount / questions.length) * 100);
      
      // Calculate adaptive score considering difficulty
      adaptiveScoreValue = adaptiveQuiz.calculateAdaptiveScore(questions.length, correctCount);
    }

    const timeTaken = 300 - timeLeft;
    const accuracy = calculatedScore;
    const finalDifficulty = adaptiveQuiz.getFinalDifficulty();

    setScore(calculatedScore);
    setCompleted(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Submit to quiz API (existing)
      await quizAPI.submitResult({
        quizType: type,
        score: calculatedScore,
        timeTaken,
        accuracy,
        answers: finalAnswers,
        difficultyLevel: finalDifficulty,
        adaptiveScore: adaptiveScoreValue,
      });

      // Also submit to dashboard API for cognitive analysis pipeline
      await dashboardAPI.submitTest({
        studentId: user.id,
        activityType: type,
        accuracy: calculatedScore,
        responseTime: timeTaken * 1000, // Convert to milliseconds
        attempts: 1,
        difficulty: finalDifficulty,
      });
      
      console.log('✅ Test submitted to both APIs');
    } catch (error) {
      console.error('Error submitting result:', error);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      isTransitioningRef.current = false;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stimulusTimerRef.current) {
        clearTimeout(stimulusTimerRef.current);
      }
    };
  }, []);

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-amber-300 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center max-w-lg"
        >
          <Head>
            <title>Results - Cognitive DNA</title>
          </Head>

          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Great Job!</h1>
          
          <div className="my-8">
            <p className="text-gray-500 text-sm mb-2">Your Score</p>
            <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{score}%</div>
          </div>

          {type === 'speed' && reactionTime && (
            <div className="mb-6 bg-yellow-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">Average Reaction Time</p>
              <p className="text-3xl font-bold text-yellow-600">{reactionTime} ms</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">Time Taken</p>
              <p className="text-xl font-bold text-blue-600">{formatTime(300 - timeLeft)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">Accuracy</p>
              <p className="text-xl font-bold text-purple-600">{score}%</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/student-dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex-1"
              >
                Back to Dashboard
              </motion.button>
            </Link>
            <Link href="/results">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex-1"
              >
                View Brain Map
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  // RENDER: Visual Memory Test
  if (type === 'memory') {
    return (
      <>
        <Head>
          <title>Memory Challenge - Cognitive DNA</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-amber-300 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="card mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Question {currentQuestion + 1} of {questions.length}
                </h2>
                <p className="text-gray-600 text-sm">Visual Memory Test</p>
              </div>
              <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {phase === 'memorize' ? (
                <motion.div
                  key="memorize"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="card text-center"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    🔍 {questions[currentQuestion]?.content.instruction}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 my-8">
                    {memoryItems.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-7xl text-slate-800 font-black drop-shadow-sm flex items-center justify-center h-24"
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-gray-600 mt-4">
                    Get ready to remember...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="recall"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    ✅ {questions[currentQuestion]?.content.recallInstruction}
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 my-8">
                    {gridItems.map((item, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleMemoryItemSelect(idx)}
                        className={`text-5xl p-4 rounded-xl border-4 transition-all text-slate-800 font-black flex items-center justify-center h-24 ${
                          selectedItems.includes(idx)
                            ? 'border-blue-500 bg-blue-100 scale-110 shadow-md'
                            : 'border-gray-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </motion.button>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitMemoryAnswer}
                    disabled={selectedItems.length === 0}
                    className="btn-primary w-full text-lg disabled:opacity-50"
                  >
                    Submit Answer ({selectedItems.length} selected)
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 bg-indigo-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
              />
            </div>

            <div className="text-center mt-4">
              <Link href="/student-dashboard" className="text-indigo-500 hover:text-indigo-700 hover:underline font-medium text-sm">
                ← Exit Activity
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // RENDER: Reaction Speed Test
  if (type === 'speed') {
    return (
      <>
        <Head>
          <title>Speed Challenge - Cognitive DNA</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-amber-300 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="card mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Trial {currentQuestion + 1} of {questions.length}
                </h2>
                <p className="text-gray-600 text-sm">Reaction Speed Test</p>
              </div>
              <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            </div>

            <motion.div
              className="card text-center relative overflow-hidden"
              style={{ minHeight: '400px' }}
              onClick={waitingForStimulus ? handleReactionClick : undefined}
            >
              {waitingForStimulus ? (
                <div className="flex flex-col items-center justify-center h-[350px] pointer-events-none">
                  <div className="text-6xl mb-6">⏳</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Wait for the circle...
                  </h3>
                  <p className="text-gray-600">Click the circle as FAST as you can when it appears!</p>
                </div>
              ) : stimulusVisible ? (
                <div className="h-[350px] relative w-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute w-20 h-20 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-4 border-white/50"
                    style={{ 
                      backgroundColor: stimulusColor,
                      top: stimulusPosition.top,
                      left: stimulusPosition.left,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={(e) => { e.stopPropagation(); handleReactionClick(); }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px]">
                  <div className="text-6xl mb-6">✅</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Ready for next trial...
                  </h3>
                </div>
              )}
            </motion.div>

            <div className="mt-8 bg-indigo-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
              />
            </div>

            <div className="text-center mt-4">
              <Link href="/student-dashboard" className="text-indigo-500 hover:text-indigo-700 hover:underline font-medium text-sm">
                ← Exit Activity
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // RENDER: Pattern, Logic, Reading Tests (Standard Question Format)
  return (
    <>
      <Head>
        <title>Activity - Cognitive DNA</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-amber-300 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="card mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Question {Math.min(answers.length + 1, questions.length)} of {questions.length}
              </h2>
              <p className="text-gray-600 text-sm">
                {type === 'pattern' && 'Pattern Recognition'}
                {type === 'logic' && 'Logic Puzzle'}
                {type === 'reading' && 'Reading Comprehension'}
              </p>
            </div>
            <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            {/* Difficulty Badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Difficulty:</span>
              {questions[currentQuestion]?.difficulty === 'easy' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border-2 border-green-300">
                  🌱 Easy
                </span>
              )}
              {questions[currentQuestion]?.difficulty === 'medium' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold border-2 border-yellow-300">
                  ⚡ Medium
                </span>
              )}
              {questions[currentQuestion]?.difficulty === 'hard' && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold border-2 border-red-300">
                  🔥 Hard
                </span>
              )}
            </div>

            {/* Reading passage display */}
            {type === 'reading' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-gray-800 leading-relaxed text-lg">
                  {questions[currentQuestion]?.content.passage}
                </p>
              </div>
            )}

            {/* Reframing Notification Banner — Premium Tooltip */}
            <AnimatePresence>
            {reframedHint && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="mb-5 p-5 rounded-2xl reframe-banner"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-md">🌟</div>
                  <div>
                    <p className="text-sm font-bold text-amber-700 mb-1">Let's look at this a different way!</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{reframedHint}</p>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {type === 'reading' 
                ? questions[currentQuestion]?.content.question
                : questions[currentQuestion]?.content
              }
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {questions[currentQuestion]?.options?.map((option: string, idx: number) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(idx)}
                  className="quiz-option"
                >
                  <span className="text-indigo-400 font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mt-8 bg-indigo-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((answers.length + 1) / questions.length) * 100, 100)}%` }}
              className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full"
            />
          </div>

          <div className="text-center mt-4">
            <Link href="/student-dashboard" className="text-indigo-500 hover:text-indigo-700 hover:underline font-medium text-sm">
              ← Exit Activity
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
