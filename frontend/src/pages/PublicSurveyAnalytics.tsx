import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../services/api';
import { timeTrackingService } from '../services/timeTrackingService';
import './SurveyAnalytics.css';

interface PublicSurveyAnalyticsData {
  survey: {
    id: string;
    title: string;
    description: string;
    author: {
      name: string;
    };
    created_at: string;
  };
  analytics: {
    totalResponses: number;
    completionRate: number;
    averageCompletionTime: number | null;
    questionAnalytics: Array<{
      questionId: string;
      question: string;
      type: string;
      responseCount: number;
      responseRate: number;
      optionBreakdown?: Array<{
        option: string;
        count: number;
        percentage: number;
      }>;
      ratingBreakdown?: Array<{
        rating: number;
        count: number;
        percentage: number;
      }>;
      averageRating?: number;
      sampleResponses?: string[];
    }>;
    responseTimeline: Array<{
      date: string;
      responses: number;
    }>;
  };
}

const PublicSurveyAnalytics: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<PublicSurveyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchPublicSurveyAnalytics();
    }
  }, [surveyId]);

  const fetchPublicSurveyAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/public/surveys/${surveyId}/analytics`);
      const data = response.data.data;
      setAnalyticsData(data);
      
      // Set first question as selected by default
      if (data.analytics.questionAnalytics.length > 0) {
        setSelectedQuestion(data.analytics.questionAnalytics[0].questionId);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Survey not found or not publicly available');
      } else if (err.response?.status === 403) {
        setError('This survey is not public');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to load survey analytics');
      }
      console.error('Public survey analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPublicSurveyData = async (format: 'json' | 'csv') => {
    try {
      const response = await api.get(`/public/surveys/${surveyId}/export/${format}`, {
        responseType: format === 'json' ? 'json' : 'blob'
      });
      
      let data: string;
      let mimeType: string;
      
      if (format === 'json') {
        data = JSON.stringify(response.data, null, 2);
        mimeType = 'application/json';
      } else {
        data = response.data;
        mimeType = 'text/csv';
      }
      
      const blob = new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-${analyticsData?.survey.title.replace(/[^a-z0-9]/gi, '_')}-data.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
      if (err.response?.status === 404) {
        alert('Survey not found or not publicly available');
      } else if (err.response?.status === 403) {
        alert('This survey data is not publicly accessible');
      } else {
        alert('Failed to export data');
      }
    }
  };

  const renderPieChart = (data: Array<{ option?: string; rating?: number; count: number; percentage: number }>, title: string) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return <div className="no-data">No responses yet</div>;

    const colors = ['#4ade80', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    let currentAngle = 0;

    return (
      <div className="pie-chart-container">
        <h4>{title}</h4>
        <div className="pie-chart">
          <svg viewBox="0 0 200 200" className="pie-svg">
            {data.map((item, index) => {
              const angle = (item.count / total) * 360;
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
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="pie-legend">
            {data.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="legend-text">
                  {item.option || item.rating}: {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = (data: Array<{ option?: string; rating?: number; count: number; percentage: number }>, title: string) => {
    const maxValue = Math.max(...data.map(item => item.count));
    if (maxValue === 0) return <div className="no-data">No responses yet</div>;

    return (
      <div className="bar-chart-container">
        <h4>{title}</h4>
        <div className="bar-chart">
          {data.map((item, index) => (
            <div key={index} className="bar-item">
              <div 
                className="bar" 
                style={{ height: `${(item.count / maxValue) * 100}%` }}
                title={`${item.option || item.rating}: ${item.count}`}
              >
                <span className="bar-value">{item.count}</span>
              </div>
              <span className="bar-label">{item.option || item.rating}</span>
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
            <button className="btn btn-primary" onClick={() => navigate('/public-surveys')}>
              Back to Public Surveys
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const selectedQuestionData = selectedQuestion 
    ? analyticsData.analytics.questionAnalytics.find(q => q.questionId === selectedQuestion) 
    : null;

  return (
    <div className="survey-analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate('/public-surveys')}>
              ← Back to Public Surveys
            </button>
            <h1>{analyticsData.survey.title}</h1>
            <p>{analyticsData.survey.description}</p>
            <div className="survey-privacy-indicator">
              <span className="privacy-badge public">
                🌐 Public Survey
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={() => downloadPublicSurveyData('json')}
            >
              📄 Export JSON
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => downloadPublicSurveyData('csv')}
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
              <div className="stat-value">{analyticsData.analytics.totalResponses}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❓</div>
            <div className="stat-content">
              <h3>Questions</h3>
              <div className="stat-value">{analyticsData.analytics.questionAnalytics.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>Avg. Time</h3>
              <div className="stat-value">
                {analyticsData.analytics.averageCompletionTime 
                  ? timeTrackingService.formatCompletionTime(analyticsData.analytics.averageCompletionTime)
                  : 'N/A'}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Created</h3>
              <div className="stat-value">
                {new Date(analyticsData.survey.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Completion Rate</h3>
              <div className="stat-value">{analyticsData.analytics.completionRate.toFixed(1)}%</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <h3>Author</h3>
              <div className="stat-value">{analyticsData.survey.author.name}</div>
            </div>
          </div>
        </div>

        {/* Response Timeline */}
        {analyticsData.analytics.responseTimeline && analyticsData.analytics.responseTimeline.length > 0 && (
          <div className="timeline-chart">
            <h3>Response Timeline (Last 30 Days)</h3>
            <div className="timeline-bars">
              {analyticsData.analytics.responseTimeline.map((item, index) => {
                const maxResponses = Math.max(...analyticsData.analytics.responseTimeline.map(d => d.responses), 1);
                return (
                  <div key={index} className="timeline-bar">
                    <div 
                      className="timeline-fill"
                      style={{ height: `${(item.responses / maxResponses) * 100}%` }}
                      title={`${item.date}: ${item.responses} responses`}
                    ></div>
                    <span className="timeline-label">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="timeline-count">{item.responses}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Selector */}
        {analyticsData.analytics.questionAnalytics.length > 0 && (
          <div className="question-selector">
            <h3>Question Analysis</h3>
            <div className="question-tabs">
              {analyticsData.analytics.questionAnalytics.map((question, index) => (
                <button
                  key={question.questionId}
                  className={`question-tab ${selectedQuestion === question.questionId ? 'active' : ''}`}
                  onClick={() => setSelectedQuestion(question.questionId)}
                >
                  Q{index + 1}: {question.question.substring(0, 50)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question Analytics */}
        {selectedQuestionData && (
          <div className="question-analytics">
            <div className="question-info">
              <h4>{selectedQuestionData.question}</h4>
              <div className="question-stats">
                <span className="stat">
                  📊 {selectedQuestionData.responseCount} responses ({selectedQuestionData.responseRate.toFixed(1)}% response rate)
                </span>
                {selectedQuestionData.averageRating && (
                  <span className="stat">
                    ⭐ {selectedQuestionData.averageRating.toFixed(1)} avg rating
                  </span>
                )}
              </div>
            </div>

            {selectedQuestionData.optionBreakdown && selectedQuestionData.optionBreakdown.length > 0 && (
              <div className="charts-grid">
                <div className="chart-section">
                  {renderPieChart(selectedQuestionData.optionBreakdown.map(item => ({
                    option: item.option,
                    count: item.count,
                    percentage: item.percentage
                  })), 'Response Distribution')}
                </div>
                <div className="chart-section">
                  {renderBarChart(selectedQuestionData.optionBreakdown.map(item => ({
                    option: item.option,
                    count: item.count,
                    percentage: item.percentage
                  })), 'Response Frequency')}
                </div>
              </div>
            )}

            {selectedQuestionData.ratingBreakdown && selectedQuestionData.ratingBreakdown.length > 0 && (
              <div className="charts-grid">
                <div className="chart-section">
                  {renderPieChart(selectedQuestionData.ratingBreakdown.map(item => ({
                    rating: item.rating,
                    count: item.count,
                    percentage: item.percentage
                  })), 'Rating Distribution')}
                </div>
                <div className="chart-section">
                  {renderBarChart(selectedQuestionData.ratingBreakdown.map(item => ({
                    rating: item.rating,
                    count: item.count,
                    percentage: item.percentage
                  })), 'Rating Frequency')}
                </div>
              </div>
            )}

            {selectedQuestionData.sampleResponses && selectedQuestionData.sampleResponses.length > 0 && (
              <div className="text-responses">
                <h4>Sample Text Responses</h4>
                <div className="text-responses-list">
                  {selectedQuestionData.sampleResponses.map((response, index) => (
                    <div key={index} className="text-response-item">
                      "{response}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}



        {/* Footer */}
        <div className="analytics-footer">
          <p>
            This is a public view of survey analytics. 
            Individual responses are anonymized and aggregated for privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicSurveyAnalytics;
