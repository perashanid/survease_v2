import { apiClient as api } from './api';

export interface TimeSeriesData {
  date: Date;
  count: number;
  label?: string;
}

export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  label: string;
}

export interface FunnelStage {
  questionId: string;
  questionText: string;
  completionCount: number;
  completionRate: number;
  dropoffRate: number;
}

export interface QuestionMetrics {
  questionId: string;
  questionText: string;
  questionType: string;
  completionRate: number;
  avgTimeSpent: number;
  dropoffCount: number;
  responseCount: number;
}

export interface DeviceMetrics {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface BrowserMetrics {
  [browserName: string]: number;
}

export interface ForecastData {
  date: Date;
  count: number;
  isForecast: boolean;
  confidenceLower?: number;
  confidenceUpper?: number;
}

export interface FilterCriteria {
  dateRange?: { start: Date; end: Date };
  demographics?: Record<string, string[]>;
  customFields?: Record<string, any>;
  searchQuery?: string;
}

export interface AttentionIssue {
  type: 'low_completion' | 'no_responses' | 'high_dropoff' | 'slow_response';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SurveyAttentionItem {
  surveyId: string;
  title: string;
  attentionScore: number;
  issues: AttentionIssue[];
  recommendations: string[];
}

export interface SegmentDefinition {
  id?: string;
  name: string;
  criteria: FilterCriteria;
  color: string;
}

class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getOverview(surveyId: string) {
    const cacheKey = this.getCacheKey(`overview_${surveyId}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/analytics/${surveyId}/overview`);
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getTrends(
    surveyId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    startDate?: Date,
    endDate?: Date
  ) {
    const params: any = { period };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const cacheKey = this.getCacheKey(`trends_${surveyId}`, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/analytics/${surveyId}/trends`, { params });
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getHeatmap(surveyId: string, startDate?: Date, endDate?: Date) {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const cacheKey = this.getCacheKey(`heatmap_${surveyId}`, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Heatmap: Using cached data', cached);
      return cached;
    }

    console.log('Heatmap: Fetching from API', { surveyId, params });
    const response = await api.get(`/analytics/${surveyId}/heatmap`, { params });
    console.log('Heatmap: API response', {
      status: response.status,
      dataType: typeof response.data.data,
      isArray: Array.isArray(response.data.data),
      length: response.data.data?.length
    });
    
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getFunnel(surveyId: string, startDate?: Date, endDate?: Date) {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const cacheKey = this.getCacheKey(`funnel_${surveyId}`, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Funnel: Using cached data', cached);
      return cached;
    }

    console.log('Funnel: Fetching from API', { surveyId, params });
    const response = await api.get(`/analytics/${surveyId}/funnel`, { params });
    console.log('Funnel: API response', {
      status: response.status,
      dataType: typeof response.data.data,
      isArray: Array.isArray(response.data.data),
      length: response.data.data?.length
    });
    
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getQuestionMetrics(
    surveyId: string,
    sortBy: 'completionRate' | 'avgTime' | 'dropoffRate' = 'completionRate',
    startDate?: Date,
    endDate?: Date
  ) {
    const params: any = { sortBy };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const cacheKey = this.getCacheKey(`questions_${surveyId}`, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/analytics/${surveyId}/questions`, { params });
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getDeviceAnalytics(surveyId: string, startDate?: Date, endDate?: Date) {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const cacheKey = this.getCacheKey(`devices_${surveyId}`, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/analytics/${surveyId}/devices`, { params });
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getForecast(surveyId: string, daysAhead: number = 7) {
    const cacheKey = this.getCacheKey(`forecast_${surveyId}`, { daysAhead });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/analytics/${surveyId}/forecast`, {
      params: { daysAhead }
    });
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async compareSurveys(surveyIds: string[], metrics: string[] = ['responseCount', 'completionRate']) {
    const response = await api.post(`/analytics/${surveyIds[0]}/compare`, {
      surveyIds,
      metrics
    });
    return response.data;
  }

  async filterResponses(surveyId: string, criteria: FilterCriteria) {
    const response = await api.post(`/analytics/${surveyId}/filter`, criteria);
    return response.data;
  }

  async searchResponses(surveyId: string, query: string, startDate?: Date, endDate?: Date) {
    const params: any = { query };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await api.get(`/analytics/${surveyId}/search`, { params });
    return response.data;
  }

  // Segment management
  async getSegments(surveyId: string) {
    const response = await api.get(`/segments/${surveyId}`);
    return response.data;
  }

  async createSegment(surveyId: string, segment: SegmentDefinition) {
    const response = await api.post(`/segments/${surveyId}`, segment);
    return response.data;
  }

  async updateSegment(segmentId: string, updates: Partial<SegmentDefinition>) {
    const response = await api.put(`/segments/${segmentId}`, updates);
    return response.data;
  }

  async deleteSegment(segmentId: string) {
    const response = await api.delete(`/segments/${segmentId}`);
    return response.data;
  }

  async compareSegments(surveyId: string, segmentIds: string[]) {
    const response = await api.post(`/segments/${surveyId}/compare`, { segmentIds });
    return response.data;
  }

  // Attention monitoring
  async getSurveysNeedingAttention(threshold: number = 30) {
    const response = await api.get('/attention/surveys', { params: { threshold } });
    return response.data;
  }

  async getAttentionDetails(surveyId: string) {
    const response = await api.get(`/attention/${surveyId}`);
    return response.data;
  }

  async getBehavioralTrends(surveyId: string, startDate?: Date, endDate?: Date) {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const cacheKey = this.getCacheKey(`behavioral_trends_${surveyId}`, params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    console.log('Behavioral Trends: Fetching from API', { surveyId, params });
    const response = await api.get(`/analytics/${surveyId}/behavioral-trends`, { params });
    console.log('Behavioral Trends: API response', {
      status: response.status,
      trendsCount: response.data.trends?.length || 0,
      totalResponses: response.data.summary?.totalResponses || 0
    });
    
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new AnalyticsService();
