import numpy as np
from typing import List, Dict
from scipy import stats

class AnalysisEngine:
    """
    Statistical analysis engine for cognitive performance data.
    Analyzes patterns, trends, and behavioral metrics.
    """
    
    def __init__(self):
        pass
    
    def analyze_performance_trend(self, results: List[Dict]) -> Dict[str, float]:
        """
        Analyze performance trends over time.
        
        Returns:
            Dictionary with trend analysis metrics
        """
        if len(results) < 2:
            return {
                'trend': 'insufficient_data',
                'improvement_rate': 0,
                'consistency': 50
            }
        
        scores = [r['score'] for r in results]
        accuracies = [r['accuracy'] for r in results]
        
        # Calculate trend using linear regression
        x = np.arange(len(scores))
        slope_score, _, _, _, _ = stats.linregress(x, scores)
        slope_accuracy, _, _, _, _ = stats.linregress(x, accuracies)
        
        # Determine trend direction
        if slope_score > 2:
            trend = 'improving'
        elif slope_score < -2:
            trend = 'declining'
        else:
            trend = 'stable'
        
        # Calculate improvement rate (percentage)
        if len(scores) >= 2:
            improvement_rate = ((scores[-1] - scores[0]) / max(scores[0], 1)) * 100
        else:
            improvement_rate = 0
        
        # Calculate consistency (standard deviation)
        consistency = 100 - min(100, np.std(scores))
        
        return {
            'trend': trend,
            'improvement_rate': improvement_rate,
            'consistency': consistency,
            'avg_score': np.mean(scores),
            'avg_accuracy': np.mean(accuracies),
        }
    
    def detect_behavioral_patterns(self, results: List[Dict]) -> Dict[str, any]:
        """
        Detect behavioral patterns from quiz interactions.
        
        Returns:
            Dictionary with behavioral insights
        """
        if not results:
            return {
                'avg_time_per_question': 0,
                'speed_accuracy_tradeoff': 'balanced',
                'performance_pattern': 'insufficient_data'
            }
        
        # Analyze time taken
        times = [r['timeTaken'] for r in results]
        avg_time = np.mean(times)
        
        # Analyze speed vs accuracy relationship
        accuracies = [r['accuracy'] for r in results]
        
        if len(times) > 1:
            correlation, _ = stats.pearsonr(times, accuracies)
            
            if correlation > 0.3:
                speed_accuracy_tradeoff = 'cautious_accurate'
            elif correlation < -0.3:
                speed_accuracy_tradeoff = 'fast_risky'
            else:
                speed_accuracy_tradeoff = 'balanced'
        else:
            speed_accuracy_tradeoff = 'balanced'
        
        # Determine performance pattern
        score_variance = np.var([r['score'] for r in results])
        
        if score_variance < 50:
            performance_pattern = 'consistent'
        elif score_variance < 150:
            performance_pattern = 'variable'
        else:
            performance_pattern = 'unpredictable'
        
        return {
            'avg_time_per_question': avg_time,
            'speed_accuracy_tradeoff': speed_accuracy_tradeoff,
            'performance_pattern': performance_pattern,
        }
    
    def calculate_difficulty_adjustment(self, results: List[Dict]) -> float:
        """
        Calculate recommended difficulty adjustment (-1 to +1).
        
        Returns:
            Float indicating difficulty adjustment
            -1: Much easier needed
            0: Current level appropriate
            +1: Much harder needed
        """
        if not results:
            return 0
        
        recent_results = results[-5:]  # Last 5 attempts
        avg_score = np.mean([r['score'] for r in recent_results])
        avg_accuracy = np.mean([r['accuracy'] for r in recent_results])
        
        # Combined performance metric
        performance = (avg_score * 0.6) + (avg_accuracy * 0.4)
        
        # Map to -1 to +1 range
        if performance > 85:
            adjustment = min(1.0, (performance - 85) / 15)
        elif performance < 50:
            adjustment = max(-1.0, (performance - 50) / 50)
        else:
            adjustment = 0
        
        return adjustment
    
    def generate_detailed_insights(self, results: List[Dict]) -> List[str]:
        """
        Generate detailed insights about student's cognitive performance.
        
        Returns:
            List of insight strings
        """
        insights = []
        
        if len(results) < 3:
            return ["Complete more activities for detailed insights"]
        
        # Performance insights
        trend_analysis = self.analyze_performance_trend(results)
        
        if trend_analysis['trend'] == 'improving':
            insights.append("Great progress! Your scores are improving over time.")
        elif trend_analysis['trend'] == 'declining':
            insights.append("Consider taking breaks between activities to maintain focus.")
        
        # Consistency insight
        if trend_analysis['consistency'] > 80:
            insights.append("You show very consistent performance across activities!")
        elif trend_analysis['consistency'] < 50:
            insights.append("Try to maintain steady focus throughout all activities.")
        
        # Behavioral insights
        behavior = self.detect_behavioral_patterns(results)
        
        if behavior['speed_accuracy_tradeoff'] == 'cautious_accurate':
            insights.append("You prioritize accuracy over speed - excellent attention to detail!")
        elif behavior['speed_accuracy_tradeoff'] == 'fast_risky':
            insights.append("Try to balance speed with careful thinking for better results.")
        
        # Subject-specific insights
        quiz_types = {}
        for result in results:
            quiz_type = result['quizType']
            if quiz_type not in quiz_types:
                quiz_types[quiz_type] = []
            quiz_types[quiz_type].append(result['score'])
        
        best_subject = max(quiz_types.items(), key=lambda x: np.mean(x[1]))
        worst_subject = min(quiz_types.items(), key=lambda x: np.mean(x[1]))
        
        subject_names = {
            'memory': 'Memory Challenge',
            'pattern': 'Pattern Detective',
            'logic': 'Logic Puzzles',
            'reading': 'Reading Quest',
            'speed': 'Speed Challenge'
        }
        
        if np.mean(best_subject[1]) > 75:
            insights.append(f"You excel at {subject_names.get(best_subject[0], best_subject[0])}!")
        
        if np.mean(worst_subject[1]) < 60:
            insights.append(f"Practice more {subject_names.get(worst_subject[0], worst_subject[0])} to improve.")
        
        return insights[:5]  # Return top 5 insights
