/**
 * Adaptive Difficulty Engine
 * Adjusts question difficulty based on student performance
 * Suitable for ages 9-12 (4th-6th grade)
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface PerformanceMetrics {
  isCorrect: boolean;
  responseTime: number; // milliseconds
  attemptNumber: number;
}

interface AdaptiveState {
  currentDifficulty: DifficultyLevel;
  streak: number; // positive = correct, negative = incorrect
  averageResponseTime: number;
  questionsAnswered: number;
}

class AdaptiveDifficultyEngine {
  private static readonly DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard'];
  
  // Age-appropriate thresholds for 9-12 year olds
  private static readonly THRESHOLDS = {
    // Response time thresholds (milliseconds) by difficulty
    FAST_RESPONSE: {
      easy: 3000,    // < 3s = fast for easy
      medium: 5000,  // < 5s = fast for medium
      hard: 8000,    // < 8s = fast for hard
    },
    // Streak requirements to change difficulty
    STREAK_TO_INCREASE: 3,   // 3 correct in a row
    STREAK_TO_DECREASE: -2,  // 2 wrong in a row
  };

  /**
   * Initialize adaptive state for a new test session
   */
  initializeState(startingDifficulty: DifficultyLevel = 'medium'): AdaptiveState {
    return {
      currentDifficulty: startingDifficulty,
      streak: 0,
      averageResponseTime: 0,
      questionsAnswered: 0,
    };
  }

  /**
   * Adjust difficulty based on performance
   */
  adjustDifficulty(
    state: AdaptiveState,
    performance: PerformanceMetrics
  ): AdaptiveState {
    const newState = { ...state };
    
    // Update streak
    if (performance.isCorrect) {
      newState.streak += 1;
    } else {
      newState.streak -= 1;
    }
    
    // Update average response time
    newState.averageResponseTime = 
      ((state.averageResponseTime * state.questionsAnswered) + performance.responseTime) / 
      (state.questionsAnswered + 1);
    
    newState.questionsAnswered += 1;
    
    // Determine if difficulty should change
    const currentIndex = this.getDifficultyIndex(state.currentDifficulty);
    
    // Increase difficulty if on a hot streak
    if (newState.streak >= AdaptiveDifficultyEngine.THRESHOLDS.STREAK_TO_INCREASE) {
      if (currentIndex < 2) {
        newState.currentDifficulty = this.getNextDifficulty(state.currentDifficulty);
        newState.streak = 0; // Reset streak after difficulty change
      }
    }
    
    // Decrease difficulty if struggling
    else if (newState.streak <= AdaptiveDifficultyEngine.THRESHOLDS.STREAK_TO_DECREASE) {
      if (currentIndex > 0) {
        newState.currentDifficulty = this.getPreviousDifficulty(state.currentDifficulty);
        newState.streak = 0; // Reset streak after difficulty change
      }
    }
    
    return newState;
  }

  /**
   * Get next question with appropriate difficulty
   */
  getNextQuestion(
    questions: any[],
    state: AdaptiveState,
    answeredIds: number[]
  ): any | null {
    const remainingQuestions = questions.filter(
      q => !answeredIds.includes(q.id) && q.difficulty === state.currentDifficulty
    );
    
    if (remainingQuestions.length > 0) {
      // Return random question of current difficulty
      return remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
    }
    
    // If no questions at current difficulty, try adjacent difficulty
    const fallbackDifficulty = state.streak > 0 
      ? this.getNextDifficulty(state.currentDifficulty)
      : this.getPreviousDifficulty(state.currentDifficulty);
    
    const fallbackQuestions = questions.filter(
      q => !answeredIds.includes(q.id) && q.difficulty === fallbackDifficulty
    );
    
    if (fallbackQuestions.length > 0) {
      return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    }
    
    // Last resort: any remaining question
    const anyRemaining = questions.filter(q => !answeredIds.includes(q.id));
    if (anyRemaining.length > 0) {
      return anyRemaining[Math.floor(Math.random() * anyRemaining.length)];
    }
    
    return null; // No more questions
  }

  /**
   * Calculate adaptive score considering difficulty
   */
  calculateAdaptiveScore(
    state: AdaptiveState,
    totalQuestions: number,
    correctAnswers: number
  ): number {
    if (totalQuestions === 0) return 0;
    
    // Base accuracy score
    const baseScore = (correctAnswers / totalQuestions) * 100;
    
    // Difficulty multiplier (harder = more points)
    const difficultyMultipliers = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
    };
    
    // Calculate weighted score based on difficulty distribution
    let difficultyBonus = 0;
    if (state.currentDifficulty === 'hard') {
      difficultyBonus = 20; // Bonus for reaching hard questions
    } else if (state.currentDifficulty === 'medium') {
      difficultyBonus = 10;
    }
    
    // Speed bonus (faster = slightly more points, but capped)
    const speedBonus = Math.min(10, Math.max(0, 
      (5000 - state.averageResponseTime) / 1000
    ));
    
    // Final adaptive score
    const adaptiveScore = Math.min(100, Math.max(0,
      (baseScore * difficultyMultipliers[state.currentDifficulty]) + 
      difficultyBonus + 
      speedBonus
    ));
    
    return Math.round(adaptiveScore);
  }

  /**
   * Get performance summary for AI analysis
   */
  getPerformanceSummary(state: AdaptiveState): any {
    return {
      finalDifficulty: state.currentDifficulty,
      peakDifficulty: this.getPeakDifficulty(state),
      averageResponseTime: Math.round(state.averageResponseTime),
      totalQuestions: state.questionsAnswered,
      finalStreak: state.streak,
      consistency: this.calculateConsistency(state),
    };
  }

  // Helper methods
  private getDifficultyIndex(difficulty: DifficultyLevel): number {
    return AdaptiveDifficultyEngine.DIFFICULTY_LEVELS.indexOf(difficulty);
  }

  private getNextDifficulty(current: DifficultyLevel): DifficultyLevel {
    const index = this.getDifficultyIndex(current);
    return index < 2 
      ? AdaptiveDifficultyEngine.DIFFICULTY_LEVELS[index + 1] 
      : current;
  }

  private getPreviousDifficulty(current: DifficultyLevel): DifficultyLevel {
    const index = this.getDifficultyIndex(current);
    return index > 0 
      ? AdaptiveDifficultyEngine.DIFFICULTY_LEVELS[index - 1] 
      : current;
  }

  private getPeakDifficulty(state: AdaptiveState): DifficultyLevel {
    // Simplified: track max difficulty reached
    return state.currentDifficulty;
  }

  private calculateConsistency(state: AdaptiveState): string {
    const absStreak = Math.abs(state.streak);
    if (absStreak >= 3) return 'high';
    if (absStreak >= 1) return 'moderate';
    return 'variable';
  }
}

// Singleton instance
export const adaptiveEngine = new AdaptiveDifficultyEngine();
