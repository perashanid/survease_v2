import express, { Request, Response } from 'express';
import { QualityClassifier } from '../services/QualityClassifier';
import { Survey } from '../models';
import mongoose from 'mongoose';

const router = express.Router();
const qualityClassifier = new QualityClassifier();

/**
 * GET /api/surveys/:surveyId/quality/rules
 * Get quality rules for a survey
 */
router.get('/:surveyId/rules', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    const rules = await qualityClassifier.getQualityRules(surveyId);

    if (!rules) {
      // Return default rules
      return res.json({
        success: true,
        rules: {
          min_completion_time: 30,
          total_flagged: 0,
          total_overridden: 0
        }
      });
    }

    res.json({
      success: true,
      rules
    });
  } catch (error: any) {
    console.error('Error fetching quality rules:', error);
    res.status(500).json({ error: 'Failed to fetch quality rules' });
  }
});

/**
 * PUT /api/surveys/:surveyId/quality/rules
 * Update quality rules for a survey
 */
router.put('/:surveyId/rules', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;
    const { min_completion_time, custom_rules } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    // Validate min_completion_time
    if (min_completion_time !== undefined) {
      if (typeof min_completion_time !== 'number' || min_completion_time < 5 || min_completion_time > 3600) {
        return res.status(400).json({ 
          error: 'Minimum completion time must be between 5 and 3600 seconds' 
        });
      }
    }

    const rules = await qualityClassifier.updateQualityRules(surveyId, userId, {
      min_completion_time,
      custom_rules
    });

    res.json({
      success: true,
      rules,
      message: 'Quality rules updated and responses re-classified'
    });
  } catch (error: any) {
    console.error('Error updating quality rules:', error);
    res.status(400).json({ error: error.message || 'Failed to update quality rules' });
  }
});

/**
 * POST /api/surveys/:surveyId/quality/classify
 * Manually trigger classification of responses
 */
router.post('/:surveyId/classify', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    let rules = await qualityClassifier.getQualityRules(surveyId);
    
    if (!rules) {
      // Create default rules
      rules = await qualityClassifier.updateQualityRules(surveyId, userId, {
        min_completion_time: 30
      });
    }

    const result = await qualityClassifier.classifyResponses(surveyId, rules);

    res.json({
      success: true,
      result,
      message: 'Responses classified successfully'
    });
  } catch (error: any) {
    console.error('Error classifying responses:', error);
    res.status(500).json({ error: 'Failed to classify responses' });
  }
});

/**
 * GET /api/surveys/:surveyId/quality/flagged-responses
 * Get all flagged responses for a survey
 */
router.get('/:surveyId/flagged-responses', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    const flaggedResponses = await qualityClassifier.getFlaggedResponses(surveyId);

    res.json({
      success: true,
      responses: flaggedResponses,
      count: flaggedResponses.length
    });
  } catch (error: any) {
    console.error('Error fetching flagged responses:', error);
    res.status(500).json({ error: 'Failed to fetch flagged responses' });
  }
});

/**
 * POST /api/surveys/:surveyId/quality/override/:responseId
 * Manually override quality classification for a response
 */
router.post('/:surveyId/override/:responseId', async (req: Request, res: Response) => {
  try {
    const { surveyId, responseId } = req.params;
    const { newStatus, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    // Validate newStatus
    if (!['quality', 'low_quality'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be "quality" or "low_quality"' });
    }

    await qualityClassifier.overrideClassification(responseId, userId, newStatus, reason);

    res.json({
      success: true,
      message: 'Response classification overridden successfully'
    });
  } catch (error: any) {
    console.error('Error overriding classification:', error);
    res.status(400).json({ error: error.message || 'Failed to override classification' });
  }
});

/**
 * GET /api/surveys/:surveyId/quality/audit-log
 * Get audit log for quality classifications
 */
router.get('/:surveyId/audit-log', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify survey ownership
    const survey = await Survey.findOne({
      _id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    const auditLog = await qualityClassifier.getAuditLog(surveyId, limit);

    res.json({
      success: true,
      audit_log: auditLog,
      count: auditLog.length
    });
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;
