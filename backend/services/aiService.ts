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
}

class AIService {
  private aiEngineUrl: string;

  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  }

  async analyzeCognitiveData(data: CognitiveAnalysisRequest): Promise<CognitiveAnalysisResponse> {
    try {
      const response = await axios.post(`${this.aiEngineUrl}/analyze`, data);
      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to analyze cognitive data');
    }
  }

  async generateRecommendations(userId: string, profile: any): Promise<string[]> {
    try {
      const response = await axios.post(`${this.aiEngineUrl}/recommendations`, {
        userId,
        profile,
      });
      return response.data.recommendations;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }
}

export default new AIService();
