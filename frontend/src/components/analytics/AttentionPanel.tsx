import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import attentionService, { SurveyNeedingAttention } from '../../services/attentionService';
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import './AttentionPanel.css';

const AttentionPanel: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyNeedingAttention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveysNeedingAttention();
  }, []);

  const fetchSurveysNeedingAttention = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attentionService.getSurveysNeedingAttention(30);
      setSurveys(data);
    } catch (err: any) {
      console.error('Error fetching surveys needing attention:', err);
      setError(err.response?.data?.error || 'Failed to load attention data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#ef4444'; // red - high attention needed
    if (score >= 40) return '#f59e0b'; // yellow - medium attention
    return '#10b981'; // green - low attention
  };

  if (loading) {
    return (
      <div className="attention-panel loading">
        <div className="panel-header">
          <h3><FiAlertTriangle /> Surveys Needing Attention</h3>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attention-panel error">
        <div className="panel-header">
          <h3><FiAlertTriangle /> Surveys Needing Attention</h3>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSurveysNeedingAttention} className="retry-btn">
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="attention-panel empty">
        <div className="panel-header">
          <h3><FiCheckCircle /> All Surveys Healthy</h3>
        </div>
        <div className="empty-state">
          <FiCheckCircle className="success-icon" />
          <p>No surveys need attention right now. Great job!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attention-panel">
      <div className="panel-header">
        <h3><FiAlertTriangle /> Surveys Needing Attention</h3>
        <button onClick={fetchSurveysNeedingAttention} className="refresh-btn" title="Refresh">
          <FiRefreshCw />
        </button>
      </div>
      <div className="attention-list">
        {surveys.map((survey) => (
          <Link
            key={survey.surveyId}
            to={`/comprehensive-analytics/${survey.surveyId}`}
            className="attention-item"
          >
            <div className="attention-item-header">
              <h4>{survey.title}</h4>
              <div
                className="attention-score"
                style={{ backgroundColor: getScoreColor(survey.attentionScore) }}
              >
                {survey.attentionScore}
              </div>
            </div>
            <div className="attention-item-meta">
              <span className="issue-count">
                {survey.issueCount} issue{survey.issueCount !== 1 ? 's' : ''} detected
              </span>
              <span className="last-updated">
                Updated {new Date(survey.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AttentionPanel;
