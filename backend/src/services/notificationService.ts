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
}
