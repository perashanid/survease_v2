import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AttentionScoreService } from '../services/AttentionScoreService';
import { Survey } from '../models';

const router = express.Router();
const attentionService = new AttentionScoreService();

// GET /api/attention/surveys
router.get('/surveys', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { threshold = '70' } = req.query;

    const thresholdValue = parseInt(threshold as string, 10);
    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
      return res.status(400).json({ error: 'Threshold must be between 0 and 100' });
    }

    const surveys = await attentionService.getSurveysNeedingAttention(userId, thresholdValue);

    res.json({ surveys, count: surveys.length });
  } catch (error) {
    console.error('Error fetching surveys needing attention:', error);
    res.status(500).json({ error: 'Failed to fetch attention data' });
  }
});

// GET /api/attention/:surveyId
router.get('/:surveyId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.id;

    // Verify survey access
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attentionScore = await attentionService.calculateAttentionScore(surveyId);
    const issues = await attentionService.identifyIssues(surveyId);
    const recommendations = await attentionService.generateRecommendations(surveyId, issues);

    res.json({
      surveyId,
      title: survey.title,
      attentionScore,
      issues,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching attention details:', error);
    res.status(500).json({ error: 'Failed to fetch attention details' });
  }
});

// GET /api/attention/public/:surveyId
// Get attention metrics for a public survey (no authentication required)
router.get('/public/:surveyId', async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;

    // Verify survey exists and is public
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (!survey.is_public) {
      return res.status(403).json({ error: 'This survey is not public' });
    }

    const attentionScore = await attentionService.calculateAttentionScore(surveyId);
    const issues = await attentionService.identifyIssues(surveyId);
    const recommendations = await attentionService.generateRecommendations(surveyId, issues);

    res.json({
      surveyId,
      title: survey.title,
      attentionScore,
      issues,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching public attention details:', error);
    res.status(500).json({ error: 'Failed to fetch attention details' });
  }
});

export default router;
