import express, { Request, Response } from 'express';
import { Survey } from '../models';
import { InvitationToken } from '../models/InvitationToken';
import { authenticateToken } from '../middleware/auth';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createInvitationSchema = Joi.object({
  description: Joi.string().max(200).optional(),
  expires_at: Joi.date().greater('now').optional(),
  max_uses: Joi.number().integer().min(1).max(10000).optional()
});

const updateInvitationSchema = Joi.object({
  description: Joi.string().max(200).optional(),
  expires_at: Joi.date().greater('now').allow(null).optional(),
  max_uses: Joi.number().integer().min(1).max(10000).allow(null).optional(),
  is_active: Joi.boolean().optional()
});

/**
 * POST /api/surveys/:id/invitations
 * Generate new invitation token for a survey
 */
router.post('/:id/invitations', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

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

    const { error, value } = createInvitationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invitation data',
          details: error.details[0].message
        }
      });
      return;
    }

    // Verify survey ownership
    const survey = await Survey.findOne({ _id: id, user_id: userId });
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

    // Check if survey is private (only private surveys can have invitations)
    if (survey.is_public) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SURVEY_IS_PUBLIC',
          message: 'Cannot create invitations for public surveys'
        }
      });
      return;
    }

    // Generate unique token
    const token = uuidv4();

    // Create invitation token
    const invitationToken = new InvitationToken({
      survey_id: survey._id,
      token,
      created_by: userId,
      description: value.description,
      expires_at: value.expires_at,
      max_uses: value.max_uses
    });

    await invitationToken.save();

    res.status(201).json({
      success: true,
      data: {
        invitation: {
          id: invitationToken._id,
          token: invitationToken.token,
          survey_id: invitationToken.survey_id,
          description: invitationToken.description,
          expires_at: invitationToken.expires_at,
          max_uses: invitationToken.max_uses,
          usage_count: invitationToken.usage_count,
          is_active: invitationToken.is_active,
          created_at: invitationToken.created_at,
          invitation_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${survey.slug}?token=${token}`
        }
      }
    });
  } catch (error: any) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create invitation'
      }
    });
  }
});

/**
 * GET /api/surveys/:id/invitations
 * List invitation tokens for a survey
 */
router.get('/:id/invitations', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

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

    // Verify survey ownership
    const survey = await Survey.findOne({ _id: id, user_id: userId });
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

    // Get all invitation tokens for this survey
    const invitations = await InvitationToken.find({ survey_id: survey._id })
      .sort({ created_at: -1 });

    const invitationsWithUrls = invitations.map(invitation => ({
      id: invitation._id,
      token: invitation.token,
      survey_id: invitation.survey_id,
      description: invitation.description,
      expires_at: invitation.expires_at,
      max_uses: invitation.max_uses,
      usage_count: invitation.usage_count,
      is_active: invitation.is_active,
      created_at: invitation.created_at,
      invitation_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${survey.slug}?token=${invitation.token}`,
      is_expired: invitation.expires_at ? new Date() > invitation.expires_at : false,
      is_usage_exceeded: invitation.max_uses ? invitation.usage_count >= invitation.max_uses : false
    }));

    res.json({
      success: true,
      data: {
        invitations: invitationsWithUrls
      }
    });
  } catch (error: any) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch invitations'
      }
    });
  }
});

/**
 * PUT /api/surveys/:id/invitations/:tokenId
 * Update invitation token
 */
router.put('/:id/invitations/:tokenId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, tokenId } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(tokenId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey or token ID'
        }
      });
      return;
    }

    const { error, value } = updateInvitationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invitation data',
          details: error.details[0].message
        }
      });
      return;
    }

    // Verify survey ownership
    const survey = await Survey.findOne({ _id: id, user_id: userId });
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

    // Find and update invitation token
    const invitation = await InvitationToken.findOneAndUpdate(
      { _id: tokenId, survey_id: survey._id },
      { $set: value },
      { new: true }
    );

    if (!invitation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'INVITATION_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        invitation: {
          id: invitation._id,
          token: invitation.token,
          survey_id: invitation.survey_id,
          description: invitation.description,
          expires_at: invitation.expires_at,
          max_uses: invitation.max_uses,
          usage_count: invitation.usage_count,
          is_active: invitation.is_active,
          created_at: invitation.created_at,
          invitation_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${survey.slug}?token=${invitation.token}`
        }
      }
    });
  } catch (error: any) {
    console.error('Update invitation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update invitation'
      }
    });
  }
});

/**
 * DELETE /api/surveys/:id/invitations/:tokenId
 * Revoke invitation token
 */
router.delete('/:id/invitations/:tokenId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, tokenId } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(tokenId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey or token ID'
        }
      });
      return;
    }

    // Verify survey ownership
    const survey = await Survey.findOne({ _id: id, user_id: userId });
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

    // Deactivate invitation token instead of deleting
    const invitation = await InvitationToken.findOneAndUpdate(
      { _id: tokenId, survey_id: survey._id },
      { $set: { is_active: false } },
      { new: true }
    );

    if (!invitation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'INVITATION_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Invitation revoked successfully'
    });
  } catch (error: any) {
    console.error('Revoke invitation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke invitation'
      }
    });
  }
});

export default router;