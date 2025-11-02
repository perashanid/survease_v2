import { apiClient as api } from './api';

export interface Segment {
  _id: string;
  user_id: string;
  survey_id: string;
  name: string;
  criteria: any;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentComparison {
  segments: Array<{
    id: string;
    name: string;
    responseCount: number;
    metrics: any;
  }>;
  comparison: any;
  insights: string[];
}

class SegmentsService {
  /**
   * Get all segments for a survey
   */
  async getSegments(surveyId: string): Promise<Segment[]> {
    const response = await api.get(`/segments/${surveyId}`);
    return response.data.segments;
  }

  /**
   * Create a new segment
   */
  async createSegment(
    surveyId: string,
    data: { name: string; criteria: any; color?: string }
  ): Promise<Segment> {
    const response = await api.post(`/segments/${surveyId}`, data);
    return response.data.segment;
  }

  /**
   * Update a segment
   */
  async updateSegment(
    segmentId: string,
    data: { name?: string; criteria?: any; color?: string }
  ): Promise<Segment> {
    const response = await api.put(`/segments/${segmentId}`, data);
    return response.data.segment;
  }

  /**
   * Delete a segment
   */
  async deleteSegment(segmentId: string): Promise<void> {
    await api.delete(`/segments/${segmentId}`);
  }

  /**
   * Compare multiple segments
   */
  async compareSegments(
    surveyId: string,
    segmentIds: string[]
  ): Promise<SegmentComparison> {
    const response = await api.post(`/segments/${surveyId}/compare`, {
      segmentIds
    });
    return response.data.comparison;
  }
}

export default new SegmentsService();
