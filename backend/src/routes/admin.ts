import express, { Request, Response } from 'express';
import { Survey, Response as SurveyResponse, User } from '../models';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/surveys
 * Get all surveys with admin details
 */
router.get('/surveys', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';
    const filter = req.query.filter as string || 'all'; // all, featured, public, active

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (filter === 'featured') {
      query.is_featured = true;
    } else if (filter === 'public') {
      query.is_public = true;
    } else if (filter === 'active') {
      query.is_active = true;
    }

    const surveys = await Survey.find(query)
      .populate('user_id', 'first_name last_name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });
        return {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          tags: survey.tags || [],
          is_public: survey.is_public,
          is_active: survey.is_active,
          is_featured: survey.is_featured,
          allow_import: survey.allow_import,
          import_count: survey.import_count,
          created_at: survey.created_at,
          updated_at: survey.updated_at,
          response_count: responseCount,
          author: {
            id: (survey.user_id as any)._id,
            name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous',
            email: (survey.user_id as any).email
          }
        };
      })
    );

    const total = await Survey.countDocuments(query);

    res.json({
      success: true,
      data: {
        surveys: surveysWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Admin get surveys error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch surveys'
      }
    });
  }
});

/**
 * PATCH /api/admin/surveys/:id/feature
 * Toggle featured status of a survey
 */
router.patch('/surveys/:id/feature', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    if (typeof is_featured !== 'boolean') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'is_featured must be a boolean'
        }
      });
      return;
    }

    const survey = await Survey.findByIdAndUpdate(
      id,
      { is_featured },
      { new: true }
    );

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

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          is_featured: survey.is_featured
        }
      },
      message: `Survey ${is_featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error: any) {
    console.error('Admin feature survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update survey'
      }
    });
  }
});

/**
 * PATCH /api/admin/surveys/:id/visibility
 * Toggle public/active status of a survey
 */
router.patch('/surveys/:id/visibility', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_public, is_active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    const updateData: any = {};
    if (typeof is_public === 'boolean') {
      updateData.is_public = is_public;
      updateData['configuration.settings.is_public'] = is_public;
    }
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'No valid fields to update'
        }
      });
      return;
    }

    const survey = await Survey.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

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

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          is_public: survey.is_public,
          is_active: survey.is_active
        }
      },
      message: 'Survey visibility updated successfully'
    });
  } catch (error: any) {
    console.error('Admin update visibility error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update survey'
      }
    });
  }
});

/**
 * DELETE /api/admin/surveys/:id
 * Delete a survey (admin override)
 */
router.delete('/surveys/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

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

    // Delete all responses for this survey
    await SurveyResponse.deleteMany({ survey_id: id });

    // Delete the survey
    await Survey.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Survey and all responses deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin delete survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete survey'
      }
    });
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSurveys = await Survey.countDocuments();
    const publicSurveys = await Survey.countDocuments({ is_public: true });
    const featuredSurveys = await Survey.countDocuments({ is_featured: true });
    const totalResponses = await SurveyResponse.countDocuments();

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const recentSurveys = await Survey.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const recentResponses = await SurveyResponse.countDocuments({ submitted_at: { $gte: thirtyDaysAgo } });

    // Get top surveys by response count
    const topSurveys = await Survey.aggregate([
      {
        $lookup: {
          from: 'responses',
          localField: '_id',
          foreignField: 'survey_id',
          as: 'responses'
        }
      },
      {
        $addFields: {
          response_count: { $size: '$responses' }
        }
      },
      {
        $sort: { response_count: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          title: 1,
          response_count: 1,
          is_featured: 1,
          is_public: 1,
          created_at: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalSurveys,
          publicSurveys,
          featuredSurveys,
          totalResponses
        },
        recentActivity: {
          newUsers: recentUsers,
          newSurveys: recentSurveys,
          newResponses: recentResponses
        },
        topSurveys
      }
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch statistics'
      }
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password_hash -password_reset_token')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const surveyCount = await Survey.countDocuments({ user_id: user._id });
        const responseCount = await SurveyResponse.countDocuments({ user_id: user._id });
        
        return {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          email_verified: user.email_verified,
          is_admin: user.is_admin,
          created_at: user.created_at,
          survey_count: surveyCount,
          response_count: responseCount
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

export default router;
