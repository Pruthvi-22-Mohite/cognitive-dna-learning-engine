import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '@/services/api';

interface Question {
  id: number;
  type: string;
  content: any;
  correctAnswer: any;
  options?: string[];
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
  
  // Reaction speed test state
  const [waitingForStimulus, setWaitingForStimulus] = useState(true);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [stimulusColor, setStimulusColor] = useState('');
  const [clickCaptured, setClickCaptured] = useState(false);
  const stimulusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reactionStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    generateQuestions(type as string);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type]);

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

  // 1. VISUAL MEMORY TEST - Scientifically Valid
  const generateVisualMemoryTest = () => {
    const objectSets = [
      ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒'],
      ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
      ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐'],
      ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️'],
      ['⭐', '🌙', '☀️', '🌈', '❄️', '🔥'],
    ];

    const questions: Question[] = [];
    
    for (let i = 0; i < 5; i++) {
      const itemsToShow = 4 + Math.floor(i / 2); // Increases difficulty: 4, 4, 5, 5, 6
      const allObjects = objectSets[i % objectSets.length];
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
          instruction: `Remember these ${itemsToShow} objects for 3 seconds!`,
          recallInstruction: 'Select ALL the objects you saw earlier',
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

  // 2. PATTERN RECOGNITION TEST - Progressive Difficulty
  const generatePatternRecognitionTest = () => {
    const patterns: Question[] = [
      {
        id: 0,
        type: 'pattern',
        content: '2, 4, 8, 16, ?',
        options: ['24', '32', '48', '64'],
        correctAnswer: 1, // 32 (doubling pattern)
      },
      {
        id: 1,
        type: 'pattern',
        content: '△ ○ □ △ ○ ?',
        options: ['△', '□', '○', '☆'],
        correctAnswer: 1, // □ (repeating sequence)
      },
      {
        id: 2,
        type: 'pattern',
        content: '5, 10, 15, 20, 25, ?',
        options: ['28', '30', '35', '40'],
        correctAnswer: 1, // 30 (+5 pattern)
      },
      {
        id: 3,
        type: 'pattern',
        content: '1, 1, 2, 3, 5, 8, ?',
        options: ['11', '13', '15', '17'],
        correctAnswer: 1, // 13 (Fibonacci sequence)
      },
      {
        id: 4,
        type: 'pattern',
        content: '3, 6, 12, 24, 48, ?',
        options: ['72', '84', '96', '108'],
        correctAnswer: 2, // 96 (×2 pattern)
      },
    ];
    
    setQuestions(patterns);
  };

  // 3. LOGIC PUZZLE TEST - Age-Appropriate Reasoning
  const generateLogicPuzzleTest = () => {
    const logicQuestions: Question[] = [
      {
        id: 0,
        type: 'logic',
        content: 'If all cats are animals and some animals are black, which statement MUST be true?',
        options: [
          'All cats are black',
          'Some cats might be black',
          'No cats are black',
          'All animals are cats'
        ],
        correctAnswer: 1,
      },
      {
        id: 1,
        type: 'logic',
        content: 'Tom is taller than Jerry. Jerry is taller than Spike. Who is the shortest?',
        options: ['Tom', 'Jerry', 'Spike', 'They are all the same height'],
        correctAnswer: 2,
      },
      {
        id: 2,
        type: 'logic',
        content: 'If it rains, the ground gets wet. The ground is NOT wet. What can we conclude?',
        options: [
          'It rained',
          'It did not rain',
          'It might have rained',
          'The ground is dry'
        ],
        correctAnswer: 1,
      },
      {
        id: 3,
        type: 'logic',
        content: 'Every student in Class 5 has a backpack. Sarah is in Class 5. What do we know about Sarah?',
        options: [
          'Sarah has a backpack',
          'Sarah does not have a backpack',
          'Sarah might have a backpack',
          'Sarah is not a student'
        ],
        correctAnswer: 0,
      },
      {
        id: 4,
        type: 'logic',
        content: 'A square has 4 equal sides. A rectangle has opposite sides equal. Which statement is correct?',
        options: [
          'All rectangles are squares',
          'All squares are rectangles',
          'No squares are rectangles',
          'Squares have more sides than rectangles'
        ],
        correctAnswer: 1,
      },
    ];
    
    setQuestions(logicQuestions);
  };

  // 4. REACTION SPEED TEST - Precise Measurement
  const generateReactionSpeedTest = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setStimulusColor(randomColor);
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

  // 5. READING COMPREHENSION TEST
  const generateReadingComprehensionTest = () => {
    const readingQuestions: Question[] = [
      {
        id: 0,
        type: 'reading',
        content: {
          passage: 'The honeybee is an amazing insect. Bees live in colonies with three types: queen, workers, and drones. The queen bee lays eggs. Worker bees collect nectar from flowers and make honey. They also protect the hive. Drones are male bees whose only job is to mate with the queen. Without bees, many plants could not grow because bees help pollinate flowers.',
          question: 'What is the main job of worker bees?',
        },
        options: [
          'Lay eggs',
          'Collect nectar and make honey',
          'Mate with the queen',
          'Sleep all day'
        ],
        correctAnswer: 1,
      },
      {
        id: 1,
        type: 'reading',
        content: {
          passage: 'Water is essential for all living things. It covers about 71% of Earth\'s surface. Water exists in three states: solid (ice), liquid (water), and gas (water vapor). When water freezes at 0°C, it becomes ice. When it boils at 100°C, it turns into steam. The water cycle includes evaporation, condensation, and precipitation.',
          question: 'At what temperature does water boil?',
        },
        options: ['0°C', '50°C', '100°C', '150°C'],
        correctAnswer: 2,
      },
      {
        id: 2,
        type: 'reading',
        content: {
          passage: 'Plants make their own food through photosynthesis. They use sunlight, water, and carbon dioxide to create glucose (sugar) and oxygen. The green pigment chlorophyll captures sunlight energy. Plants release oxygen as a byproduct, which humans and animals need to breathe. This is why forests are called the "lungs of Earth".',
          question: 'What do plants release during photosynthesis?',
        },
        options: [
          'Carbon dioxide',
          'Oxygen',
          'Nitrogen',
          'Hydrogen'
        ],
        correctAnswer: 1,
      },
    ];
    
    setQuestions(readingQuestions);
  };

  const handleReactionClick = () => {
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
    const newAnswers = [...answers, { question: currentQuestion, answer: answerIndex }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => handleSubmit(newAnswers), 300);
    }
  };

  const handleSubmit = async (finalAnswers = answers) => {
    let calculatedScore = 0;
    
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
    }

    const timeTaken = 300 - timeLeft;
    const accuracy = calculatedScore;

    setScore(calculatedScore);
    setCompleted(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await quizAPI.submitResult({
        quizType: type,
        score: calculatedScore,
        timeTaken,
        accuracy,
        answers: finalAnswers,
      });
    } catch (error) {
      console.error('Error submitting result:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center max-w-lg"
        >
          <Head>
            <title>Results - Cognitive DNA</title>
          </Head>

          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Great Job!</h1>
          
          <div className="my-8">
            <p className="text-gray-600 mb-2">Your Score</p>
            <div className="text-6xl font-bold text-green-500">{score}%</div>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
        <div className="text-white text-2xl">Loading questions...</div>
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

        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 py-8 px-4">
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
                        className="text-7xl"
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
                        className={`text-5xl p-4 rounded-xl border-4 transition-all ${
                          selectedItems.includes(idx)
                            ? 'border-blue-500 bg-blue-100 scale-110'
                            : 'border-gray-200 bg-white'
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

            <div className="mt-8 bg-white/30 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-green-400 to-blue-500"
              />
            </div>

            <div className="text-center mt-4">
              <Link href="/student-dashboard" className="text-white hover:underline">
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

        <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 py-8 px-4">
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
              className="card text-center"
              style={{ minHeight: '400px' }}
            >
              {waitingForStimulus ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-6xl mb-6">⏳</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Wait for the circle...
                  </h3>
                  <p className="text-gray-600">Click as FAST as you can when it appears!</p>
                </div>
              ) : stimulusVisible ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center justify-center h-64 cursor-pointer"
                  onClick={handleReactionClick}
                >
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1.2 }}
                    className="w-48 h-48 rounded-full shadow-2xl"
                    style={{ backgroundColor: stimulusColor }}
                  />
                  <p className="text-2xl font-bold text-gray-800 mt-8">CLICK NOW! 🖱️</p>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-6xl mb-6">✅</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Ready for next trial...
                  </h3>
                </div>
              )}
            </motion.div>

            <div className="mt-8 bg-white/30 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-red-500"
              />
            </div>

            <div className="text-center mt-4">
              <Link href="/student-dashboard" className="text-white hover:underline">
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

      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="card mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Question {currentQuestion + 1} of {questions.length}
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
            {/* Reading passage display */}
            {type === 'reading' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <p className="text-gray-800 leading-relaxed text-lg">
                  {questions[currentQuestion]?.content.passage}
                </p>
              </div>
            )}

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
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(idx)}
                  className="btn-secondary text-left py-6 text-lg"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mt-8 bg-white/30 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-blue-500"
            />
          </div>

          <div className="text-center mt-4">
            <Link href="/student-dashboard" className="text-white hover:underline">
              ← Exit Activity
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
