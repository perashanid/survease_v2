import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ResponseLockingService } from '../services/ResponseLockingService';
import { PointsService } from '../services/PointsService';
import { CustomLinkService } from '../services/CustomLinkService';
import { SurveyBoostService } from '../services/SurveyBoostService';
import { Survey } from '../models/Survey';
import mongoose from 'mongoose';

const router = express.Router();

// Get locked responses for a survey
router.get('/surveys/:surveyId/responses/locked', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.userId;
    
    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }
    
    if (!survey.user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const lockedResponses = await ResponseLockingService.getLockedResponses(
      new mongoose.Types.ObjectId(surveyId)
    );
    
    const formattedResponses = lockedResponses.map(response => ({
      response_id: response._id,
      respondent_name: response.user_id 
        ? `${(response.user_id as any).first_name} ${(response.user_id as any).last_name}`.trim()
        : 'Anonymous',
      respondent_email: response.user_id ? (response.user_id as any).email : null,
      submitted_at: response.submitted_at,
      unlock_requirement: {
        type: response.unlock_requirement?.type,
        target_survey: response.unlock_requirement?.target_survey_id ? {
          id: (response.unlock_requirement.target_survey_id as any)._id,
          title: (response.unlock_requirement.target_survey_id as any).title,
          slug: (response.unlock_requirement.target_survey_id as any).slug
        } : null
      }
    }));
    
    const stats = await ResponseLockingService.getUnlockStatistics(
      new mongoose.Types.ObjectId(surveyId)
    );
    
    res.json({
      success: true,
      data: {
        locked_responses: formattedResponses,
        total_locked: stats.locked,
        statistics: stats
      }
    });
  } catch (error: any) {
    console.error('Error fetching locked responses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unlock a response
router.post('/surveys/:surveyId/responses/:responseId/unlock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId, responseId } = req.params;
    const { completed_survey_id } = req.body;
    const userId = (req as any).user.userId;
    
    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }
    
    if (!survey.user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Check if can unlock
    const canUnlock = await ResponseLockingService.canUnlockResponse(
      new mongoose.Types.ObjectId(responseId),
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(completed_survey_id)
    );
    
    if (!canUnlock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot unlock this response. Please complete the required survey first.' 
      });
    }
    
    // Unlock the response
    const unlock = await ResponseLockingService.unlockResponse(
      new mongoose.Types.ObjectId(responseId),
      new mongoose.Types.ObjectId(userId),
      new mongoose.Types.ObjectId(completed_survey_id)
    );
    
    // Get the unlocked response
    const { Response } = await import('../models/Response');
    const response = await Response.findById(responseId);
    
    res.json({
      success: true,
      data: {
        response,
        points_awarded: unlock.points_awarded
      }
    });
  } catch (error: any) {
    console.error('Error unlocking response:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate custom link for a survey
router.post('/surveys/:surveyId/custom-link', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { expires_at } = req.body;
    const userId = (req as any).user.userId;
    
    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }
    
    if (!survey.user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const expiresAt = expires_at ? new Date(expires_at) : undefined;
    
    const customLink = await CustomLinkService.generateCustomLink(
      new mongoose.Types.ObjectId(surveyId),
      new mongoose.Types.ObjectId(userId),
      frontendUrl,
      expiresAt
    );
    
    res.json({
      success: true,
      data: { link: customLink }
    });
  } catch (error: any) {
    console.error('Error generating custom link:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get custom links for a survey
router.get('/surveys/:surveyId/custom-links', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.userId;
    
    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }
    
    if (!survey.user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const customLinks = await CustomLinkService.getSurveyCustomLinks(
      new mongoose.Types.ObjectId(surveyId)
    );
    
    res.json({
      success: true,
      data: { links: customLinks }
    });
  } catch (error: any) {
    console.error('Error fetching custom links:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Deactivate a custom link
router.delete('/custom-links/:linkId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const userId = (req as any).user.userId;
    
    // Verify link ownership
    const { CustomLink } = await import('../models/CustomLink');
    const link = await CustomLink.findById(linkId).populate('survey_id');
    
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }
    
    if (!(link.survey_id as any).user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const deactivatedLink = await CustomLinkService.deactivateCustomLink(
      new mongoose.Types.ObjectId(linkId)
    );
    
    res.json({
      success: true,
      data: { link: deactivatedLink }
    });
  } catch (error: any) {
    console.error('Error deactivating custom link:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Boost a survey
router.post('/surveys/:surveyId/boost', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { bonus_points, duration_days } = req.body;
    const userId = (req as any).user.userId;
    
    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }
    
    if (!survey.user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Validate bonus points
    if (!bonus_points || bonus_points < 1 || bonus_points > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bonus points must be between 1 and 100' 
      });
    }
    
    const boostedSurvey = await SurveyBoostService.boostSurvey(
      new mongoose.Types.ObjectId(surveyId),
      bonus_points,
      duration_days
    );
    
    res.json({
      success: true,
      data: { survey: boostedSurvey }
    });
  } catch (error: any) {
    console.error('Error boosting survey:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove boost from a survey
router.delete('/surveys/:surveyId/boost', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.userId;
    
    // Verify survey ownership
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }
    
    if (!survey.user_id.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const unboostedSurvey = await SurveyBoostService.unboostSurvey(
      new mongoose.Types.ObjectId(surveyId)
    );
    
    res.json({
      success: true,
      data: { survey: unboostedSurvey }
    });
  } catch (error: any) {
    console.error('Error removing boost:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get boosted surveys (public)
router.get('/boosted-surveys', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await SurveyBoostService.getBoostedSurveys(page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching boosted surveys:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user points
router.get('/users/points', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log(`[Points API] Fetching points for user: ${userId}`);
    
    const [points, recentTransactions] = await Promise.all([
      PointsService.getUserPoints(new mongoose.Types.ObjectId(userId)),
      PointsService.getPointsHistory(new mongoose.Types.ObjectId(userId), 10)
    ]);
    
    console.log(`[Points API] User ${userId} points:`, points.total_points);
    
    res.json({
      success: true,
      data: {
        points,
        recent_transactions: recentTransactions
      }
    });
  } catch (error: any) {
    console.error('Error fetching user points:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get points history
router.get('/users/points/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const transactions = await PointsService.getPointsHistory(
      new mongoose.Types.ObjectId(userId),
      limit
    );
    
    res.json({
      success: true,
      data: { transactions }
    });
  } catch (error: any) {
    console.error('Error fetching points history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const leaderboard = await PointsService.getLeaderboard(limit);
    
    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
