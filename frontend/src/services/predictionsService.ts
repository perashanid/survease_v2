import { apiClient as api } from './api';

export interface PredictionScenario {
  name: string;
  input: {
    deviceType?: string;
    timeOfDay?: number;
    dayOfWeek?: number;
    [key: string]: any;
  };
}

export interface QuestionPrediction {
  questionId: string;
  predictedResponse: any;
  confidence: number;
  reasoning?: string;
}

export interface SurveyPrediction {
  predictions: QuestionPrediction[];
  totalQuestions: number;
  averageConfidence: number;
}

export interface CompletionPrediction {
  likelihood: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
}

class PredictionsService {
  /**
   * Get demo scenarios for testing
   */
  async getDemoScenarios(surveyId: string): Promise<PredictionScenario[]> {
    const response = await api.get(`/predictions/${surveyId}/demo-scenarios`);
    return response.data.data.scenarios;
  }

  /**
   * Predict response for a specific question
   */
  async predictQuestion(
    surveyId: string,
    questionId: string,
    input: any
  ): Promise<QuestionPrediction> {
    const response = await api.post(
      `/predictions/${surveyId}/question/${questionId}`,
      input
    );
    return response.data.data;
  }

  /**
   * Predict all responses for a survey
   */
  async predictSurvey(surveyId: string, input: any): Promise<SurveyPrediction> {
    const response = await api.post(`/predictions/${surveyId}/survey`, input);
    return response.data.data;
  }

  /**
   * Analyze multiple scenarios
   */
  async analyzeScenarios(
    surveyId: string,
    scenarios: PredictionScenario[]
  ): Promise<any[]> {
    const response = await api.post(`/predictions/${surveyId}/scenarios`, {
      scenarios
    });
    return response.data.data.scenarios;
  }

  /**
   * Predict completion likelihood
   */
  async predictCompletion(
    surveyId: string,
    partialResponses: any,
    demographics?: any
  ): Promise<CompletionPrediction> {
    const response = await api.post(`/predictions/${surveyId}/completion`, {
      partialResponses,
      demographics
    });
    return response.data.data;
  }
}

export default new PredictionsService();
