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
  async getAttentionMetrics(surveyId: string, isPublic: boolean = false): Promise<AttentionData> {
    const endpoint = isPublic ? `/attention/public/${surveyId}` : `/attention/${surveyId}`;
    const response = await api.get(endpoint);
    return response.data;
  }

  /**
   * Get all surveys needing attention
   * @param threshold - Surveys with scores BELOW this threshold need attention (default 70)
   */
  async getSurveysNeedingAttention(
    threshold: number = 70
  ): Promise<SurveyNeedingAttention[]> {
    const response = await api.get('/attention/surveys', {
      params: { threshold }
    });
    return response.data.surveys;
  }
}

export default new AttentionService();
