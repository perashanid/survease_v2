import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showTrend?: boolean;
}

const SparklineComponent: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  showTrend = true
}) => {
  const chartData = data.map((value, index) => ({ index, value }));
  
  const getTrend = (): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    const first = data[0];
    const last = data[data.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  const trend = getTrend();
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {showTrend && (
        <span style={{ fontSize: '14px', color: trendColor, fontWeight: 600 }}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'stable' && '→'}
        </span>
      )}
    </div>
  );
};

export default SparklineComponent;
