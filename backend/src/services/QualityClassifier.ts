import { Response, IResponse, QualityRule, IQualityRule, QualityAuditLog } from '../models';
import mongoose from 'mongoose';

export interface ClassificationResult {
  total_classified: number;
  flagged_count: number;
  quality_count: number;
}

export class QualityClassifier {
  /**
   * Classify responses based on quality rules
   */
  async classifyResponses(
    surveyId: string,
    rules: IQualityRule
  ): Promise<ClassificationResult> {
    const responses = await Response.find({ 
      survey_id: new mongoose.Types.ObjectId(surveyId)
    });

    let flaggedCount = 0;
    let qualityCount = 0;

    for (const response of responses) {
      // Skip if already manually overridden
      if (response.quality_status === 'manually_overridden') {
        continue;
      }

      const completionTime = response.completion_time || 0;
      const previousStatus = response.quality_status || 'quality';
      let newStatus: 'quality' | 'low_quality' = 'quality';

      // Check completion time threshold
      if (completionTime > 0 && completionTime < rules.min_completion_time) {
        newStatus = 'low_quality';
        flaggedCount++;

        // Add quality flag if not already present
        const hasFlag = response.quality_flags?.some(f => f.flag_type === 'completion_time');
        if (!hasFlag) {
          if (!response.quality_flags) {
            response.quality_flags = [];
          }
          response.quality_flags.push({
            flag_type: 'completion_time',
            flagged_at: new Date(),
            threshold_value: rules.min_completion_time
          });
        }

        // Create audit log if status changed
        if (previousStatus !== newStatus) {
          await QualityAuditLog.create({
            response_id: response._id,
            survey_id: response.survey_id,
            user_id: rules.user_id,
            action: 'flagged',
            previous_status: previousStatus,
            new_status: newStatus,
            completion_time: completionTime,
            threshold_at_time: rules.min_completion_time
          });
        }
      } else {
        qualityCount++;
      }

      response.quality_status = newStatus;
      await response.save();
    }

    // Update statistics in quality rules
    rules.total_flagged = flaggedCount;
    await rules.save();

    return {
      total_classified: responses.length,
      flagged_count: flaggedCount,
      quality_count: qualityCount
    };
  }

  /**
   * Override quality classification manually
   */
  async overrideClassification(
    responseId: string,
    userId: string,
    newStatus: 'quality' | 'low_quality',
    reason?: string
  ): Promise<void> {
    const response = await Response.findById(responseId);
    if (!response) {
      throw new Error('Response not found');
    }

    const previousStatus = response.quality_status || 'quality';

    // Update response
    response.quality_status = 'manually_overridden';
    response.manual_override = {
      overridden_by: new mongoose.Types.ObjectId(userId),
      overridden_at: new Date(),
      reason
    };
    await response.save();

    // Create audit log
    await QualityAuditLog.create({
      response_id: response._id,
      survey_id: response.survey_id,
      user_id: new mongoose.Types.ObjectId(userId),
      action: 'overridden',
      previous_status: previousStatus as 'quality' | 'low_quality',
      new_status: newStatus,
      reason,
      completion_time: response.completion_time || 0,
      threshold_at_time: 0
    });

    // Update quality rule statistics
    const rule = await QualityRule.findOne({ survey_id: response.survey_id });
    if (rule) {
      rule.total_overridden = (rule.total_overridden || 0) + 1;
      await rule.save();
    }
  }

  /**
   * Get quality-filtered responses
   */
  async getQualityFilteredResponses(
    surveyId: string,
    includeQuality: boolean = true,
    includeLowQuality: boolean = false
  ): Promise<IResponse[]> {
    const filter: any = { survey_id: new mongoose.Types.ObjectId(surveyId) };

    if (!includeQuality && !includeLowQuality) {
      return [];
    }

    if (includeQuality && !includeLowQuality) {
      filter.$or = [
        { quality_status: 'quality' },
        { quality_status: 'manually_overridden' },
        { quality_status: { $exists: false } }
      ];
    } else if (!includeQuality && includeLowQuality) {
      filter.quality_status = 'low_quality';
    }
    // If both are true, return all responses (no additional filter needed)

    return await Response.find(filter).sort({ submitted_at: -1 });
  }

  /**
   * Get flagged responses
   */
  async getFlaggedResponses(surveyId: string): Promise<IResponse[]> {
    return await Response.find({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      quality_status: 'low_quality'
    }).sort({ submitted_at: -1 });
  }

  /**
   * Update quality rules
   */
  async updateQualityRules(
    surveyId: string,
    userId: string,
    updates: Partial<IQualityRule>
  ): Promise<IQualityRule> {
    // Validate min_completion_time
    if (updates.min_completion_time !== undefined) {
      if (updates.min_completion_time < 5 || updates.min_completion_time > 3600) {
        throw new Error('Minimum completion time must be between 5 and 3600 seconds');
      }
    }

    let rule = await QualityRule.findOne({ survey_id: new mongoose.Types.ObjectId(surveyId) });

    if (!rule) {
      // Create new rule
      rule = await QualityRule.create({
        survey_id: new mongoose.Types.ObjectId(surveyId),
        user_id: new mongoose.Types.ObjectId(userId),
        min_completion_time: updates.min_completion_time || 30,
        total_flagged: 0,
        total_overridden: 0
      });
    } else {
      // Update existing rule
      if (updates.min_completion_time !== undefined) {
        rule.min_completion_time = updates.min_completion_time;
      }
      if (updates.custom_rules !== undefined) {
        rule.custom_rules = updates.custom_rules;
      }
      await rule.save();
    }

    // Re-classify responses with new rules
    await this.classifyResponses(surveyId, rule);

    return rule;
  }

  /**
   * Get quality rules for a survey
   */
  async getQualityRules(surveyId: string): Promise<IQualityRule | null> {
    return await QualityRule.findOne({ survey_id: new mongoose.Types.ObjectId(surveyId) });
  }

  /**
   * Get audit log for a survey
   */
  async getAuditLog(surveyId: string, limit: number = 100): Promise<any[]> {
    return await QualityAuditLog.find({ 
      survey_id: new mongoose.Types.ObjectId(surveyId) 
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user_id', 'name email')
    .populate('response_id');
  }
}
