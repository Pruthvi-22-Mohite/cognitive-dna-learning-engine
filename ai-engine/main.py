from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import httpx
from cognitive_model import CognitiveModel
from analysis import AnalysisEngine

app = FastAPI(title="Cognitive DNA AI Engine", version="1.0.0")

# Initialize models
cognitive_model = CognitiveModel()
analysis_engine = AnalysisEngine()


def calculate_attention_focus(results: List[Dict]) -> float:
    """
    Calculate attention focus based on consistency and completion time.
    """
    if not results:
        return 50.0
    
    # Measure consistency across attempts
    scores = [r.get('accuracy', 50) for r in results]
    if len(scores) > 1:
        variance = sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
        consistency_score = max(0, 100 - variance)
    else:
        consistency_score = scores[0] if scores else 50
    
    return round(min(100, max(0, consistency_score)), 2)


def calculate_processing_speed(results: List[Dict]) -> float:
    """
    Calculate processing speed based on response times.
    """
    if not results:
        return 50.0
    
    # Average time taken (normalized)
    times = [r.get('timeTaken', 50) for r in results]
    avg_time = sum(times) / len(times)
    
    # Faster = higher score (normalized around 30-60 seconds average)
    speed_score = max(0, min(100, 100 - (avg_time - 30) * 2))
    
    return round(speed_score, 2)


def extract_strengths(traits: Dict[str, float]) -> List[str]:
    """
    Extract cognitive strengths from trait scores.
    """
    strengths = []
    
    if traits.get('memory', 50) > 70:
        strengths.append('Strong visual memory')
    if traits.get('logicalThinking', 50) > 70:
        strengths.append('Excellent logical reasoning')
    if traits.get('readingSkill', 50) > 70:
        strengths.append('Advanced reading comprehension')
    if traits.get('problemSolving', 50) > 70:
        strengths.append('Fast information processing')
    
    return strengths if strengths else ['Balanced cognitive abilities']


def extract_weaknesses(traits: Dict[str, float]) -> List[str]:
    """
    Extract areas for improvement from trait scores.
    """
    weaknesses = []
    
    if traits.get('memory', 50) < 50:
        weaknesses.append('Visual memory development needed')
    if traits.get('logicalThinking', 50) < 50:
        weaknesses.append('Logical reasoning practice recommended')
    if traits.get('readingSkill', 50) < 50:
        weaknesses.append('Reading comprehension support')
    if traits.get('problemSolving', 50) < 50:
        weaknesses.append('Processing speed exercises')
    
    return weaknesses


class QuizResult(BaseModel):
    quizType: str
    score: float
    timeTaken: float
    accuracy: float


class AnalysisRequest(BaseModel):
    userId: str
    results: List[QuizResult]


class ProfileUpdateRequest(BaseModel):
    userId: str
    logicalThinking: float
    visualLearning: float
    memory: float
    readingSkill: float
    problemSolving: float
    learningStyle: str
    recommendations: List[str]


@app.get("/")
async def root():
    return {
        "message": "Cognitive DNA AI Engine is running",
        "version": "1.0.0",
        "endpoints": ["/analyze", "/recommendations", "/insights"]
    }


@app.post("/analyze")
async def analyze_cognitive_data(request: AnalysisRequest):
    """
    Analyze quiz results and generate cognitive profile.
    Returns enhanced Cognitive DNA profile with brain map data,
    YouTube video recommendations, parent/teacher guidelines,
    and a detailed narrative analysis report.
    """
    print(f"🚀 Received profile request for data: {request.json()}")
    try:
        # Convert results to dictionary format
        results_dict = [result.dict() for result in request.results]
        
        # Calculate cognitive traits
        traits = cognitive_model.calculate_cognitive_traits(results_dict)
        
        # Detect learning style
        learning_style = cognitive_model.detect_learning_style(traits, results_dict)
        
        # Generate recommendations
        recommendations = cognitive_model.generate_recommendations(traits, learning_style)
        
        # Perform additional analysis
        trend_analysis = analysis_engine.analyze_performance_trend(results_dict)
        behavioral_patterns = analysis_engine.detect_behavioral_patterns(results_dict)
        
        # --- NEW: Generate video recommendations ---
        recommended_videos = analysis_engine.generate_video_recommendations(traits, learning_style)
        
        # --- NEW: Generate parent/teacher guidelines ---
        report_guidelines = analysis_engine.generate_report_guidelines(traits, learning_style)
        
        # Build partial profile data dict for the narrative generator
        profile_for_report = {
            'memory': traits.get('memory', 50),
            'logicalThinking': traits.get('logicalThinking', 50),
            'visualLearning': traits.get('visualLearning', 50),
            'readingSkill': traits.get('readingSkill', 50),
            'problemSolving': traits.get('problemSolving', 50),
            'attentionFocus': calculate_attention_focus(results_dict),
            'processingSpeed': calculate_processing_speed(results_dict),
            'learningStyle': learning_style,
            'strengths': extract_strengths(traits),
            'weaknesses': extract_weaknesses(traits),
            'recommendations': recommendations,
        }
        
        # --- NEW: Generate narrative analysis report ---
        detailed_analysis_report = analysis_engine.generate_analysis_text(profile_for_report)
        
        # --- NEW: Generate prescriptive diagnostic report ---
        prescriptive = analysis_engine.generate_prescriptive_report(traits, learning_style, recommendations)
        
        # Map to enhanced Cognitive DNA profile format
        response = {
            "memory": traits.get('memory', 50),
            "logicalThinking": traits.get('logicalThinking', 50),
            "visualLearning": traits.get('visualLearning', 50),
            "readingSkill": traits.get('readingSkill', 50),
            "problemSolving": traits.get('problemSolving', 50),
            "attentionFocus": calculate_attention_focus(results_dict),
            "processingSpeed": calculate_processing_speed(results_dict),
            "learningStyle": learning_style.lower().replace('+', '-'),
            "strengths": extract_strengths(traits),
            "weaknesses": extract_weaknesses(traits),
            "recommendations": recommendations,
            "recommendedVideos": recommended_videos,
            "reportGuidelines": report_guidelines,
            "detailedAnalysisReport": detailed_analysis_report,
            "diagnosticSummary": prescriptive['diagnosticSummary'],
            "remedialPath": prescriptive['remedialPath'],
            "overallGrade": prescriptive['overallGrade'],
            "analysis": {
                "trend": trend_analysis['trend'],
                "improvement_rate": trend_analysis['improvement_rate'],
                "consistency": trend_analysis['consistency'],
                "behavioral_pattern": behavioral_patterns['performance_pattern'],
            }
        }
        
        return response
    
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/recommendations")
async def get_recommendations(request: dict):
    """
    Get personalized learning recommendations based on cognitive profile.
    """
    try:
        profile = request.get('profile', {})
        learning_style = profile.get('learningStyle', 'Balanced')
        
        # Extract trait scores
        traits = {
            'logicalThinking': profile.get('logicalThinking', 50),
            'visualLearning': profile.get('visualLearning', 50),
            'memory': profile.get('memory', 50),
            'readingSkill': profile.get('readingSkill', 50),
            'problemSolving': profile.get('problemSolving', 50),
        }
        
        recommendations = cognitive_model.generate_recommendations(traits, learning_style)
        
        return {"recommendations": recommendations}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/insights")
async def get_detailed_insights(request: AnalysisRequest):
    """
    Get detailed behavioral and performance insights.
    """
    try:
        results_dict = [result.dict() for result in request.results]
        
        insights = analysis_engine.generate_detailed_insights(results_dict)
        difficulty_adjustment = analysis_engine.calculate_difficulty_adjustment(results_dict)
        
        return {
            "insights": insights,
            "difficulty_adjustment": difficulty_adjustment
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "ok", "message": "Brain is online"}


@app.post("/health")
async def health_check_post():
    """Health check for POST requests (Docker compatibility)."""
    return {"status": "healthy", "service": "ai-engine"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
