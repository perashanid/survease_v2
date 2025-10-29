import { Response, IResponse } from '../models';
import mongoose from 'mongoose';

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

export class AnalyticsAggregationService {
  /**
   * Aggregate response data by time period
   */
  async aggregateByTimePeriod(
    surveyId: string,
    period: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Promise<TimeSeriesData[]> {
    const groupFormat: any = {
      hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$submitted_at' } },
      day: { $dateToString: { format: '%Y-%m-%d', date: '$submitted_at' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$submitted_at' } },
      month: { $dateToString: { format: '%Y-%m', date: '$submitted_at' } }
    };

    const results = await Response.aggregate([
      {
        $match: {
          survey_id: new mongoose.Types.ObjectId(surveyId),
          submitted_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupFormat[period],
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return results.map(r => ({
      date: new Date(r._id),
      count: r.count,
      label: r._id
    }));
  }

  /**
   * Calculate heatmap data for response times
   */
  async generateHeatmapData(
    surveyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HeatmapCell[][]> {
    const results = await Response.aggregate([
      {
        $match: {
          survey_id: new mongoose.Types.ObjectId(surveyId),
          submitted_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$submitted_at' },
          hour: { $hour: '$submitted_at' }
        }
      },
      {
        $group: {
          _id: { day: '$dayOfWeek', hour: '$hour' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize 7x24 grid
    const heatmap: HeatmapCell[][] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let day = 0; day < 7; day++) {
      const row: HeatmapCell[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const match = results.find(r => r._id.day === day + 1 && r._id.hour === hour);
        row.push({
          x: hour,
          y: day,
          value: match ? match.count : 0,
          label: `${days[day]} ${hour}:00`
        });
      }
      heatmap.push(row);
    }

    return heatmap;
  }

  /**
   * Calculate funnel data for question completion
   */
  async calculateFunnelData(
    surveyId: string,
    filters?: any
  ): Promise<FunnelStage[]> {
    const matchQuery: any = { survey_id: new mongoose.Types.ObjectId(surveyId) };
    if (filters?.dateRange) {
      matchQuery.submitted_at = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    const responses = await Response.find(matchQuery).lean();
    if (responses.length === 0) return [];

    // Get survey questions order
    const Survey = mongoose.model('Survey');
    const survey = await Survey.findById(surveyId);
    if (!survey) return [];

    const questions = (survey as any).configuration?.questions || [];
    const totalResponses = responses.length;
    const funnel: FunnelStage[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const completionCount = responses.filter(r => {
        const responseData = r.response_data?.responses || r.response_data;
        return responseData && responseData[question.id] !== undefined;
      }).length;

      const completionRate = (completionCount / totalResponses) * 100;
      const dropoffRate = i > 0 ? funnel[i - 1].completionRate - completionRate : 0;

      funnel.push({
        questionId: question.id,
        questionText: question.question || 'Untitled Question',
        completionCount,
        completionRate,
        dropoffRate
      });
    }

    return funnel;
  }

  /**
   * Calculate question-level metrics
   */
  async calculateQuestionMetrics(
    surveyId: string,
    filters?: any
  ): Promise<QuestionMetrics[]> {
    const matchQuery: any = { survey_id: new mongoose.Types.ObjectId(surveyId) };
    if (filters?.dateRange) {
      matchQuery.submitted_at = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    const responses = await Response.find(matchQuery).lean();
    if (responses.length === 0) return [];

    const Survey = mongoose.model('Survey');
    const survey = await Survey.findById(surveyId);
    if (!survey) return [];

    const questions = (survey as any).configuration?.questions || [];
    const metrics: QuestionMetrics[] = [];

    for (const question of questions) {
      const questionId = question.id;
      let completionCount = 0;
      let totalTime = 0;
      let timeCount = 0;

      for (const response of responses) {
        const responseData = response.response_data?.responses || response.response_data;
        if (responseData && responseData[questionId] !== undefined) {
          completionCount++;
        }

        // Calculate average time if available
        if (response.question_timings && response.question_timings[questionId]) {
          totalTime += response.question_timings[questionId].duration;
          timeCount++;
        }
      }

      const completionRate = (completionCount / responses.length) * 100;
      const avgTimeSpent = timeCount > 0 ? totalTime / timeCount : 0;
      const dropoffCount = responses.length - completionCount;

      metrics.push({
        questionId,
        questionText: question.question || 'Untitled Question',
        questionType: question.type,
        completionRate,
        avgTimeSpent,
        dropoffCount,
        responseCount: completionCount
      });
    }

    return metrics;
  }

  /**
   * Aggregate device and browser data
   */
  async aggregateDeviceData(
    surveyId: string,
    filters?: any
  ): Promise<{ devices: DeviceMetrics; browsers: BrowserMetrics }> {
    const matchQuery: any = { survey_id: new mongoose.Types.ObjectId(surveyId) };
    if (filters?.dateRange) {
      matchQuery.submitted_at = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    const responses = await Response.find(matchQuery).lean();

    const devices: DeviceMetrics = { mobile: 0, desktop: 0, tablet: 0 };
    const browsers: BrowserMetrics = {};

    for (const response of responses) {
      if (response.device_info) {
        const deviceType = response.device_info.type || 'desktop';
        devices[deviceType]++;

        const browser = response.device_info.browser || 'Unknown';
        browsers[browser] = (browsers[browser] || 0) + 1;
      } else {
        // Default to desktop if no device info
        devices.desktop++;
        browsers['Unknown'] = (browsers['Unknown'] || 0) + 1;
      }
    }

    return { devices, browsers };
  }
}
