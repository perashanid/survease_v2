import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import ErrorBoundary from '../components/analytics/ErrorBoundary';
import LoadingSkeleton from '../components/analytics/LoadingSkeleton';
import EmptyState from '../components/analytics/EmptyState';
import LineChartComponent from '../components/analytics/LineChartComponent';
import ExportButton from '../components/analytics/ExportButton';
import './BasicAnalyticsDashboard.css';

const BasicAnalyticsDashboard: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    if (surveyId) {
      fetchBasicAnalytics();
    }
  }, [surveyId]);

  const fetchBasicAnalytics = async () => {
    if (!surveyId) return;

    try {
      setLoading(true);
      setError(null);

      const [overview, trends] = await Promise.all([
        analyticsService.getOverview(surveyId),
        analyticsService.getTrends(surveyId, 'day')
      ]);

      setOverviewData(overview);
      setTrendData(trends.data || []);
    } catch (err: any) {
      console.error('Error fetching basic analytics:', err);
      const errorMessage = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="basic-analytics">
        <div className="analytics-page-header">
          <h1 className="analytics-page-title">Basic Analytics</h1>
          <p className="analytics-page-subtitle">Loading your essential metrics...</p>
        </div>
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="basic-analytics">
        <EmptyState
          icon="⚠️"
          title="Failed to Load Analytics"
          message={error}
          action={{
            label: 'Retry',
            onClick: fetchBasicAnalytics
          }}
        />
      </div>
    );
  }

  return (
    <div className="basic-analytics">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title">📊 Basic Analytics</h1>
          <p className="analytics-page-subtitle">
            Essential metrics and insights for your survey
          </p>
        </div>
        <ExportButton
          data={{ overview: overviewData, trends: trendData }}
          type="full"
          filename="basic-analytics-report"
        />
      </div>

      <div className="analytics-content">
        {/* Key Metrics */}
        {overviewData && (
          <div className="metric-cards">
            <div className="metric-card primary">
              <div className="metric-icon">👥</div>
              <div className="metric-info">
                <div className="metric-label">Total Responses</div>
                <div className="metric-value">{overviewData.totalResponses || 0}</div>
                <div className="metric-description">All time responses</div>
              </div>
            </div>
            
            <div className="metric-card success">
              <div className="metric-icon">✅</div>
              <div className="metric-info">
                <div className="metric-label">Completion Rate</div>
                <div className="metric-value">
                  {overviewData.completionRate ? `${overviewData.completionRate.toFixed(1)}%` : '0%'}
                </div>
                <div className="metric-description">Average completion</div>
              </div>
            </div>
            
            <div className="metric-card info">
              <div className="metric-icon">⏱️</div>
              <div className="metric-info">
                <div className="metric-label">Avg Time</div>
                <div className="metric-value">
                  {overviewData.avgCompletionTime ? `${overviewData.avgCompletionTime}s` : 'N/A'}
                </div>
                <div className="metric-description">Per response</div>
              </div>
            </div>
            
            <div className="metric-card warning">
              <div className="metric-icon">🎯</div>
              <div className="metric-info">
                <div className="metric-label">Attention Score</div>
                <div className="metric-value">{overviewData.attentionScore || 0}</div>
                <div className="metric-description">
                  {(overviewData.attentionScore || 0) < 30 ? 'Healthy' : 
                   (overviewData.attentionScore || 0) < 70 ? 'Needs attention' : 'Critical'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Trends Chart */}
        <ErrorBoundary>
          <div className="chart-card">
            <div className="chart-header">
              <h3>📈 Response Trends</h3>
              <p className="chart-description">Daily response activity over time</p>
            </div>
            {trendData && trendData.length > 0 ? (
              <LineChartComponent
                data={trendData.map(d => ({ date: d.label, count: d.count }))}
                xAxisKey="date"
                yAxisKey="count"
                height={300}
              />
            ) : (
              <EmptyState
                icon="📈"
                title="No Trend Data"
                message="Response trends will appear here once you have survey responses."
              />
            )}
          </div>
        </ErrorBoundary>

        {/* Quick Insights */}
        {overviewData && (
          <div className="insights-card">
            <h3>💡 Quick Insights</h3>
            <div className="insights-list">
              <div className="insight-item">
                <span className="insight-icon">
                  {(overviewData.totalResponses || 0) > 50 ? '🎉' : '📢'}
                </span>
                <span className="insight-text">
                  {(overviewData.totalResponses || 0) > 50 
                    ? `Great job! You have ${overviewData.totalResponses} responses.`
                    : 'Consider promoting your survey to get more responses.'
                  }
                </span>
              </div>
              
              <div className="insight-item">
                <span className="insight-icon">
                  {(overviewData.completionRate || 0) > 70 ? '✅' : '⚠️'}
                </span>
                <span className="insight-text">
                  {(overviewData.completionRate || 0) > 70
                    ? 'Excellent completion rate! Your survey is engaging.'
                    : 'Consider shortening your survey to improve completion rates.'
                  }
                </span>
              </div>
              
              <div className="insight-item">
                <span className="insight-icon">
                  {(overviewData.attentionScore || 0) < 30 ? '🟢' : 
                   (overviewData.attentionScore || 0) < 70 ? '🟡' : '🔴'}
                </span>
                <span className="insight-text">
                  {(overviewData.attentionScore || 0) < 30 
                    ? 'Your survey is performing well with no major issues.'
                    : (overviewData.attentionScore || 0) < 70
                    ? 'Some areas need attention. Check the Attention Analytics for details.'
                    : 'Critical issues detected. Immediate attention required.'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicAnalyticsDashboard;