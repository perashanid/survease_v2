import { Response, Survey } from '../models';
import mongoose from 'mongoose';

export interface AttentionIssue {
  type: 'low_completion' | 'no_responses' | 'high_dropoff' | 'slow_response';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface SurveyAttentionItem {
  surveyId: string;
  title: string;
  attentionScore: number;
  issues: AttentionIssue[];
  recommendations: string[];
}

export class AttentionScoreService {
  /**
   * Calculate attention score for a survey (0-100, higher = more attention needed)
   */
  async calculateAttentionScore(surveyId: string): Promise<number> {
    const issues = await this.identifyIssues(surveyId);
    
    // Weight issues by severity
    const severityWeights = { high: 40, medium: 25, low: 10 };
    let score = 0;

    for (const issue of issues) {
      score += severityWeights[issue.severity];
    }

    return Math.min(100, score);
  }

  /**
   * Identify issues requiring attention
   */
  async identifyIssues(surveyId: string): Promise<AttentionIssue[]> {
    const issues: AttentionIssue[] = [];

    // Get survey and responses
    const survey = await Survey.findById(surveyId);
    if (!survey) return issues;

    const responses = await Response.find({ survey_id: new mongoose.Types.ObjectId(surveyId) });
    const totalResponses = responses.length;

    // Check 1: Low completion rate
    if (totalResponses > 0) {
      const totalQuestions = survey.configuration?.questions?.length || 0;
      let totalCompletedQuestions = 0;

      for (const response of responses) {
        const responseData = response.response_data?.responses || response.response_data;
        if (responseData) {
          totalCompletedQuestions += Object.keys(responseData).length;
        }
      }

      const completionRate = totalQuestions > 0
        ? (totalCompletedQuestions / (totalQuestions * totalResponses)) * 100
        : 0;

      if (completionRate < 50) {
        issues.push({
          type: 'low_completion',
          severity: 'high',
          message: `Survey has a low completion rate of ${completionRate.toFixed(1)}%`
        });
      } else if (completionRate < 70) {
        issues.push({
          type: 'low_completion',
          severity: 'medium',
          message: `Survey completion rate is ${completionRate.toFixed(1)}%, which could be improved`
        });
      }
    }

    // Check 2: No recent responses
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentResponses = await Response.countDocuments({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      submitted_at: { $gte: sevenDaysAgo }
    });

    if (totalResponses > 0 && recentResponses === 0) {
      issues.push({
        type: 'no_responses',
        severity: 'high',
        message: 'No responses received in the last 7 days'
      });
    } else if (recentResponses < 5 && totalResponses > 10) {
      issues.push({
        type: 'slow_response',
        severity: 'medium',
        message: 'Response rate has slowed down significantly'
      });
    }

    // Check 3: High drop-off rates
    if (totalResponses > 5 && survey.configuration?.questions && survey.configuration.questions.length > 1) {
      const questions = survey.configuration.questions;
      
      for (let i = 0; i < questions.length - 1; i++) {
        const currentQ = questions[i];
        const nextQ = questions[i + 1];
        
        const currentQId = currentQ.id;
        const nextQId = nextQ.id;

        let currentCount = 0;
        let nextCount = 0;

        for (const response of responses) {
          const responseData = response.response_data?.responses || response.response_data;
          if (responseData) {
            if (responseData[currentQId] !== undefined) currentCount++;
            if (responseData[nextQId] !== undefined) nextCount++;
          }
        }

        if (currentCount > 0) {
          const dropoffRate = ((currentCount - nextCount) / currentCount) * 100;
          
          if (dropoffRate > 30) {
            issues.push({
              type: 'high_dropoff',
              severity: 'high',
              message: `High drop-off rate (${dropoffRate.toFixed(1)}%) at question ${i + 2}`
            });
            break; // Only report the first major drop-off
          }
        }
      }
    }

    return issues;
  }

  /**
   * Generate recommendations for improvement
   */
  async generateRecommendations(
    surveyId: string,
    issues: AttentionIssue[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'low_completion':
          recommendations.push('Consider shortening the survey or making questions optional');
          recommendations.push('Review question clarity and simplify complex questions');
          break;
        case 'no_responses':
          recommendations.push('Increase survey promotion and distribution');
          recommendations.push('Check if the survey link is still accessible');
          recommendations.push('Consider offering incentives for participation');
          break;
        case 'high_dropoff':
          recommendations.push('Review the question where users are dropping off');
          recommendations.push('Consider reordering questions to put easier ones first');
          recommendations.push('Make the problematic question optional or simplify it');
          break;
        case 'slow_response':
          recommendations.push('Send reminder emails to potential respondents');
          recommendations.push('Refresh your distribution channels');
          break;
      }
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Get all surveys needing attention for a user
   */
  async getSurveysNeedingAttention(
    userId: string,
    threshold: number = 30
  ): Promise<SurveyAttentionItem[]> {
    const surveys = await Survey.find({ user_id: new mongoose.Types.ObjectId(userId) });
    const attentionItems: SurveyAttentionItem[] = [];

    for (const survey of surveys) {
      const surveyId = (survey._id as mongoose.Types.ObjectId).toString();
      const attentionScore = await this.calculateAttentionScore(surveyId);

      if (attentionScore >= threshold) {
        const issues = await this.identifyIssues(surveyId);
        const recommendations = await this.generateRecommendations(surveyId, issues);

        attentionItems.push({
          surveyId,
          title: survey.title,
          attentionScore,
          issues,
          recommendations
        });
      }
    }

    // Sort by attention score (highest first)
    return attentionItems.sort((a, b) => b.attentionScore - a.attentionScore);
  }
}
