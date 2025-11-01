import React, { useState } from 'react';
import './RecommendationPanel.css';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  suggested_actions: string[];
}

interface Props {
  recommendations: Recommendation[];
}

const RecommendationPanel: React.FC<Props> = ({ recommendations }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="recommendation-panel">
      {sortedRecommendations.map((rec, index) => (
        <div key={index} className="recommendation-card">
          <div 
            className="recommendation-header"
            onClick={() => toggleExpand(index)}
          >
            <div className="header-left">
              <span className="priority-icon">{getPriorityIcon(rec.priority)}</span>
              <h3>{rec.title}</h3>
            </div>
            <div className="header-right">
              <span 
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(rec.priority) }}
              >
                {rec.priority.toUpperCase()}
              </span>
              <button className="expand-button">
                {expandedIndex === index ? '▲' : '▼'}
              </button>
            </div>
          </div>

          <p className="recommendation-description">{rec.description}</p>

          {expandedIndex === index && (
            <div className="recommendation-details">
              <div className="reasoning-section">
                <h4>💭 Reasoning</h4>
                <p>{rec.reasoning}</p>
              </div>

              {rec.suggested_actions.length > 0 && (
                <div className="actions-section">
                  <h4>✅ Suggested Actions</h4>
                  <ul className="actions-list">
                    {rec.suggested_actions.map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecommendationPanel;
