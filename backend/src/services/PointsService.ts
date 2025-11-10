import mongoose from 'mongoose';
import { UserPoints, IUserPoints } from '../models/UserPoints';
import { PointsTransaction, IPointsTransaction } from '../models/PointsTransaction';
import { ISurvey } from '../models/Survey';
import { POINTS_REWARDS } from '../constants/points';

export class PointsService {
  private static readonly BASE_POINTS = POINTS_REWARDS.BASE_SURVEY_COMPLETION;
  
  /**
   * Award points to a user
   */
  static async awardPoints(
    userId: mongoose.Types.ObjectId,
    points: number,
    source: 'survey_completion' | 'response_unlock' | 'boost_bonus',
    description: string,
    relatedSurveyId?: mongoose.Types.ObjectId,
    relatedResponseId?: mongoose.Types.ObjectId
  ): Promise<IPointsTransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create transaction record
      const transaction = await PointsTransaction.create([{
        user_id: userId,
        transaction_type: 'earned',
        points,
        source,
        related_survey_id: relatedSurveyId,
        related_response_id: relatedResponseId,
        description
      }], { session });
      
      // Update or create user points
      const userPoints = await UserPoints.findOneAndUpdate(
        { user_id: userId },
        {
          $inc: {
            total_points: points,
            lifetime_points: points
          },
          $set: {
            last_updated: new Date()
          }
        },
        {
          upsert: true,
          new: true,
          session
        }
      );
      
      console.log(`[PointsService] Updated user ${userId} points. New total: ${userPoints.total_points}`);
      
      await session.commitTransaction();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get user's current point balance
   */
  static async getUserPoints(userId: mongoose.Types.ObjectId): Promise<IUserPoints> {
    const userPoints = await UserPoints.findOne({ user_id: userId });
    
    if (!userPoints) {
      // Create initial points record with welcome bonus
      return await this.initializeUserPoints(userId);
    }
    
    return userPoints;
  }
  
  /**
   * Initialize new user with welcome bonus
   */
  static async initializeUserPoints(userId: mongoose.Types.ObjectId): Promise<IUserPoints> {
    const WELCOME_BONUS = POINTS_REWARDS.WELCOME_BONUS;
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create user points record with welcome bonus
      const userPointsArray = await UserPoints.create([{
        user_id: userId,
        total_points: WELCOME_BONUS,
        lifetime_points: WELCOME_BONUS,
        points_spent: 0
      }], { session });
      
      // Create transaction record for welcome bonus
      await PointsTransaction.create([{
        user_id: userId,
        transaction_type: 'earned',
        points: WELCOME_BONUS,
        source: 'survey_completion',
        description: '🎉 Welcome bonus! Start exploring surveys and earning more points.'
      }], { session });
      
      await session.commitTransaction();
      return userPointsArray[0] as IUserPoints;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get user's points transaction history
   */
  static async getPointsHistory(
    userId: mongoose.Types.ObjectId,
    limit: number = 50
  ): Promise<IPointsTransaction[]> {
    return await PointsTransaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('related_survey_id', 'title slug')
      .exec();
  }
  
  /**
   * Calculate points for survey completion
   * @param survey - The survey being completed
   * @param userId - The user completing the survey
   * @returns Points to award
   */
  static async calculateSurveyCompletionPoints(
    survey: ISurvey,
    userId: mongoose.Types.ObjectId
  ): Promise<number> {
    // Everyone gets base points for completing a survey
    let points = this.BASE_POINTS;
    console.log(`[PointsService] Base points: ${points}`);
    
    // Featured survey bonus
    if (survey.is_featured) {
      points += POINTS_REWARDS.FEATURED_SURVEY_BONUS;
      console.log(`[PointsService] Featured bonus: +${POINTS_REWARDS.FEATURED_SURVEY_BONUS}, total: ${points}`);
    }
    
    // Boosted survey bonus (applies to everyone)
    if (survey.is_boosted && survey.boost_config?.bonus_points) {
      points += survey.boost_config.bonus_points;
      console.log(`[PointsService] Boost bonus: +${survey.boost_config.bonus_points}, total: ${points}`);
    }
    
    console.log(`[PointsService] Final calculated points: ${points}`);
    return points;
  }
  
  /**
   * Deduct points from a user
   */
  static async deductPoints(
    userId: mongoose.Types.ObjectId,
    points: number,
    source: 'survey_creation' | 'boost_survey' | 'unlock_response',
    description: string,
    relatedSurveyId?: mongoose.Types.ObjectId
  ): Promise<IPointsTransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get current user points
      const userPoints = await UserPoints.findOne({ user_id: userId }).session(session);
      
      if (!userPoints) {
        throw new Error('User points record not found');
      }
      
      // Check if user has enough points
      if (userPoints.total_points < points) {
        throw new Error(`Insufficient points. You have ${userPoints.total_points} points but need ${points}.`);
      }
      
      // Create transaction record
      const transaction = await PointsTransaction.create([{
        user_id: userId,
        transaction_type: 'spent',
        points: -points, // Negative for spent points
        source,
        related_survey_id: relatedSurveyId,
        description
      }], { session });
      
      // Update user points
      const updatedUserPoints = await UserPoints.findOneAndUpdate(
        { user_id: userId },
        {
          $inc: {
            total_points: -points,
            points_spent: points
          },
          $set: {
            last_updated: new Date()
          }
        },
        {
          new: true,
          session
        }
      );
      
      console.log(`[PointsService] Deducted ${points} points from user ${userId}. New total: ${updatedUserPoints?.total_points}`);
      
      await session.commitTransaction();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get leaderboard (top users by points)
   */
  static async getLeaderboard(limit: number = 10): Promise<Array<IUserPoints & { user: any }>> {
    return await UserPoints.find()
      .sort({ total_points: -1 })
      .limit(limit)
      .populate('user_id', 'first_name last_name email')
      .exec() as any;
  }
}
