import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PatternVisualization.css';

interface Pattern {
  type: string;
  description: string;
  confidence: number;
  supporting_data: any;
  statistical_significance: number;
}

interface Props {
  pattern: Pattern;
}

const PatternVisualization: React.FC<Props> = ({ pattern }) => {
  const renderVisualization = () => {
    if (!pattern.supporting_data) {
      return null;
    }

    // Correlation pattern
    if (pattern.type === 'correlation' && pattern.supporting_data.correlation_coefficient) {
      return (
        <div className="pattern-viz-simple">
          <div className="viz-stat">
            <span className="viz-label">Correlation Coefficient:</span>
            <span className="viz-value">{pattern.supporting_data.correlation_coefficient.toFixed(3)}</span>
          </div>
          <div className="viz-stat">
            <span className="viz-label">Sample Size:</span>
            <span className="viz-value">{pattern.supporting_data.sample_size}</span>
          </div>
        </div>
      );
    }

    // Temporal pattern
    if (pattern.type === 'temporal' && pattern.supporting_data.trend) {
      return (
        <div className="pattern-viz-simple">
          <div className="viz-stat">
            <span className="viz-label">Trend:</span>
            <span className="viz-value trend-badge">{pattern.supporting_data.trend}</span>
          </div>
          <div className="viz-stat">
            <span className="viz-label">Slope:</span>
            <span className="viz-value">{pattern.supporting_data.slope?.toFixed(4)}</span>
          </div>
          <div className="viz-stat">
            <span className="viz-label">Sample Size:</span>
            <span className="viz-value">{pattern.supporting_data.sample_size}</span>
          </div>
        </div>
      );
    }

    // Demographic pattern
    if (pattern.type === 'demographic' && pattern.supporting_data.groups) {
      const chartData = pattern.supporting_data.groups.map((g: any) => ({
        name: g.group,
        mean: g.mean,
        count: g.count
      }));

      return (
        <div className="pattern-viz-chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="mean" fill="#3498db" name="Average Response" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Anomaly pattern
    if (pattern.type === 'anomaly' && pattern.supporting_data.outliers) {
      return (
        <div className="pattern-viz-simple">
          <div className="viz-stat">
            <span className="viz-label">Outliers Detected:</span>
            <span className="viz-value">{pattern.supporting_data.outliers.length}</span>
          </div>
          <div className="viz-stat">
            <span className="viz-label">Total Responses:</span>
            <span className="viz-value">{pattern.supporting_data.total_responses}</span>
          </div>
          <div className="viz-stat">
            <span className="viz-label">Mean:</span>
            <span className="viz-value">{pattern.supporting_data.mean?.toFixed(2)}</span>
          </div>
          <div className="viz-stat">
            <span className="viz-label">Std Dev:</span>
            <span className="viz-value">{pattern.supporting_data.std_dev?.toFixed(2)}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pattern-visualization">
      {renderVisualization()}
    </div>
  );
};

export default PatternVisualization;
