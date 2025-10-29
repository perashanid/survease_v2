import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DeviceMetrics {
  mobile: number;
  desktop: number;
  tablet: number;
}

interface BrowserMetrics {
  [browserName: string]: number;
}

interface DeviceBreakdownProps {
  deviceData: DeviceMetrics;
  browserData: BrowserMetrics;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DeviceBreakdownChart: React.FC<DeviceBreakdownProps> = ({
  deviceData,
  browserData
}) => {
  const deviceChartData = [
    { name: 'Mobile', value: deviceData.mobile, percentage: 0 },
    { name: 'Desktop', value: deviceData.desktop, percentage: 0 },
    { name: 'Tablet', value: deviceData.tablet, percentage: 0 }
  ].filter(item => item.value > 0);

  const total = deviceChartData.reduce((sum, item) => sum + item.value, 0);
  deviceChartData.forEach(item => {
    item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
  });

  const browserChartData = Object.entries(browserData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            {payload[0].value} responses ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Device Types</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={deviceChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percentage }) => `${name} ${percentage}%`}
            >
              {deviceChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Browser Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={browserChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DeviceBreakdownChart;
