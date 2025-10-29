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
      <div className="heatmap-grid">
        <div className="heatmap-corner"></div>
        {xLabels.map((label, i) => (
          <div key={i} className="heatmap-xlabel">{label}</div>
        ))}
        
        {data.map((row, y) => (
          <React.Fragment key={y}>
            <div className="heatmap-ylabel">{yLabels[y]}</div>
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
    </div>
  );
};

export default HeatmapComponent;
