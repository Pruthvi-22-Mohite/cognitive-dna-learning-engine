import { useState, useRef } from 'react';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface AdaptiveState {
  currentDifficulty: DifficultyLevel;
  streak: number;
  averageResponseTime: number;
  questionsAnswered: number;
  performanceHistory: Array<{
    questionId: number;
    isCorrect: boolean;
    responseTime: number;
    difficulty: DifficultyLevel;
  }>;
}

interface Question {
  id: number;
  type: string;
  content: any;
  correctAnswer: any;
  options?: string[];
  difficulty?: DifficultyLevel;
}

export const useAdaptiveQuiz = (quizType: string) => {
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>({
    currentDifficulty: 'medium',
    streak: 0,
    averageResponseTime: 0,
    questionsAnswered: 0,
    performanceHistory: [],
  });

  const questionStartTimeRef = useRef<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);

  // Age-appropriate thresholds for 9-12 year olds
  const THRESHOLDS = {
    FAST_RESPONSE: {
      easy: 3000,    // < 3s = fast for easy
      medium: 5000,  // < 5s = fast for medium  
      hard: 8000,    // < 8s = fast for hard
    },
    STREAK_TO_INCREASE: 3,   // 3 correct in a row to increase
    STREAK_TO_DECREASE: -2,  // 2 wrong in a row to decrease
  };

  /**
   * Record start of question (for timing)
   */
  const startQuestion = (questionId: number) => {
    questionStartTimeRef.current = Date.now();
  };

  /**
   * Process answer and adjust difficulty
   */
  const processAnswer = (
    question: Question,
    selectedAnswer: any,
    isCorrect: boolean
  ): { 
    nextDifficulty: DifficultyLevel;
    responseTime: number;
    updatedState: AdaptiveState;
  } => {
    const responseTime = Date.now() - questionStartTimeRef.current;
    
    // Update performance history
    const newPerformance = {
      questionId: question.id,
      isCorrect,
      responseTime,
      difficulty: adaptiveState.currentDifficulty,
    };

    // Calculate new streak
    const newStreak = isCorrect 
      ? adaptiveState.streak + 1 
      : adaptiveState.streak - 1;

    // Calculate new average response time
    const newAverageResponseTime = 
      ((adaptiveState.averageResponseTime * adaptiveState.questionsAnswered) + responseTime) / 
      (adaptiveState.questionsAnswered + 1);

    // Determine if difficulty should change
    let nextDifficulty = adaptiveState.currentDifficulty;
    let adjustedStreak = newStreak;

    const difficultyIndex = { easy: 0, medium: 1, hard: 2 }[adaptiveState.currentDifficulty];

    // Increase difficulty if on hot streak
    if (newStreak >= THRESHOLDS.STREAK_TO_INCREASE && difficultyIndex < 2) {
      const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
      nextDifficulty = difficulties[difficultyIndex + 1];
      adjustedStreak = 0; // Reset streak after difficulty change
    }
    // Decrease difficulty if struggling
    else if (newStreak <= THRESHOLDS.STREAK_TO_DECREASE && difficultyIndex > 0) {
      const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
      nextDifficulty = difficulties[difficultyIndex - 1];
      adjustedStreak = 0; // Reset streak after difficulty change
    }

    // Update state
    const newState: AdaptiveState = {
      currentDifficulty: nextDifficulty,
      streak: adjustedStreak,
      averageResponseTime: newAverageResponseTime,
      questionsAnswered: adaptiveState.questionsAnswered + 1,
      performanceHistory: [...adaptiveState.performanceHistory, newPerformance],
    };

    setAdaptiveState(newState);
    setAnsweredQuestions([...answeredQuestions, question.id]);

    return {
      nextDifficulty,
      responseTime,
      updatedState: newState,
    };
  };

  /**
   * Get next question based on current difficulty
   */
  const getNextQuestion = (allQuestions: Question[]): Question | null => {
    const remainingQuestions = allQuestions.filter(
      q => !answeredQuestions.includes(q.id) && q.difficulty === adaptiveState.currentDifficulty
    );

    if (remainingQuestions.length > 0) {
      // Return random question of current difficulty
      const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
      return remainingQuestions[randomIndex];
    }

    // If no questions at current difficulty, try adjacent difficulty
    const difficultyIndex = { easy: 0, medium: 1, hard: 2 }[adaptiveState.currentDifficulty];
    const fallbackIndex = adaptiveState.streak > 0 
      ? Math.min(2, difficultyIndex + 1)
      : Math.max(0, difficultyIndex - 1);
    
    const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    const fallbackDifficulty = difficulties[fallbackIndex];

    const fallbackQuestions = allQuestions.filter(
      q => !answeredQuestions.includes(q.id) && q.difficulty === fallbackDifficulty
    );

    if (fallbackQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
      return fallbackQuestions[randomIndex];
    }

    // Last resort: any remaining question
    const anyRemaining = allQuestions.filter(q => !answeredQuestions.includes(q.id));
    if (anyRemaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * anyRemaining.length);
      return anyRemaining[randomIndex];
    }

    return null; // No more questions
  };

  /**
   * Calculate adaptive score considering difficulty
   */
  const calculateAdaptiveScore = (totalQuestions: number, correctAnswers: number): number => {
    if (totalQuestions === 0) return 0;

    // Base accuracy score
    const baseScore = (correctAnswers / totalQuestions) * 100;

    // Difficulty multiplier (harder = more points)
    const difficultyMultipliers = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
    };

    // Calculate weighted score based on final difficulty
    let difficultyBonus = 0;
    if (adaptiveState.currentDifficulty === 'hard') {
      difficultyBonus = 20; // Bonus for reaching hard questions
    } else if (adaptiveState.currentDifficulty === 'medium') {
      difficultyBonus = 10;
    }

    // Speed bonus (faster = slightly more points, but capped)
    const speedBonus = Math.min(10, Math.max(0,
      (5000 - adaptiveState.averageResponseTime) / 1000
    ));

    // Final adaptive score
    const adaptiveScore = Math.min(100, Math.max(0,
      (baseScore * difficultyMultipliers[adaptiveState.currentDifficulty]) +
      difficultyBonus +
      speedBonus
    ));

    return Math.round(adaptiveScore);
  };

  /**
   * Get final difficulty level
   */
  const getFinalDifficulty = (): DifficultyLevel => {
    return adaptiveState.currentDifficulty;
  };

  /**
   * Get performance summary for backend submission
   */
  const getPerformanceSummary = () => {
    return {
      difficultyLevel: adaptiveState.currentDifficulty,
      adaptiveScore: 0, // Will be calculated after quiz completion
      averageResponseTime: Math.round(adaptiveState.averageResponseTime),
      totalQuestions: adaptiveState.questionsAnswered,
      finalStreak: adaptiveState.streak,
      performanceHistory: adaptiveState.performanceHistory,
    };
  };

  /**
   * Reset adaptive state for new quiz
   */
  const resetAdaptiveState = (startingDifficulty: DifficultyLevel = 'medium') => {
    setAdaptiveState({
      currentDifficulty: startingDifficulty,
      streak: 0,
      averageResponseTime: 0,
      questionsAnswered: 0,
      performanceHistory: [],
    });
    setAnsweredQuestions([]);
    setCurrentQuestionIndex(0);
  };

  return {
    adaptiveState,
    currentQuestionIndex,
    answeredQuestions,
    startQuestion,
    processAnswer,
    getNextQuestion,
    calculateAdaptiveScore,
    getFinalDifficulty,
    getPerformanceSummary,
    resetAdaptiveState,
    setCurrentQuestionIndex,
  };
};
