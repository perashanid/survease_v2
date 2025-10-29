import { Response } from '../models';
import mongoose from 'mongoose';

export interface ForecastData {
  date: Date;
  count: number;
  isForecast: boolean;
  confidenceLower?: number;
  confidenceUpper?: number;
}

export class ForecastService {
  /**
   * Predict future response rates using linear regression
   */
  async forecastResponses(
    surveyId: string,
    daysAhead: number
  ): Promise<ForecastData[]> {
    // Get historical data for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const historicalData = await Response.aggregate([
      {
        $match: {
          survey_id: new mongoose.Types.ObjectId(surveyId),
          submitted_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submitted_at' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    if (historicalData.length < 2) {
      return []; // Not enough data for forecasting
    }

    // Convert to time series
    const timeSeries = historicalData.map((d, index) => ({
      x: index,
      y: d.count
    }));

    // Calculate linear regression
    const { slope, intercept } = this.linearRegression(timeSeries);

    // Generate forecast
    const forecast: ForecastData[] = [];
    const lastIndex = timeSeries.length - 1;

    for (let i = 1; i <= daysAhead; i++) {
      const futureIndex = lastIndex + i;
      const predictedCount = Math.max(0, Math.round(slope * futureIndex + intercept));
      
      const futureDate = new Date(endDate);
      futureDate.setDate(futureDate.getDate() + i);

      const { lower, upper } = this.calculateConfidenceInterval(
        timeSeries.map(t => t.y),
        predictedCount
      );

      forecast.push({
        date: futureDate,
        count: predictedCount,
        isForecast: true,
        confidenceLower: lower,
        confidenceUpper: upper
      });
    }

    return forecast;
  }

  /**
   * Calculate linear regression
   */
  private linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate confidence intervals for forecasts
   */
  private calculateConfidenceInterval(
    historicalData: number[],
    forecast: number
  ): { lower: number; upper: number } {
    // Calculate standard deviation
    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (approximately 2 standard deviations)
    const margin = 1.96 * stdDev;

    return {
      lower: Math.max(0, Math.round(forecast - margin)),
      upper: Math.round(forecast + margin)
    };
  }

  /**
   * Detect trends in historical data
   */
  detectTrend(data: { date: Date; count: number }[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const timeSeries = data.map((d, index) => ({ x: index, y: d.count }));
    const { slope } = this.linearRegression(timeSeries);

    const threshold = 0.1; // Minimum slope to consider as trend
    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }
}
