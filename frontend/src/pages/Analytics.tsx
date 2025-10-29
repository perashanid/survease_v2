import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SurveyService as surveyService } from '../services/surveyService';
import { timeTrackingService } from '../services/timeTrackingService';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, FiUsers, FiTrendingUp, FiGlobe, FiClock, 
  FiAlertCircle, FiRefreshCw, FiCheckCircle, FiActivity
} from 'react-icons/fi';
import './Analytics.css';

interface AnalyticsData {
  totalSurveys: number;
  totalResponses: number;
  recentResponses: number;
  averageResponseRate: number;
  overallAverageCompletionTime?: number | null;
  responsesWithTiming?: number;
  activeSurveys?: number;
  publicSurveys?: number;
  totalQuestions?: number;
  averageQuestionsPerSurvey?: number;
  responseGrowth?: number;
  recentActivity: Array<{
    id: string;
    surveyTitle: string;
    responseCount: number;
    date: string;
  }>;
  topPerformingSurveys: Array<{
    id: string;
    title: string;
    responseCount: number;
    responseRate: number;
    responsesPerDay?: number;
    averageCompletionTime?: number | null;
    daysSinceCreation?: number;
    isActive?: boolean;
    isPublic?: boolean;
    questionCount?: number;
  }>;
  responsesByMonth: Array<{
    month: string;
    responses: number;
  }>;
}

const Analytics: React.FC = () => {
  const { } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate time range
      if (!['7d', '30d', '90d', '1y'].includes(timeRange)) {
        throw new Error('Invalid time range selected');
      }
      
      // Fetch analytics data from API
      const data = await surveyService.getAnalyticsData(timeRange);
      
      // Validate response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid analytics data received from server');
      }
      
      setAnalyticsData({
        totalSurveys: data.totalSurveys || 0,
        totalResponses: data.totalResponses || 0,
        recentResponses: data.recentResponses || 0,
        averageResponseRate: data.averageResponseRate || 0,
        overallAverageCompletionTime: data.overallAverageCompletionTime,
        responsesWithTiming: data.responsesWithTiming || 0,
        activeSurveys: data.activeSurveys || 0,
        publicSurveys: data.publicSurveys || 0,
        totalQuestions: data.totalQuestions || 0,
        averageQuestionsPerSurvey: data.averageQuestionsPerSurvey || 0,
        responseGrowth: data.responseGrowth || 0,
        recentActivity: data.recentActivity || [],
        topPerformingSurveys: data.topPerformingSurveys || [],
        responsesByMonth: data.responsesByMonth || []
      });
    } catch (err: any) {
      console.error('Analytics error:', err);
      
      // Retry logic for network errors
      if (retryCount < 2 && (err.code === 'NETWORK_ERROR' || err.response?.status >= 500)) {
        console.log(`Retrying analytics request (attempt ${retryCount + 1})`);
        setTimeout(() => fetchAnalyticsData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Set user-friendly error message
      if (err.response?.status === 401) {
        setError('Please log in to view analytics');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view analytics');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.message === 'Invalid time range selected') {
        setError('Invalid time range. Please select a valid time period.');
      } else if (err.message === 'Invalid analytics data received from server') {
        setError('Received invalid data from server. Please try again.');
      } else {
        setError('Failed to load analytics data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <motion.div 
            className="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <motion.div 
            className="error-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="error-icon"><FiAlertCircle /></div>
            <h2>Error Loading Analytics</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => fetchAnalyticsData()}>
              <FiRefreshCw /> Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <motion.div 
          className="analytics-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Analytics Dashboard</h1>
          
          <div className="time-range-selector">
            <button 
              className={`time-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '90d' ? 'active' : ''}`}
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '1y' ? 'active' : ''}`}
              onClick={() => setTimeRange('1y')}
            >
              1 Year
            </button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <motion.div 
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="metric-icon"><FiBarChart2 /></div>
            <div className="metric-content">
              <h3>Total Surveys</h3>
              <div className="metric-value">{analyticsData.totalSurveys}</div>
              <div className="metric-change neutral">
                {analyticsData.activeSurveys || 0} active
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="metric-icon"><FiUsers /></div>
            <div className="metric-content">
              <h3>Total Responses</h3>
              <div className="metric-value">{analyticsData.totalResponses}</div>
              <div className={`metric-change ${(analyticsData.responseGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
                {(analyticsData.responseGrowth || 0) >= 0 ? '+' : ''}{analyticsData.responseGrowth?.toFixed(1) || '0.0'}% growth
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="metric-icon"><FiTrendingUp /></div>
            <div className="metric-content">
              <h3>Avg Completion Rate</h3>
              <div className="metric-value">{analyticsData.averageResponseRate.toFixed(1)}%</div>
              <div className="metric-change neutral">
                Based on real data
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="metric-icon"><FiGlobe /></div>
            <div className="metric-content">
              <h3>Public Surveys</h3>
              <div className="metric-value">
                {analyticsData.publicSurveys || 0}
              </div>
              <div className="metric-change neutral">
                {(((analyticsData.publicSurveys || 0) / Math.max(analyticsData.totalSurveys, 1)) * 100).toFixed(0)}% of total
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="metric-icon"><FiClock /></div>
            <div className="metric-content">
              <h3>Avg Completion Time</h3>
              <div className="metric-value">
                {analyticsData.overallAverageCompletionTime 
                  ? timeTrackingService.formatCompletionTime(analyticsData.overallAverageCompletionTime)
                  : 'N/A'
                }
              </div>
              <div className="metric-change neutral">
                {analyticsData.responsesWithTiming || 0} responses with timing
              </div>
            </div>
          </motion.div>
        </div>

        {/* Survey Quick Access */}
        <div className="survey-quick-access">
          <h3>Your Survey Analytics</h3>
          <p>Click on any survey below to view detailed analytics with charts and export options</p>
          <div className="survey-grid">
            {analyticsData.topPerformingSurveys.map((survey) => (
              <Link
                key={survey.id}
                to={`/survey-analytics/${survey.id}`}
                className="survey-analytics-card"
              >
                <div className="survey-card-header">
                  <h4>{survey.title}</h4>
                  <div className="survey-metrics">
                    <span className="metric"><FiBarChart2 /> {survey.responseCount} responses</span>
                    <span className="metric"><FiTrendingUp /> {survey.responseRate.toFixed(1)}% rate</span>
                    {survey.responsesPerDay && (
                      <span className="metric"><FiActivity /> {survey.responsesPerDay} per day</span>
                    )}
                  </div>
                </div>
                <div className="survey-card-footer">
                  <span className="view-analytics">View Detailed Analytics →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Public Survey Analytics Access */}
        <div className="public-survey-analytics-section">
          <h3>Public Survey Analytics</h3>
          <p>Explore analytics for public surveys created by the community</p>
          <div className="public-analytics-actions">
            <Link to="/surveys" className="btn btn-primary">
              Browse Public Surveys
            </Link>
            <div className="public-analytics-info">
              <div className="info-item">
                <span className="info-icon"><FiGlobe /></span>
                <span className="info-text">View analytics for any public survey</span>
              </div>
              <div className="info-item">
                <span className="info-icon"><FiBarChart2 /></span>
                <span className="info-text">Access the same detailed charts and insights</span>
              </div>
              <div className="info-item">
                <span className="info-icon"><FiCheckCircle /></span>
                <span className="info-text">Download public survey data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="analytics-content">
          <div className="chart-section">
            <div className="chart-card">
              <h3>Response Trends</h3>
              <div className="chart-info">
                <p>Showing response patterns over the selected time period ({timeRange})</p>
              </div>
              <div className="chart-container">
                {analyticsData.responsesByMonth && analyticsData.responsesByMonth.length > 0 ? (
                  <div className="response-trends-chart">
                    {(() => {
                      const maxResponses = Math.max(...analyticsData.responsesByMonth.map(d => d.responses), 1);
                      const totalResponses = analyticsData.responsesByMonth.reduce((sum, d) => sum + d.responses, 0);
                      const hasData = totalResponses > 0;
                      
                      return (
                        <div className="trends-chart-container">
                          <div className="chart-stats">
                            <span className="stat"><FiBarChart2 /> Total: {totalResponses} responses</span>
                            <span className="stat"><FiTrendingUp /> Peak: {maxResponses} responses</span>
                            <span className="stat"><FiActivity /> Period: {analyticsData.responsesByMonth.length} data points</span>
                          </div>
                          <div className="simple-chart">
                            {analyticsData.responsesByMonth.map((data, index) => (
                              <div key={index} className="chart-bar">
                                <span className="bar-value">{data.responses}</span>
                                <div 
                                  className={`bar ${data.responses === 0 ? 'empty' : ''}`}
                                  style={{ 
                                    height: `${Math.max((data.responses / maxResponses) * 100, 2)}%`,
                                    minHeight: data.responses > 0 ? '8px' : '2px'
                                  }}
                                  title={`${data.month}: ${data.responses} responses`}
                                ></div>
                                <span className="bar-label">{data.month}</span>
                              </div>
                            ))}
                          </div>
                          {!hasData && (
                            <div className="chart-overlay">
                              <div className="no-data-message">
                                <div className="no-data-icon"><FiBarChart2 /></div>
                                <p>No responses recorded in this time period</p>
                                <small>Try selecting a different time range or create some test responses</small>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="chart-placeholder">
                    <div className="no-data-icon"><FiBarChart2 /></div>
                    <p>No response data available for the selected time range</p>
                    <small>Response trends will appear here once you have survey responses</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tables-section">
            <div className="table-card">
              <h3>Survey Performance</h3>
              <div className="table-container">
                {analyticsData.topPerformingSurveys.length > 0 ? (
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Survey Title</th>
                        <th>Responses</th>
                        <th>Rate</th>
                        <th>Per Day</th>
                        <th>Avg Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topPerformingSurveys.map((survey) => (
                        <tr key={survey.id}>
                          <td className="survey-title-cell">
                            <div className="survey-title-info">
                              <span className="title">{survey.title}</span>
                              <span className="question-count">{survey.questionCount} questions</span>
                            </div>
                          </td>
                          <td className="response-count">{survey.responseCount}</td>
                          <td className="response-rate">{survey.responseRate.toFixed(1)}%</td>
                          <td className="responses-per-day">{survey.responsesPerDay?.toFixed(1) || '0.0'}</td>
                          <td className="completion-time">
                            {survey.averageCompletionTime 
                              ? timeTrackingService.formatCompletionTime(survey.averageCompletionTime)
                              : 'N/A'
                            }
                          </td>
                          <td className="survey-status">
                            <div className="status-badges">
                              {survey.isActive && <span className="badge active">Active</span>}
                              {survey.isPublic && <span className="badge public">Public</span>}
                              {!survey.isActive && <span className="badge inactive">Inactive</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-table">
                    <div className="empty-icon"><FiBarChart2 /></div>
                    <p>No surveys found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="table-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {analyticsData.recentActivity.length > 0 ? (
                  analyticsData.recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon"><FiActivity /></div>
                      <div className="activity-content">
                        <div className="activity-title">{activity.surveyTitle}</div>
                        <div className="activity-meta">
                          {activity.responseCount} responses • {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-activity">
                    <div className="empty-icon"><FiActivity /></div>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;