import React from 'react';
import './HeatmapComponent.css';

interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  label: string;
}

interface HeatmapProps {
  data: HeatmapCell[][];
  xLabels: string[];
  yLabels: string[];
  onCellClick?: (cell: HeatmapCell) => void;
}

const HeatmapComponent: React.FC<HeatmapProps> = ({
  data,
  xLabels,
  yLabels,
  onCellClick
}) => {
  // Debug logging
  console.log('HeatmapComponent received data:', {
    dataType: typeof data,
    isArray: Array.isArray(data),
    length: data?.length,
    firstRow: data?.[0],
    xLabelsLength: xLabels?.length,
    yLabelsLength: yLabels?.length
  });

  // Create empty grid if no data provided
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('Heatmap: No data provided, creating empty grid');
    
    // Create empty 7x24 grid
    const emptyData: HeatmapCell[][] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let day = 0; day < 7; day++) {
      const row: HeatmapCell[] = [];
      for (let hour = 0; hour < 24; hour++) {
        row.push({
          x: hour,
          y: day,
          value: 0,
          label: `${days[day]} ${hour}:00`
        });
      }
      emptyData.push(row);
    }
    
    // Use the empty data to render the grid
    data = emptyData;
  }

  // Validate first row
  if (!data[0] || !Array.isArray(data[0]) || data[0].length === 0) {
    console.log('Heatmap: Invalid first row', data[0]);
    return (
      <div className="heatmap-container" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Invalid heatmap data</p>
        <p style={{ fontSize: '14px' }}>Unable to display heatmap visualization.</p>
      </div>
    );
  }

  // Find max value for color scaling
  const maxValue = Math.max(...data.flat().map(cell => cell?.value || 0));
  console.log('Heatmap max value:', maxValue);

  const getColor = (value: number): string => {
    if (value === 0) return '#f9fafb'; // Very light gray for zero values
    if (maxValue === 0) return '#f9fafb';
    
    const intensity = value / maxValue;
    
    // Blue gradient with better visibility
    if (intensity < 0.2) return '#dbeafe'; // Very light blue
    if (intensity < 0.4) return '#bfdbfe'; // Light blue
    if (intensity < 0.6) return '#93c5fd'; // Medium light blue
    if (intensity < 0.8) return '#60a5fa'; // Medium blue
    if (intensity < 0.9) return '#3b82f6'; // Strong blue
    return '#2563eb'; // Deep blue
  };

  // Count total responses for display
  const totalResponses = data.flat().reduce((sum, cell) => sum + (cell?.value || 0), 0);
  console.log('Heatmap rendering with', totalResponses, 'total responses');

  // If we have a grid but no responses, show a different message
  if (totalResponses === 0) {
    return (
      <div className="heatmap-container" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No responses in selected date range</p>
        <p style={{ fontSize: '14px' }}>Try adjusting your date filters or wait for more survey submissions.</p>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
        <strong>Total Responses:</strong> {totalResponses}
      </div>
      <div className="heatmap-grid" style={{ gridTemplateColumns: `100px repeat(${xLabels.length}, 40px)` }}>
        <div className="heatmap-corner"></div>
        {xLabels.map((label, i) => (
          <div key={i} className="heatmap-xlabel">{label}</div>
        ))}
        
        {data.map((row, y) => (
          <React.Fragment key={y}>
            <div className="heatmap-ylabel">{yLabels[y] || `Row ${y}`}</div>
            {row.map((cell, x) => {
              const bgColor = getColor(cell.value);
              return (
                <div
                  key={`${x}-${y}`}
                  className="heatmap-cell"
                  style={{ 
                    backgroundColor: bgColor,
                    minWidth: '40px',
                    minHeight: '40px'
                  }}
                  onClick={() => onCellClick?.(cell)}
                  title={`${cell.label}: ${cell.value} response${cell.value !== 1 ? 's' : ''}`}
                >
                  {cell.value > 0 && <span className="heatmap-value">{cell.value}</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
        <p>Darker colors indicate more responses during that time period</p>
        <p style={{ marginTop: '8px' }}>Hover over cells to see exact counts</p>
      </div>
    </div>
  );
};

export default HeatmapComponent;
