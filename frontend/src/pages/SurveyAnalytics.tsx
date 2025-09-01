import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SurveyService as surveyService } from '../services/surveyService';
import { timeTrackingService } from '../services/timeTrackingService';
import './SurveyAnalytics.css';

interface SurveyAnalyticsData {
  survey: {
    id: string;
    title: string;
    description: string;
    questions: any[];
    responseCount: number;
    createdAt: string;
    is_public: boolean;
  };
  responses: Array<{
    id: string;
    submitted_at: string;
    is_anonymous: boolean;
    respondent_email?: string;
    response_data: any;
    completion_time?: number;
    started_at?: string;
  }>;
  questionAnalytics: {
    [questionId: string]: {
      type: string;
      question: string;
      totalResponses: number;
      responseDistribution: { [key: string]: number };
      averageRating?: number;
      mostCommonAnswer?: string;
      responseRate: number;
    };
  };
  demographics: {
    responsesByDate: { date: string; count: number }[];
    responsesByHour: { hour: number; count: number }[];
    completionRate: number;
    averageCompletionTime?: number;
  };
}

const SurveyAnalytics: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<SurveyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyAnalytics();
    }
  }, [surveyId]);

  const fetchSurveyAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await surveyService.getSurveyAnalytics(surveyId!);
      setAnalyticsData(data);
      
      // Set first question as selected by default
      if (data.survey.questions.length > 0) {
        setSelectedQuestion(data.survey.questions[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load survey analytics');
      console.error('Survey analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSurveyData = async (format: 'json' | 'csv') => {
    try {
      const data = await surveyService.exportSurveyData(surveyId!, format);
      
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-${analyticsData?.survey.title.replace(/[^a-z0-9]/gi, '_')}-data.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  const renderPieChart = (data: { [key: string]: number }, title: string) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return <div className="no-data">No responses yet</div>;

    const colors = ['#4ade80', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    let currentAngle = 0;

    return (
      <div className="pie-chart-container">
        <h4>{title}</h4>
        <div className="pie-chart">
          <svg viewBox="0 0 200 200" className="pie-svg">
            {Object.entries(data).map(([key, value], index) => {
              const angle = (value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              currentAngle += angle;
              
              return (
                <path
                  key={key}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="pie-legend">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="legend-text">
                  {key}: {value} ({((value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = (data: { [key: string]: number }, title: string) => {
    const maxValue = Math.max(...Object.values(data));
    if (maxValue === 0) return <div className="no-data">No responses yet</div>;

    return (
      <div className="bar-chart-container">
        <h4>{title}</h4>
        <div className="bar-chart">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bar-item">
              <div 
                className="bar" 
                style={{ height: `${(value / maxValue) * 100}%` }}
                title={`${key}: ${value}`}
              >
                <span className="bar-value">{value}</span>
              </div>
              <span className="bar-label">{key}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResponseTimeline = () => {
    if (!analyticsData?.demographics.responsesByDate || analyticsData.demographics.responsesByDate.length === 0) {
      return (
        <div className="timeline-chart">
          <h4>Response Timeline</h4>
          <div className="chart-placeholder">
            <div className="no-data-icon">📊</div>
            <p>No response timeline data available</p>
          </div>
        </div>
      );
    }

    const data = analyticsData.demographics.responsesByDate;
    const maxResponses = Math.max(...data.map(d => d.count), 1);

    return (
      <div className="timeline-chart">
        <h4>Response Timeline</h4>
        <div className="timeline-bars">
          {data.map((item, index) => (
            <div key={index} className="timeline-bar">
              <span className="timeline-count">{item.count}</span>
              <div 
                className="timeline-fill"
                style={{ height: `${(item.count / maxResponses) * 100}%` }}
                title={`${item.date}: ${item.count} responses`}
              ></div>
              <span className="timeline-label">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResponsesByHour = () => {
    if (!analyticsData?.demographics.responsesByHour || analyticsData.demographics.responsesByHour.length === 0) {
      return (
        <div className="hour-chart">
          <h4>Responses by Hour</h4>
          <div className="chart-placeholder">
            <div className="no-data-icon">📊</div>
            <p>No hourly response data available</p>
          </div>
        </div>
      );
    }

    const data = analyticsData.demographics.responsesByHour;
    const maxResponses = Math.max(...data.map(d => d.count), 1);
    const totalResponses = data.reduce((sum, d) => sum + d.count, 0);

    if (totalResponses === 0) {
      return (
        <div className="hour-chart">
          <h4>Responses by Hour</h4>
          <div className="chart-placeholder">
            <div className="no-data-icon">📊</div>
            <p>No responses recorded yet</p>
          </div>
        </div>
      );
    }

    return (
      <div className="hour-chart">
        <h4>Responses by Hour</h4>
        <div className="hour-bars">
          {data.map((item, index) => (
            <div key={index} className="hour-bar">
              <div 
                className="hour-fill"
                style={{ height: `${(item.count / maxResponses) * 100}%` }}
                title={`${item.hour}:00 - ${item.count} responses`}
              ></div>
              <span className="hour-label">{item.hour}</span>
              <span className="hour-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="survey-analytics-page">
        <div className="analytics-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading survey analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="survey-analytics-page">
        <div className="analytics-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>Error Loading Analytics</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const selectedQuestionData = selectedQuestion ? analyticsData.questionAnalytics[selectedQuestion] : null;

  return (
    <div className="survey-analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>{analyticsData.survey.title}</h1>
            <p>{analyticsData.survey.description}</p>
            <div className="survey-privacy-indicator">
              {analyticsData.survey.is_public ? (
                <span className="privacy-badge public">
                  🌐 Public Survey
                </span>
              ) : (
                <span className="privacy-badge private">
                  🔒 Private Survey
                </span>
              )}
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={() => downloadSurveyData('json')}
            >
              📄 Export JSON
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => downloadSurveyData('csv')}
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Responses</h3>
              <div className="stat-value">{analyticsData.survey.responseCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Completion Rate</h3>
              <div className="stat-value">{analyticsData.demographics.completionRate.toFixed(1)}%</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❓</div>
            <div className="stat-content">
              <h3>Questions</h3>
              <div className="stat-value">{analyticsData.survey.questions.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>Avg. Time</h3>
              <div className="stat-value">
                {analyticsData.demographics.averageCompletionTime 
                  ? timeTrackingService.formatCompletionTime(analyticsData.demographics.averageCompletionTime)
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Question Selector */}
        <div className="question-selector">
          <h3>Question Analysis</h3>
          <div className="question-tabs">
            {analyticsData.survey.questions.map((question) => (
              <button
                key={question.id}
                className={`question-tab ${selectedQuestion === question.id ? 'active' : ''}`}
                onClick={() => setSelectedQuestion(question.id)}
              >
                Q{analyticsData.survey.questions.indexOf(question) + 1}: {question.question.substring(0, 50)}...
              </button>
            ))}
          </div>
        </div>

        {/* Question Analytics */}
        {selectedQuestionData && (
          <div className="question-analytics">
            <div className="question-info">
              <h4>{selectedQuestionData.question}</h4>
              <div className="question-stats">
                <span className="stat">
                  📊 {selectedQuestionData.totalResponses} responses
                </span>
                <span className="stat">
                  📈 {selectedQuestionData.responseRate.toFixed(1)}% response rate
                </span>
                {selectedQuestionData.averageRating && (
                  <span className="stat">
                    ⭐ {selectedQuestionData.averageRating.toFixed(1)} avg rating
                  </span>
                )}
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-section">
                {renderPieChart(selectedQuestionData.responseDistribution, 'Response Distribution')}
              </div>
              <div className="chart-section">
                {renderBarChart(selectedQuestionData.responseDistribution, 'Response Frequency')}
              </div>
            </div>
          </div>
        )}

        {/* Overall Analytics */}
        <div className="overall-analytics">
          <div className="analytics-grid">
            <div className="chart-section">
              {renderResponseTimeline()}
            </div>
            <div className="chart-section">
              {renderResponsesByHour()}
            </div>
          </div>
        </div>

        {/* Raw Data Preview */}
        <div className="raw-data-section">
          <h3>Recent Responses Preview</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Response ID</th>
                  <th>Submitted At</th>
                  <th>Respondent</th>
                  <th>Completion Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.responses.slice(0, 10).map((response, index) => (
                  <tr key={response.id || index}>
                    <td>#{(response.id || '').substring(0, 8)}...</td>
                    <td>{new Date(response.submitted_at).toLocaleString()}</td>
                    <td>
                      {response.is_anonymous ? (
                        <span className="anonymous-badge">Anonymous</span>
                      ) : (
                        <span className="respondent-email">
                          {response.respondent_email || 'Registered User'}
                        </span>
                      )}
                    </td>
                    <td>
                      {response.completion_time 
                        ? timeTrackingService.formatCompletionTime(response.completion_time)
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <span className="completion-badge complete">Complete</span>
                    </td>
                    <td>
                      <button className="btn-sm btn-outline">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalytics;