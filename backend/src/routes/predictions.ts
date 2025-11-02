import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PredictiveModelService } from '../services/PredictiveModelService';
import { Survey } from '../models';
import mongoose from 'mongoose';

const router = express.Router();
const predictiveService = new PredictiveModelService();

// Middleware to verify survey ownership
async function verifySurveyAccess(req: Request, res: Response, next: any) {
  try {
    const surveyId = req.params.surveyId;
    const userId = (req as any).user.id;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ 
        success: false,
        error: 'Survey not found' 
      });
    }

    if (survey.user_id.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
}

/**
 * POST /api/predictions/:surveyId/question/:questionId
 * Predict response for a specific question
 */
router.post('/:surveyId/question/:questionId', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId, questionId } = req.params;
    const input = req.body;

    const prediction = await predictiveService.predictResponse(surveyId, questionId, input);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    console.error('Error predicting question response:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict response'
    });
  }
});

/**
 * POST /api/predictions/:surveyId/survey
 * Predict all responses for a survey
 */
router.post('/:surveyId/survey', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const input = req.body;

    const predictions = await predictiveService.predictSurveyResponses(surveyId, input);

    res.json({
      success: true,
      data: {
        predictions,
        totalQuestions: predictions.length,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      }
    });
  } catch (error: any) {
    console.error('Error predicting survey responses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict survey responses'
    });
  }
});

/**
 * POST /api/predictions/:surveyId/scenarios
 * Analyze multiple scenarios
 */
router.post('/:surveyId/scenarios', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { scenarios } = req.body;

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Scenarios array is required'
      });
    }

    const analysis = await predictiveService.analyzeScenarios(surveyId, scenarios);

    res.json({
      success: true,
      data: {
        scenarios: analysis,
        totalScenarios: analysis.length
      }
    });
  } catch (error: any) {
    console.error('Error analyzing scenarios:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze scenarios'
    });
  }
});

/**
 * POST /api/predictions/:surveyId/completion
 * Predict completion likelihood
 */
router.post('/:surveyId/completion', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { partialResponses, demographics } = req.body;

    if (!partialResponses || typeof partialResponses !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'partialResponses object is required'
      });
    }

    const prediction = await predictiveService.predictCompletionLikelihood(
      surveyId,
      partialResponses,
      demographics
    );

    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    console.error('Error predicting completion likelihood:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict completion likelihood'
    });
  }
});

/**
 * GET /api/predictions/:surveyId/demo-scenarios
 * Get demo scenarios for testing
 */
router.get('/:surveyId/demo-scenarios', authenticateToken, verifySurveyAccess, async (req: Request, res: Response) => {
  try {
    const demoScenarios = [
      {
        name: 'Mobile User - Morning',
        input: {
          deviceType: 'mobile',
          timeOfDay: 9,
          dayOfWeek: 1
        }
      },
      {
        name: 'Desktop User - Afternoon',
        input: {
          deviceType: 'desktop',
          timeOfDay: 14,
          dayOfWeek: 3
        }
      },
      {
        name: 'Tablet User - Evening',
        input: {
          deviceType: 'tablet',
          timeOfDay: 19,
          dayOfWeek: 5
        }
      },
      {
        name: 'Mobile User - Weekend',
        input: {
          deviceType: 'mobile',
          timeOfDay: 11,
          dayOfWeek: 6
        }
      }
    ];

    res.json({
      success: true,
      data: {
        scenarios: demoScenarios,
        description: 'Pre-configured scenarios for testing predictions'
      }
    });
  } catch (error: any) {
    console.error('Error getting demo scenarios:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get demo scenarios'
    });
  }
});

export default router;
