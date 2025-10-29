import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  height?: number;
  color?: string;
}

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  showGrid = true,
  showTooltip = true,
  height = 300,
  color = '#3b82f6'
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        {showTooltip && <Tooltip />}
        <Legend />
        <Line type="monotone" dataKey={yAxisKey} stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;
