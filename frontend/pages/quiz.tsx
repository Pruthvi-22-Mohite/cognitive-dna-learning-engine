import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { quizAPI } from '@/services/api';

export default function Quiz() {
  const router = useRouter();
  const { type } = router.query;
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Generate sample questions based on type
    generateQuestions(type as string);

    // Timer
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
    // Sample question generator - in production, fetch from backend
    const questionTemplates: any = {
      memory: [
        { q: "Remember this pattern: 🍎🍌🍇🍊. What comes after 🍌?", options: ["🍇", "🍎", "🍊", "🍋"], answer: 0 },
        { q: "Which shape matches? 🔵🔺🟢🔺. Find the matching pair.", options: ["🔵", "🔺", "🟢", "⭐"], answer: 1 },
        { q: "Recall the sequence: 2, 4, 6, ?. What's next?", options: ["7", "8", "9", "10"], answer: 1 },
      ],
      pattern: [
        { q: "What comes next? △ ○ △ ○ ?", options: ["△", "○", "□", "☆"], answer: 0 },
        { q: "Complete: 5, 10, 15, 20, ?", options: ["22", "25", "30", "35"], answer: 1 },
        { q: "Find the missing piece: A, C, E, G, ?", options: ["H", "I", "J", "K"], answer: 1 },
      ],
      logic: [
        { q: "If all cats have tails, and Fluffy is a cat, then:", options: ["Fluffy has no tail", "Fluffy has a tail", "Fluffy is not a cat", "Cannot tell"], answer: 1 },
        { q: "Tom is taller than Jerry. Jerry is taller than Spike. Who is shortest?", options: ["Tom", "Jerry", "Spike", "Same height"], answer: 2 },
        { q: "A square has how many sides?", options: ["3", "4", "5", "6"], answer: 1 },
      ],
      reading: [
        { q: "Read: 'The sun rises in the east.' Where does the sun rise?", options: ["West", "East", "North", "South"], answer: 1 },
        { q: "What is opposite of 'happy'?", options: ["Sad", "Joyful", "Excited", "Glad"], answer: 0 },
        { q: "Choose the noun: 'Run quickly'", options: ["Run", "Quickly", "Both", "Neither"], answer: 0 },
      ],
      speed: [
        { q: "Quick! What's 7 + 8?", options: ["14", "15", "16", "13"], answer: 1 },
        { q: "Fast! Which is bigger?", options: ["1/2", "1/4", "1/8", "1/10"], answer: 0 },
        { q: "Hurry! 9 × 6 = ?", options: ["52", "54", "56", "58"], answer: 1 },
      ],
    };

    setQuestions(questionTemplates[quizType] || questionTemplates.memory);
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, { question: currentQuestion, answer: answerIndex }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers = answers) => {
    // Calculate score
    let correctCount = 0;
    finalAnswers.forEach((ans, idx) => {
      if (ans.answer === questions[idx]?.answer) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    const timeTaken = 300 - timeLeft;
    const accuracy = calculatedScore;

    setScore(calculatedScore);
    setCompleted(true);

    // Submit to backend
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
      // Don't show error to user - submission is not critical for quiz completion
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
              <p className="text-gray-600 text-sm">Type: {type}</p>
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
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {questions[currentQuestion]?.q}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {questions[currentQuestion]?.options.map((option: string, idx: number) => (
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
