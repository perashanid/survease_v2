import { apiClient as api } from './api';

export interface Survey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  url: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  response_count: number;
  questions: Question[];
  settings: SurveySettings;
  responses?: any[];
  views?: number;
  createdAt: string;
  original_survey_id?: string;
  tags?: string[];
}

export interface Question {
  id: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'rating' | 'date' | 'email' | 'number';
  question: string;
  required: boolean;
  options?: string[];
  min_rating?: number;
  max_rating?: number;
  validation?: {
    min?: number;
    max?: number;
  };
}

export interface SurveySettings {
  is_public: boolean;
  allow_anonymous: boolean;
  collect_email: boolean;
  one_response_per_user: boolean;
  show_results: boolean;
  close_date?: string;
}

export interface CreateSurveyData {
  title: string;
  description?: string;
  questions: Question[];
  settings: SurveySettings;
}

export interface SubmitResponseData {
  responses: Record<string, any>;
  respondent_email?: string;
  completion_time?: number; // Time in seconds
  started_at?: Date;
  device_info?: any;
  is_anonymous?: boolean;
  custom_link_token?: string;
}

export interface PublicSurveysResponse {
  surveys: Survey[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class SurveyService {
  static async createSurvey(data: CreateSurveyData): Promise<Survey> {
    const response = await api.post('/surveys', data);
    return response.data.data.survey;
  }

  static async getUserSurveys(): Promise<Survey[]> {
    const response = await api.get('/surveys', {
      params: { limit: 1000 } // Request all surveys (up to 1000)
    });
    return response.data.data.surveys;
  }

  static async getSurveyBySlug(slug: string, token?: string): Promise<Survey> {
    const url = token ? `/surveys/${slug}?token=${token}` : `/surveys/${slug}`;
    const response = await api.get(url);
    return response.data.data.survey;
  }

  static async updateSurvey(id: string, data: Partial<CreateSurveyData>): Promise<Survey> {
    const response = await api.put(`/surveys/${id}`, data);
    return response.data.data.survey;
  }

  static async deleteSurvey(id: string): Promise<void> {
    await api.delete(`/surveys/${id}`);
  }

  static async submitResponse(slug: string, data: SubmitResponseData): Promise<{
    response_id: string;
    is_locked: boolean;
    points_earned?: number;
    message: string;
    unlock_requirement?: any;
  }> {
    // Extract custom_link_token to send as query param
    const { custom_link_token, ...bodyData } = data;
    const url = custom_link_token 
      ? `/surveys/${slug}/responses?custom_link_token=${custom_link_token}`
      : `/surveys/${slug}/responses`;
    const response = await api.post(url, bodyData);
    return response.data.data;
  }

  static async getPublicSurveys(page: number = 1, limit: number = 12): Promise<PublicSurveysResponse> {
    const response = await api.get('/surveys/public', {
      params: { page, limit }
    });
    return response.data;
  }

  static async getAnalyticsData(timeRange: string = '30d'): Promise<any> {
    const response = await api.get('/surveys/analytics/data', {
      params: { range: timeRange }
    });
    return response.data.data;
  }

  static async getSurveyAnalytics(surveyId: string): Promise<any> {
    const response = await api.get(`/surveys/${surveyId}/analytics`);
    return response.data.data;
  }

  static async exportSurveyData(surveyId: string, format: 'json' | 'csv'): Promise<string> {
    try {
      const response = await api.get(`/surveys/${surveyId}/export`, {
        params: { format },
        responseType: format === 'json' ? 'json' : 'text',
        timeout: 30000 // 30 second timeout for large exports
      });
      
      if (format === 'json') {
        return JSON.stringify(response.data, null, 2);
      }
      return response.data;
    } catch (error: any) {
      console.error('Export error:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Export timed out. The dataset may be too large. Please try again or contact support.');
      } else if (error.response?.status === 404) {
        throw new Error('Survey not found or you do not have permission to export this data.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to export this survey data.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error occurred during export. Please try again later.');
      } else {
        throw new Error('Failed to export survey data. Please check your connection and try again.');
      }
    }
  }

  static async getImportableSurveys(page: number = 1, limit: number = 12): Promise<PublicSurveysResponse> {
    const response = await api.get('/surveys/public/importable', {
      params: { page, limit }
    });
    return response.data.data;
  }

  static async importSurvey(surveyId: string): Promise<Survey> {
    const response = await api.post(`/surveys/${surveyId}/import`);
    return response.data.data.survey;
  }

  static async toggleSurveyVisibility(surveyId: string, isPublic: boolean): Promise<Survey> {
    const response = await api.put(`/surveys/${surveyId}/visibility`, {
      is_public: isPublic
    });
    return response.data.data.survey;
  }

  static async getFeaturedSurveys(limit: number = 6): Promise<{ surveys: Survey[] }> {
    const response = await api.get('/surveys/public/surveys/featured', {
      params: { limit }
    });
    return response.data;
  }

  static async getTrendingSurveys(limit: number = 6): Promise<{ surveys: Survey[] }> {
    const response = await api.get('/surveys/public/surveys/trending', {
      params: { limit }
    });
    return response.data;
  }

  static async toggleFeaturedStatus(surveyId: string, isFeatured: boolean): Promise<Survey> {
    const response = await api.patch(`/surveys/${surveyId}/featured`, {
      is_featured: isFeatured
    });
    return response.data.data;
  }
}