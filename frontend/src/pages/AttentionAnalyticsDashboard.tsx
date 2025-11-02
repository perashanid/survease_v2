import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import attentionService, { AttentionData, SurveyNeedingAttention } from '../services/attentionService';
import ErrorBoundary from '../components/analytics/ErrorBoundary';
import LoadingSkeleton from '../components/analytics/LoadingSkeleton';
import EmptyState from '../components/analytics/EmptyState';
import AttentionDashboard from '../components/analytics/AttentionDashboard';
import AttentionPanel from '../components/analytics/AttentionPanel';
import ExportButton from '../components/analytics/ExportButton';
import './AttentionAnalyticsDashboard.css';

const AttentionAnalyticsDashboard: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'overview' | 'recommendations'>('current');
  
  const [attentionData, setAttentionData] = useState<AttentionData | null>(null);
  const [surveysNeedingAttention, setSurveysNeedingAttention] = useState<SurveyNeedingAttention[]>([]);

  useEffect(() => {
    fetchAttentionData();
  }, [surveyId]);

  const fetchAttentionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];
      
      // If we have a specific survey, get its attention data
      if (surveyId) {
        promises.push(attentionService.getAttentionMetrics(surveyId));
      }
      
      // Always get surveys needing attention
      promises.push(attentionService.getSurveysNeedingAttention(30));

      const results = await Promise.all(promises);
      
      if (surveyId) {
        setAttentionData(results[0] as AttentionData);
        setSurveysNeedingAttention(results[1] as SurveyNeedingAttention[]);
      } else {
        setSurveysNeedingAttention(results[0] as SurveyNeedingAttention[]);
      }
    } catch (err: any) {
      console.error('Error fetching attention data:', err);
      const errorMessage = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to load attention data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="attention-analytics">
        <div className="analytics-page-header">
          <h1 className="analytics-page-title">Attention Analytics</h1>
          <p className="analytics-page-subtitle">Loading attention monitoring data...</p>
        </div>
        <LoadingSkeleton type="chart" />
        <LoadingSkeleton type="table" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="attention-analytics">
        <EmptyState
          icon="⚠️"
          title="Failed to Load Attention Data"
          message={error}
          action={{
            label: 'Retry',
            onClick: fetchAttentionData
          }}
        />
      </div>
    );
  }

  return (
    <div className="attention-analytics">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title">🎯 Attention Analytics</h1>
          <p className="analytics-page-subtitle">
            Monitor survey health and identify issues requiring immediate attention
          </p>
        </div>
        <ExportButton
          data={{ attention: attentionData, surveys: surveysNeedingAttention }}
          type="full"
          filename="attention-analytics-report"
        />
      </div>

      {/* Health Status Overview */}
      <div className="health-overview">
        <div className="health-card">
          <div className="health-icon">🟢</div>
          <div className="health-info">
            <div className="health-label">Healthy Surveys</div>
            <div className="health-value">
              {surveysNeedingAttention.length === 0 ? 'All surveys' : 'Most surveys'}
            </div>
            <div className="health-description">
              {surveysNeedingAttention.length === 0 
                ? 'No issues detected across your surveys'
                : `${surveysNeedingAttention.length} survey${surveysNeedingAttention.length > 1 ? 's' : ''} need attention`
              }
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon">
            {surveysNeedingAttention.length === 0 ? '✅' : 
             surveysNeedingAttention.length < 3 ? '⚠️' : '🚨'}
          </div>
          <div className="health-info">
            <div className="health-label">Attention Required</div>
            <div className="health-value">{surveysNeedingAttention.length}</div>
            <div className="health-description">
              {surveysNeedingAttention.length === 0 ? 'No action needed' :
               surveysNeedingAttention.length === 1 ? 'One survey needs attention' :
               `${surveysNeedingAttention.length} surveys need attention`}
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon">📊</div>
          <div className="health-info">
            <div className="health-label">Current Survey Score</div>
            <div className="health-value">
              {surveyId && attentionData ? attentionData.attentionScore : 'N/A'}
            </div>
            <div className="health-description">
              {surveyId && attentionData 
                ? attentionData.attentionScore < 30 ? 'Healthy' :
                  attentionData.attentionScore < 70 ? 'Monitor' : 'Critical'
                : 'Select a survey to view score'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        {surveyId && (
          <button
            className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            🎯 Current Survey
          </button>
        )}
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 All Surveys
        </button>
        <button
          className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 Recommendations
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'current' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <AttentionDashboard surveyId={surveyId} />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="attention-overview-card">
                <div className="card-header">
                  <h3>📋 Surveys Requiring Attention</h3>
                  <p>Monitor all your surveys and identify issues early</p>
                </div>
                <AttentionPanel />
              </div>
            </ErrorBoundary>

            {/* Attention Insights */}
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon">🔍</div>
                  <h4>What We Monitor</h4>
                </div>
                <ul className="insight-list">
                  <li>Response completion rates</li>
                  <li>Recent activity levels</li>
                  <li>Question drop-off points</li>
                  <li>Survey engagement metrics</li>
                </ul>
              </div>

              <div className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon">⚡</div>
                  <h4>Quick Actions</h4>
                </div>
                <ul className="insight-list">
                  <li>Review low-performing questions</li>
                  <li>Send reminder emails</li>
                  <li>Adjust survey settings</li>
                  <li>Promote inactive surveys</li>
                </ul>
              </div>

              <div className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon">📈</div>
                  <h4>Health Indicators</h4>
                </div>
                <ul className="insight-list">
                  <li>🟢 0-29: Survey is healthy</li>
                  <li>🟡 30-69: Needs monitoring</li>
                  <li>🔴 70-100: Requires immediate action</li>
                  <li>📊 Regular health checks recommended</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="analytics-section">
            <div className="recommendations-grid">
              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div className="recommendation-icon">🎯</div>
                  <h4>Improve Completion Rates</h4>
                </div>
                <div className="recommendation-content">
                  <p>Keep surveys concise and engaging to maintain high completion rates.</p>
                  <ul>
                    <li>Limit surveys to 10-15 questions maximum</li>
                    <li>Use clear, simple language</li>
                    <li>Add progress indicators</li>
                    <li>Make optional questions clearly marked</li>
                  </ul>
                </div>
              </div>

              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div className="recommendation-icon">📢</div>
                  <h4>Boost Response Rates</h4>
                </div>
                <div className="recommendation-content">
                  <p>Increase participation through strategic promotion and timing.</p>
                  <ul>
                    <li>Send surveys at optimal times (Tuesday-Thursday, 10am-2pm)</li>
                    <li>Use personalized invitation messages</li>
                    <li>Offer incentives for completion</li>
                    <li>Send gentle reminders after 3-5 days</li>
                  </ul>
                </div>
              </div>

              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div className="recommendation-icon">🔧</div>
                  <h4>Optimize Question Flow</h4>
                </div>
                <div className="recommendation-content">
                  <p>Structure questions to minimize drop-offs and maximize engagement.</p>
                  <ul>
                    <li>Start with easy, engaging questions</li>
                    <li>Group related questions together</li>
                    <li>Use conditional logic to reduce irrelevant questions</li>
                    <li>Place sensitive questions toward the end</li>
                  </ul>
                </div>
              </div>

              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div className="recommendation-icon">📱</div>
                  <h4>Mobile Optimization</h4>
                </div>
                <div className="recommendation-content">
                  <p>Ensure your surveys work perfectly on all devices.</p>
                  <ul>
                    <li>Test surveys on mobile devices</li>
                    <li>Use mobile-friendly question types</li>
                    <li>Keep text concise for small screens</li>
                    <li>Optimize loading times</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttentionAnalyticsDashboard;