import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SurveyComparisonData {
  surveyId: string;
  title: string;
  responseCount: number;
  completionRate: number;
  questionCount?: number;
}

interface ComparisonChartProps {
  surveys: SurveyComparisonData[];
  metrics: string[];
  chartType?: 'bar' | 'line';
}

const ComparisonChartComponent: React.FC<ComparisonChartProps> = ({
  surveys,
  metrics,
  chartType = 'bar'
}) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Transform data for chart
  const chartData = metrics.map(metric => {
    const dataPoint: any = { metric: metric.replace(/([A-Z])/g, ' $1').trim() };
    surveys.forEach((survey, index) => {
      dataPoint[survey.title] = (survey as any)[metric] || 0;
    });
    return dataPoint;
  });

  // Find best performing survey for each metric
  const getBestSurvey = (metric: string): string => {
    let best = surveys[0];
    let bestValue = (best as any)[metric] || 0;
    
    surveys.forEach(survey => {
      const value = (survey as any)[metric] || 0;
      if (value > bestValue) {
        bestValue = value;
        best = survey;
      }
    });
    
    return best.title;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip />
          <Legend />
          {surveys.map((survey, index) => (
            <Bar
              key={survey.surveyId}
              dataKey={survey.title}
              fill={colors[index % colors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Best Performers</h4>
        {metrics.map(metric => (
          <div key={metric} style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            <strong>{metric.replace(/([A-Z])/g, ' $1').trim()}:</strong> {getBestSurvey(metric)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonChartComponent;
