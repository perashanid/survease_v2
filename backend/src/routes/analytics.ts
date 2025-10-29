import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AnalyticsAggregationService } from '../services/AnalyticsAggregationService';
import { ForecastService } from '../services/ForecastService';
import { SegmentationService } from '../services/SegmentationService';
import { AttentionScoreService } from '../services/AttentionScoreService';
import { Survey } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

const analyticsService = new AnalyticsAggregationService();
const forecastService = new ForecastService();
const segmentationService = new SegmentationService();
const attentionService = new AttentionScoreService();

// Middleware to verify survey ownership
async function verifySurveyAccess(req: Request, res: Response, next: any) {
  try {
    const surveyId = req.params.surveyId;
    const userId = (req as any).user.userId;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.user_id.toString() !== userId && !survey.configuration?.settings?.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/analytics/:surveyId/overview
router.get('/:surveyId/overview', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    
    // Get last 30 days data for sparklines
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const trendData = await analyticsService.aggregateByTimePeriod(
      surveyId,
      'day',
      startDate,
      endDate
    );

    const attentionScore = await attentionService.calculateAttentionScore(surveyId);
    const issues = await attentionService.identifyIssues(surveyId);

    res.json({
      sparklineData: trendData,
      attentionScore,
      hasIssues: issues.length > 0,
      issueCount: issues.length
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /api/analytics/:surveyId/trends
router.get('/:surveyId/trends', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { period = 'day', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const data = await analyticsService.aggregateByTimePeriod(
      surveyId,
      period as 'hour' | 'day' | 'week' | 'month',
      start,
      end
    );

    const trend = forecastService.detectTrend(data);

    res.json({ data, trend });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// GET /api/analytics/:surveyId/heatmap
router.get('/:surveyId/heatmap', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const data = await analyticsService.generateHeatmapData(surveyId, start, end);

    res.json({ data });
  } catch (error) {
    console.error('Error fetching heatmap:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// GET /api/analytics/:surveyId/funnel
router.get('/:surveyId/funnel', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const data = await analyticsService.calculateFunnelData(surveyId, filters);

    res.json({ data });
  } catch (error) {
    console.error('Error fetching funnel:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

// GET /api/analytics/:surveyId/questions
router.get('/:surveyId/questions', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { sortBy = 'completionRate', startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    let data = await analyticsService.calculateQuestionMetrics(surveyId, filters);

    // Sort data
    if (sortBy === 'completionRate') {
      data = data.sort((a, b) => a.completionRate - b.completionRate);
    } else if (sortBy === 'avgTime') {
      data = data.sort((a, b) => b.avgTimeSpent - a.avgTimeSpent);
    } else if (sortBy === 'dropoffRate') {
      data = data.sort((a, b) => b.dropoffCount - a.dropoffCount);
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching question metrics:', error);
    res.status(500).json({ error: 'Failed to fetch question metrics' });
  }
});

// GET /api/analytics/:surveyId/devices
router.get('/:surveyId/devices', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const data = await analyticsService.aggregateDeviceData(surveyId, filters);

    res.json(data);
  } catch (error) {
    console.error('Error fetching device data:', error);
    res.status(500).json({ error: 'Failed to fetch device analytics' });
  }
});

// GET /api/analytics/:surveyId/forecast
router.get('/:surveyId/forecast', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { daysAhead = '7' } = req.query;

    const days = parseInt(daysAhead as string, 10);
    if (isNaN(days) || days < 1 || days > 90) {
      return res.status(400).json({ error: 'daysAhead must be between 1 and 90' });
    }

    const data = await forecastService.forecastResponses(surveyId, days);

    res.json({ data });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// POST /api/analytics/:surveyId/compare
router.post('/:surveyId/compare', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyIds, metrics = ['responseCount', 'completionRate'] } = req.body;
    const userId = (req as any).user.userId;

    if (!Array.isArray(surveyIds) || surveyIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 survey IDs required for comparison' });
    }

    // Verify access to all surveys
    const surveys = await Survey.find({
      _id: { $in: surveyIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      $or: [
        { user_id: new mongoose.Types.ObjectId(userId) },
        { 'configuration.settings.is_public': true }
      ]
    });

    if (surveys.length !== surveyIds.length) {
      return res.status(403).json({ error: 'Access denied to one or more surveys' });
    }

    const comparisons = [];
    for (const survey of surveys) {
      const surveyId = (survey._id as mongoose.Types.ObjectId).toString();
      const questionMetrics = await analyticsService.calculateQuestionMetrics(surveyId);
      
      const totalQuestions = survey.configuration?.questions?.length || 0;
      const avgCompletionRate = questionMetrics.length > 0
        ? questionMetrics.reduce((sum, q) => sum + q.completionRate, 0) / questionMetrics.length
        : 0;

      comparisons.push({
        surveyId,
        title: survey.title,
        responseCount: questionMetrics[0]?.responseCount || 0,
        completionRate: avgCompletionRate,
        questionCount: totalQuestions
      });
    }

    res.json({ comparisons });
  } catch (error) {
    console.error('Error comparing surveys:', error);
    res.status(500).json({ error: 'Failed to compare surveys' });
  }
});

// POST /api/analytics/:surveyId/filter
router.post('/:surveyId/filter', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const criteria = req.body;

    const responses = await segmentationService.filterResponses(surveyId, criteria);

    res.json({ 
      count: responses.length,
      responses: responses.slice(0, 100) // Limit to first 100 for performance
    });
  } catch (error) {
    console.error('Error filtering responses:', error);
    res.status(500).json({ error: 'Failed to filter responses' });
  }
});

// GET /api/analytics/:surveyId/search
router.get('/:surveyId/search', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { query, startDate, endDate } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const filters: any = {};
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const responses = await segmentationService.searchResponses(surveyId, query, filters);

    res.json({ 
      count: responses.length,
      responses: responses.slice(0, 50) // Limit results
    });
  } catch (error) {
    console.error('Error searching responses:', error);
    res.status(500).json({ error: 'Failed to search responses' });
  }
});

export default router;
