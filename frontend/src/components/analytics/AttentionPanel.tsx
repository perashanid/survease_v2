import React, { useState, useEffect } from 'react';
import analyticsService, { SurveyAttentionItem } from '../../services/analyticsService';
import './AttentionPanel.css';

const AttentionPanel: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyAttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttentionData();
  }, []);

  const fetchAttentionData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getSurveysNeedingAttention(30);
      setSurveys(data.surveys || []);
    } catch (err: any) {
      console.error('Error fetching attention data:', err);
      setError('Failed to load attention data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <div className="attention-panel">
        <div className="attention-header">
          <div className="attention-title">Surveys Needing Attention</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attention-panel">
        <div className="attention-header">
          <div className="attention-title">Surveys Needing Attention</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="attention-panel">
        <div className="attention-header">
          <div className="attention-icon low">✓</div>
          <div className="attention-title">All Surveys Performing Well</div>
        </div>
        <div className="attention-empty">
          <div className="attention-empty-icon">🎉</div>
          <p>No surveys need attention right now. Great job!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attention-panel">
      <div className="attention-header">
        <div className={`attention-icon ${getSeverityClass(surveys[0].attentionScore)}`}>
          ⚠
        </div>
        <div className="attention-title">
          {surveys.length} Survey{surveys.length > 1 ? 's' : ''} Need{surveys.length === 1 ? 's' : ''} Attention
        </div>
      </div>

      <div className="attention-list">
        {surveys.map((survey) => (
          <div key={survey.surveyId} className="attention-item">
            <div className="attention-item-header">
              <div>
                <div className="attention-item-title">{survey.title}</div>
              </div>
              <span className={`attention-score ${getSeverityClass(survey.attentionScore)}`}>
                Score: {survey.attentionScore}
              </span>
            </div>

            {survey.issues.length > 0 && (
              <div className="attention-issues">
                {survey.issues.map((issue, index) => (
                  <div key={index} className="attention-issue">
                    <span className="attention-issue-icon">⚠️</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {survey.recommendations.length > 0 && (
              <div className="attention-recommendations">
                <div className="attention-recommendations-title">Recommendations:</div>
                {survey.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="attention-recommendation">
                    <span className="attention-recommendation-icon">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttentionPanel;
