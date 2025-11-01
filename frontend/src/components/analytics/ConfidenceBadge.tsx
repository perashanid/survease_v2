import React from 'react';
import './ConfidenceBadge.css';

interface Props {
  confidence: number;
}

const ConfidenceBadge: React.FC<Props> = ({ confidence }) => {
  const getConfidenceLevel = (conf: number): { level: string; color: string } => {
    if (conf >= 80) return { level: 'High', color: '#27ae60' };
    if (conf >= 50) return { level: 'Medium', color: '#f39c12' };
    return { level: 'Low', color: '#e74c3c' };
  };

  const { level, color } = getConfidenceLevel(confidence);

  return (
    <div className="confidence-badge" style={{ backgroundColor: color }}>
      <span className="confidence-level">{level} Confidence</span>
      <span className="confidence-value">{confidence}%</span>
    </div>
  );
};

export default ConfidenceBadge;
