import { Notification, UserProfile, SurveyContribution } from '../models';
import mongoose from 'mongoose';

export class NotificationService {
  /**
   * Create a notification for a new public survey
   */
  static async notifyNewPublicSurvey(surveyId: mongoose.Types.ObjectId, surveyTitle: string, surveyOwnerId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Get all users except the survey owner
      const UserProfile = (await import('../models')).UserProfile;
      const profiles = await UserProfile.find({ user_id: { $ne: surveyOwnerId } }).limit(100);

      const notifications = profiles.map(profile => ({
        user_id: profile.user_id,
        type: 'new_survey' as const,
        title: 'New Survey Available',
        message: `A new survey "${surveyTitle}" is now available to participate in.`,
        related_survey_id: surveyId,
        is_read: false
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (error) {
      console.error('Error creating new survey notifications:', error);
    }
  }

  /**
   * Create a notification when someone contributes to a survey
   */
  static async notifyContribution(
    surveyId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyOwnerId: mongoose.Types.ObjectId,
    contributorId: mongoose.Types.ObjectId,
    contributorName: string
  ): Promise<void> {
    try {
      // Create notification for survey owner
      await Notification.create({
        user_id: surveyOwnerId,
        type: 'survey_contribution',
        title: 'New Survey Contribution',
        message: `${contributorName} just contributed to your survey "${surveyTitle}". Help them with their research too!`,
        related_survey_id: surveyId,
        related_user_id: contributorId,
        is_read: false
      });

      // Update profile stats
      await UserProfile.findOneAndUpdate(
        { user_id: surveyOwnerId },
        { $inc: { contributions_received: 1 } },
        { upsert: true }
      );

      await UserProfile.findOneAndUpdate(
        { user_id: contributorId },
        { $inc: { contributions_made: 1 } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error creating contribution notification:', error);
    }
  }

  /**
   * Create a notification for survey response
   */
  static async notifyResponse(
    surveyId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyOwnerId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: surveyOwnerId,
        type: 'survey_response',
        title: 'New Survey Response',
        message: `Someone just responded to your survey "${surveyTitle}".`,
        related_survey_id: surveyId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating response notification:', error);
    }
  }

  /**
   * Update profile stats when a survey is created
   */
  static async updateSurveyCreatedStats(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await UserProfile.findOneAndUpdate(
        { user_id: userId },
        { $inc: { surveys_created: 1 } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating survey created stats:', error);
    }
  }

  /**
   * Update profile stats when a user completes a survey
   */
  static async updateSurveyCompletedStats(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await UserProfile.findOneAndUpdate(
        { user_id: userId },
        { $inc: { surveys_completed: 1 } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating survey completed stats:', error);
    }
  }

  /**
   * Create a notification when a user completes a survey
   */
  static async notifySurveyCompletion(
    userId: mongoose.Types.ObjectId,
    surveyId: mongoose.Types.ObjectId,
    surveyTitle: string
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: userId,
        type: 'survey_response',
        title: 'Survey Completed',
        message: `Thank you for completing "${surveyTitle}"! Your response has been recorded.`,
        related_survey_id: surveyId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating survey completion notification:', error);
    }
  }

  /**
   * RECIPROCAL SYSTEM NOTIFICATIONS
   */

  /**
   * Notify user when they earn points
   */
  static async notifyPointsEarned(
    userId: mongoose.Types.ObjectId,
    points: number,
    surveyTitle: string,
    surveyId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: userId,
        type: 'points_earned',
        title: '🎁 Points Earned!',
        message: `You earned ${points} points for completing "${surveyTitle}"!`,
        related_survey_id: surveyId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating points earned notification:', error);
    }
  }

  /**
   * Notify survey creator when someone uses their custom link
   */
  static async notifyCustomLinkUsed(
    surveyOwnerId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: surveyOwnerId,
        type: 'custom_link_used',
        title: '🔗 Custom Link Used',
        message: `Someone used your custom link to respond to "${surveyTitle}"!`,
        related_survey_id: surveyId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating custom link notification:', error);
    }
  }

  /**
   * Notify survey creator when their survey is boosted
   */
  static async notifySurveyBoosted(
    userId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyId: mongoose.Types.ObjectId,
    bonusPoints: number,
    durationDays: number
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: userId,
        type: 'survey_boosted',
        title: '🚀 Survey Boosted!',
        message: `Your survey "${surveyTitle}" is now boosted with ${bonusPoints} bonus points for ${durationDays} days!`,
        related_survey_id: surveyId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating survey boosted notification:', error);
    }
  }

  /**
   * Notify user when a response is unlocked
   */
  static async notifyResponseUnlocked(
    userId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyId: mongoose.Types.ObjectId,
    unlockedByUserId?: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: userId,
        type: 'response_unlocked',
        title: '🔓 Response Unlocked!',
        message: `You can now view a response to your survey "${surveyTitle}"!`,
        related_survey_id: surveyId,
        related_user_id: unlockedByUserId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating response unlocked notification:', error);
    }
  }

  /**
   * Notify user when their response is locked (someone completed their survey)
   */
  static async notifyResponseLocked(
    surveyOwnerId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyId: mongoose.Types.ObjectId,
    respondentId?: mongoose.Types.ObjectId,
    respondentName?: string,
    respondentSurveyId?: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      const message = respondentName 
        ? `${respondentName} responded to your survey "${surveyTitle}". Fill out their survey to register and view this response!`
        : `Someone responded to your survey "${surveyTitle}". Complete other surveys to register and view this response!`;
      
      await Notification.create({
        user_id: surveyOwnerId,
        type: 'response_locked',
        title: '🔒 New Response (Locked)',
        message,
        // Link to respondent's survey (so they can complete it), or their own survey if no respondent survey
        related_survey_id: respondentSurveyId || surveyId,
        related_user_id: respondentId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating response locked notification:', error);
    }
  }

  /**
   * Notify both users when reciprocal exchange is complete
   */
  static async notifyReciprocalComplete(
    user1Id: mongoose.Types.ObjectId,
    user2Id: mongoose.Types.ObjectId,
    user1SurveyTitle: string,
    user2SurveyTitle: string,
    user1SurveyId: mongoose.Types.ObjectId,
    user2SurveyId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      // Notify user 1 - link to their own survey to view the unlocked response
      await Notification.create({
        user_id: user1Id,
        type: 'reciprocal_complete',
        title: '🎉 Response Registered!',
        message: `Your response has been registered! The survey owner completed your survey. Both responses are now unlocked and viewable.`,
        related_survey_id: user1SurveyId, // Their own survey (to view analytics)
        related_user_id: user2Id,
        is_read: false
      });

      // Notify user 2 - link to their own survey to view the unlocked response
      await Notification.create({
        user_id: user2Id,
        type: 'reciprocal_complete',
        title: '🎉 Response Unlocked!',
        message: `You completed the respondent's survey! The response to your survey is now registered and unlocked.`,
        related_survey_id: user2SurveyId, // Their own survey (to view analytics)
        related_user_id: user1Id,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating reciprocal complete notifications:', error);
    }
  }

  /**
   * Notify user when boost is about to expire
   */
  static async notifyBoostExpiring(
    userId: mongoose.Types.ObjectId,
    surveyTitle: string,
    surveyId: mongoose.Types.ObjectId,
    hoursRemaining: number
  ): Promise<void> {
    try {
      await Notification.create({
        user_id: userId,
        type: 'boost_expiring',
        title: '⏰ Boost Expiring Soon',
        message: `Your boost for "${surveyTitle}" expires in ${hoursRemaining} hours!`,
        related_survey_id: surveyId,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating boost expiring notification:', error);
    }
  }
}
