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
  // Validate data
  if (!data || data.length === 0 || !data[0] || data[0].length === 0) {
    return (
      <div className="heatmap-container" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <p>No data available for heatmap visualization</p>
      </div>
    );
  }

  // Find max value for color scaling
  const maxValue = Math.max(...data.flat().map(cell => cell.value));

  const getColor = (value: number): string => {
    if (maxValue === 0) return '#f3f4f6';
    const intensity = value / maxValue;
    
    if (intensity === 0) return '#f3f4f6';
    if (intensity < 0.2) return '#dbeafe';
    if (intensity < 0.4) return '#93c5fd';
    if (intensity < 0.6) return '#60a5fa';
    if (intensity < 0.8) return '#3b82f6';
    return '#1e40af';
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-grid" style={{ gridTemplateColumns: `100px repeat(${xLabels.length}, 40px)` }}>
        <div className="heatmap-corner"></div>
        {xLabels.map((label, i) => (
          <div key={i} className="heatmap-xlabel">{label}</div>
        ))}
        
        {data.map((row, y) => (
          <React.Fragment key={y}>
            <div className="heatmap-ylabel">{yLabels[y] || `Row ${y}`}</div>
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className="heatmap-cell"
                style={{ backgroundColor: getColor(cell.value) }}
                onClick={() => onCellClick?.(cell)}
                title={`${cell.label}: ${cell.value} responses`}
              >
                {cell.value > 0 && <span className="heatmap-value">{cell.value}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
        <p>Darker colors indicate more responses during that time period</p>
      </div>
    </div>
  );
};

export default HeatmapComponent;
