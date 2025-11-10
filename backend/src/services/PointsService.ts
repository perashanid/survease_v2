import mongoose from 'mongoose';
import { UserPoints, IUserPoints } from '../models/UserPoints';
import { PointsTransaction, IPointsTransaction } from '../models/PointsTransaction';
import { ISurvey } from '../models/Survey';

export class PointsService {
  private static readonly BASE_POINTS = 10;
  
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
    const WELCOME_BONUS = 100;
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
   */
  static calculateSurveyCompletionPoints(survey: ISurvey, isBoosted: boolean = false): number {
    let points = this.BASE_POINTS;
    
    // Add bonus points if survey is boosted
    if (isBoosted && survey.boost_config?.bonus_points) {
      points += survey.boost_config.bonus_points;
    }
    
    return points;
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
