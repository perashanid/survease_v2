import mongoose from 'mongoose';
import crypto from 'crypto';
import { CustomLink, ICustomLink } from '../models/CustomLink';

export class CustomLinkService {
  /**
   * Generate a custom link for a survey
   */
  static async generateCustomLink(
    surveyId: mongoose.Types.ObjectId,
    creatorId: mongoose.Types.ObjectId,
    frontendUrl: string,
    expiresAt?: Date
  ): Promise<ICustomLink> {
    // Generate unique token
    const linkToken = crypto.randomBytes(32).toString('hex');
    
    // Construct full URL
    const linkUrl = `${frontendUrl}/survey/custom/${linkToken}`;
    
    const customLink = await CustomLink.create({
      survey_id: surveyId,
      creator_id: creatorId,
      link_token: linkToken,
      link_url: linkUrl,
      is_active: true,
      usage_count: 0,
      expires_at: expiresAt
    });
    
    return customLink;
  }
  
  /**
   * Validate and retrieve custom link
   */
  static async validateCustomLink(linkToken: string): Promise<ICustomLink | null> {
    const customLink = await CustomLink.findOne({ link_token: linkToken })
      .populate('survey_id')
      .exec();
    
    if (!customLink) {
      return null;
    }
    
    // Check if link is active
    if (!customLink.is_active) {
      return null;
    }
    
    // Check if link has expired
    if (customLink.expires_at && customLink.expires_at < new Date()) {
      return null;
    }
    
    return customLink;
  }
  
  /**
   * Track custom link usage
   */
  static async trackLinkUsage(linkId: mongoose.Types.ObjectId): Promise<void> {
    await CustomLink.findByIdAndUpdate(linkId, {
      $inc: { usage_count: 1 }
    });
  }
  
  /**
   * Get custom links for a survey
   */
  static async getSurveyCustomLinks(surveyId: mongoose.Types.ObjectId): Promise<ICustomLink[]> {
    return await CustomLink.find({ survey_id: surveyId })
      .sort({ created_at: -1 })
      .exec();
  }
  
  /**
   * Deactivate a custom link
   */
  static async deactivateCustomLink(linkId: mongoose.Types.ObjectId): Promise<ICustomLink | null> {
    return await CustomLink.findByIdAndUpdate(
      linkId,
      { is_active: false },
      { new: true }
    );
  }
  
  /**
   * Get custom link statistics
   */
  static async getLinkStatistics(linkId: mongoose.Types.ObjectId): Promise<{
    link: ICustomLink;
    responseCount: number;
  } | null> {
    const link = await CustomLink.findById(linkId);
    
    if (!link) {
      return null;
    }
    
    // Import Response model here to avoid circular dependency
    const { Response } = await import('../models/Response');
    
    const responseCount = await Response.countDocuments({
      custom_link_id: linkId
    });
    
    return {
      link,
      responseCount
    };
  }
}
