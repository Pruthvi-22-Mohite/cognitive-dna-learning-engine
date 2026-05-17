import axios from 'axios';

interface CognitiveAnalysisRequest {
  userId: string;
  results: Array<{
    quizType: string;
    score: number;
    timeTaken: number;
    accuracy: number;
  }>;
}

interface CognitiveAnalysisResponse {
  logicalThinking: number;
  visualLearning: number;
  memory: number;
  readingSkill: number;
  problemSolving: number;
  learningStyle: string;
  recommendations: string[];
  recommendedVideos: Array<{ title: string; url: string; rationale: string }>;
  reportGuidelines: Array<{ category: string; instruction: string }>;
  detailedAnalysisReport: string;
  diagnosticSummary: string;
  remedialPath: Array<{ trait: string; score: number; videoUrl: string; videoTitle: string; improvementTip: string }>;
  overallGrade: string;
  [key: string]: any;
}

class AIService {
  private aiEngineUrl: string;

  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  }

  async analyzeCognitiveData(data: CognitiveAnalysisRequest): Promise<CognitiveAnalysisResponse> {
    try {
      console.log(`🚀 Sending data to Python AI Engine: ${this.aiEngineUrl}/analyze`);
      const response = await axios.post(`${this.aiEngineUrl}/analyze`, data, { timeout: 15000 });
      console.log('✅ Received dynamic response from Python AI Engine');
      return response.data;
    } catch (error: any) {
      console.error("AI_SERVICE_ERROR: Failed to connect to Python Engine.", { 
        message: error.message, 
        code: error.code, 
        urlTried: `${this.aiEngineUrl}/analyze` 
      });
      throw new Error(`AI Engine unavailable or timed out: ${error.message}`);
    }
  }

  async generateRecommendations(userId: string, profile: any): Promise<string[]> {
    try {
      const response = await axios.post(`${this.aiEngineUrl}/recommendations`, {
        userId,
        profile,
      }, { timeout: 15000 });
      return response.data.recommendations;
    } catch (error: any) {
      console.error("AI_SERVICE_ERROR: Failed to connect to Python Engine.", { 
        message: error.message, 
        code: error.code, 
        urlTried: `${this.aiEngineUrl}/recommendations` 
      });
      throw new Error(`AI Engine unavailable or timed out: ${error.message}`);
    }
  }
}

// THIS is the line that was missing!
export default new AIService();