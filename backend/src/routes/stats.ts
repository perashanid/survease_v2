import express, { Request, Response } from 'express';
import { Survey, Response as SurveyResponse, User } from '../models';

const router = express.Router();

/**
 * GET /api/stats/platform
 * Get platform-wide statistics
 */
router.get('/platform', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total surveys count
    const totalSurveys = await Survey.countDocuments();
    
    // Get active surveys count
    const activeSurveys = await Survey.countDocuments({ is_active: true });
    
    // Get public surveys count
    const publicSurveys = await Survey.countDocuments({ is_public: true, is_active: true });
    
    // Get total responses count
    const totalResponses = await SurveyResponse.countDocuments();
    
    // Get anonymous vs authenticated responses
    const anonymousResponses = await SurveyResponse.countDocuments({ is_anonymous: true });
    const authenticatedResponses = await SurveyResponse.countDocuments({ is_anonymous: false });
    
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get recent activity (surveys created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSurveys = await Survey.countDocuments({
      created_at: { $gte: thirtyDaysAgo }
    });
    
    // Get recent responses (responses in last 30 days)
    const recentResponses = await SurveyResponse.countDocuments({
      submitted_at: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        surveys: {
          total: totalSurveys,
          active: activeSurveys,
          public: publicSurveys,
          recent: recentSurveys
        },
        responses: {
          total: totalResponses,
          anonymous: anonymousResponses,
          authenticated: authenticatedResponses,
          recent: recentResponses
        },
        users: {
          total: totalUsers
        },
        activity: {
          surveysThisMonth: recentSurveys,
          responsesThisMonth: recentResponses
        }
      }
    });
  } catch (error: any) {
    console.error('Platform stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch platform statistics'
      }
    });
  }
});

/**
 * GET /api/stats/survey/:id
 * Get detailed statistics for a specific survey
 */
router.get('/survey/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Find the survey
    const survey = await Survey.findById(id);
    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    // Get total responses for this survey
    const totalResponses = await SurveyResponse.countDocuments({ survey_id: id });
    
    // Get anonymous vs authenticated responses
    const anonymousResponses = await SurveyResponse.countDocuments({ 
      survey_id: id, 
      is_anonymous: true 
    });
    const authenticatedResponses = await SurveyResponse.countDocuments({ 
      survey_id: id, 
      is_anonymous: false 
    });

    // Get responses over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const responsesOverTime = await SurveyResponse.aggregate([
      {
        $match: {
          survey_id: survey._id,
          submitted_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submitted_at"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get question-specific analytics
    const responses = await SurveyResponse.find({ survey_id: id });
    const questionAnalytics: any = {};

    // Analyze each question
    survey.configuration.questions.forEach((question: any) => {
      const questionResponses = responses
        .map(r => r.response_data[question.id])
        .filter(r => r !== undefined && r !== null && r !== '');

      questionAnalytics[question.id] = {
        question: question.question,
        type: question.type,
        totalResponses: questionResponses.length,
        responseRate: totalResponses > 0 ? (questionResponses.length / totalResponses) * 100 : 0
      };

      // Type-specific analytics
      if (question.type === 'multiple_choice' || question.type === 'dropdown') {
        const optionCounts: any = {};
        question.options?.forEach((option: string) => {
          optionCounts[option] = questionResponses.filter(r => r === option).length;
        });
        questionAnalytics[question.id].optionCounts = optionCounts;
      } else if (question.type === 'checkbox') {
        const optionCounts: any = {};
        question.options?.forEach((option: string) => {
          optionCounts[option] = questionResponses.filter(r => 
            Array.isArray(r) && r.includes(option)
          ).length;
        });
        questionAnalytics[question.id].optionCounts = optionCounts;
      } else if (question.type === 'rating') {
        const ratings = questionResponses.filter(r => typeof r === 'number');
        if (ratings.length > 0) {
          const sum = ratings.reduce((a, b) => a + b, 0);
          questionAnalytics[question.id].averageRating = sum / ratings.length;
          questionAnalytics[question.id].ratingDistribution = {};
          
          for (let i = question.min_rating || 1; i <= (question.max_rating || 5); i++) {
            questionAnalytics[question.id].ratingDistribution[i] = ratings.filter(r => r === i).length;
          }
        }
      } else if (question.type === 'text' || question.type === 'textarea') {
        const textResponses = questionResponses.filter(r => typeof r === 'string' && r.trim() !== '');
        questionAnalytics[question.id].averageLength = textResponses.length > 0 
          ? textResponses.reduce((sum, text) => sum + text.length, 0) / textResponses.length 
          : 0;
      }
    });

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          created_at: survey.created_at
        },
        responses: {
          total: totalResponses,
          anonymous: anonymousResponses,
          authenticated: authenticatedResponses
        },
        timeline: responsesOverTime,
        questions: questionAnalytics
      }
    });
  } catch (error: any) {
    console.error('Survey stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch survey statistics'
      }
    });
  }
});

export default router;