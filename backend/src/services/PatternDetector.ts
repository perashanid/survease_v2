import { IResponse, ISurveyQuestion } from '../models';
import { StatisticsEngine, TimeSeriesData } from './StatisticsEngine';

export interface CorrelationPattern {
  type: 'correlation';
  question1: string;
  question2: string;
  correlation: number;
  confidence: number;
  description: string;
  supporting_data: any;
  statistical_significance: number;
}

export interface TemporalPattern {
  type: 'temporal';
  question: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  description: string;
  supporting_data: any;
  statistical_significance: number;
}

export interface DemographicPattern {
  type: 'demographic';
  demographic_field: string;
  question: string;
  confidence: number;
  description: string;
  supporting_data: any;
  statistical_significance: number;
}

export interface AnomalyPattern {
  type: 'anomaly';
  question: string;
  anomaly_count: number;
  confidence: number;
  description: string;
  supporting_data: any;
  statistical_significance: number;
}

export type Pattern = CorrelationPattern | TemporalPattern | DemographicPattern | AnomalyPattern;

export class PatternDetector {
  private statsEngine: StatisticsEngine;

  constructor() {
    this.statsEngine = new StatisticsEngine();
  }

  /**
   * Find correlations between questions
   */
  async findCorrelations(
    responses: IResponse[],
    questions: ISurveyQuestion[]
  ): Promise<CorrelationPattern[]> {
    const patterns: CorrelationPattern[] = [];
    
    // Only analyze numeric or rating questions
    const numericQuestions = questions.filter(q => 
      ['rating', 'number'].includes(q.type)
    );

    if (numericQuestions.length < 2 || responses.length < 10) {
      return patterns;
    }

    // Compare each pair of questions
    for (let i = 0; i < numericQuestions.length; i++) {
      for (let j = i + 1; j < numericQuestions.length; j++) {
        const q1 = numericQuestions[i];
        const q2 = numericQuestions[j];

        const data1: number[] = [];
        const data2: number[] = [];

        responses.forEach(response => {
          const val1 = this.extractNumericValue(response.response_data[q1.id]);
          const val2 = this.extractNumericValue(response.response_data[q2.id]);
          
          if (val1 !== null && val2 !== null) {
            data1.push(val1);
            data2.push(val2);
          }
        });

        if (data1.length >= 10) {
          const correlation = this.statsEngine.calculateCorrelation(data1, data2);
          
          if (Math.abs(correlation) > 0.3) {
            const confidence = Math.min(100, Math.abs(correlation) * 100 * Math.log10(data1.length));
            const significance = this.statsEngine.calculateSignificance(data1.length, correlation);

            patterns.push({
              type: 'correlation',
              question1: q1.question,
              question2: q2.question,
              correlation,
              confidence,
              description: this.generateCorrelationDescription(q1.question, q2.question, correlation),
              supporting_data: {
                sample_size: data1.length,
                correlation_coefficient: correlation
              },
              statistical_significance: significance
            });
          }
        }
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Analyze temporal trends
   */
  async analyzeTrends(
    responses: IResponse[],
    questions: ISurveyQuestion[]
  ): Promise<TemporalPattern[]> {
    const patterns: TemporalPattern[] = [];

    if (responses.length < 10) {
      return patterns;
    }

    // Sort responses by submission time
    const sortedResponses = [...responses].sort((a, b) => 
      a.submitted_at.getTime() - b.submitted_at.getTime()
    );

    // Analyze numeric questions for trends
    const numericQuestions = questions.filter(q => 
      ['rating', 'number'].includes(q.type)
    );

    for (const question of numericQuestions) {
      const timeSeriesData: TimeSeriesData[] = [];

      sortedResponses.forEach(response => {
        const value = this.extractNumericValue(response.response_data[question.id]);
        if (value !== null) {
          timeSeriesData.push({
            timestamp: response.submitted_at,
            value
          });
        }
      });

      if (timeSeriesData.length >= 10) {
        const analysis = this.statsEngine.analyzeTimeSeries(timeSeriesData);
        
        if (analysis.confidence > 30) {
          patterns.push({
            type: 'temporal',
            question: question.question,
            trend: analysis.trend,
            confidence: analysis.confidence,
            description: this.generateTrendDescription(question.question, analysis.trend),
            supporting_data: {
              sample_size: timeSeriesData.length,
              slope: analysis.slope,
              trend: analysis.trend
            },
            statistical_significance: analysis.confidence
          });
        }
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Analyze demographic patterns
   */
  async analyzeDemographics(
    responses: IResponse[],
    questions: ISurveyQuestion[]
  ): Promise<DemographicPattern[]> {
    const patterns: DemographicPattern[] = [];

    if (responses.length < 20) {
      return patterns;
    }

    // Find responses with demographics
    const responsesWithDemographics = responses.filter(r => r.demographics && Object.keys(r.demographics).length > 0);
    
    if (responsesWithDemographics.length < 10) {
      return patterns;
    }

    // Get demographic fields
    const demographicFields = new Set<string>();
    responsesWithDemographics.forEach(r => {
      if (r.demographics) {
        Object.keys(r.demographics).forEach(field => demographicFields.add(field));
      }
    });

    // Analyze each demographic field against numeric questions
    const numericQuestions = questions.filter(q => 
      ['rating', 'number'].includes(q.type)
    );

    for (const field of demographicFields) {
      for (const question of numericQuestions) {
        const groupedData: { [key: string]: number[] } = {};

        responsesWithDemographics.forEach(response => {
          if (response.demographics && response.demographics[field]) {
            const demographicValue = response.demographics[field];
            const questionValue = this.extractNumericValue(response.response_data[question.id]);
            
            if (questionValue !== null) {
              if (!groupedData[demographicValue]) {
                groupedData[demographicValue] = [];
              }
              groupedData[demographicValue].push(questionValue);
            }
          }
        });

        // Check if there are significant differences between groups
        const groups = Object.keys(groupedData);
        if (groups.length >= 2) {
          const means = groups.map(g => this.statsEngine.mean(groupedData[g]));
          const maxDiff = Math.max(...means) - Math.min(...means);
          const overallMean = this.statsEngine.mean(means);
          
          if (overallMean > 0 && maxDiff / overallMean > 0.2) {
            const totalSamples = Object.values(groupedData).reduce((sum, arr) => sum + arr.length, 0);
            const confidence = Math.min(100, (maxDiff / overallMean) * 100 * Math.log10(totalSamples));

            patterns.push({
              type: 'demographic',
              demographic_field: field,
              question: question.question,
              confidence,
              description: this.generateDemographicDescription(field, question.question, groupedData),
              supporting_data: {
                groups: Object.keys(groupedData).map(key => ({
                  group: key,
                  mean: this.statsEngine.mean(groupedData[key]),
                  count: groupedData[key].length
                }))
              },
              statistical_significance: confidence
            });
          }
        }
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Detect anomalies in responses
   */
  async detectAnomalies(
    responses: IResponse[],
    questions: ISurveyQuestion[]
  ): Promise<AnomalyPattern[]> {
    const patterns: AnomalyPattern[] = [];

    if (responses.length < 20) {
      return patterns;
    }

    const numericQuestions = questions.filter(q => 
      ['rating', 'number'].includes(q.type)
    );

    for (const question of numericQuestions) {
      const values: number[] = [];

      responses.forEach(response => {
        const value = this.extractNumericValue(response.response_data[question.id]);
        if (value !== null) {
          values.push(value);
        }
      });

      if (values.length >= 20) {
        const outliers = this.statsEngine.detectOutliers(values);
        
        if (outliers.length > 0 && outliers.length / values.length < 0.1) {
          const confidence = Math.min(100, (outliers.length / values.length) * 500);

          patterns.push({
            type: 'anomaly',
            question: question.question,
            anomaly_count: outliers.length,
            confidence,
            description: this.generateAnomalyDescription(question.question, outliers.length, values.length),
            supporting_data: {
              outliers: outliers.slice(0, 10),
              total_responses: values.length,
              mean: this.statsEngine.mean(values),
              std_dev: this.statsEngine.standardDeviation(values)
            },
            statistical_significance: confidence
          });
        }
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Extract numeric value from response data
   */
  private extractNumericValue(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Generate correlation description
   */
  private generateCorrelationDescription(q1: string, q2: string, correlation: number): string {
    const strength = Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.5 ? 'moderate' : 'weak';
    const direction = correlation > 0 ? 'positive' : 'negative';
    return `Found a ${strength} ${direction} correlation between "${q1}" and "${q2}". ` +
           `Responses to these questions tend to ${correlation > 0 ? 'increase' : 'decrease'} together.`;
  }

  /**
   * Generate trend description
   */
  private generateTrendDescription(question: string, trend: string): string {
    if (trend === 'increasing') {
      return `Responses to "${question}" show an increasing trend over time, suggesting growing positive sentiment or values.`;
    } else if (trend === 'decreasing') {
      return `Responses to "${question}" show a decreasing trend over time, indicating declining values or sentiment.`;
    } else {
      return `Responses to "${question}" remain relatively stable over time with no significant trend.`;
    }
  }

  /**
   * Generate demographic description
   */
  private generateDemographicDescription(field: string, question: string, groupedData: { [key: string]: number[] }): string {
    const groups = Object.keys(groupedData).map(key => ({
      name: key,
      mean: this.statsEngine.mean(groupedData[key])
    })).sort((a, b) => b.mean - a.mean);

    return `Significant differences found in "${question}" across ${field} groups. ` +
           `${groups[0].name} shows the highest average response.`;
  }

  /**
   * Generate anomaly description
   */
  private generateAnomalyDescription(question: string, anomalyCount: number, total: number): string {
    const percentage = ((anomalyCount / total) * 100).toFixed(1);
    return `Detected ${anomalyCount} outlier responses (${percentage}%) for "${question}" that significantly deviate from the typical pattern.`;
  }
}
