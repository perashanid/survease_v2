import { GoogleGenerativeAI } from '@google/generative-ai';
import { IResponse, ISurvey, ISurveyQuestion, ISummary, IPattern, IRecommendation } from '../models';
import { PatternDetector, Pattern } from './PatternDetector';
import { StatisticsEngine } from './StatisticsEngine';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private patternDetector: PatternDetector;
  private statsEngine: StatisticsEngine;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
    });
    this.patternDetector = new PatternDetector();
    this.statsEngine = new StatisticsEngine();
  }

  /**
   * Generate comprehensive summary of survey results
   */
  async generateSummary(
    survey: ISurvey,
    responses: IResponse[]
  ): Promise<ISummary> {
    if (responses.length === 0) {
      throw new Error('No responses available for analysis');
    }

    // Calculate response statistics
    const completedResponses = responses.filter(r => r.response_data && Object.keys(r.response_data).length > 0);
    const completionRate = (completedResponses.length / responses.length) * 100;
    
    const completionTimes = responses
      .filter(r => r.completion_time && r.completion_time > 0)
      .map(r => r.completion_time!);
    const avgCompletionTime = completionTimes.length > 0 
      ? this.statsEngine.mean(completionTimes) 
      : 0;

    const qualityResponses = responses.filter(r => 
      r.quality_status === 'quality' || 
      r.quality_status === 'manually_overridden' ||
      !r.quality_status
    ).length;
    const lowQualityResponses = responses.filter(r => r.quality_status === 'low_quality').length;

    // Generate question-level insights
    const questionInsights = await this.generateQuestionInsights(survey.questions, responses);

    // Create prompt for AI summary
    const prompt = this.createSummaryPrompt(survey, responses, questionInsights);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const overview = response.text();

      // Extract key findings from the overview
      const keyFindings = this.extractKeyFindings(overview, questionInsights);

      return {
        overview,
        key_findings: keyFindings,
        response_statistics: {
          total_responses: responses.length,
          completion_rate: Math.round(completionRate * 10) / 10,
          average_completion_time: Math.round(avgCompletionTime),
          quality_responses: qualityResponses,
          low_quality_responses: lowQualityResponses
        },
        question_insights: questionInsights
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate AI summary');
    }
  }

  /**
   * Detect patterns in survey data
   */
  async detectPatterns(
    survey: ISurvey,
    responses: IResponse[]
  ): Promise<IPattern[]> {
    if (responses.length < 10) {
      return [];
    }

    const patterns: IPattern[] = [];

    try {
      // Find correlations
      const correlations = await this.patternDetector.findCorrelations(responses, survey.questions);
      patterns.push(...correlations.map(p => ({
        type: p.type as 'correlation',
        description: p.description,
        confidence: Math.round(p.confidence),
        supporting_data: p.supporting_data,
        statistical_significance: Math.round(p.statistical_significance)
      })));

      // Analyze trends
      const trends = await this.patternDetector.analyzeTrends(responses, survey.questions);
      patterns.push(...trends.map(p => ({
        type: p.type as 'temporal',
        description: p.description,
        confidence: Math.round(p.confidence),
        supporting_data: p.supporting_data,
        statistical_significance: Math.round(p.statistical_significance)
      })));

      // Analyze demographics
      const demographics = await this.patternDetector.analyzeDemographics(responses, survey.questions);
      patterns.push(...demographics.map(p => ({
        type: p.type as 'demographic',
        description: p.description,
        confidence: Math.round(p.confidence),
        supporting_data: p.supporting_data,
        statistical_significance: Math.round(p.statistical_significance)
      })));

      // Detect anomalies
      const anomalies = await this.patternDetector.detectAnomalies(responses, survey.questions);
      patterns.push(...anomalies.map(p => ({
        type: p.type as 'anomaly',
        description: p.description,
        confidence: Math.round(p.confidence),
        supporting_data: p.supporting_data,
        statistical_significance: Math.round(p.statistical_significance)
      })));

      // Enhance pattern descriptions with AI
      if (patterns.length > 0) {
        await this.enhancePatternDescriptions(patterns, survey);
      }

      return patterns.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error detecting patterns:', error);
      return [];
    }
  }

  /**
   * Generate research recommendations
   */
  async generateRecommendations(
    survey: ISurvey,
    patterns: IPattern[],
    summary: ISummary
  ): Promise<IRecommendation[]> {
    if (patterns.length === 0 && summary.response_statistics.total_responses < 10) {
      return [];
    }

    const prompt = this.createRecommendationsPrompt(survey, patterns, summary);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse recommendations from AI response
      const recommendations = this.parseRecommendations(text);

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.generateFallbackRecommendations(patterns, summary);
    }
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(pattern: IPattern, sampleSize: number): number {
    const baseConfidence = pattern.confidence;
    const sampleFactor = Math.min(1, Math.log10(sampleSize) / 2);
    const significanceFactor = pattern.statistical_significance / 100;

    return Math.min(100, Math.round(baseConfidence * sampleFactor * significanceFactor));
  }

  /**
   * Generate question-level insights
   */
  private async generateQuestionInsights(
    questions: ISurveyQuestion[],
    responses: IResponse[]
  ): Promise<any[]> {
    const insights = [];

    for (const question of questions) {
      const questionId = question._id?.toString() || '';
      const responseValues = responses
        .map(r => r.response_data[questionId])
        .filter(v => v !== undefined && v !== null && v !== '');

      if (responseValues.length === 0) continue;

      const distribution = this.calculateDistribution(question, responseValues);
      const insight = this.generateQuestionInsight(question, distribution, responseValues.length);

      insights.push({
        question_id: questionId,
        question_text: question.text,
        insight,
        response_distribution: distribution
      });
    }

    return insights;
  }

  /**
   * Calculate response distribution for a question
   */
  private calculateDistribution(question: ISurveyQuestion, values: any[]): any {
    if (['multiple_choice', 'checkbox', 'dropdown'].includes(question.type)) {
      const counts: { [key: string]: number } = {};
      values.forEach(v => {
        if (Array.isArray(v)) {
          v.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
          });
        } else {
          counts[v] = (counts[v] || 0) + 1;
        }
      });
      return counts;
    } else if (['rating', 'scale', 'number'].includes(question.type)) {
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        return {
          mean: this.statsEngine.mean(numericValues),
          median: this.statsEngine.median(numericValues),
          std_dev: this.statsEngine.standardDeviation(numericValues),
          min: Math.min(...numericValues),
          max: Math.max(...numericValues)
        };
      }
    }
    return { total_responses: values.length };
  }

  /**
   * Generate insight for a single question
   */
  private generateQuestionInsight(question: ISurveyQuestion, distribution: any, responseCount: number): string {
    if (['multiple_choice', 'dropdown'].includes(question.type)) {
      const entries = Object.entries(distribution).sort((a: any, b: any) => b[1] - a[1]);
      if (entries.length > 0) {
        const topChoice = entries[0];
        const percentage = ((topChoice[1] as number / responseCount) * 100).toFixed(1);
        return `Most respondents (${percentage}%) selected "${topChoice[0]}".`;
      }
    } else if (question.type === 'rating' || question.type === 'scale') {
      const mean = distribution.mean?.toFixed(1);
      return `Average rating: ${mean} out of ${question.options?.length || 5}.`;
    } else if (question.type === 'text' || question.type === 'textarea') {
      return `Received ${responseCount} text responses.`;
    }
    return `${responseCount} responses collected.`;
  }

  /**
   * Create prompt for AI summary generation
   */
  private createSummaryPrompt(survey: ISurvey, responses: IResponse[], questionInsights: any[]): string {
    return `You are an expert research analyst. Analyze this survey data and provide a comprehensive summary.

Survey Title: ${survey.title}
Survey Description: ${survey.description || 'No description provided'}
Total Responses: ${responses.length}

Question Insights:
${questionInsights.map(qi => `- ${qi.question_text}: ${qi.insight}`).join('\n')}

Please provide a comprehensive overview (2-3 paragraphs) that:
1. Summarizes the main findings from the survey
2. Highlights the most significant patterns or trends
3. Provides context about response quality and participation
4. Offers initial observations about the data

Keep the tone professional and research-oriented. Focus on actionable insights.`;
  }

  /**
   * Extract key findings from overview
   */
  private extractKeyFindings(overview: string, questionInsights: any[]): string[] {
    const findings: string[] = [];

    // Extract sentences that seem like key findings
    const sentences = overview.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Add top insights from questions
    questionInsights.slice(0, 3).forEach(qi => {
      findings.push(`${qi.question_text}: ${qi.insight}`);
    });

    // Add some sentences from overview
    sentences.slice(0, 2).forEach(s => {
      if (s.trim()) findings.push(s.trim());
    });

    return findings.slice(0, 5);
  }

  /**
   * Enhance pattern descriptions with AI
   */
  private async enhancePatternDescriptions(patterns: IPattern[], survey: ISurvey): Promise<void> {
    // For now, keep the statistical descriptions
    // In future, could enhance with AI-generated natural language
  }

  /**
   * Create prompt for recommendations
   */
  private createRecommendationsPrompt(survey: ISurvey, patterns: IPattern[], summary: ISummary): string {
    return `You are an expert research advisor. Based on this survey analysis, provide actionable research recommendations.

Survey: ${survey.title}
Total Responses: ${summary.response_statistics.total_responses}

Detected Patterns:
${patterns.map(p => `- ${p.type}: ${p.description} (confidence: ${p.confidence}%)`).join('\n')}

Key Findings:
${summary.key_findings.join('\n')}

Please provide 3-5 specific, actionable recommendations for the researcher. For each recommendation:
1. Give it a clear title
2. Explain what to investigate and why
3. Suggest specific follow-up questions or analyses
4. Indicate priority level (high/medium/low)

Format each recommendation as:
TITLE: [recommendation title]
PRIORITY: [high/medium/low]
DESCRIPTION: [detailed description]
ACTIONS: [specific suggested actions, separated by semicolons]
---`;
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(text: string): IRecommendation[] {
    const recommendations: IRecommendation[] = [];
    const blocks = text.split('---').filter(b => b.trim());

    for (const block of blocks) {
      const titleMatch = block.match(/TITLE:\s*(.+)/i);
      const priorityMatch = block.match(/PRIORITY:\s*(high|medium|low)/i);
      const descMatch = block.match(/DESCRIPTION:\s*(.+?)(?=ACTIONS:|$)/is);
      const actionsMatch = block.match(/ACTIONS:\s*(.+)/is);

      if (titleMatch && descMatch) {
        recommendations.push({
          title: titleMatch[1].trim(),
          priority: (priorityMatch?.[1].toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
          description: descMatch[1].trim(),
          reasoning: descMatch[1].trim(),
          suggested_actions: actionsMatch 
            ? actionsMatch[1].split(';').map(a => a.trim()).filter(a => a)
            : []
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate fallback recommendations if AI fails
   */
  private generateFallbackRecommendations(patterns: IPattern[], summary: ISummary): IRecommendation[] {
    const recommendations: IRecommendation[] = [];

    if (patterns.length > 0) {
      const topPattern = patterns[0];
      recommendations.push({
        title: 'Investigate Primary Pattern',
        priority: 'high',
        description: `Further investigate the ${topPattern.type} pattern identified in the data.`,
        reasoning: topPattern.description,
        suggested_actions: [
          'Collect additional data to confirm the pattern',
          'Conduct follow-up interviews with respondents',
          'Design targeted questions for deeper analysis'
        ]
      });
    }

    if (summary.response_statistics.low_quality_responses > 0) {
      recommendations.push({
        title: 'Review Data Quality',
        priority: 'medium',
        description: 'Review and address low-quality responses to improve data reliability.',
        reasoning: `${summary.response_statistics.low_quality_responses} responses were flagged as low quality.`,
        suggested_actions: [
          'Review flagged responses manually',
          'Adjust quality thresholds if needed',
          'Consider additional validation questions'
        ]
      });
    }

    recommendations.push({
      title: 'Expand Sample Size',
      priority: 'medium',
      description: 'Increase the number of responses to improve statistical confidence.',
      reasoning: 'Larger sample sizes provide more reliable insights and stronger statistical significance.',
      suggested_actions: [
        'Share survey with additional target audiences',
        'Extend data collection period',
        'Consider incentives for participation'
      ]
    });

    return recommendations;
  }
}
