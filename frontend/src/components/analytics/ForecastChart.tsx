import React from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface TimeSeriesData {
  date: Date;
  count: number;
  label?: string;
}

interface ForecastData {
  date: Date;
  count: number;
  isForecast: boolean;
  confidenceLower?: number;
  confidenceUpper?: number;
}

interface ForecastChartProps {
  historicalData: TimeSeriesData[];
  forecastData: ForecastData[];
  confidenceInterval?: boolean;
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  historicalData,
  forecastData,
  confidenceInterval = true
}) => {
  // Combine historical and forecast data
  const combinedData = [
    ...historicalData.map(d => ({
      date: new Date(d.date).toLocaleDateString(),
      actual: d.count,
      forecast: null,
      lower: null,
      upper: null,
      isForecast: false
    })),
    ...forecastData.map(d => ({
      date: new Date(d.date).toLocaleDateString(),
      actual: null,
      forecast: d.count,
      lower: d.confidenceLower || null,
      upper: d.confidenceUpper || null,
      isForecast: true
    }))
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{data.date}</p>
          {data.actual !== null && (
            <p style={{ margin: '4px 0 0 0', color: '#3b82f6' }}>
              Actual: {data.actual}
            </p>
          )}
          {data.forecast !== null && (
            <>
              <p style={{ margin: '4px 0 0 0', color: '#f59e0b' }}>
                Forecast: {data.forecast}
              </p>
              {confidenceInterval && data.lower !== null && data.upper !== null && (
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                  Range: {data.lower} - {data.upper}
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {confidenceInterval && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#fef3c7"
              fillOpacity={0.3}
              name="Confidence Interval"
            />
          )}
          
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Historical"
          />
          
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Forecast"
          />
          
          {confidenceInterval && (
            <Line
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="none"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '12px', padding: '12px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
          <strong>Note:</strong> Forecast is based on historical trends using linear regression. 
          {confidenceInterval && ' Shaded area shows 95% confidence interval.'}
        </p>
      </div>
    </div>
  );
};

export default ForecastChart;
