import { apiClient as api } from './api';

export interface AttentionIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedCount?: number;
  details?: any;
}

export interface AttentionData {
  surveyId: string;
  title: string;
  attentionScore: number;
  issues: AttentionIssue[];
  recommendations: string[];
}

export interface SurveyNeedingAttention {
  surveyId: string;
  title: string;
  attentionScore: number;
  issueCount: number;
  lastUpdated: string;
}

class AttentionService {
  /**
   * Get attention metrics for a specific survey
   */
  async getAttentionMetrics(surveyId: string): Promise<AttentionData> {
    const response = await api.get(`/attention/${surveyId}`);
    return response.data;
  }

  /**
   * Get all surveys needing attention
   */
  async getSurveysNeedingAttention(
    threshold: number = 30
  ): Promise<SurveyNeedingAttention[]> {
    const response = await api.get('/attention/surveys', {
      params: { threshold }
    });
    return response.data.surveys;
  }
}

export default new AttentionService();
