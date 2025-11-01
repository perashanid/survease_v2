import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIInsightsDashboard.css';
import PatternVisualization from './PatternVisualization';
import RecommendationPanel from './RecommendationPanel';
import ConfidenceBadge from './ConfidenceBadge';
import LoadingSkeleton from './LoadingSkeleton';

interface AIInsight {
  _id: string;
  summary: {
    overview: string;
    key_findings: string[];
    response_statistics: {
      total_responses: number;
      completion_rate: number;
      average_completion_time: number;
      quality_responses: number;
      low_quality_responses: number;
    };
    question_insights: Array<{
      question_id: string;
      question_text: string;
      insight: string;
      response_distribution: any;
    }>;
  };
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    supporting_data: any;
    statistical_significance: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    suggested_actions: string[];
  }>;
  generated_at: string;
  data_snapshot: {
    response_count: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}

interface Props {
  surveyId: string;
}

const AIInsightsDashboard: React.FC<Props> = ({ surveyId }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'patterns' | 'recommendations'>('summary');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadLatestInsight();
  }, [surveyId]);

  const loadLatestInsight = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/insights`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1 }
        }
      );

      if (response.data.insights && response.data.insights.length > 0) {
        const latestInsightId = response.data.insights[0]._id;
        await loadInsightDetails(latestInsightId);
      }
    } catch (err: any) {
      console.error('Error loading insights:', err);
      setError(err.response?.data?.error || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const loadInsightDetails = async (insightId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/insights/${insightId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInsight(response.data.insight);
    } catch (err: any) {
      console.error('Error loading insight details:', err);
      setError(err.response?.data?.error || 'Failed to load insight details');
    }
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/ai/generate-insights`,
        { includeQuality: true, includeLowQuality: false },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInsight(response.data.insight);
      setActiveTab('summary');
    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.response?.data?.error || 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  const regenerateInsights = async () => {
    try {
      setGenerating(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/ai/regenerate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInsight(response.data.insight);
      setActiveTab('summary');
    } catch (err: any) {
      console.error('Error regenerating insights:', err);
      setError(err.response?.data?.error || 'Failed to regenerate insights');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !insight) {
    return (
      <div className="ai-insights-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to Load Insights</h3>
        <p>{error}</p>
        <button onClick={loadLatestInsight} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="ai-insights-empty">
        <div className="empty-icon">🤖</div>
        <h3>No AI Insights Yet</h3>
        <p>Generate AI-powered insights to discover patterns, trends, and recommendations from your survey data.</p>
        <button 
          onClick={generateInsights} 
          className="generate-button"
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate AI Insights'}
        </button>
      </div>
    );
  }

  return (
    <div className="ai-insights-dashboard">
      <div className="insights-header">
        <div className="header-content">
          <h2>🤖 AI Research Analytics</h2>
          <div className="header-meta">
            <span className="generated-time">
              Generated: {new Date(insight.generated_at).toLocaleString()}
            </span>
            <span className="data-snapshot">
              Based on {insight.data_snapshot.response_count} responses
            </span>
          </div>
        </div>
        <button 
          onClick={regenerateInsights} 
          className="regenerate-button"
          disabled={generating}
        >
          {generating ? 'Regenerating...' : '🔄 Regenerate'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="insights-tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Summary
        </button>
        <button
          className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          🔍 Patterns ({insight.patterns.length})
        </button>
        <button
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 Recommendations ({insight.recommendations.length})
        </button>
      </div>

      <div className="insights-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <div className="statistics-cards">
              <div className="stat-card">
                <div className="stat-label">Total Responses</div>
                <div className="stat-value">{insight.summary.response_statistics.total_responses}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completion Rate</div>
                <div className="stat-value">{insight.summary.response_statistics.completion_rate}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg. Completion Time</div>
                <div className="stat-value">{Math.round(insight.summary.response_statistics.average_completion_time)}s</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Quality Responses</div>
                <div className="stat-value">{insight.summary.response_statistics.quality_responses}</div>
              </div>
            </div>

            <div className="overview-section">
              <h3>Overview</h3>
              <p className="overview-text">{insight.summary.overview}</p>
            </div>

            <div className="key-findings-section">
              <h3>Key Findings</h3>
              <ul className="findings-list">
                {insight.summary.key_findings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>

            {insight.summary.question_insights.length > 0 && (
              <div className="question-insights-section">
                <h3>Question-Level Insights</h3>
                <div className="question-insights-grid">
                  {insight.summary.question_insights.map((qi, index) => (
                    <div key={index} className="question-insight-card">
                      <h4>{qi.question_text}</h4>
                      <p>{qi.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="patterns-tab">
            {insight.patterns.length === 0 ? (
              <div className="empty-state">
                <p>No significant patterns detected in the data.</p>
              </div>
            ) : (
              <div className="patterns-list">
                {insight.patterns.map((pattern, index) => (
                  <div key={index} className="pattern-card">
                    <div className="pattern-header">
                      <div className="pattern-type-badge">{pattern.type}</div>
                      <ConfidenceBadge confidence={pattern.confidence} />
                    </div>
                    <p className="pattern-description">{pattern.description}</p>
                    <div className="pattern-stats">
                      <span>Statistical Significance: {pattern.statistical_significance}%</span>
                    </div>
                    {pattern.supporting_data && (
                      <PatternVisualization pattern={pattern} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            {insight.recommendations.length === 0 ? (
              <div className="empty-state">
                <p>No recommendations available at this time.</p>
              </div>
            ) : (
              <RecommendationPanel recommendations={insight.recommendations} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
