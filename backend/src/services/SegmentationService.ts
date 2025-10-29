import { Response, IResponse } from '../models';
import mongoose from 'mongoose';

export interface FilterCriteria {
  dateRange?: { start: Date; end: Date };
  demographics?: Record<string, string[]>;
  customFields?: Record<string, any>;
  searchQuery?: string;
}

export interface SegmentComparison {
  segmentId: string;
  segmentName: string;
  metrics: {
    responseCount: number;
    completionRate: number;
    avgCompletionTime: number;
  };
}

export class SegmentationService {
  /**
   * Filter responses based on criteria
   */
  async filterResponses(
    surveyId: string,
    criteria: FilterCriteria
  ): Promise<IResponse[]> {
    const query: any = { survey_id: new mongoose.Types.ObjectId(surveyId) };

    // Date range filter
    if (criteria.dateRange) {
      query.submitted_at = {
        $gte: criteria.dateRange.start,
        $lte: criteria.dateRange.end
      };
    }

    // Demographics filter
    if (criteria.demographics) {
      for (const [field, values] of Object.entries(criteria.demographics)) {
        if (values && values.length > 0) {
          query[`demographics.${field}`] = { $in: values };
        }
      }
    }

    // Custom fields filter
    if (criteria.customFields) {
      for (const [field, value] of Object.entries(criteria.customFields)) {
        if (value !== undefined && value !== null) {
          query[`custom_fields.${field}`] = value;
        }
      }
    }

    let responses = await Response.find(query).lean();

    // Text search filter (applied after query)
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const searchLower = criteria.searchQuery.toLowerCase();
      responses = responses.filter(response => {
        const responseData = response.response_data?.responses || response.response_data;
        if (!responseData) return false;

        // Search through all response values
        return Object.values(responseData).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (Array.isArray(value)) {
            return value.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(searchLower)
            );
          }
          return false;
        });
      });
    }

    return responses as IResponse[];
  }

  /**
   * Compare metrics across segments
   */
  async compareSegments(
    surveyId: string,
    segments: Array<{ id: string; name: string; criteria: FilterCriteria }>
  ): Promise<SegmentComparison[]> {
    const comparisons: SegmentComparison[] = [];

    for (const segment of segments) {
      const responses = await this.filterResponses(surveyId, segment.criteria);
      
      // Calculate completion rate
      const Survey = mongoose.model('Survey');
      const survey = await Survey.findById(surveyId);
      const totalQuestions = (survey as any)?.configuration?.questions?.length || 0;
      
      let totalCompletedQuestions = 0;
      let totalCompletionTime = 0;
      let completionTimeCount = 0;

      for (const response of responses) {
        const responseData = response.response_data?.responses || response.response_data;
        if (responseData) {
          totalCompletedQuestions += Object.keys(responseData).length;
        }

        if (response.completion_time) {
          totalCompletionTime += response.completion_time;
          completionTimeCount++;
        }
      }

      const completionRate = totalQuestions > 0 && responses.length > 0
        ? (totalCompletedQuestions / (totalQuestions * responses.length)) * 100
        : 0;

      const avgCompletionTime = completionTimeCount > 0
        ? totalCompletionTime / completionTimeCount
        : 0;

      comparisons.push({
        segmentId: segment.id,
        segmentName: segment.name,
        metrics: {
          responseCount: responses.length,
          completionRate,
          avgCompletionTime
        }
      });
    }

    return comparisons;
  }

  /**
   * Search responses by text content
   */
  async searchResponses(
    surveyId: string,
    query: string,
    filters?: FilterCriteria
  ): Promise<IResponse[]> {
    const searchCriteria: FilterCriteria = {
      ...filters,
      searchQuery: query
    };

    return this.filterResponses(surveyId, searchCriteria);
  }
}
