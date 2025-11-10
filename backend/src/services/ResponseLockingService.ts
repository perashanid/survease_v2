import mongoose from 'mongoose';
import { Response, IResponse } from '../models/Response';
import { ResponseUnlock, IResponseUnlock } from '../models/ResponseUnlock';
import { Survey } from '../models/Survey';
import { PointsService } from './PointsService';
import { NotificationService } from './notificationService';

export class ResponseLockingService {
  /**
   * Determine if a response should be locked based on submission source
   */
  static async shouldLockResponse(
    surveyId: mongoose.Types.ObjectId,
    respondentId: mongoose.Types.ObjectId | null,
    sourceType: 'platform' | 'custom_link',
    isAnonymous: boolean
  ): Promise<boolean> {
    // Custom link responses are never locked
    if (sourceType === 'custom_link') {
      return false;
    }
    
    // Platform responses are locked (both anonymous and identified)
    return true;
  }
  
  /**
   * Create a locked response with unlock requirements
   */
  static async createLockedResponse(
    responseData: Partial<IResponse>,
    respondentId: mongoose.Types.ObjectId | null,
    surveyId: mongoose.Types.ObjectId
  ): Promise<IResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get the survey to find the owner
      const survey = await Survey.findById(surveyId).session(session);
      if (!survey) {
        throw new Error('Survey not found');
      }
      
      // Determine unlock requirement
      let unlockRequirement: IResponse['unlock_requirement'];
      
      if (respondentId) {
        // Check if respondent has an active survey
        const respondentSurvey = await Survey.findOne({
          user_id: respondentId,
          is_active: true,
          is_public: true
        }).session(session);
        
        if (respondentSurvey) {
          unlockRequirement = {
            type: 'complete_survey',
            target_survey_id: respondentSurvey._id as mongoose.Types.ObjectId,
            target_user_id: respondentId
          };
        } else {
          unlockRequirement = {
            type: 'complete_any_survey',
            target_user_id: respondentId
          };
        }
      } else {
        // Anonymous response - creator must complete any survey
        unlockRequirement = {
          type: 'complete_any_survey'
        };
      }
      
      // Create the response with locking
      const response = await Response.create([{
        ...responseData,
        is_locked: true,
        lock_reason: 'reciprocal',
        unlock_requirement: unlockRequirement
      }], { session });
      
      // Update survey locked response count
      await Survey.findByIdAndUpdate(
        surveyId,
        { $inc: { locked_response_count: 1 } },
        { session }
      );
      
      // Send notification to survey creator with respondent info
      let respondentName: string | undefined;
      let respondentSurveyId: mongoose.Types.ObjectId | undefined;
      
      if (respondentId) {
        const { User } = await import('../models');
        const respondent = await User.findById(respondentId);
        respondentName = respondent 
          ? `${respondent.first_name || ''} ${respondent.last_name || ''}`.trim() || respondent.email
          : undefined;
        
        // Get respondent's survey ID from unlock requirement
        if (unlockRequirement.type === 'complete_survey' && unlockRequirement.target_survey_id) {
          respondentSurveyId = unlockRequirement.target_survey_id;
        }
      }
      
      await NotificationService.notifyResponseLocked(
        survey.user_id as mongoose.Types.ObjectId,
        survey.title,
        surveyId,
        respondentId || undefined,
        respondentName,
        respondentSurveyId
      );
      
      await session.commitTransaction();
      return response[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get unlock requirements for a specific response
   */
  static async getUnlockRequirements(responseId: mongoose.Types.ObjectId): Promise<any> {
    const response = await Response.findById(responseId)
      .populate('unlock_requirement.target_survey_id', 'title slug')
      .populate('unlock_requirement.target_user_id', 'first_name last_name email')
      .exec();
    
    if (!response) {
      throw new Error('Response not found');
    }
    
    return response.unlock_requirement;
  }
  
  /**
   * Check if survey creator can unlock a response
   */
  static async canUnlockResponse(
    responseId: mongoose.Types.ObjectId,
    creatorId: mongoose.Types.ObjectId,
    completedSurveyId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const response = await Response.findById(responseId);
    
    if (!response) {
      return false;
    }
    
    // Check if response is already unlocked
    if (!response.is_locked) {
      return false;
    }
    
    // Check unlock requirement
    if (response.unlock_requirement?.type === 'complete_survey') {
      // Must complete specific survey
      return response.unlock_requirement.target_survey_id?.equals(completedSurveyId) || false;
    } else if (response.unlock_requirement?.type === 'complete_any_survey') {
      // Can complete any survey
      const completedSurvey = await Survey.findById(completedSurveyId);
      return completedSurvey !== null && completedSurvey.is_active && completedSurvey.is_public;
    }
    
    return false;
  }
  
  /**
   * Unlock a response after reciprocal contribution
   */
  static async unlockResponse(
    responseId: mongoose.Types.ObjectId,
    creatorId: mongoose.Types.ObjectId,
    completedSurveyId: mongoose.Types.ObjectId
  ): Promise<IResponseUnlock> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const response = await Response.findById(responseId).session(session);
      if (!response) {
        throw new Error('Response not found');
      }
      
      // Verify response is locked
      if (!response.is_locked) {
        throw new Error('Response is already unlocked');
      }
      
      // Get the completed survey
      const completedSurvey = await Survey.findById(completedSurveyId).session(session);
      if (!completedSurvey) {
        throw new Error('Completed survey not found');
      }
      
      // Verify creator actually completed the survey
      const completedResponse = await Response.findOne({
        survey_id: completedSurveyId,
        user_id: creatorId
      }).session(session);
      
      if (!completedResponse) {
        throw new Error('You must complete the survey first');
      }
      
      // Calculate points to award to the survey owner whose survey was completed
      const pointsToAward = await PointsService.calculateSurveyCompletionPoints(
        completedSurvey,
        completedSurvey.user_id as mongoose.Types.ObjectId
      );
      
      // Unlock the response
      await Response.findByIdAndUpdate(
        responseId,
        {
          is_locked: false,
          lock_reason: 'none'
        },
        { session }
      );
      
      // Update survey counts
      const survey = await Survey.findById(response.survey_id).session(session);
      if (survey) {
        await Survey.findByIdAndUpdate(
          response.survey_id,
          {
            $inc: {
              locked_response_count: -1,
              unlocked_response_count: 1
            }
          },
          { session }
        );
      }
      
      // Create unlock record
      const unlock = await ResponseUnlock.create([{
        response_id: responseId,
        survey_id: response.survey_id,
        survey_owner_id: creatorId,
        unlocked_by_survey_id: completedSurveyId,
        unlocked_by_survey_owner_id: completedSurvey.user_id,
        points_awarded: pointsToAward
      }], { session });
      
      // Award points to the completed survey owner (if points > 0)
      if (pointsToAward > 0) {
        await PointsService.awardPoints(
          completedSurvey.user_id,
          pointsToAward,
          'response_unlock',
          `Response unlocked by completing your survey "${completedSurvey.title}"`,
          completedSurveyId,
          responseId
        );
      }
      
      // Send reciprocal complete notifications to both users
      if (response.user_id && survey) {
        await NotificationService.notifyReciprocalComplete(
          response.user_id as mongoose.Types.ObjectId,
          creatorId,
          completedSurvey.title,
          survey.title,
          completedSurveyId,
          response.survey_id as mongoose.Types.ObjectId
        );
      } else {
        // Fallback to individual unlock notifications if no respondent ID
        await NotificationService.notifyResponseUnlocked(
          creatorId,
          survey?.title || 'Survey',
          response.survey_id as mongoose.Types.ObjectId
        );
      }
      
      await session.commitTransaction();
      return unlock[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get all locked responses for a survey
   */
  static async getLockedResponses(surveyId: mongoose.Types.ObjectId): Promise<IResponse[]> {
    return await Response.find({
      survey_id: surveyId,
      is_locked: true
    })
      .populate('user_id', 'first_name last_name email')
      .populate('unlock_requirement.target_survey_id', 'title slug')
      .populate('unlock_requirement.target_user_id', 'first_name last_name')
      .sort({ submitted_at: -1 })
      .exec();
  }
  
  /**
   * Get unlock statistics for a survey
   */
  static async getUnlockStatistics(surveyId: mongoose.Types.ObjectId): Promise<{
    total: number;
    locked: number;
    unlocked: number;
    lockRate: number;
  }> {
    const [total, locked] = await Promise.all([
      Response.countDocuments({ survey_id: surveyId }),
      Response.countDocuments({ survey_id: surveyId, is_locked: true })
    ]);
    
    const unlocked = total - locked;
    const lockRate = total > 0 ? (locked / total) * 100 : 0;
    
    return {
      total,
      locked,
      unlocked,
      lockRate
    };
  }
}
