import express, { Request, Response } from 'express';
import { AIInsight, Survey, Response as SurveyResponse } from '../models';
import { AIService } from '../services/AIService';
import { QualityClassifier } from '../services/QualityClassifier';
import { ExportService } from '../services/ExportService';
import mongoose from 'mongoose';

const router = express.Router();
const aiService = new AIService();
const qualityClassifier = new QualityClassifier();
const exportService = new ExportService();

// Rate limiting map (in-memory, should use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
};

/**
 * POST /api/surveys/:surveyId/ai/generate-insights
 * Generate AI insights for a survey
 */
router.post('/:surveyId/generate-insights', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Rate limiting: 10 requests per hour
    if (!checkRateLimit(userId, 10, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    // Validate survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    // Get quality-filtered responses
    const includeQuality = req.body.includeQuality !== false;
    const includeLowQuality = req.body.includeLowQuality === true;
    
    const responses = await qualityClassifier.getQualityFilteredResponses(
      surveyId,
      includeQuality,
      includeLowQuality
    );

    if (responses.length === 0) {
      return res.status(400).json({ error: 'No responses available for analysis' });
    }

    // Generate insights
    const summary = await aiService.generateSummary(survey, responses);
    const patterns = await aiService.detectPatterns(survey, responses);
    const recommendations = await aiService.generateRecommendations(survey, patterns, summary);

    // Calculate data snapshot
    const sortedResponses = responses.sort((a, b) => 
      a.submitted_at.getTime() - b.submitted_at.getTime()
    );
    const dateRange = {
      start: sortedResponses[0].submitted_at,
      end: sortedResponses[sortedResponses.length - 1].submitted_at
    };

    // Save insight
    const insight = await AIInsight.create({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId),
      summary,
      patterns,
      recommendations,
      generated_at: new Date(),
      data_snapshot: {
        response_count: responses.length,
        date_range: dateRange,
        filters_applied: { includeQuality, includeLowQuality }
      },
      is_stale: false,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour TTL
    });

    res.json({
      success: true,
      insight: {
        id: insight._id,
        summary: insight.summary,
        patterns: insight.patterns,
        recommendations: insight.recommendations,
        generated_at: insight.generated_at,
        data_snapshot: insight.data_snapshot
      }
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: error.message || 'Failed to generate insights' });
  }
});

/**
 * GET /api/surveys/:surveyId/ai/insights
 * Get all insights for a survey
 */
router.get('/:surveyId/insights', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const insights = await AIInsight.find({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    })
    .sort({ generated_at: -1 })
    .skip(skip)
    .limit(limit)
    .select('generated_at data_snapshot is_stale');

    const total = await AIInsight.countDocuments({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    res.json({
      success: true,
      insights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

/**
 * GET /api/surveys/:surveyId/ai/insights/:insightId
 * Get specific insight by ID
 */
router.get('/:surveyId/insights/:insightId', async (req: Request, res: Response) => {
  try {
    const { surveyId, insightId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const insight = await AIInsight.findOne({
      _id: new mongoose.Types.ObjectId(insightId),
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json({
      success: true,
      insight
    });
  } catch (error: any) {
    console.error('Error fetching insight:', error);
    res.status(500).json({ error: 'Failed to fetch insight' });
  }
});

/**
 * DELETE /api/surveys/:surveyId/ai/insights/:insightId
 * Delete an insight
 */
router.delete('/:surveyId/insights/:insightId', async (req: Request, res: Response) => {
  try {
    const { surveyId, insightId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await AIInsight.deleteOne({
      _id: new mongoose.Types.ObjectId(insightId),
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    res.json({
      success: true,
      message: 'Insight deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting insight:', error);
    res.status(500).json({ error: 'Failed to delete insight' });
  }
});

/**
 * POST /api/surveys/:surveyId/ai/regenerate
 * Regenerate insights with current data
 */
router.post('/:surveyId/regenerate', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mark existing insights as stale
    await AIInsight.updateMany(
      {
        survey_id: new mongoose.Types.ObjectId(surveyId),
        user_id: new mongoose.Types.ObjectId(userId)
      },
      { is_stale: true }
    );

    // Generate new insights (reuse the generate-insights logic)
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const responses = await qualityClassifier.getQualityFilteredResponses(surveyId, true, false);

    if (responses.length === 0) {
      return res.status(400).json({ error: 'No responses available for analysis' });
    }

    const summary = await aiService.generateSummary(survey, responses);
    const patterns = await aiService.detectPatterns(survey, responses);
    const recommendations = await aiService.generateRecommendations(survey, patterns, summary);

    const sortedResponses = responses.sort((a, b) => 
      a.submitted_at.getTime() - b.submitted_at.getTime()
    );

    const insight = await AIInsight.create({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId),
      summary,
      patterns,
      recommendations,
      generated_at: new Date(),
      data_snapshot: {
        response_count: responses.length,
        date_range: {
          start: sortedResponses[0].submitted_at,
          end: sortedResponses[sortedResponses.length - 1].submitted_at
        },
        filters_applied: { includeQuality: true, includeLowQuality: false }
      },
      is_stale: false,
      expires_at: new Date(Date.now() + 60 * 60 * 1000)
    });

    res.json({
      success: true,
      insight: {
        id: insight._id,
        summary: insight.summary,
        patterns: insight.patterns,
        recommendations: insight.recommendations,
        generated_at: insight.generated_at
      }
    });
  } catch (error: any) {
    console.error('Error regenerating insights:', error);
    res.status(500).json({ error: 'Failed to regenerate insights' });
  }
});

/**
 * POST /api/surveys/:surveyId/ai/export/pdf
 * Export insights to PDF
 */
router.post('/:surveyId/export/pdf', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { insightId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Rate limiting: 20 requests per hour
    if (!checkRateLimit(`export_${userId}`, 20, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Export rate limit exceeded' });
    }

    const insight = await AIInsight.findOne({
      _id: new mongoose.Types.ObjectId(insightId),
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const pdfBuffer = await exportService.exportToPDF(insight, survey, req.body.options || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ai-insights-${surveyId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error exporting to PDF:', error);
    res.status(500).json({ error: 'Failed to export to PDF' });
  }
});

/**
 * POST /api/surveys/:surveyId/ai/export/json
 * Export insights to JSON
 */
router.post('/:surveyId/export/json', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { insightId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const insight = await AIInsight.findOne({
      _id: new mongoose.Types.ObjectId(insightId),
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const jsonData = await exportService.exportToJSON(insight);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ai-insights-${surveyId}.json"`);
    res.json(jsonData);
  } catch (error: any) {
    console.error('Error exporting to JSON:', error);
    res.status(500).json({ error: 'Failed to export to JSON' });
  }
});

export default router;
