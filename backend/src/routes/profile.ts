import express, { Request, Response } from 'express';
import { UserProfile, User, Survey, SurveyContribution } from '../models';
import { authenticateToken } from '../middleware/auth';
import { Response as SurveyResponse } from '../models';

const router = express.Router();

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    let profile = await UserProfile.findOne({ user_id: userId });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = new UserProfile({
        user_id: userId,
        surveys_created: 0,
        surveys_completed: 0,
        contributions_made: 0,
        contributions_received: 0,
        interests: []
      });
      await profile.save();
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          email_verified: user.email_verified,
          created_at: user.created_at
        },
        profile: {
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          institution: profile.institution,
          field_of_study: profile.field_of_study,
          interests: profile.interests,
          stats: {
            surveys_created: profile.surveys_created,
            surveys_completed: profile.surveys_completed,
            contributions_made: profile.contributions_made,
            contributions_received: profile.contributions_received
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch profile'
      }
    });
  }
});

/**
 * PUT /api/profile
 * Update current user's profile
 */
router.put('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { bio, avatar_url, institution, field_of_study, interests, first_name, last_name } = req.body;

    // Update user basic info
    if (first_name !== undefined || last_name !== undefined) {
      await User.findByIdAndUpdate(userId, {
        ...(first_name !== undefined && { first_name }),
        ...(last_name !== undefined && { last_name })
      });
    }

    // Update or create profile
    let profile = await UserProfile.findOne({ user_id: userId });

    if (!profile) {
      profile = new UserProfile({
        user_id: userId,
        bio,
        avatar_url,
        institution,
        field_of_study,
        interests: interests || [],
        surveys_created: 0,
        surveys_completed: 0,
        contributions_made: 0,
        contributions_received: 0
      });
    } else {
      if (bio !== undefined) profile.bio = bio;
      if (avatar_url !== undefined) profile.avatar_url = avatar_url;
      if (institution !== undefined) profile.institution = institution;
      if (field_of_study !== undefined) profile.field_of_study = field_of_study;
      if (interests !== undefined) profile.interests = interests;
    }

    await profile.save();

    const user = await User.findById(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: user!._id,
          email: user!.email,
          first_name: user!.first_name,
          last_name: user!.last_name
        },
        profile: {
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          institution: profile.institution,
          field_of_study: profile.field_of_study,
          interests: profile.interests,
          stats: {
            surveys_created: profile.surveys_created,
            surveys_completed: profile.surveys_completed,
            contributions_made: profile.contributions_made,
            contributions_received: profile.contributions_received
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

/**
 * GET /api/profile/contributions
 * Get user's survey contributions
 */
router.get('/contributions', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const contributions = await SurveyContribution.find({ contributor_id: userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('survey_id', 'title slug')
      .populate('survey_owner_id', 'first_name last_name');

    const total = await SurveyContribution.countDocuments({ contributor_id: userId });

    res.json({
      success: true,
      data: {
        contributions: contributions.map(contrib => ({
          id: contrib._id,
          survey: {
            id: (contrib.survey_id as any)._id,
            title: (contrib.survey_id as any).title,
            slug: (contrib.survey_id as any).slug
          },
          owner: {
            name: `${(contrib.survey_owner_id as any).first_name || ''} ${(contrib.survey_owner_id as any).last_name || ''}`.trim() || 'Anonymous'
          },
          created_at: contrib.created_at
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Get contributions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch contributions'
      }
    });
  }
});

/**
 * GET /api/profile/pending-contributions
 * Get surveys from users who contributed to current user's surveys
 */
router.get('/pending-contributions', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Find users who contributed to my surveys
    const contributions = await SurveyContribution.find({ survey_owner_id: userId })
      .populate('contributor_id', 'first_name last_name');

    const contributorIds = [...new Set(contributions.map(c => c.contributor_id.toString()))];

    // Find public surveys from these contributors that I haven't responded to yet
    const contributorSurveys = await Survey.find({
      user_id: { $in: contributorIds },
      is_public: true,
      is_active: true
    }).populate('user_id', 'first_name last_name');

    // Check which surveys I've already responded to
    const myResponses = await SurveyResponse.find({
      user_id: userId,
      survey_id: { $in: contributorSurveys.map(s => s._id) }
    });

    const respondedSurveyIds = new Set(myResponses.map(r => r.survey_id.toString()));

    const pendingSurveys = contributorSurveys
      .filter(survey => !respondedSurveyIds.has((survey._id as any).toString()))
      .map(survey => ({
        id: survey._id,
        title: survey.title,
        description: survey.description,
        slug: survey.slug,
        tags: survey.tags || [],
        author: {
          name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous'
        },
        created_at: survey.created_at
      }));

    res.json({
      success: true,
      data: {
        pending_surveys: pendingSurveys
      }
    });
  } catch (error: any) {
    console.error('Get pending contributions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch pending contributions'
      }
    });
  }
});

export default router;
