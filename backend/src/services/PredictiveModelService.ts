import { Response, Survey } from '../models';
import mongoose from 'mongoose';

export interface PredictionInput {
  demographics?: Record<string, any>;
  previousAnswers?: Record<string, any>;
  timeOfDay?: number;
  dayOfWeek?: number;
  deviceType?: string;
}

export interface PredictionResult {
  questionId: string;
  questionText: string;
  predictedResponse: any;
  confidence: number;
  alternatives: Array<{ value: any; probability: number }>;
  reasoning: string;
}

export interface ScenarioAnalysis {
  scenario: string;
  predictions: PredictionResult[];
  overallConfidence: number;
  insights: string[];
}

export class PredictiveModelService {
  /**
   * Predict response for a specific question based on historical data
   */
  async predictResponse(
    surveyId: string,
    questionId: string,
    input: PredictionInput
  ): Promise<PredictionResult> {
    try {
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      const question = (survey as any).configuration?.questions?.find(
        (q: any) => q.id === questionId
      );
      if (!question) {
        throw new Error('Question not found');
      }

      // Get historical responses
      const responses = await Response.find({
        survey_id: new mongoose.Types.ObjectId(surveyId)
      }).lean();

      if (responses.length === 0) {
        return {
          questionId,
          questionText: question.question,
          predictedResponse: null,
          confidence: 0,
          alternatives: [],
          reasoning: 'No historical data available for prediction'
        };
      }

      // Filter responses based on similar characteristics
      const similarResponses = this.filterSimilarResponses(responses, input);

      // Analyze patterns based on question type
      const prediction = this.analyzePatternsForQuestion(
        question,
        similarResponses,
        input
      );

      return {
        questionId,
        questionText: question.question,
        ...prediction
      };
    } catch (error) {
      console.error('Error predicting response:', error);
      throw error;
    }
  }

  /**
   * Predict all responses for a survey based on input characteristics
   */
  async predictSurveyResponses(
    surveyId: string,
    input: PredictionInput
  ): Promise<PredictionResult[]> {
    try {
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      const questions = (survey as any).configuration?.questions || [];
      const predictions: PredictionResult[] = [];

      for (const question of questions) {
        const prediction = await this.predictResponse(surveyId, question.id, {
          ...input,
          previousAnswers: predictions.reduce((acc, p) => {
            acc[p.questionId] = p.predictedResponse;
            return acc;
          }, {} as Record<string, any>)
        });
        predictions.push(prediction);
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting survey responses:', error);
      throw error;
    }
  }

  /**
   * Analyze different scenarios and predict outcomes
   */
  async analyzeScenarios(
    surveyId: string,
    scenarios: Array<{ name: string; input: PredictionInput }>
  ): Promise<ScenarioAnalysis[]> {
    const results: ScenarioAnalysis[] = [];

    for (const scenario of scenarios) {
      const predictions = await this.predictSurveyResponses(surveyId, scenario.input);
      
      const overallConfidence =
        predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

      const insights = this.generateScenarioInsights(predictions, scenario.input);

      results.push({
        scenario: scenario.name,
        predictions,
        overallConfidence,
        insights
      });
    }

    return results;
  }

  /**
   * Predict completion likelihood based on partial responses
   */
  async predictCompletionLikelihood(
    surveyId: string,
    partialResponses: Record<string, any>,
    demographics?: Record<string, any>
  ): Promise<{ likelihood: number; factors: string[]; recommendations: string[] }> {
    try {
      const responses = await Response.find({
        survey_id: new mongoose.Types.ObjectId(surveyId)
      }).lean();

      if (responses.length === 0) {
        return {
          likelihood: 0.5,
          factors: ['Insufficient historical data'],
          recommendations: ['Collect more responses to improve prediction accuracy']
        };
      }

      // Check if response has all questions answered (is complete)
      const surveyData = await Survey.findById(surveyId);
      const totalQuestionsCount = (surveyData as any)?.configuration?.questions?.length || 1;
      
      const completedResponses = responses.filter(r => {
        const responseData = r.response_data?.responses || r.response_data;
        if (!responseData) return false;
        const answeredQuestions = Object.keys(responseData).length;
        return answeredQuestions >= totalQuestionsCount;
      });
      const completionRate = completedResponses.length / responses.length;

      // Analyze patterns in completed vs incomplete responses
      const answeredQuestions = Object.keys(partialResponses).length;
      const progressRate = answeredQuestions / totalQuestionsCount;

      // Calculate likelihood based on multiple factors
      let likelihood = completionRate * 0.4 + progressRate * 0.6;

      const factors: string[] = [];
      const recommendations: string[] = [];

      // Analyze time-based patterns
      if (demographics?.timeOfDay !== undefined) {
        const hourlyCompletionRates = this.calculateHourlyCompletionRates(responses);
        const hourRate = hourlyCompletionRates[demographics.timeOfDay] || completionRate;
        likelihood = likelihood * 0.7 + hourRate * 0.3;
        factors.push(`Time of day factor: ${(hourRate * 100).toFixed(1)}% completion rate`);
      }

      // Analyze device-based patterns
      if (demographics?.deviceType) {
        const deviceCompletionRates = this.calculateDeviceCompletionRates(responses);
        const deviceRate = deviceCompletionRates[demographics.deviceType] || completionRate;
        likelihood = likelihood * 0.8 + deviceRate * 0.2;
        factors.push(`Device type factor: ${demographics.deviceType} users complete ${(deviceRate * 100).toFixed(1)}% of surveys`);
      }

      // Generate recommendations
      if (likelihood < 0.5) {
        recommendations.push('Consider simplifying remaining questions');
        recommendations.push('Add progress indicator to motivate completion');
        recommendations.push('Reduce number of remaining questions if possible');
      } else if (likelihood < 0.7) {
        recommendations.push('User is moderately likely to complete - maintain engagement');
        recommendations.push('Consider adding a motivational message');
      } else {
        recommendations.push('User is highly likely to complete the survey');
        recommendations.push('Maintain current survey flow');
      }

      factors.push(`Overall progress: ${(progressRate * 100).toFixed(1)}%`);
      factors.push(`Historical completion rate: ${(completionRate * 100).toFixed(1)}%`);

      return {
        likelihood: Math.max(0, Math.min(1, likelihood)),
        factors,
        recommendations
      };
    } catch (error) {
      console.error('Error predicting completion likelihood:', error);
      throw error;
    }
  }

  /**
   * Filter responses similar to input characteristics
   */
  private filterSimilarResponses(
    responses: any[],
    input: PredictionInput
  ): any[] {
    return responses.filter(response => {
      let similarity = 0;
      let factors = 0;

      // Match time of day (within 2 hours)
      if (input.timeOfDay !== undefined && response.submitted_at) {
        const responseHour = new Date(response.submitted_at).getHours();
        if (Math.abs(responseHour - input.timeOfDay) <= 2) {
          similarity++;
        }
        factors++;
      }

      // Match day of week
      if (input.dayOfWeek !== undefined && response.submitted_at) {
        const responseDay = new Date(response.submitted_at).getDay();
        if (responseDay === input.dayOfWeek) {
          similarity++;
        }
        factors++;
      }

      // Match device type
      if (input.deviceType && response.device_info?.type) {
        if (response.device_info.type === input.deviceType) {
          similarity++;
        }
        factors++;
      }

      // If no factors to compare, include all responses
      if (factors === 0) return true;

      // Include if at least 50% similar
      return similarity / factors >= 0.5;
    });
  }

  /**
   * Analyze patterns for a specific question
   */
  private analyzePatternsForQuestion(
    question: any,
    responses: any[],
    input: PredictionInput
  ): Omit<PredictionResult, 'questionId' | 'questionText'> {
    const questionId = question.id;
    const answers: any[] = [];

    // Extract answers for this question
    for (const response of responses) {
      const responseData = response.response_data?.responses || response.response_data;
      if (responseData && responseData[questionId] !== undefined) {
        answers.push(responseData[questionId]);
      }
    }

    if (answers.length === 0) {
      return {
        predictedResponse: null,
        confidence: 0,
        alternatives: [],
        reasoning: 'No historical answers available for this question'
      };
    }

    // Analyze based on question type
    switch (question.type) {
      case 'multiple_choice':
        return this.predictMultipleChoice(question, answers, input);
      
      case 'rating':
        return this.predictRating(question, answers, input);
      
      case 'checkbox':
        return this.predictCheckbox(question, answers, input);
      
      case 'text':
      case 'textarea':
        return this.predictTextResponse(question, answers, input);
      
      default:
        return {
          predictedResponse: answers[0],
          confidence: 0.5,
          alternatives: [],
          reasoning: 'Using most common response'
        };
    }
  }

  /**
   * Predict multiple choice response
   */
  private predictMultipleChoice(
    question: any,
    answers: any[],
    input: PredictionInput
  ): Omit<PredictionResult, 'questionId' | 'questionText'> {
    const frequency: Record<string, number> = {};
    
    answers.forEach(answer => {
      frequency[answer] = (frequency[answer] || 0) + 1;
    });

    const sorted = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({
        value,
        probability: count / answers.length
      }));

    const predicted = sorted[0];
    const alternatives = sorted.slice(1, 4);

    return {
      predictedResponse: predicted.value,
      confidence: predicted.probability,
      alternatives,
      reasoning: `${(predicted.probability * 100).toFixed(1)}% of similar users chose this option`
    };
  }

  /**
   * Predict rating response
   */
  private predictRating(
    question: any,
    answers: any[],
    input: PredictionInput
  ): Omit<PredictionResult, 'questionId' | 'questionText'> {
    const numericAnswers = answers.map(a => Number(a)).filter(a => !isNaN(a));
    
    if (numericAnswers.length === 0) {
      return {
        predictedResponse: null,
        confidence: 0,
        alternatives: [],
        reasoning: 'No valid numeric ratings found'
      };
    }

    const average = numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length;
    const predicted = Math.round(average);

    // Calculate distribution
    const frequency: Record<number, number> = {};
    numericAnswers.forEach(rating => {
      frequency[rating] = (frequency[rating] || 0) + 1;
    });

    const alternatives = Object.entries(frequency)
      .map(([value, count]) => ({
        value: Number(value),
        probability: count / numericAnswers.length
      }))
      .filter(alt => alt.value !== predicted)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);

    const confidence = frequency[predicted] ? frequency[predicted] / numericAnswers.length : 0.5;

    return {
      predictedResponse: predicted,
      confidence,
      alternatives,
      reasoning: `Average rating is ${average.toFixed(1)}, most common is ${predicted}`
    };
  }

  /**
   * Predict checkbox response
   */
  private predictCheckbox(
    question: any,
    answers: any[],
    input: PredictionInput
  ): Omit<PredictionResult, 'questionId' | 'questionText'> {
    const optionFrequency: Record<string, number> = {};
    
    answers.forEach(answer => {
      if (Array.isArray(answer)) {
        answer.forEach(option => {
          optionFrequency[option] = (optionFrequency[option] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(optionFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([value, count]) => ({
        value,
        probability: count / answers.length
      }));

    // Predict top 2-3 most common options
    const predicted = sorted.slice(0, 3).map(s => s.value);
    const avgConfidence = sorted.slice(0, 3).reduce((sum, s) => sum + s.probability, 0) / 3;

    return {
      predictedResponse: predicted,
      confidence: avgConfidence,
      alternatives: sorted.slice(3, 6),
      reasoning: `Most commonly selected options based on ${answers.length} responses`
    };
  }

  /**
   * Predict text response
   */
  private predictTextResponse(
    question: any,
    answers: any[],
    input: PredictionInput
  ): Omit<PredictionResult, 'questionId' | 'questionText'> {
    // Analyze text patterns
    const lengths = answers.map(a => String(a).length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

    // Find common words/phrases
    const words: Record<string, number> = {};
    answers.forEach(answer => {
      const text = String(answer).toLowerCase();
      const tokens = text.split(/\s+/);
      tokens.forEach(word => {
        if (word.length > 3) {
          words[word] = (words[word] || 0) + 1;
        }
      });
    });

    const commonWords = Object.entries(words)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return {
      predictedResponse: `[Text response, avg length: ${Math.round(avgLength)} chars]`,
      confidence: 0.3,
      alternatives: [],
      reasoning: `Common themes: ${commonWords.join(', ') || 'varied responses'}`
    };
  }

  /**
   * Generate insights for scenario analysis
   */
  private generateScenarioInsights(
    predictions: PredictionResult[],
    input: PredictionInput
  ): string[] {
    const insights: string[] = [];

    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    if (avgConfidence > 0.7) {
      insights.push('High prediction confidence - strong patterns in historical data');
    } else if (avgConfidence > 0.5) {
      insights.push('Moderate prediction confidence - some patterns identified');
    } else {
      insights.push('Low prediction confidence - limited or varied historical data');
    }

    // Analyze input characteristics
    if (input.deviceType) {
      insights.push(`Predictions based on ${input.deviceType} users`);
    }

    if (input.timeOfDay !== undefined) {
      const timeLabel = input.timeOfDay < 12 ? 'morning' : input.timeOfDay < 18 ? 'afternoon' : 'evening';
      insights.push(`Predictions for ${timeLabel} responses`);
    }

    const highConfidencePredictions = predictions.filter(p => p.confidence > 0.7);
    if (highConfidencePredictions.length > 0) {
      insights.push(`${highConfidencePredictions.length} questions have high confidence predictions`);
    }

    return insights;
  }

  /**
   * Calculate hourly completion rates
   */
  private calculateHourlyCompletionRates(responses: any[]): Record<number, number> {
    const hourlyRates: Record<number, { completed: number; total: number }> = {};

    responses.forEach(response => {
      if (response.submitted_at) {
        const hour = new Date(response.submitted_at).getHours();
        if (!hourlyRates[hour]) {
          hourlyRates[hour] = { completed: 0, total: 0 };
        }
        hourlyRates[hour].total++;
        
        // Check if response has completion_time (indicates completion)
        if (response.completion_time && response.completion_time > 0) {
          hourlyRates[hour].completed++;
        }
      }
    });

    const rates: Record<number, number> = {};
    Object.entries(hourlyRates).forEach(([hour, data]) => {
      rates[Number(hour)] = data.total > 0 ? data.completed / data.total : 0;
    });

    return rates;
  }

  /**
   * Calculate device-based completion rates
   */
  private calculateDeviceCompletionRates(responses: any[]): Record<string, number> {
    const deviceRates: Record<string, { completed: number; total: number }> = {};

    responses.forEach(response => {
      const deviceType = response.device_info?.type || 'desktop';
      if (!deviceRates[deviceType]) {
        deviceRates[deviceType] = { completed: 0, total: 0 };
      }
      deviceRates[deviceType].total++;
      
      // Check if response has completion_time (indicates completion)
      if (response.completion_time && response.completion_time > 0) {
        deviceRates[deviceType].completed++;
      }
    });

    const rates: Record<string, number> = {};
    Object.entries(deviceRates).forEach(([device, data]) => {
      rates[device] = data.total > 0 ? data.completed / data.total : 0;
    });

    return rates;
  }
}
