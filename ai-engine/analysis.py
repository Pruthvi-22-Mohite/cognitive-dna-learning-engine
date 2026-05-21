import json
import os
import random
import re
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

import google.generativeai as genai
import numpy as np
from scipy import stats

# Initialize Gemini API
try:
    API_KEY = os.environ.get("GEMINI_API_KEY")
    if API_KEY:
        genai.configure(api_key=API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("Gemini AI Model initialized successfully")
    else:
        print("WARNING: GEMINI_API_KEY not found. Gemini will use static fallback.")
        gemini_model = None
except Exception as e:
    print(f"Failed to initialize Gemini API: {e}")
    gemini_model = None


class AnalysisEngine:
    """
    Statistical analysis engine for cognitive performance data.
    Analyzes patterns, trends, and behavioral metrics.
    """

    TRAIT_LABELS = {
        "memory": "Visual Memory",
        "logicalThinking": "Logical Reasoning",
        "visualLearning": "Visual-Spatial Skills",
        "readingSkill": "Reading Comprehension",
        "problemSolving": "Problem Solving",
        "attentionFocus": "Attention & Focus",
        "processingSpeed": "Processing Speed",
    }

    def __init__(self):
        pass

    def _derive_weaknesses_from_traits(self, traits: Dict[str, float]) -> List[str]:
        weaknesses: List[str] = []

        if traits.get("memory", 50) < 50:
            weaknesses.append("Visual memory development needed")
        if traits.get("logicalThinking", 50) < 50:
            weaknesses.append("Logical reasoning practice recommended")
        if traits.get("readingSkill", 50) < 50:
            weaknesses.append("Reading comprehension support")
        if traits.get("problemSolving", 50) < 50:
            weaknesses.append("Processing speed exercises")

        return weaknesses

    def _weakness_to_dimension(self, weakness: str) -> str:
        weakness_lower = weakness.lower()

        if "memory" in weakness_lower:
            return "Visual Memory"
        if "logic" in weakness_lower or "reason" in weakness_lower:
            return "Logical Reasoning"
        if "visual" in weakness_lower or "spatial" in weakness_lower:
            return "Visual-Spatial Skills"
        if "reading" in weakness_lower or "comprehension" in weakness_lower:
            return "Reading Comprehension"
        if "problem" in weakness_lower:
            return "Problem Solving"
        if "process" in weakness_lower or "speed" in weakness_lower:
            return "Processing Speed"
        if "attention" in weakness_lower or "focus" in weakness_lower:
            return "Attention & Focus"

        return weakness.strip() or "General Skill Building"

    def _dimension_to_trait_key(self, dimension: str) -> Optional[str]:
        normalized_dimension = dimension.lower()
        for trait_key, label in self.TRAIT_LABELS.items():
            if label.lower() == normalized_dimension:
                return trait_key
        return None

    def _fallback_youtube_topic(self, dimension: str, learning_style: str) -> str:
        primary_style = learning_style.split("+")[0].strip().lower()

        # Multiple topic variations per dimension/style to ensure variety
        style_topics = {
            "visual": {
                "Visual Memory": [
                    "animated memory palace tricks for kids with colorful cartoons",
                    "visual memory games animation for children memory training",
                    "colorful picture memory challenge for kids with music",
                    "animated short term memory exercises for 10 year olds",
                ],
                "Logical Reasoning": [
                    "animated detective logic puzzle stories for kids",
                    "mystery solving animation for kids with clues",
                    "logic puzzle animation explained visually for children",
                    "animated step by step reasoning challenges for kids",
                ],
                "Visual-Spatial Skills": [
                    "3D shape puzzle animation for children",
                    "animated spatial reasoning games for kids",
                    "visual maze solving animation kids brain training",
                    "3D geometry puzzle animation educational for kids",
                ],
                "Reading Comprehension": [
                    "story map animation reading comprehension for children",
                    "visual story sequencing animation kids reading",
                    "animated storyboard reading comprehension for kids",
                    "picture based reading comprehension for children",
                ],
                "Problem Solving": [
                    "visual puzzle challenge animation for 10 year olds",
                    "animated problem solving games kids visual thinking",
                    "visual strategy puzzle animation for children",
                    "step by step visual puzzle solving for kids",
                ],
                "Processing Speed": [
                    "fast visual brain games for kids with timers",
                    "visual speed reaction games animation for children",
                    "quick visual recognition games for kids",
                    "animated fast paced visual games for kids",
                ],
                "Attention & Focus": [
                    "focus games for kids with colorful visual cues",
                    "animated concentration games for kids visual",
                    "visual attention games kids brain training",
                    "colorful mindfulness games for kids focus",
                ],
            },
            "logical": {
                "Visual Memory": [
                    "mnemonic memory systems for kids explained with patterns",
                    "pattern based memory tricks for children logic",
                    "logical memory palace technique kids explained",
                    "systematic memory tricks for kids with patterns",
                ],
                "Logical Reasoning": [
                    "minecraft redstone logic gates tutorial for 10 year olds",
                    "coding logic gates explained for kids simple",
                    "boolean logic puzzles for kids explained easy",
                    "if then logic rules game for children",
                ],
                "Visual-Spatial Skills": [
                    "tangram strategy puzzles for kids explained step by step",
                    "geometric logic puzzle kids explained reasoning",
                    "shape rotation logic game for kids",
                    "spatial reasoning logic puzzle for children",
                ],
                "Reading Comprehension": [
                    "how to find clues and evidence while reading stories for kids",
                    "logical inference reading comprehension for kids",
                    "cause and effect reasoning stories kids",
                    "deductive reasoning reading for children",
                ],
                "Problem Solving": [
                    "kid friendly strategy puzzles with step by step reasoning",
                    "logic based strategy games for kids explained",
                    "puzzle solving technique kids step by step",
                    "logical deduction puzzle for children game",
                ],
                "Processing Speed": [
                    "mental math speed drills for children with logic shortcuts",
                    "fast math tricks for kids logical reasoning",
                    "quick calculation techniques kids explained",
                    "speed mental math games for children",
                ],
                "Attention & Focus": [
                    "brain training concentration challenges for kids",
                    "focus logic games kids brain training exercises",
                    "concentration puzzle games for children",
                    "sustained attention logic challenge for kids",
                ],
            },
            "verbal": {
                "Visual Memory": [
                    "storytelling memory tricks for children with funny examples",
                    "verbal memory story technique kids explained",
                    "narrative memory games for children audio",
                    "story based memory training kids fun",
                ],
                "Logical Reasoning": [
                    "Batman detective riddles explained for kids",
                    "mystery stories with reasoning riddles for kids",
                    "detective story solving game for children",
                    "riddle solving technique kids explained easy",
                ],
                "Visual-Spatial Skills": [
                    "describe and draw challenge game for kids",
                    "verbal description drawing game kids communication",
                    "spatial description communication game children",
                    "describe the scene drawing game kids fun",
                ],
                "Reading Comprehension": [
                    "read aloud comprehension questions for children",
                    "audiobook comprehension games for kids discussion",
                    "read and discuss story comprehension kids",
                    "reading aloud technique kids comprehension",
                ],
                "Problem Solving": [
                    "mystery solving stories for kids with clues and answers",
                    "detective mystery stories kids problem solving",
                    "story based problem solving game children",
                    "narrative mystery game kids with clues",
                ],
                "Processing Speed": [
                    "rapid word challenge games for children",
                    "word speed games kids verbal challenge",
                    "quick word recognition games for kids",
                    "fast word recall games children",
                ],
                "Attention & Focus": [
                    "listening games to improve focus for kids",
                    "audio attention games kids focus training",
                    "listening comprehension focus game children",
                    "concentration listening activity kids",
                ],
            },
            "kinesthetic": {
                "Visual Memory": [
                    "movement memory game for kids at home",
                    "action sequence memory game kids physical",
                    "movement based memory training kids fun",
                    "dance move memory game for children",
                ],
                "Logical Reasoning": [
                    "hands on logic puzzles with LEGO for kids",
                    "physical block logic puzzle game kids",
                    "hands on logic game kids build and test",
                    "LEGO logic gate puzzle kids explained",
                ],
                "Visual-Spatial Skills": [
                    "build it yourself cardboard maze challenge for kids",
                    "building spatial maze game kids physical",
                    "hands on maze building activity kids",
                    "cardboard structure building kids spatial",
                ],
                "Reading Comprehension": [
                    "act out a story reading comprehension activity for kids",
                    "dramatic reading comprehension game kids",
                    "role play story comprehension activity kids",
                    "physical acting out stories kids comprehension",
                ],
                "Problem Solving": [
                    "escape room challenge ideas for kids at home",
                    "physical escape room puzzle game kids fun",
                    "hands on escape room activity kids",
                    "DIY escape room challenge kids problem solving",
                ],
                "Processing Speed": [
                    "reaction time games for kids physical brain breaks",
                    "physical speed challenge games kids reaction",
                    "movement speed game kids reaction training",
                    "active reaction time game children",
                ],
                "Attention & Focus": [
                    "brain break focus exercises for kids with movement",
                    "active focus game kids movement exercise",
                    "physical mindfulness activity kids focus",
                    "movement based concentration activity kids",
                ],
            },
        }

        default_topics = {
            "Visual Memory": [
                "fun memory games for kids brain training",
                "memory challenge games kids practice",
            ],
            "Logical Reasoning": [
                "logic puzzles and brain teasers for kids",
                "reasoning puzzle game kids fun",
            ],
            "Visual-Spatial Skills": [
                "visual spatial activities for kids",
                "spatial games kids brain training",
            ],
            "Reading Comprehension": [
                "reading comprehension strategies for kids",
                "reading understanding games for kids",
            ],
            "Problem Solving": [
                "problem solving skills for children activities",
                "puzzle solving game kids practice",
            ],
            "Processing Speed": [
                "processing speed exercises for kids",
                "speed games kids reaction training",
            ],
            "Attention & Focus": [
                "attention and concentration games for kids",
                "focus games kids brain training",
            ],
        }

        # Get the appropriate topics list
        topics_list = style_topics.get(primary_style, {}).get(dimension) or default_topics.get(dimension, [f"{dimension} activities for kids"])
        
        # Return a random topic from the list for variety
        return random.choice(topics_list) if topics_list else f"{dimension} activities for kids"

    def _build_static_remedial_plan(self, weaknesses: list[str]) -> list[dict[str, str]]:
        topic_pool = {
            "Visual Memory": [
                "memory palace cartoon adventure for kids",
                "spot the difference brain games for children",
                "picture sequence recall challenge for 10 year olds",
                "hidden object memory quest for kids",
            ],
            "Logical Reasoning": [
                "minecraft redstone logic gates tutorial for kids",
                "detective riddle cases explained for children",
                "pattern puzzle olympiad tricks for 10 year olds",
                "kid friendly coding logic puzzles with scratch",
            ],
            "Visual-Spatial Skills": [
                "3d shape rotation animation for kids",
                "tangram challenge strategies for children",
                "lego symmetry building ideas for 10 year olds",
                "maze drawing and mapping games for kids",
            ],
            "Reading Comprehension": [
                "animated read aloud with inference questions for kids",
                "story clue hunt comprehension lesson for children",
                "comic strip reading strategies for 10 year olds",
                "how to predict and summarize stories for kids",
            ],
            "Problem Solving": [
                "escape room puzzle ideas for kids at home",
                "bridge building STEM challenge for children",
                "treasure hunt clue solving game for 10 year olds",
                "strategy puzzle walkthrough for curious kids",
            ],
            "Processing Speed": [
                "rapid fire brain games for kids with timer",
                "quick thinking challenge activities for children",
                "mental math speed warmups for 10 year olds",
                "reaction time brain breaks for kids",
            ],
            "Attention & Focus": [
                "focus games for kids with movement breaks",
                "mindful concentration challenge for children",
                "listen and react attention training for kids",
                "one minute classroom focus games for 10 year olds",
            ],
        }

        tip_pool = {
            "Visual Memory": [
                "Use a short picture-flash routine, then ask the child to redraw what they saw from memory.",
                "Turn recall practice into a scavenger hunt with 5 objects that disappear after one minute.",
                "Build memory strength with color-coded card flips and a quick retell after each round.",
            ],
            "Logical Reasoning": [
                "Give one daily if-then challenge and ask the child to explain the rule before solving it.",
                "Use buildable puzzles where the child predicts what happens next and tests the idea physically.",
                "Practice logic through clue-based elimination games instead of repeated worksheet drills.",
            ],
            "Visual-Spatial Skills": [
                "Ask the child to sketch shapes, arrows, and layouts before solving the task itself.",
                "Use folding, rotating, and arranging objects by hand before switching to paper questions.",
                "Turn spatial practice into a build-and-explain activity with blocks, paper, or tangrams.",
            ],
            "Reading Comprehension": [
                "Pause after each paragraph for a one-sentence retell and one prediction about what comes next.",
                "Use short stories and ask the child to circle clues that reveal feelings, motives, or outcomes.",
                "Mix reading with discussion so comprehension feels like solving a mini mystery instead of a test.",
            ],
            "Problem Solving": [
                "Teach a three-step habit: name the goal, list two options, and justify the next move aloud.",
                "Use real-world mini challenges that require planning, testing, and revising one idea at a time.",
                "Let the child solve one playful obstacle each day and explain why their solution should work.",
            ],
            "Processing Speed": [
                "Run one-minute challenge rounds with easy prompts first, then increase pace without adding pressure.",
                "Use quick retrieval games where the child celebrates beating their own previous time.",
                "Practice short timed bursts followed by calm review so speed improves without careless mistakes.",
            ],
            "Attention & Focus": [
                "Start work with a tiny reset routine: breathe, move, then focus on one visible target task.",
                "Use short focus sprints with clear stop points so attention feels achievable and rewarding.",
                "Alternate movement and concentration tasks to help the child reset before the next learning block.",
            ],
        }

        used_topics: set[str] = set()
        cards: list[dict[str, str]] = []

        for weakness in [w.strip() for w in weaknesses if w and w.strip()]:
            dimension = self._weakness_to_dimension(weakness) if hasattr(self, "_weakness_to_dimension") else weakness
            topics = topic_pool.get(dimension, ["brain training activities for kids"])
            tips = tip_pool.get(
                dimension,
                ["Use short, encouraging daily practice with one clear goal and quick feedback."],
            )

            available_topics = [topic for topic in topics if topic not in used_topics]
            if not available_topics:
                available_topics = topics

            youtube_topic = random.choice(available_topics)
            used_topics.add(youtube_topic)

            cards.append({
                "dimension": dimension,
                "tip": random.choice(tips),
                "youtubeTopic": youtube_topic,
            })

        return cards

    def _parse_remedial_plan_response(
        self,
        raw_text: str,
        weaknesses: List[str],
        learning_style: str,
    ) -> List[Dict[str, str]]:
        fallback_plan = self._build_static_remedial_plan(weaknesses, learning_style)

        if not raw_text:
            return fallback_plan

        cleaned_text = raw_text.strip()
        candidate_payloads = [cleaned_text]

        start_idx = cleaned_text.find("[")
        end_idx = cleaned_text.rfind("]")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            candidate_payloads.append(cleaned_text[start_idx : end_idx + 1])

        for payload in candidate_payloads:
            try:
                parsed = json.loads(payload)
            except Exception:
                continue

            if not isinstance(parsed, list):
                continue

            normalized_items: List[Dict[str, str]] = []
            for index, item in enumerate(parsed):
                if not isinstance(item, dict):
                    normalized_items = []
                    break

                dimension = str(item.get("dimension", "")).strip()
                tip = str(item.get("tip", "")).strip()
                youtube_topic = str(item.get("youtubeTopic", "")).strip()

                if not dimension:
                    dimension = self._weakness_to_dimension(
                        weaknesses[index] if index < len(weaknesses) else "General Skill Building"
                    )
                if not tip or not youtube_topic:
                    normalized_items = []
                    break

                normalized_items.append(
                    {
                        "dimension": dimension,
                        "tip": tip,
                        "youtubeTopic": youtube_topic,
                    }
                )

            if normalized_items:
                # Deduplicate YouTube topics - if duplicates found, regenerate them
                seen_topics: set = set()
                deduplicated_items: List[Dict[str, str]] = []
                for item in normalized_items:
                    topic = item.get("youtubeTopic", "")
                    if topic in seen_topics:
                        # Duplicate found - regenerate a new topic for this dimension
                        dimension = item.get("dimension", "")
                        new_topic = self._fallback_youtube_topic(dimension, learning_style)
                        attempts = 0
                        while new_topic in seen_topics and attempts < 3:
                            new_topic = self._fallback_youtube_topic(dimension, learning_style)
                            attempts += 1
                        item["youtubeTopic"] = new_topic
                        topic = new_topic
                    seen_topics.add(topic)
                    deduplicated_items.append(item)
                
                return deduplicated_items

        return fallback_plan

    def analyze_performance_trend(self, results: List[Dict]) -> Dict[str, float]:
        """
        Analyze performance trends over time.

        Returns:
            Dictionary with trend analysis metrics
        """
        if len(results) < 2:
            return {
                "trend": "insufficient_data",
                "improvement_rate": 0,
                "consistency": 50,
            }

        scores = [r["score"] for r in results]
        accuracies = [r["accuracy"] for r in results]

        x = np.arange(len(scores))
        slope_score, _, _, _, _ = stats.linregress(x, scores)
        slope_accuracy, _, _, _, _ = stats.linregress(x, accuracies)

        if slope_score > 2:
            trend = "improving"
        elif slope_score < -2:
            trend = "declining"
        else:
            trend = "stable"

        if len(scores) >= 2:
            improvement_rate = ((scores[-1] - scores[0]) / max(scores[0], 1)) * 100
        else:
            improvement_rate = 0

        consistency = 100 - min(100, np.std(scores))

        return {
            "trend": trend,
            "improvement_rate": improvement_rate,
            "consistency": consistency,
            "avg_score": np.mean(scores),
            "avg_accuracy": np.mean(accuracies),
        }

    def detect_behavioral_patterns(self, results: List[Dict]) -> Dict[str, Any]:
        """
        Detect behavioral patterns from quiz interactions.

        Returns:
            Dictionary with behavioral insights
        """
        if not results:
            return {
                "avg_time_per_question": 0,
                "speed_accuracy_tradeoff": "balanced",
                "performance_pattern": "insufficient_data",
            }

        times = [r["timeTaken"] for r in results]
        avg_time = np.mean(times)
        accuracies = [r["accuracy"] for r in results]

        if len(times) > 1:
            correlation, _ = stats.pearsonr(times, accuracies)
            if correlation > 0.3:
                speed_accuracy_tradeoff = "cautious_accurate"
            elif correlation < -0.3:
                speed_accuracy_tradeoff = "fast_risky"
            else:
                speed_accuracy_tradeoff = "balanced"
        else:
            speed_accuracy_tradeoff = "balanced"

        score_variance = np.var([r["score"] for r in results])

        if score_variance < 50:
            performance_pattern = "consistent"
        elif score_variance < 150:
            performance_pattern = "variable"
        else:
            performance_pattern = "unpredictable"

        return {
            "avg_time_per_question": avg_time,
            "speed_accuracy_tradeoff": speed_accuracy_tradeoff,
            "performance_pattern": performance_pattern,
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

        recent_results = results[-5:]
        avg_score = np.mean([r["score"] for r in recent_results])
        avg_accuracy = np.mean([r["accuracy"] for r in recent_results])

        performance = (avg_score * 0.6) + (avg_accuracy * 0.4)

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
        insights: List[str] = []

        if len(results) < 3:
            return ["Complete more activities for detailed insights"]

        trend_analysis = self.analyze_performance_trend(results)

        if trend_analysis["trend"] == "improving":
            insights.append("Great progress! Your scores are improving over time.")
        elif trend_analysis["trend"] == "declining":
            insights.append("Consider taking breaks between activities to maintain focus.")

        if trend_analysis["consistency"] > 80:
            insights.append("You show very consistent performance across activities!")
        elif trend_analysis["consistency"] < 50:
            insights.append("Try to maintain steady focus throughout all activities.")

        behavior = self.detect_behavioral_patterns(results)

        if behavior["speed_accuracy_tradeoff"] == "cautious_accurate":
            insights.append("You prioritize accuracy over speed - excellent attention to detail!")
        elif behavior["speed_accuracy_tradeoff"] == "fast_risky":
            insights.append("Try to balance speed with careful thinking for better results.")

        quiz_types: Dict[str, List[float]] = {}
        for result in results:
            quiz_type = result["quizType"]
            if quiz_type not in quiz_types:
                quiz_types[quiz_type] = []
            quiz_types[quiz_type].append(result["score"])

        best_subject = max(quiz_types.items(), key=lambda x: np.mean(x[1]))
        worst_subject = min(quiz_types.items(), key=lambda x: np.mean(x[1]))

        subject_names = {
            "memory": "Memory Challenge",
            "pattern": "Pattern Detective",
            "logic": "Logic Puzzles",
            "reading": "Reading Quest",
            "speed": "Speed Challenge",
        }

        if np.mean(best_subject[1]) > 75:
            insights.append(f"You excel at {subject_names.get(best_subject[0], best_subject[0])}!")

        if np.mean(worst_subject[1]) < 60:
            insights.append(f"Practice more {subject_names.get(worst_subject[0], worst_subject[0])} to improve.")

        return insights[:5]

    def generate_remedial_plan(self, weaknesses: list[str], learning_style: str) -> list[dict[str, str]]:
        sanitized_weaknesses = [w.strip() for w in weaknesses if w and w.strip()]
        if not sanitized_weaknesses:
            return []

        def normalize_topic(value: str) -> str:
            return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", "", value.lower())).strip()

        def too_similar(topic: str, seen_normalized: set[str]) -> bool:
            current = set(normalize_topic(topic).split())
            if not current:
                return True
            for prior in seen_normalized:
                if prior == normalize_topic(topic):
                    return True
                prior_tokens = set(prior.split())
                overlap = len(current & prior_tokens) / max(1, len(current | prior_tokens))
                if overlap >= 0.75:
                    return True
            return False

        fallback_plan = self._build_static_remedial_plan(sanitized_weaknesses)

        global gemini_model
        if not gemini_model:
            import os
            import google.generativeai as genai

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                print("WARNING: GEMINI_API_KEY not found. Using static fallback.")
                return fallback_plan

            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
You are an expert pediatric educational strategist designing support for a child.

Learning style: {learning_style}
Weaknesses:
{json.dumps(sanitized_weaknesses, ensure_ascii=True, indent=2)}

Task:
- Create exactly one remedial recommendation per weakness.
- For each weakness, generate a unique, hyper-specific `tip`.
- For each weakness, generate a highly randomized, vivid, engaging YouTube search query in `youtubeTopic`.
- Heavily adapt every `youtubeTopic` to the child's learning style.
- Visual learners should get animated, colorful, diagram-heavy search topics.
- Kinesthetic learners should get physical, hands-on, movement-based, experiment-based, or build-it-yourself search topics.
- Verbal learners should get storytelling, read-aloud, discussion, vocabulary, or mystery-explanation search topics.
- Logical learners should get pattern, deduction, coding, redstone, puzzle, strategy, or step-by-step reasoning search topics.
- Increase creativity and variety so no two users get the exact same video string.
- Avoid generic outputs such as "logic puzzle video" or "memory game video".
- Make the search topics feel concrete, child-friendly, and YouTube-search-ready.
- CRITICAL RULE: NO TWO youtubeTopic VALUES CAN BE THE SAME OR SIMILAR. Use completely distinct phrasing and keywords for every weakness.

Output rules:
- Return a raw JSON array only.
- Each array item must be an object with exactly these keys: `dimension`, `tip`, `youtubeTopic`.
- Do not include markdown, code fences, explanations, numbering, or extra keys.
- Keep `dimension` aligned to the weakness being addressed.
"""

        try:
            response = gemini_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(temperature=0.8),
            )
            response_text = (getattr(response, "text", "") or "").strip()

            response_text = re.sub(r"^\s*```(?:json)?\s*", "", response_text, flags=re.IGNORECASE)
            response_text = re.sub(r"\s*```\s*$", "", response_text)

            if "[" in response_text and "]" in response_text:
                response_text = response_text[response_text.find("[") : response_text.rfind("]") + 1]

            payload = json.loads(response_text)
            if not isinstance(payload, list) or len(payload) != len(sanitized_weaknesses):
                return fallback_plan

            seen_topics: set[str] = set()
            cards: list[dict[str, str]] = []

            for index, item in enumerate(payload):
                if not isinstance(item, dict):
                    return fallback_plan

                dimension_fallback = self._weakness_to_dimension(sanitized_weaknesses[index]) if hasattr(self, "_weakness_to_dimension") else sanitized_weaknesses[index]
                dimension = str(item.get("dimension", "")).strip() or dimension_fallback

                tip = str(item.get("tip", "")).strip()
                youtube_topic = str(item.get("youtubeTopic", "")).strip()

                if not tip or not youtube_topic:
                    return fallback_plan

                normalized = normalize_topic(youtube_topic)
                if normalized in seen_topics or too_similar(youtube_topic, seen_topics):
                    return fallback_plan

                seen_topics.add(normalized)
                cards.append({
                    "dimension": dimension,
                    "tip": tip,
                    "youtubeTopic": youtube_topic,
                })

            return cards
        except Exception:
            return fallback_plan

    def generate_video_recommendations(
        self,
        traits: Dict[str, float],
        learning_style: str,
        weaknesses: Optional[List[str]] = None,
        remedial_plan: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        """
        Generate curated YouTube video search links based on cognitive weaknesses
        and the child's detected learning style.

        Returns:
            List of dicts with title, url, and rationale
        """
        effective_weaknesses = weaknesses or self._derive_weaknesses_from_traits(traits)
        effective_plan = remedial_plan or self.generate_remedial_plan(effective_weaknesses, learning_style)

        videos: List[Dict[str, str]] = []
        for item in effective_plan:
            topic = item.get("youtubeTopic", "").strip()
            if not topic:
                continue

            dimension = item.get("dimension", "Skill Building").strip()
            videos.append(
                {
                    "title": f"{dimension} Video Practice",
                    "url": f"https://www.youtube.com/results?search_query={quote_plus(topic)}",
                    "rationale": item.get("tip", "").strip()
                    or f"This search topic supports {dimension.lower()} growth.",
                }
            )

        if not videos:
            videos.append(
                {
                    "title": "General Learning Skills Practice",
                    "url": "https://www.youtube.com/results?search_query=brain+training+activities+for+kids",
                    "rationale": "A broad fallback set of activities to support overall cognitive growth.",
                }
            )

        return videos[:6]

    def generate_report_guidelines(self, traits: Dict[str, float], learning_style: str) -> List[Dict[str, str]]:
        """
        Generate actionable guidelines for parents and teachers based on the
        child's cognitive profile and learning style.

        Returns:
            List of dicts with category and instruction
        """
        guidelines: List[Dict[str, str]] = []

        if traits.get("memory", 50) < 60:
            guidelines.append(
                {
                    "category": "Memory Development",
                    "instruction": "Play daily matching-pair card games with your child. Start with 6 pairs and gradually increase to 12. Repeat sequences of items aloud together before bedtime to strengthen auditory-visual memory links.",
                }
            )
        if traits.get("logicalThinking", 50) < 60:
            guidelines.append(
                {
                    "category": "Logical Reasoning",
                    "instruction": 'Use physical blocks or LEGO sets to explain fractions and ratios before moving to numbers on paper. Ask "What would happen if...?" questions during everyday activities to build deductive thinking.',
                }
            )
        if traits.get("visualLearning", 50) < 60:
            guidelines.append(
                {
                    "category": "Visual-Spatial Skills",
                    "instruction": "Encourage drawing diagrams before solving math word problems. Use colour-coded sticky notes for different subjects. Let the child create mind-maps summarizing each chapter.",
                }
            )
        if traits.get("readingSkill", 50) < 60:
            guidelines.append(
                {
                    "category": "Reading Comprehension",
                    "instruction": 'Read together for 15-20 minutes daily and pause to ask "Why do you think that happened?" after each page. Maintain a vocabulary journal where the child writes one new word and its meaning each day.',
                }
            )
        if traits.get("problemSolving", 50) < 60:
            guidelines.append(
                {
                    "category": "Problem Solving",
                    "instruction": "Present real-world mini-challenges (e.g., planning a picnic budget). Encourage the child to break every homework problem into 3 smaller steps before attempting to solve it.",
                }
            )

        if traits.get("attentionFocus", 50) < 60:
            guidelines.append(
                {
                    "category": "Attention & Focus",
                    "instruction": "Use the Pomodoro technique (15 min focus, 5 min break) adapted for kids. Remove distractions during study time and introduce short mindfulness breathing exercises before homework.",
                }
            )
        if traits.get("processingSpeed", 50) < 60:
            guidelines.append(
                {
                    "category": "Processing Speed",
                    "instruction": "Practice timed activities in a low-pressure setting using a kitchen timer for fun speed drills like rapid mental math or quick-fire vocabulary. Celebrate improvement, not perfection.",
                }
            )

        style_guidelines = {
            "Visual": {
                "category": "Visual Learner Support",
                "instruction": "Provide graph paper, coloured markers, and flowchart templates. Replace text-heavy notes with infographics. Use educational videos as the primary introduction to new topics.",
            },
            "Logical": {
                "category": "Logical Learner Support",
                "instruction": 'Always explain the "why" behind rules and formulas. Introduce Sudoku, chess, and pattern-based board games. Let the child classify and sort objects during play.',
            },
            "Verbal": {
                "category": "Verbal Learner Support",
                "instruction": "Encourage reading aloud and group discussions. Let the child teach a concept back to you in their own words. Use audiobooks alongside printed books to reinforce comprehension.",
            },
            "Kinesthetic": {
                "category": "Kinesthetic Learner Support",
                "instruction": "Incorporate movement breaks every 20 minutes. Use physical manipulatives (coins, beads, blocks) for math. Let the child act out historical events or science concepts.",
            },
        }

        for style_key in learning_style.split("+"):
            style_key = style_key.strip()
            if style_key in style_guidelines:
                guidelines.append(style_guidelines[style_key])

        guidelines.append(
            {
                "category": "General Best Practice",
                "instruction": "Maintain a consistent daily study routine. Praise effort over results to build a growth mindset. Re-take the Cognitive DNA assessment every 4-6 weeks to track progress.",
            }
        )

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
        learning_style = profile_data.get("learningStyle", "Balanced")
        strengths = profile_data.get("strengths", [])
        weaknesses = profile_data.get("weaknesses", [])

        memory = profile_data.get("memory", 50)
        logical = profile_data.get("logicalThinking", 50)
        visual = profile_data.get("visualLearning", 50)
        reading = profile_data.get("readingSkill", 50)
        problem = profile_data.get("problemSolving", 50)
        attention = profile_data.get("attentionFocus", 50)
        speed = profile_data.get("processingSpeed", 50)

        scores = [memory, logical, visual, reading, problem, attention, speed]
        avg_score = round(sum(scores) / len(scores), 1)

        if avg_score >= 75:
            tier = "above average"
        elif avg_score >= 50:
            tier = "at an age-appropriate level"
        else:
            tier = "developing and has room for growth"

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

        intros = [
            f"This Cognitive DNA report reveals that the student's overall cognitive performance is {tier}, with a composite score of {avg_score} out of 100 across all assessed dimensions. ",
            f"Based on the latest assessment, the student has achieved a composite score of {avg_score}/100, indicating performance that is {tier}. ",
            f"The current cognitive evaluation shows a baseline score of {avg_score} across all dimensions, placing the student's performance level as {tier}. ",
        ]

        style_intros = [
            f"The student has been identified as a '{learning_style.replace('-', '+')}' learner, meaning they absorb information most effectively through ",
            f"We have detected a strong '{learning_style.replace('-', '+')}' learning preference, suggesting they learn best using ",
            f"Their primary modality is '{learning_style.replace('-', '+')}', which means they thrive when engaged with ",
        ]

        para1 = random.choice(intros) + random.choice(style_intros)
        style_desc = {
            "visual": "visual aids such as diagrams, videos, and colour-coded materials.",
            "logical": "structured reasoning, patterns, and step-by-step problem solving.",
            "verbal": "reading, discussion, and verbal explanation of concepts.",
            "kinesthetic": "hands-on activities, movement, and tactile engagement.",
        }
        primary_style = learning_style.split("-")[0].split("+")[0].strip().lower()
        para1 += style_desc.get(primary_style, "a balanced combination of learning modalities.")

        strength_text = ", ".join(strengths) if strengths else "balanced cognitive abilities"
        weakness_text = ", ".join(weaknesses) if weaknesses else "no significant gaps"

        strength_intros = [
            f"Key strengths include: {strength_text}. ",
            f"The student demonstrated remarkable proficiency in: {strength_text}. ",
            f"Notable cognitive assets identified during testing: {strength_text}. ",
        ]
        weakness_intros = [
            f"Areas that would benefit from targeted practice include: {weakness_text}. ",
            f"Developmental focus should be directed towards: {weakness_text}. ",
            f"Opportunities for measurable growth lie in: {weakness_text}. ",
        ]

        para2 = (
            random.choice(strength_intros)
            + random.choice(weakness_intros)
            + f"Specifically, the highest-performing dimension scored {max(scores)} while the "
            + f"area needing the most attention scored {min(scores)}. "
            + f"This spread of {max(scores) - min(scores)} points indicates "
        )
        spread = max(scores) - min(scores)
        if spread > 30:
            para2 += "a pronounced difference between the student's strongest and weakest abilities, suggesting focused intervention in the weaker areas will yield significant improvement."
        elif spread > 15:
            para2 += "a moderate range of abilities, which is common and healthy. Targeted exercises in weaker areas can bring the profile into better balance."
        else:
            para2 += "a well-rounded cognitive profile with relatively balanced abilities across all dimensions."

        recommendations = profile_data.get("recommendations", [])
        if recommendations:
            rec_text = "; ".join(recommendations[:3])
            rec_intros = [
                f"Based on this analysis, the following actions are recommended: {rec_text}. ",
                f"To support continuous development, we prescribe the following routines: {rec_text}. ",
                f"Immediate actionable steps for parents and educators include: {rec_text}. ",
            ]
            para3 = (
                random.choice(rec_intros)
                + "Parents and teachers are encouraged to incorporate these strategies into daily routines "
                + "and reassess the student's cognitive profile in 4-6 weeks to measure progress. "
                + "Consistency and encouragement are the most powerful tools for cognitive development at this age."
            )
        else:
            para3 = (
                "Continue engaging with all five activity types regularly. "
                "A re-assessment in 4-6 weeks will provide an updated picture of cognitive growth. "
                "Consistency and encouragement are the most powerful tools for cognitive development at this age."
            )

        return f"{para1}\n\n{para2}\n\n{para3}"

    def generate_prescriptive_report(
        self,
        traits: Dict[str, float],
        learning_style: str,
        recommendations: List[str],
        weaknesses: Optional[List[str]] = None,
        remedial_plan: Optional[List[Dict[str, str]]] = None,
    ) -> Dict:
        """
        Generate a prescriptive diagnostic report treating the assessment like a
        professional educational evaluation.

        Returns:
            Dict with keys: overallGrade, diagnosticSummary, remedialPath
        """
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

        trait_meta = {
            "memory": {"label": "Visual Memory"},
            "logicalThinking": {"label": "Logical Reasoning"},
            "visualLearning": {"label": "Visual-Spatial Skills"},
            "readingSkill": {"label": "Reading Comprehension"},
            "problemSolving": {"label": "Problem Solving"},
            "attentionFocus": {"label": "Attention & Focus"},
            "processingSpeed": {"label": "Processing Speed"},
        }

        effective_weaknesses = weaknesses or self._derive_weaknesses_from_traits(traits)
        effective_plan = remedial_plan or self.generate_remedial_plan(effective_weaknesses, learning_style)

        remedial_path = []
        for item in effective_plan:
            dimension = item.get("dimension", "").strip()
            if not dimension:
                continue

            trait_key = self._dimension_to_trait_key(dimension)
            score = round(traits.get(trait_key, 50), 1) if trait_key else 50.0
            youtube_topic = item.get("youtubeTopic", "").strip()
            remedial_path.append(
                {
                    "trait": dimension,
                    "score": score,
                    "videoUrl": f"https://www.youtube.com/results?search_query={quote_plus(youtube_topic)}",
                    "videoTitle": youtube_topic or f"{dimension} practice for kids",
                    "improvementTip": item.get("tip", "").strip() or "Use short daily practice with clear feedback.",
                }
            )

        if traits:
            strongest_key = max(traits, key=traits.get)
            weakest_key = min(traits, key=traits.get)
        else:
            strongest_key = "memory"
            weakest_key = "memory"

        trait_labels = {k: v["label"] for k, v in trait_meta.items()}
        primary_strength = trait_labels.get(strongest_key, strongest_key)
        primary_weakness = trait_labels.get(weakest_key, weakest_key)

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

                Primary Asset - {primary_strength} ({strength_score}/100): [2 sentences explaining how to leverage this strength in daily life/school]

                Primary Focus Area - {primary_weakness} ({weakness_score}/100): [2 sentences explaining how to improve this weakness]

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
                f"CLINICAL PROFILE: {overall_grade}\n\n",
            ]

            asset_templates = [
                f"Primary Asset - {primary_strength} ({strength_score}/100): This is the student's strongest cognitive dimension and should be leveraged as a gateway to teach weaker areas. For example, use {primary_strength.lower()}-based activities to introduce concepts in other subjects.\n\n",
                f"Cognitive Anchor - {primary_strength} ({strength_score}/100): The student excels here. We strongly advise using {primary_strength.lower()} methodologies to build confidence before tackling difficult homework.\n\n",
                f"Peak Ability - {primary_strength} ({strength_score}/100): Exceptional performance in this trait. Teachers can harness this {primary_strength.lower()} dominance to facilitate complex problem-solving.\n\n",
            ]

            focus_templates = [
                f"Primary Focus Area - {primary_weakness} ({weakness_score}/100): This dimension scored below the age-appropriate benchmark and would benefit from daily targeted practice. A structured 4-week remedial programme focusing on {primary_weakness.lower()} exercises is recommended.\n\n",
                f"Growth Opportunity - {primary_weakness} ({weakness_score}/100): We recommend dedicating 10-15 minutes a day specifically to {primary_weakness.lower()} tasks to build neural pathways in this area.\n\n",
                f"Targeted Intervention - {primary_weakness} ({weakness_score}/100): While developing, this trait requires attention. Consistent {primary_weakness.lower()} drills will yield rapid, measurable improvements.\n\n",
            ]

            diagnostic_summary = (
                random.choice(diagnostic_intros)
                + random.choice(asset_templates)
                + random.choice(focus_templates)
                + "PRESCRIPTION: "
            )

            if recommendations:
                prescription_steps = "; ".join(recommendations[:3])
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
            "overallGrade": overall_grade,
            "diagnosticSummary": diagnostic_summary,
            "remedialPath": remedial_path,
        }
