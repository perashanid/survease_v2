import { apiClient as api } from './api';

export interface AIInsight {
  _id: string;
  summary: {
    overview: string;
    key_findings: string[];
    response_statistics: {
      total_responses: number;
      completion_rate: number;
      average_completion_time: number;
      quality_responses: number;
      low_quality_responses: number;
    };
    question_insights: Array<{
      question_id: string;
      question_text: string;
      insight: string;
      response_distribution: any;
    }>;
  };
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    supporting_data: any;
    statistical_significance: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    suggested_actions: string[];
  }>;
  generated_at: string;
  data_snapshot: {
    response_count: number;
    date_range: {
      start: string;
      end: string;
    };
    filters_applied?: any;
  };
  is_stale: boolean;
}

export interface QualityRule {
  min_completion_time: number;
  total_flagged: number;
  total_overridden: number;
  custom_rules?: any[];
}

export interface FlaggedResponse {
  _id: string;
  completion_time: number;
  submitted_at: string;
  quality_status: string;
  manual_override?: {
    overridden_by: string;
    overridden_at: string;
    reason?: string;
  };
}

export interface AuditLogEntry {
  _id: string;
  action: string;
  response_id: string;
  old_status: string;
  new_status: string;
  performed_by: string;
  performed_at: string;
  reason?: string;
}

class AIService {
  // ============ AI Insights ============
  
  /**
   * Generate new AI insights for a survey
   */
  async generateInsights(
    surveyId: string,
    options: { includeQuality?: boolean; includeLowQuality?: boolean } = {}
  ): Promise<AIInsight> {
    const response = await api.post(
      `/surveys/${surveyId}/ai/generate-insights`,
      {
        includeQuality: options.includeQuality !== false,
        includeLowQuality: options.includeLowQuality === true
      }
    );
    return response.data.insight;
  }

  /**
   * Get all insights for a survey (paginated)
   */
  async getInsights(
    surveyId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ insights: AIInsight[]; pagination: any }> {
    const response = await api.get(`/surveys/${surveyId}/insights`, {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Get a specific insight by ID
   */
  async getInsightById(surveyId: string, insightId: string): Promise<AIInsight> {
    const response = await api.get(`/surveys/${surveyId}/insights/${insightId}`);
    return response.data.insight;
  }

  /**
   * Delete an insight
   */
  async deleteInsight(surveyId: string, insightId: string): Promise<void> {
    await api.delete(`/surveys/${surveyId}/insights/${insightId}`);
  }

  /**
   * Regenerate insights with current data
   */
  async regenerateInsights(surveyId: string): Promise<AIInsight> {
    const response = await api.post(`/surveys/${surveyId}/ai/regenerate`);
    return response.data.insight;
  }

  // ============ Export ============

  /**
   * Export insights to PDF
   */
  async exportToPDF(
    surveyId: string,
    insightId: string,
    options: any = {}
  ): Promise<Blob> {
    const response = await api.post(
      `/surveys/${surveyId}/ai/export/pdf`,
      { insightId, options },
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Export insights to JSON
   */
  async exportToJSON(surveyId: string, insightId: string): Promise<any> {
    const response = await api.post(`/surveys/${surveyId}/ai/export/json`, {
      insightId
    });
    return response.data;
  }

  // ============ Data Quality ============

  /**
   * Get quality rules for a survey
   */
  async getQualityRules(surveyId: string): Promise<QualityRule> {
    const response = await api.get(`/surveys/${surveyId}/quality/rules`);
    return response.data.rules;
  }

  /**
   * Update quality rules for a survey
   */
  async updateQualityRules(
    surveyId: string,
    rules: { min_completion_time?: number; custom_rules?: any[] }
  ): Promise<QualityRule> {
    const response = await api.put(`/surveys/${surveyId}/quality/rules`, rules);
    return response.data.rules;
  }

  /**
   * Manually trigger classification of responses
   */
  async classifyResponses(surveyId: string): Promise<any> {
    const response = await api.post(`/surveys/${surveyId}/quality/classify`);
    return response.data.result;
  }

  /**
   * Get all flagged responses for a survey
   */
  async getFlaggedResponses(surveyId: string): Promise<FlaggedResponse[]> {
    const response = await api.get(`/surveys/${surveyId}/quality/flagged-responses`);
    return response.data.responses;
  }

  /**
   * Manually override quality classification for a response
   */
  async overrideClassification(
    surveyId: string,
    responseId: string,
    newStatus: 'quality' | 'low_quality',
    reason?: string
  ): Promise<void> {
    await api.post(`/surveys/${surveyId}/quality/override/${responseId}`, {
      newStatus,
      reason
    });
  }

  /**
   * Get audit log for quality classifications
   */
  async getAuditLog(surveyId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const response = await api.get(`/surveys/${surveyId}/quality/audit-log`, {
      params: { limit }
    });
    return response.data.audit_log;
  }
}

export default new AIService();
