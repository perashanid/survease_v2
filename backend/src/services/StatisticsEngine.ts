import * as ss from 'simple-statistics';

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  confidence: number;
}

export class StatisticsEngine {
  /**
   * Calculate correlation coefficient between two datasets
   */
  calculateCorrelation(data1: number[], data2: number[]): number {
    if (data1.length !== data2.length || data1.length < 2) {
      return 0;
    }
    
    try {
      return ss.sampleCorrelation(data1, data2);
    } catch (error) {
      console.error('Error calculating correlation:', error);
      return 0;
    }
  }

  /**
   * Perform chi-square test for categorical data
   */
  chiSquareTest(observed: number[], expected: number[]): { statistic: number; pValue: number } {
    if (observed.length !== expected.length || observed.length === 0) {
      return { statistic: 0, pValue: 1 };
    }

    try {
      let chiSquare = 0;
      for (let i = 0; i < observed.length; i++) {
        if (expected[i] > 0) {
          chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
        }
      }

      // Simplified p-value calculation (degrees of freedom = n-1)
      const df = observed.length - 1;
      const pValue = this.chiSquarePValue(chiSquare, df);

      return { statistic: chiSquare, pValue };
    } catch (error) {
      console.error('Error in chi-square test:', error);
      return { statistic: 0, pValue: 1 };
    }
  }

  /**
   * Calculate statistical significance
   */
  calculateSignificance(sampleSize: number, effect: number): number {
    if (sampleSize < 2) return 0;
    
    // Simple significance calculation based on sample size and effect size
    const significance = Math.min(100, (sampleSize / 10) * Math.abs(effect) * 100);
    return Math.max(0, significance);
  }

  /**
   * Analyze time series data for trends
   */
  analyzeTimeSeries(data: TimeSeriesData[]): TrendAnalysis {
    if (data.length < 2) {
      return { trend: 'stable', slope: 0, confidence: 0 };
    }

    try {
      // Convert timestamps to numeric values (days since first data point)
      const firstTimestamp = data[0].timestamp.getTime();
      const xValues = data.map(d => (d.timestamp.getTime() - firstTimestamp) / (1000 * 60 * 60 * 24));
      const yValues = data.map(d => d.value);

      // Calculate linear regression
      const regression = ss.linearRegression([xValues, yValues].map((_, i) => [xValues[i], yValues[i]]));
      const slope = regression.m;
      const rSquared = ss.rSquared([xValues, yValues].map((_, i) => [xValues[i], yValues[i]]), regression);

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(slope) < 0.01) {
        trend = 'stable';
      } else if (slope > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      // Confidence based on R-squared and sample size
      const confidence = Math.min(100, rSquared * 100 * Math.log10(data.length + 1));

      return { trend, slope, confidence };
    } catch (error) {
      console.error('Error analyzing time series:', error);
      return { trend: 'stable', slope: 0, confidence: 0 };
    }
  }

  /**
   * Calculate mean of an array
   */
  mean(data: number[]): number {
    if (data.length === 0) return 0;
    return ss.mean(data);
  }

  /**
   * Calculate standard deviation
   */
  standardDeviation(data: number[]): number {
    if (data.length < 2) return 0;
    return ss.standardDeviation(data);
  }

  /**
   * Calculate median
   */
  median(data: number[]): number {
    if (data.length === 0) return 0;
    return ss.median(data);
  }

  /**
   * Detect outliers using IQR method
   */
  detectOutliers(data: number[]): number[] {
    if (data.length < 4) return [];

    const sorted = [...data].sort((a, b) => a - b);
    const q1 = ss.quantile(sorted, 0.25);
    const q3 = ss.quantile(sorted, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter(value => value < lowerBound || value > upperBound);
  }

  /**
   * Simplified chi-square p-value calculation
   */
  private chiSquarePValue(chiSquare: number, df: number): number {
    // Simplified approximation - for production, use a proper statistical library
    if (chiSquare > 10.83 && df === 1) return 0.001;
    if (chiSquare > 6.63 && df === 1) return 0.01;
    if (chiSquare > 3.84 && df === 1) return 0.05;
    if (chiSquare > 2.71 && df === 1) return 0.10;
    return 0.5;
  }
}
