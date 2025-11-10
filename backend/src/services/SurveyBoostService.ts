import mongoose from 'mongoose';
import { Survey, ISurvey } from '../models/Survey';

export class SurveyBoostService {
  /**
   * Boost a survey with bonus points
   */
  static async boostSurvey(
    surveyId: mongoose.Types.ObjectId,
    bonusPoints: number,
    durationDays?: number
  ): Promise<ISurvey> {
    const boostedUntil = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : undefined;
    
    const survey = await Survey.findByIdAndUpdate(
      surveyId,
      {
        is_boosted: true,
        boost_config: {
          bonus_points: bonusPoints,
          boosted_at: new Date(),
          boosted_until: boostedUntil
        }
      },
      { new: true }
    );
    
    if (!survey) {
      throw new Error('Survey not found');
    }
    
    return survey;
  }
  
  /**
   * Remove boost from a survey
   */
  static async unboostSurvey(surveyId: mongoose.Types.ObjectId): Promise<ISurvey> {
    const survey = await Survey.findByIdAndUpdate(
      surveyId,
      {
        is_boosted: false,
        $unset: { boost_config: 1 }
      },
      { new: true }
    );
    
    if (!survey) {
      throw new Error('Survey not found');
    }
    
    return survey;
  }
  
  /**
   * Get all boosted surveys
   */
  static async getBoostedSurveys(
    page: number = 1,
    limit: number = 20
  ): Promise<{ surveys: ISurvey[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    // Filter out expired boosts
    const now = new Date();
    const query = {
      is_boosted: true,
      is_active: true,
      is_public: true,
      $or: [
        { 'boost_config.boosted_until': { $exists: false } },
        { 'boost_config.boosted_until': { $gte: now } }
      ]
    };
    
    const [surveys, total] = await Promise.all([
      Survey.find(query)
        .sort({ 'boost_config.bonus_points': -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'first_name last_name email')
        .exec(),
      Survey.countDocuments(query)
    ]);
    
    return {
      surveys,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Check if survey boost is still active
   */
  static async isBoostActive(surveyId: mongoose.Types.ObjectId): Promise<boolean> {
    const survey = await Survey.findById(surveyId);
    
    if (!survey || !survey.is_boosted) {
      return false;
    }
    
    // Check if boost has expired
    if (survey.boost_config?.boosted_until) {
      return survey.boost_config.boosted_until > new Date();
    }
    
    return true;
  }
  
  /**
   * Auto-expire boosted surveys (should be run periodically)
   */
  static async expireBoosts(): Promise<number> {
    const now = new Date();
    
    const result = await Survey.updateMany(
      {
        is_boosted: true,
        'boost_config.boosted_until': { $lt: now }
      },
      {
        is_boosted: false,
        $unset: { boost_config: 1 }
      }
    );
    
    return result.modifiedCount;
  }
}
