import React, { useEffect, useState } from 'react';
import attentionService, { AttentionData } from '../../services/attentionService';
import './AttentionDashboard.css';

interface AttentionDashboardProps {
  surveyId: string;
}

const AttentionDashboard: React.FC<AttentionDashboardProps> = ({ surveyId }) => {
  const [attentionData, setAttentionData] = useState<AttentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttentionData();
  }, [surveyId]);

  const fetchAttentionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attentionService.getAttentionMetrics(surveyId);
      setAttentionData(data);
    } catch (err: any) {
      console.error('Error fetching attention data:', err);
      setError(err.response?.data?.error || 'Failed to load attention data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#10b981'; // green
    if (score >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="attention-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading attention metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attention-dashboard error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Attention Data</h3>
        <p>{error}</p>
        <button onClick={fetchAttentionData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!attentionData) {
    return (
      <div className="attention-dashboard empty">
        <p>No attention data available</p>
      </div>
    );
  }

  return (
    <div className="attention-dashboard">
      <div className="dashboard-header">
        <h2>Survey Attention Dashboard</h2>
        <p className="survey-title">{attentionData.title}</p>
      </div>

      <div className="attention-score-section">
        <div className="score-card">
          <h3>Attention Score</h3>
          <div 
            className="score-gauge"
            style={{ 
              background: `conic-gradient(${getScoreColor(attentionData.attentionScore)} ${attentionData.attentionScore}%, #e5e7eb 0%)` 
            }}
          >
            <div className="score-value">
              <span className="score-number">{attentionData.attentionScore}</span>
              <span className="score-label">/ 100</span>
            </div>
          </div>
          <p className="score-description">
            {attentionData.attentionScore >= 70 && 'Excellent - Survey is performing well'}
            {attentionData.attentionScore >= 40 && attentionData.attentionScore < 70 && 'Moderate - Some attention needed'}
            {attentionData.attentionScore < 40 && 'Critical - Immediate attention required'}
          </p>
        </div>
      </div>

      <div className="issues-section">
        <h3>Issues Identified ({attentionData.issues.length})</h3>
        {attentionData.issues.length === 0 ? (
          <div className="no-issues">
            <span className="success-icon">✓</span>
            <p>No issues detected. Survey is running smoothly!</p>
          </div>
        ) : (
          <div className="issues-list">
            {attentionData.issues.map((issue, index) => (
              <div key={index} className="issue-card" data-severity={issue.severity}>
                <div className="issue-header">
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(issue.severity) }}
                  >
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className="issue-type">{issue.type}</span>
                </div>
                <p className="issue-description">{issue.description}</p>
                {issue.affectedCount && (
                  <p className="issue-affected">
                    Affected: {issue.affectedCount} responses
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="recommendations-section">
        <h3>Recommendations ({attentionData.recommendations.length})</h3>
        {attentionData.recommendations.length === 0 ? (
          <p className="no-recommendations">No recommendations at this time.</p>
        ) : (
          <div className="recommendations-list">
            {attentionData.recommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-card">
                <div className="recommendation-number">{index + 1}</div>
                <p className="recommendation-text">{recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="actions-section">
        <button onClick={fetchAttentionData} className="refresh-button">
          <span className="refresh-icon">↻</span>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AttentionDashboard;
