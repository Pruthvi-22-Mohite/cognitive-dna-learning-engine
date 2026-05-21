import numpy as np
from typing import List, Dict
import random

class CognitiveModel:
    """
    Machine Learning model for analyzing cognitive patterns in children.
    Detects learning styles and cognitive strengths/weaknesses.
    """
    
    def __init__(self):
        # Cognitive trait weights for different quiz types
        self.trait_weights = {
            'memory': {
                'memory': 0.7,
                'logicalThinking': 0.1,
                'visualLearning': 0.1,
                'readingSkill': 0.05,
                'problemSolving': 0.05,
            },
            'pattern': {
                'visualLearning': 0.5,
                'logicalThinking': 0.3,
                'problemSolving': 0.15,
                'memory': 0.05,
                'readingSkill': 0.0,
            },
            'logic': {
                'logicalThinking': 0.6,
                'problemSolving': 0.25,
                'visualLearning': 0.1,
                'memory': 0.05,
                'readingSkill': 0.0,
            },
            'reading': {
                'readingSkill': 0.7,
                'memory': 0.15,
                'logicalThinking': 0.1,
                'visualLearning': 0.05,
                'problemSolving': 0.0,
            },
            'speed': {
                'problemSolving': 0.4,
                'logicalThinking': 0.3,
                'memory': 0.2,
                'visualLearning': 0.1,
                'readingSkill': 0.0,
            }
        }
        
        # Learning style detection thresholds
        self.learning_styles = {
            'Visual': ['visualLearning', 'pattern', 'logic'],
            'Logical': ['logicalThinking', 'logic', 'pattern'],
            'Verbal': ['readingSkill', 'reading', 'memory'],
            'Kinesthetic': ['speed', 'problemSolving'],
        }
    
    def calculate_cognitive_traits(self, results: List[Dict]) -> Dict[str, float]:
        """
        Calculate cognitive traits based on quiz results.
        
        Args:
            results: List of quiz results with quizType, score, accuracy, timeTaken
            
        Returns:
            Dictionary of cognitive trait scores (0-100)
        """
        traits = {
            'logicalThinking': 0.0,
            'visualLearning': 0.0,
            'memory': 0.0,
            'readingSkill': 0.0,
            'problemSolving': 0.0,
        }
        
        total_weight = {trait: 0.0 for trait in traits}
        
        for result in results:
            quiz_type = result['quizType']
            score = float(result.get('score', 0))
            accuracy = float(result.get('accuracy', score))

            # Normalize scoring so correct runs remain near 100 and wrong runs
            # reduce the trait cleanly instead of being skewed by bonus math.
            performance_score = float(np.clip(accuracy, 0, 100))
            
            # Apply weights for this quiz type
            if quiz_type in self.trait_weights:
                weights = self.trait_weights[quiz_type]
                
                for trait, weight in weights.items():
                    if trait in traits:
                        traits[trait] += performance_score * weight
                        total_weight[trait] += weight
        
        # Normalize traits to 0-100 scale
        for trait in traits:
            if total_weight[trait] > 0:
                traits[trait] = min(100, max(0, traits[trait] / total_weight[trait]))
            else:
                traits[trait] = 50  # Default average if no data
        
        return traits
    
    def detect_learning_style(self, traits: Dict[str, float], results: List[Dict]) -> str:
        """
        Detect dominant learning style based on cognitive traits.
        
        Returns:
            Learning style string (e.g., "Visual+Logical")
        """
        style_scores = {}
        
        for style, indicators in self.learning_styles.items():
            score = 0
            count = 0
            
            for indicator in indicators:
                if indicator in traits:
                    score += traits[indicator]
                    count += 1
                elif any(r['quizType'] == indicator for r in results):
                    # Bonus for quiz types completed
                    score += 60
                    count += 1
            
            if count > 0:
                style_scores[style] = score / count
            else:
                style_scores[style] = 0
        
        # Sort styles by score
        sorted_styles = sorted(style_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Get top 1-2 styles
        top_styles = [style for style, score in sorted_styles[:2] if score > 50]
        
        if not top_styles:
            top_styles = [sorted_styles[0][0]] if sorted_styles else ['Balanced']
        
        return '+'.join(top_styles)
    
    def generate_recommendations(self, traits: Dict[str, float], learning_style: str) -> List[str]:
        """
        Generate personalized learning recommendations.
        
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Identify weakest areas
        sorted_traits = sorted(traits.items(), key=lambda x: x[1])
        weakest_areas = [trait for trait, score in sorted_traits[:2] if score < 70]
        
        # Generate recommendations based on weaknesses
        recommendation_templates = {
            'logicalThinking': [
                "Practice with logic puzzles and brain teasers daily",
                "Try coding games or mathematical reasoning exercises",
                "Use step-by-step problem-solving approaches"
            ],
            'visualLearning': [
                "Use diagrams, charts, and visual aids while studying",
                "Watch educational videos and animations",
                "Create mind maps and visual notes"
            ],
            'memory': [
                "Practice memory games like matching pairs",
                "Use mnemonic devices and memory palaces",
                "Break information into smaller chunks for better retention"
            ],
            'readingSkill': [
                "Read age-appropriate books for 20 minutes daily",
                "Practice reading comprehension exercises",
                "Discuss stories and summarize what you read"
            ],
            'problemSolving': [
                "Work on puzzle games and strategy challenges",
                "Try escape room games or mystery solving activities",
                "Practice breaking complex problems into smaller steps"
            ]
        }
        
        # Add recommendations for weak areas
        for area in weakest_areas:
            if area in recommendation_templates:
                recs = recommendation_templates[area].copy()
                random.shuffle(recs)
                recommendations.extend(recs[:2])
        
        # Add learning style specific recommendations
        style_recommendations = {
            'Visual': [
                "Use color-coded notes and highlighters",
                "Draw pictures and diagrams to understand concepts"
            ],
            'Logical': [
                "Look for patterns and connections in what you learn",
                "Ask 'why' questions to understand deeper concepts"
            ],
            'Verbal': [
                "Read instructions aloud and discuss with others",
                "Write summaries and explain concepts in your own words"
            ],
            'Kinesthetic': [
                "Use hands-on activities and experiments",
                "Take breaks and move around while studying"
            ]
        }
        
        for style in learning_style.split('+'):
            if style in style_recommendations:
                recs = style_recommendations[style].copy()
                random.shuffle(recs)
                recommendations.append(recs[0])
        
        # Remove duplicates and limit to 5 recommendations
        unique_recommendations = list(dict.fromkeys(recommendations))
        random.shuffle(unique_recommendations)
        unique_recommendations = unique_recommendations[:5]
        
        return unique_recommendations
