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
    """
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
        
        response = {
            **traits,
            "learningStyle": learning_style,
            "recommendations": recommendations,
            "analysis": {
                "trend": trend_analysis['trend'],
                "improvement_rate": trend_analysis['improvement_rate'],
                "consistency": trend_analysis['consistency'],
                "behavioral_pattern": behavioral_patterns['performance_pattern'],
            }
        }
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    return {"status": "healthy", "service": "ai-engine"}


@app.post("/health")
async def health_check_post():
    """Health check for POST requests (Docker compatibility)."""
    return {"status": "healthy", "service": "ai-engine"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
