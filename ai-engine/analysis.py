import numpy as np
from typing import List, Dict
from scipy import stats
import random
import os
import google.generativeai as genai

# Initialize Gemini API
try:
    API_KEY = os.environ.get("GEMINI_API_KEY", "")
    genai.configure(api_key=API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Gemini AI Model Initialized successfully")
except Exception as e:
    print(f"⚠️ Failed to initialize Gemini API: {e}")
    gemini_model = None

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

    def generate_video_recommendations(self, traits: Dict[str, float], learning_style: str) -> List[Dict[str, str]]:
        """
        Generate curated YouTube video search links based on cognitive weaknesses
        and the child's detected learning style.
        
        Returns:
            List of dicts with title, url, and rationale
        """
        videos: List[Dict[str, str]] = []
        
        # Curated video recommendation map keyed by weak trait
        trait_video_map = {
            'memory': [
                {
                    'title': 'Fun Memory Games for Kids',
                    'url': 'https://www.youtube.com/results?search_query=memory+games+for+kids+brain+training',
                    'rationale': 'Visual memory scored below target. These games strengthen recall and working memory.',
                },
                {
                    'title': 'How to Improve Your Memory - Tips for Students',
                    'url': 'https://www.youtube.com/results?search_query=how+to+improve+memory+for+students+kids',
                    'rationale': 'Techniques like chunking and mnemonics can boost memory retention.',
                },
            ],
            'logicalThinking': [
                {
                    'title': 'Logic Puzzles & Brain Teasers for Kids',
                    'url': 'https://www.youtube.com/results?search_query=logic+puzzles+brain+teasers+for+kids',
                    'rationale': 'Logical reasoning needs practice. These puzzles build deductive thinking step by step.',
                },
                {
                    'title': 'Math Patterns and Sequences Explained',
                    'url': 'https://www.youtube.com/results?search_query=math+patterns+sequences+for+kids+explained',
                    'rationale': 'Recognizing numerical patterns strengthens the logical reasoning pathway.',
                },
            ],
            'visualLearning': [
                {
                    'title': 'Visual Math Puzzles for Kids',
                    'url': 'https://www.youtube.com/results?search_query=visual+math+puzzles+for+kids',
                    'rationale': 'Visual-spatial processing can be boosted with pattern and shape-based exercises.',
                },
                {
                    'title': 'Drawing & Diagram Techniques for Learning',
                    'url': 'https://www.youtube.com/results?search_query=visual+learning+techniques+diagrams+for+students',
                    'rationale': 'Learning to map concepts visually strengthens spatial reasoning.',
                },
            ],
            'readingSkill': [
                {
                    'title': 'Reading Comprehension Strategies for Kids',
                    'url': 'https://www.youtube.com/results?search_query=reading+comprehension+strategies+for+kids',
                    'rationale': 'Reading comprehension scored low. These strategies teach active reading habits.',
                },
                {
                    'title': 'Fun Storytime & Vocabulary Building',
                    'url': 'https://www.youtube.com/results?search_query=storytime+vocabulary+building+kids+read+aloud',
                    'rationale': 'Listening to stories and building vocabulary improves comprehension naturally.',
                },
            ],
            'problemSolving': [
                {
                    'title': 'Problem Solving Skills for Kids',
                    'url': 'https://www.youtube.com/results?search_query=problem+solving+skills+for+kids+critical+thinking',
                    'rationale': 'Problem-solving can be improved with structured step-by-step challenge exercises.',
                },
                {
                    'title': 'Coding & Computational Thinking for Beginners',
                    'url': 'https://www.youtube.com/results?search_query=coding+for+kids+beginners+computational+thinking',
                    'rationale': 'Coding games teach decomposition and algorithmic thinking – core problem-solving skills.',
                },
            ],
        }

        # Learning-style-specific bonus videos
        style_video_map = {
            'Visual': {
                'title': 'Visual Learning Techniques for Students',
                'url': 'https://www.youtube.com/results?search_query=visual+learning+techniques+mind+maps+kids',
                'rationale': 'As a visual learner, mind maps and infographics will accelerate your understanding.',
            },
            'Logical': {
                'title': 'Logical Thinking Exercises & Games',
                'url': 'https://www.youtube.com/results?search_query=logical+thinking+exercises+kids+games',
                'rationale': 'Logical learners thrive with structured reasoning games and number challenges.',
            },
            'Verbal': {
                'title': 'Public Speaking & Storytelling for Kids',
                'url': 'https://www.youtube.com/results?search_query=public+speaking+storytelling+for+kids',
                'rationale': 'Verbal learners benefit from expressing ideas through speech and creative writing.',
            },
            'Kinesthetic': {
                'title': 'Hands-On Science Experiments for Kids',
                'url': 'https://www.youtube.com/results?search_query=hands+on+science+experiments+kids+at+home',
                'rationale': 'Kinesthetic learners absorb best through physical experiments and tactile activities.',
            },
        }

        # Add videos for the weakest traits (score < 60)
        sorted_traits = sorted(traits.items(), key=lambda x: x[1])
        for trait_name, score in sorted_traits:
            if score < 60 and trait_name in trait_video_map:
                vids = trait_video_map[trait_name].copy()
                random.shuffle(vids)
                videos.extend(vids[:1]) # Pick 1 random video per weak trait

        # Add learning-style-specific video
        for style_key in learning_style.split('+'):
            style_key = style_key.strip()
            if style_key in style_video_map:
                videos.append(style_video_map[style_key])

        # Cap at 6 video recommendations
        random.shuffle(videos)
        return videos[:6]

    def generate_report_guidelines(self, traits: Dict[str, float], learning_style: str) -> List[Dict[str, str]]:
        """
        Generate actionable guidelines for parents and teachers based on the
        child's cognitive profile and learning style.
        
        Returns:
            List of dicts with category and instruction
        """
        guidelines: List[Dict[str, str]] = []

        # Trait-specific guidelines for weak areas
        if traits.get('memory', 50) < 60:
            guidelines.append({
                'category': 'Memory Development',
                'instruction': 'Play daily matching-pair card games with your child. Start with 6 pairs and gradually increase to 12. Repeat sequences of items aloud together before bedtime to strengthen auditory-visual memory links.',
            })
        if traits.get('logicalThinking', 50) < 60:
            guidelines.append({
                'category': 'Logical Reasoning',
                'instruction': 'Use physical blocks or LEGO sets to explain fractions and ratios before moving to numbers on paper. Ask "What would happen if…?" questions during everyday activities to build deductive thinking.',
            })
        if traits.get('visualLearning', 50) < 60:
            guidelines.append({
                'category': 'Visual-Spatial Skills',
                'instruction': 'Encourage drawing diagrams before solving math word problems. Use colour-coded sticky notes for different subjects. Let the child create mind-maps summarizing each chapter.',
            })
        if traits.get('readingSkill', 50) < 60:
            guidelines.append({
                'category': 'Reading Comprehension',
                'instruction': 'Read together for 15-20 minutes daily and pause to ask "Why do you think that happened?" after each page. Maintain a vocabulary journal where the child writes one new word and its meaning each day.',
            })
        if traits.get('problemSolving', 50) < 60:
            guidelines.append({
                'category': 'Problem Solving',
                'instruction': 'Present real-world mini-challenges (e.g., planning a picnic budget). Encourage the child to break every homework problem into 3 smaller steps before attempting to solve it.',
            })

        # Attention and processing speed guidelines
        if traits.get('attentionFocus', 50) < 60:
            guidelines.append({
                'category': 'Attention & Focus',
                'instruction': 'Use the Pomodoro technique (15 min focus, 5 min break) adapted for kids. Remove distractions during study time and introduce short mindfulness breathing exercises before homework.',
            })
        if traits.get('processingSpeed', 50) < 60:
            guidelines.append({
                'category': 'Processing Speed',
                'instruction': 'Practice timed activities in a low-pressure setting—use a kitchen timer for fun speed drills like rapid mental math or quick-fire vocabulary. Celebrate improvement, not perfection.',
            })

        # Learning-style-specific guidance for parents/teachers
        style_guidelines = {
            'Visual': {
                'category': 'Visual Learner Support',
                'instruction': 'Provide graph paper, coloured markers, and flowchart templates. Replace text-heavy notes with infographics. Use educational videos as the primary introduction to new topics.',
            },
            'Logical': {
                'category': 'Logical Learner Support',
                'instruction': 'Always explain the "why" behind rules and formulas. Introduce Sudoku, chess, and pattern-based board games. Let the child classify and sort objects during play.',
            },
            'Verbal': {
                'category': 'Verbal Learner Support',
                'instruction': 'Encourage reading aloud and group discussions. Let the child teach a concept back to you in their own words. Use audiobooks alongside printed books to reinforce comprehension.',
            },
            'Kinesthetic': {
                'category': 'Kinesthetic Learner Support',
                'instruction': 'Incorporate movement breaks every 20 minutes. Use physical manipulatives (coins, beads, blocks) for math. Let the child act out historical events or science concepts.',
            },
        }

        for style_key in learning_style.split('+'):
            style_key = style_key.strip()
            if style_key in style_guidelines:
                guidelines.append(style_guidelines[style_key])

        # General best-practice guideline
        guidelines.append({
            'category': 'General Best Practice',
            'instruction': 'Maintain a consistent daily study routine. Praise effort over results to build a growth mindset. Re-take the Cognitive DNA assessment every 4-6 weeks to track progress.',
        })

        return guidelines

    def generate_analysis_text(self, profile_data: Dict) -> str:
        """
        Compile the cognitive profile stats, learning style, strengths and
        weaknesses into a readable 2-3 paragraph narrative summary.
        
        Args:
            profile_data: Dictionary containing all profile fields
            
        Returns:
            A multi-paragraph analysis report string
        """
        learning_style = profile_data.get('learningStyle', 'Balanced')
        strengths = profile_data.get('strengths', [])
        weaknesses = profile_data.get('weaknesses', [])

        # Extract scores with safe defaults
        memory = profile_data.get('memory', 50)
        logical = profile_data.get('logicalThinking', 50)
        visual = profile_data.get('visualLearning', 50)
        reading = profile_data.get('readingSkill', 50)
        problem = profile_data.get('problemSolving', 50)
        attention = profile_data.get('attentionFocus', 50)
        speed = profile_data.get('processingSpeed', 50)

        scores = [memory, logical, visual, reading, problem, attention, speed]
        avg_score = round(sum(scores) / len(scores), 1)

        # Determine overall performance tier
        if avg_score >= 75:
            tier = "above average"
        elif avg_score >= 50:
            tier = "at an age-appropriate level"
        else:
            tier = "developing and has room for growth"

        # Try Gemini API first
        global gemini_model
        if gemini_model:
            try:
                prompt = f"""
                Act as an expert pediatric cognitive psychologist. Write a cohesive 3-paragraph diagnostic summary for a 10-12 year old student based on these cognitive scores (out of 100):
                - Visual Memory: {memory}
                - Logical Reasoning: {logical}
                - Visual Learning: {visual}
                - Reading Skill: {reading}
                - Problem Solving: {problem}
                - Attention Focus: {attention}
                - Processing Speed: {speed}
                
                Detected Learning Style: {learning_style}
                Strengths: {', '.join(strengths)}
                Weaknesses: {', '.join(weaknesses)}
                
                Guidelines:
                - Paragraph 1: Discuss their overall performance tier ({tier}), composite average ({avg_score}), and learning style.
                - Paragraph 2: Discuss their specific strengths and weaknesses based on the exact scores.
                - Paragraph 3: Provide 2-3 actionable recommendations and end with encouragement.
                - Do not use markdown formatting like **bold** in the response, keep it as plain text. Do not start with "Here is the report" or "Report:". Just return the paragraphs separated by a newline.
                """
                response = gemini_model.generate_content(prompt)
                if response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"Gemini API fallback for analysis text: {e}")
        # --- Fallback Paragraph 1: Overview ---
        intros = [
            f"This Cognitive DNA report reveals that the student's overall cognitive performance is {tier}, with a composite score of {avg_score} out of 100 across all assessed dimensions. ",
            f"Based on the latest assessment, the student has achieved a composite score of {avg_score}/100, indicating performance that is {tier}. ",
            f"The current cognitive evaluation shows a baseline score of {avg_score} across all dimensions, placing the student's performance level as {tier}. "
        ]
        ]
        
        style_intros = [
            f"The student has been identified as a '{learning_style.replace('-', '+')}' learner, meaning they absorb information most effectively through ",
            f"We have detected a strong '{learning_style.replace('-', '+')}' learning preference, suggesting they learn best using ",
            f"Their primary modality is '{learning_style.replace('-', '+')}', which means they thrive when engaged with "
        ]

        para1 = random.choice(intros) + random.choice(style_intros)
        style_desc = {
            'visual': "visual aids such as diagrams, videos, and colour-coded materials.",
            'logical': "structured reasoning, patterns, and step-by-step problem solving.",
            'verbal': "reading, discussion, and verbal explanation of concepts.",
            'kinesthetic': "hands-on activities, movement, and tactile engagement.",
        }
        primary_style = learning_style.split('-')[0].split('+')[0].strip().lower()
        para1 += style_desc.get(primary_style, "a balanced combination of learning modalities.")

        # --- Paragraph 2: Strengths & Weaknesses ---
        strength_text = ', '.join(strengths) if strengths else 'balanced cognitive abilities'
        weakness_text = ', '.join(weaknesses) if weaknesses else 'no significant gaps'

        strength_intros = [
            f"Key strengths include: {strength_text}. ",
            f"The student demonstrated remarkable proficiency in: {strength_text}. ",
            f"Notable cognitive assets identified during testing: {strength_text}. "
        ]
        weakness_intros = [
            f"Areas that would benefit from targeted practice include: {weakness_text}. ",
            f"Developmental focus should be directed towards: {weakness_text}. ",
            f"Opportunities for measurable growth lie in: {weakness_text}. "
        ]
        
        para2 = (
            random.choice(strength_intros) + 
            random.choice(weakness_intros) +
            f"Specifically, the highest-performing dimension scored {max(scores)} while the "
            f"area needing the most attention scored {min(scores)}. "
            f"This spread of {max(scores) - min(scores)} points indicates "
        )
        spread = max(scores) - min(scores)
        if spread > 30:
            para2 += "a pronounced difference between the student's strongest and weakest abilities, suggesting focused intervention in the weaker areas will yield significant improvement."
        elif spread > 15:
            para2 += "a moderate range of abilities, which is common and healthy. Targeted exercises in weaker areas can bring the profile into better balance."
        else:
            para2 += "a well-rounded cognitive profile with relatively balanced abilities across all dimensions."

        # --- Paragraph 3: Recommendations ---
        recommendations = profile_data.get('recommendations', [])
        if recommendations:
            rec_text = '; '.join(recommendations[:3])
            rec_intros = [
                f"Based on this analysis, the following actions are recommended: {rec_text}. ",
                f"To support continuous development, we prescribe the following routines: {rec_text}. ",
                f"Immediate actionable steps for parents and educators include: {rec_text}. "
            ]
            para3 = (
                random.choice(rec_intros) +
                f"Parents and teachers are encouraged to incorporate these strategies into daily routines "
                f"and reassess the student's cognitive profile in 4-6 weeks to measure progress. "
                f"Consistency and encouragement are the most powerful tools for cognitive development at this age."
            )
        else:
            para3 = (
                "Continue engaging with all five activity types regularly. "
                "A re-assessment in 4-6 weeks will provide an updated picture of cognitive growth. "
                "Consistency and encouragement are the most powerful tools for cognitive development at this age."
            )

        return f"{para1}\n\n{para2}\n\n{para3}"

    def generate_prescriptive_report(self, traits: Dict[str, float], learning_style: str, recommendations: List[str]) -> Dict:
        """
        Generate a prescriptive diagnostic report treating the assessment like a
        professional educational evaluation.

        Returns:
            Dict with keys: overallGrade, diagnosticSummary, remedialPath
        """

        # ── Overall Grade assignment ──
        scores = list(traits.values())
        avg = sum(scores) / len(scores) if scores else 50

        if avg >= 85:
            overall_grade = "Advanced Explorer"
        elif avg >= 70:
            overall_grade = "Confident Learner"
        elif avg >= 55:
            overall_grade = "Developing Thinker"
        elif avg >= 40:
            overall_grade = "Emerging Learner"
        else:
            overall_grade = "Needs Guided Support"

        # ── Remedial path (one entry per weak trait < 50) ──
        trait_meta = {
            'memory': {
                'label': 'Visual Memory',
                'videoTitle': 'Memory Improvement Techniques for Kids',
                'videoUrl': 'https://www.youtube.com/results?search_query=memory+improvement+techniques+for+kids',
                'tip': 'Practice 5 minutes of matching-pair card games daily. Use colourful flashcards before bedtime to reinforce recall.',
            },
            'logicalThinking': {
                'label': 'Logical Reasoning',
                'videoTitle': 'Logical Thinking Exercises for Young Minds',
                'videoUrl': 'https://www.youtube.com/results?search_query=logical+thinking+exercises+for+kids+step+by+step',
                'tip': 'Solve one age-appropriate logic puzzle each day. Use LEGO blocks to physically model "if-then" scenarios.',
            },
            'visualLearning': {
                'label': 'Visual-Spatial Skills',
                'videoTitle': 'Visual Learning Strategies for Students',
                'videoUrl': 'https://www.youtube.com/results?search_query=visual+learning+strategies+for+kids+diagrams',
                'tip': 'Draw a mind-map for every new chapter. Replace text notes with colour-coded diagrams for 10 minutes daily.',
            },
            'readingSkill': {
                'label': 'Reading Comprehension',
                'videoTitle': 'Reading Comprehension Tips for Kids',
                'videoUrl': 'https://www.youtube.com/results?search_query=reading+comprehension+tips+for+kids+how+to+improve',
                'tip': 'Read together for 15 minutes daily and pause after each page to ask "What just happened?" Maintain a vocabulary journal.',
            },
            'problemSolving': {
                'label': 'Problem Solving',
                'videoTitle': 'Problem Solving Skills for Children',
                'videoUrl': 'https://www.youtube.com/results?search_query=problem+solving+skills+for+children+exercises',
                'tip': 'Present one real-world mini-challenge daily (e.g., plan a picnic budget). Break every homework problem into 3 steps before starting.',
            },
        }

        remedial_path = []
        for trait_key, score in sorted(traits.items(), key=lambda x: x[1]):
            if score < 50 and trait_key in trait_meta:
                meta = trait_meta[trait_key]
                remedial_path.append({
                    'trait': meta['label'],
                    'score': round(score, 1),
                    'videoUrl': meta['videoUrl'],
                    'videoTitle': meta['videoTitle'],
                    'improvementTip': meta['tip'],
                })

        # ── Primary strength & weakness ──
        if traits:
            strongest_key = max(traits, key=traits.get)
            weakest_key = min(traits, key=traits.get)
        else:
            strongest_key = 'memory'
            weakest_key = 'memory'

        trait_labels = {k: v['label'] for k, v in trait_meta.items()}
        primary_strength = trait_labels.get(strongest_key, strongest_key)
        primary_weakness = trait_labels.get(weakest_key, weakest_key)

        # ── Diagnostic Summary (Doctor's Note) ──
        strength_score = round(traits.get(strongest_key, 50), 1)
        weakness_score = round(traits.get(weakest_key, 50), 1)

        diagnostic_summary = None
        if gemini_model:
            try:
                prompt = f"""
                Act as a pediatric educational specialist. Write a 'Diagnostic Summary' prescription note for a 10-12 year old.
                
                Scores:
                - Primary Asset: {primary_strength} ({strength_score}/100)
                - Primary Focus Area: {primary_weakness} ({weakness_score}/100)
                - Overall Grade Classification: {overall_grade}
                - Current Prescriptions: {'; '.join(recommendations[:3]) if recommendations else 'Practice all activities'}
                
                Format strictly like this EXACT structure (replace brackets with generated content):
                ASSESSMENT OUTCOME: {overall_grade}
                
                Primary Asset — {primary_strength} ({strength_score}/100): [2 sentences explaining how to leverage this strength in daily life/school]
                
                Primary Focus Area — {primary_weakness} ({weakness_score}/100): [2 sentences explaining how to improve this weakness]
                
                PRESCRIPTION: [2 sentences recommending specific daily actions based on the Current Prescriptions, emphasizing consistency]
                
                Keep it plain text, absolutely NO markdown formatting (no asterisks).
                """
                response = gemini_model.generate_content(prompt)
                if response.text:
                    diagnostic_summary = response.text.strip()
            except Exception as e:
                print(f"Gemini API fallback for diagnostic summary: {e}")

        if not diagnostic_summary:
            diagnostic_intros = [
                f"ASSESSMENT OUTCOME: {overall_grade}\n\n",
            f"FINAL EVALUATION: {overall_grade}\n\n",
            f"CLINICAL PROFILE: {overall_grade}\n\n"
        ]
        
        asset_templates = [
            f"Primary Asset — {primary_strength} ({strength_score}/100): This is the student's strongest cognitive dimension and should be leveraged as a gateway to teach weaker areas. For example, use {primary_strength.lower()}-based activities to introduce concepts in other subjects.\n\n",
            f"Cognitive Anchor — {primary_strength} ({strength_score}/100): The student excels here. We strongly advise using {primary_strength.lower()} methodologies to build confidence before tackling difficult homework.\n\n",
            f"Peak Ability — {primary_strength} ({strength_score}/100): Exceptional performance in this trait. Teachers can harness this {primary_strength.lower()} dominance to facilitate complex problem-solving.\n\n"
        ]
        
        focus_templates = [
            f"Primary Focus Area — {primary_weakness} ({weakness_score}/100): This dimension scored below the age-appropriate benchmark and would benefit from daily targeted practice. A structured 4-week remedial programme focusing on {primary_weakness.lower()} exercises is recommended.\n\n",
            f"Growth Opportunity — {primary_weakness} ({weakness_score}/100): We recommend dedicating 10-15 minutes a day specifically to {primary_weakness.lower()} tasks to build neural pathways in this area.\n\n",
            f"Targeted Intervention — {primary_weakness} ({weakness_score}/100): While developing, this trait requires attention. Consistent {primary_weakness.lower()} drills will yield rapid, measurable improvements.\n\n"
        ]

            diagnostic_summary = (
                random.choice(diagnostic_intros) +
                random.choice(asset_templates) +
                random.choice(focus_templates) +
                f"PRESCRIPTION: "
            )

            if recommendations:
                prescription_steps = '; '.join(recommendations[:3])
                diagnostic_summary += (
                    f"The following daily actions are prescribed: {prescription_steps}. "
                    f"Re-assess after 4-6 weeks to measure growth. Encourage the student with praise for effort, "
                    f"not just results. Consistency is the most powerful tool for cognitive development at this age."
                )
            else:
                diagnostic_summary += (
                    "Continue engaging with all five activity types regularly. "
                    "Re-assess after 4-6 weeks to measure growth."
                )

        return {
            'overallGrade': overall_grade,
            'diagnosticSummary': diagnostic_summary,
            'remedialPath': remedial_path,
        }

