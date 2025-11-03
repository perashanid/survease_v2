import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import analyticsService, { FilterCriteria } from '../services/analyticsService';
import { SurveyService } from '../services/surveyService';
import { 
  FiBarChart2, FiFileText, FiFilter, FiActivity, FiSmartphone, 
  FiTarget, FiEye, FiCpu, FiSettings, FiTrendingUp, FiUsers, FiGlobe,
  FiHelpCircle, FiClock, FiCalendar, FiUser, FiStar
} from 'react-icons/fi';
import ErrorBoundary from '../components/analytics/ErrorBoundary';

import EmptyState from '../components/analytics/EmptyState';
import AttentionDashboard from '../components/analytics/AttentionDashboard';
import LineChartComponent from '../components/analytics/LineChartComponent';
import ForecastChart from '../components/analytics/ForecastChart';
import DeviceBreakdownChart from '../components/analytics/DeviceBreakdownChart';
import HeatmapComponent from '../components/analytics/HeatmapComponent';
import FunnelChartComponent from '../components/analytics/FunnelChartComponent';
import QuestionPerformanceTable from '../components/analytics/QuestionPerformanceTable';
import QuestionDetailModal from '../components/analytics/QuestionDetailModal';
import FilterPanel from '../components/analytics/FilterPanel';
import SegmentBuilder from '../components/analytics/SegmentBuilder';
import SegmentComparison from '../components/analytics/SegmentComparison';
import AIInsightsDashboard from '../components/analytics/AIInsightsDashboard';
import DataQualityManager from '../components/analytics/DataQualityManager';
import PredictiveAnalytics from '../components/analytics/PredictiveAnalytics';
import BehavioralTrendsPanel from '../components/analytics/BehavioralTrendsPanel';

import ExportButton from '../components/analytics/ExportButton';
import SparklineComponent from '../components/analytics/SparklineComponent';
import '../styles/responsive-analytics.css';
import '../styles/accessibility.css';
import './ComprehensiveAnalyticsDashboard.css';
import './SurveyAnalytics.css';

const ComprehensiveAnalyticsDashboard: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [overviewData, setOverviewData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[][]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [questionMetrics, setQuestionMetrics] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [publicAnalyticsData, setPublicAnalyticsData] = useState<any>(null);
  const [selectedPublicQuestion, setSelectedPublicQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchAnalyticsData();
    }
  }, [surveyId, filters]);

  const fetchAnalyticsData = async () => {
    if (!surveyId) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = filters.dateRange?.start;
      const endDate = filters.dateRange?.end;

      const [overview, trends, heatmap, funnel, questions, devices, forecast, publicData] = await Promise.all([
        analyticsService.getOverview(surveyId),
        analyticsService.getTrends(surveyId, 'day', startDate, endDate),
        analyticsService.getHeatmap(surveyId, startDate, endDate),
        analyticsService.getFunnel(surveyId, startDate, endDate),
        analyticsService.getQuestionMetrics(surveyId, 'completionRate', startDate, endDate),
        analyticsService.getDeviceAnalytics(surveyId, startDate, endDate),
        analyticsService.getForecast(surveyId, 7),
        SurveyService.getSurveyAnalytics(surveyId).catch(() => null)
      ]);

      console.log('Heatmap API response:', {
        heatmap,
        dataType: typeof heatmap.data,
        isArray: Array.isArray(heatmap.data),
        length: heatmap.data?.length,
        firstRow: heatmap.data?.[0],
        startDate,
        endDate
      });

      setOverviewData(overview);
      setTrendData(trends.data || []);
      setHeatmapData(heatmap.data || []);
      setFunnelData(funnel.data || []);
      setQuestionMetrics(questions.data || []);
      setDeviceData(devices);
      setForecastData(forecast.data || []);
      setPublicAnalyticsData(publicData);
      
      // Set first question as selected by default for public data
      if (publicData && publicData.analytics.questionAnalytics.length > 0) {
        setSelectedPublicQuestion(publicData.analytics.questionAnalytics[0].questionId);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      // Handle error object properly - extract message string
      const errorMessage = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({});
  };

  // Helper functions for public analytics rendering
  const renderPublicPieChart = (data: Array<{ option?: string; rating?: number; count: number; percentage: number }>, title: string) => {
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

  const renderPublicBarChart = (data: Array<{ option?: string; rating?: number; count: number; percentage: number }>, title: string) => {
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
      <div className="advanced-analytics">
        <div className="analytics-page-header">
          <h1 className="analytics-page-title">Comprehensive Analytics Dashboard</h1>
          <p className="analytics-page-subtitle">Loading your analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="advanced-analytics">
        <EmptyState
          icon={<FiActivity />}
          title="Failed to Load Analytics"
          message={typeof error === 'string' ? error : 'An error occurred while loading analytics data'}
          action={{
            label: 'Retry',
            onClick: fetchAnalyticsData
          }}
        />
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title">Comprehensive Analytics Dashboard</h1>
          <p className="analytics-page-subtitle">
            Advanced insights and visualizations for data-driven decisions
          </p>
        </div>
        <ExportButton
          data={{ overview: overviewData, trends: trendData, questions: questionMetrics, devices: deviceData }}
          type="full"
          filename="analytics-report"
        />
      </div>

      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      <div className="analytics-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiBarChart2 /> Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <FiFileText /> Questions
        </button>
        <button
          className={`tab-button ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          <FiFilter /> Funnel
        </button>
        <button
          className={`tab-button ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <FiActivity /> Heatmap
        </button>
        <button
          className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <FiSmartphone /> Devices
        </button>
        <button
          className={`tab-button ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          <FiTarget /> Segments
        </button>
        <button
          className={`tab-button ${activeTab === 'attention' ? 'active' : ''}`}
          onClick={() => setActiveTab('attention')}
        >
          <FiEye /> Attention
        </button>
        <button
          className={`tab-button ${activeTab === 'ai-insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-insights')}
        >
          <FiCpu /> AI Insights
        </button>
        <button
          className={`tab-button ${activeTab === 'data-quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('data-quality')}
        >
          <FiSettings /> Data Quality
        </button>
        <button
          className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          <FiTrendingUp /> Predictions
        </button>
        <button
          className={`tab-button ${activeTab === 'behavioral-trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavioral-trends')}
        >
          <FiUsers /> Behavioral
        </button>
        <button
          className={`tab-button ${activeTab === 'public-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('public-data')}
        >
          <FiGlobe /> Public Data
        </button>
      </div>

      <div className="analytics-content" role="main">
        {activeTab === 'overview' && (
          <div className="analytics-section">
            {overviewData && (
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-label">Total Responses</div>
                  <div className="metric-value">{overviewData.totalResponses || 0}</div>
                  <div className="metric-trend">
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>All time</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Completion Rate</div>
                  <div className="metric-value">{overviewData.completionRate ? `${overviewData.completionRate.toFixed(1)}%` : '0%'}</div>
                  <div className="metric-trend">
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Average</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Attention Score</div>
                  <div className="metric-value">{overviewData.attentionScore || 0}</div>
                  <div className="metric-trend">
                    {overviewData.sparklineData && overviewData.sparklineData.length > 0 && (
                      <SparklineComponent 
                        data={overviewData.sparklineData.map((d: any) => d.count)} 
                        width={80}
                        height={24}
                      />
                    )}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Avg Time</div>
                  <div className="metric-value">{overviewData.avgCompletionTime ? `${overviewData.avgCompletionTime}s` : 'N/A'}</div>
                  <div className="metric-trend">
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Per response</span>
                  </div>
                </div>
              </div>
            )}

            <ErrorBoundary>
              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Response Trends</h3>
                  <ExportButton data={trendData} type="trends" filename="response-trends" />
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
                    icon={<FiTrendingUp />}
                    title="No Trend Data"
                    message="Response trends will appear here once you have survey responses."
                  />
                )}
              </div>
            </ErrorBoundary>

            {forecastData && forecastData.length > 0 && (
              <ErrorBoundary>
                <div className="chart-card">
                  <h3>7-Day Response Forecast</h3>
                  <ForecastChart
                    historicalData={trendData.slice(-7)}
                    forecastData={forecastData}
                    confidenceInterval={true}
                  />
                </div>
              </ErrorBoundary>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Question Performance Analysis</h3>
                  <ExportButton data={questionMetrics} type="questions" filename="question-metrics" />
                </div>
                {questionMetrics.length > 0 ? (
                  <QuestionPerformanceTable
                    questions={questionMetrics}
                    onQuestionClick={(questionId) => {
                      const question = questionMetrics.find(q => q.questionId === questionId);
                      if (question) setSelectedQuestion(question);
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={<FiFileText />}
                    title="No Question Data"
                    message="No question metrics available for this survey yet."
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'funnel' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Survey Completion Funnel</h3>
                  <ExportButton data={funnelData} type="funnel" filename="funnel-analysis" />
                </div>
                {(() => {
                  console.log('Funnel tab - data check:', {
                    funnelData,
                    isArray: Array.isArray(funnelData),
                    length: funnelData?.length,
                    firstStage: funnelData?.[0],
                    surveyId,
                    filters
                  });
                  
                  // Always show the funnel component - it handles empty data gracefully
                  return (
                    <FunnelChartComponent 
                      data={funnelData && Array.isArray(funnelData) && funnelData.length > 0 ? funnelData : []} 
                    />
                  );
                })()}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Response Time Heatmap</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Shows when users typically respond to your survey
                  </p>
                </div>
                {(() => {
                  console.log('Heatmap tab - data check:', {
                    heatmapData,
                    isArray: Array.isArray(heatmapData),
                    length: heatmapData?.length,
                    firstRow: heatmapData?.[0],
                    surveyId,
                    filters
                  });
                  
                  // Always show the heatmap component - it handles empty data gracefully
                  return (
                    <HeatmapComponent
                      data={heatmapData && Array.isArray(heatmapData) && heatmapData.length > 0 ? heatmapData : []}
                      xLabels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
                      yLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                    />
                  );
                })()}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Device & Browser Analytics</h3>
                  <ExportButton data={deviceData} type="devices" filename="device-analytics" />
                </div>
                {deviceData && (deviceData.devices.mobile + deviceData.devices.desktop + deviceData.devices.tablet) > 0 ? (
                  <DeviceBreakdownChart
                    deviceData={deviceData.devices}
                    browserData={deviceData.browsers}
                  />
                ) : (
                  <EmptyState
                    icon={<FiSmartphone />}
                    title="No Device Data"
                    message="No device information available yet."
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'segments' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <SegmentBuilder surveyId={surveyId} />
            </ErrorBoundary>
            <ErrorBoundary>
              <SegmentComparison surveyId={surveyId} />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'attention' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <AttentionDashboard 
                surveyId={surveyId} 
                isPublic={publicAnalyticsData?.survey?.is_public || false}
              />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'ai-insights' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <AIInsightsDashboard surveyId={surveyId} />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'data-quality' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <DataQualityManager surveyId={surveyId} />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'predictions' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <PredictiveAnalytics surveyId={surveyId} />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'behavioral-trends' && surveyId && (
          <div className="analytics-section">
            <ErrorBoundary>
              <BehavioralTrendsPanel 
                surveyId={surveyId} 
                dateRange={filters.dateRange}
              />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'public-data' && (
          <div className="analytics-section" style={{ maxWidth: '1600px', margin: '0 auto' }}>
            {publicAnalyticsData ? (
              <>
                {/* Summary Stats */}
                <div className="summary-stats" style={{ marginBottom: '40px' }}>
                  <div className="stat-card">
                    <div className="stat-icon"><FiUsers /></div>
                    <div className="stat-content">
                      <h3>Total Responses</h3>
                      <div className="stat-value">{publicAnalyticsData.analytics.totalResponses}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><FiHelpCircle /></div>
                    <div className="stat-content">
                      <h3>Questions</h3>
                      <div className="stat-value">{publicAnalyticsData.analytics.questionAnalytics.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><FiClock /></div>
                    <div className="stat-content">
                      <h3>Avg. Time</h3>
                      <div className="stat-value">
                        {publicAnalyticsData.analytics.averageCompletionTime 
                          ? `${Math.floor(publicAnalyticsData.analytics.averageCompletionTime / 60)}m ${publicAnalyticsData.analytics.averageCompletionTime % 60}s`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><FiCalendar /></div>
                    <div className="stat-content">
                      <h3>Created</h3>
                      <div className="stat-value">
                        {new Date(publicAnalyticsData.survey.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><FiTrendingUp /></div>
                    <div className="stat-content">
                      <h3>Completion Rate</h3>
                      <div className="stat-value">{publicAnalyticsData.analytics.completionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><FiUser /></div>
                    <div className="stat-content">
                      <h3>Author</h3>
                      <div className="stat-value" style={{ fontSize: '16px' }}>{publicAnalyticsData.survey.author.name}</div>
                    </div>
                  </div>
                </div>

                {/* Response Timeline */}
                {publicAnalyticsData.analytics.responseTimeline && publicAnalyticsData.analytics.responseTimeline.length > 0 && (
                  <div className="timeline-chart" style={{ marginBottom: '40px' }}>
                    <h3>Response Timeline (Last 30 Days)</h3>
                    <div className="timeline-bars">
                      {publicAnalyticsData.analytics.responseTimeline.map((item: any, index: number) => {
                        const maxResponses = Math.max(...publicAnalyticsData.analytics.responseTimeline.map((d: any) => d.responses), 1);
                        return (
                          <div key={index} className="timeline-bar">
                            <span className="timeline-count">{item.responses}</span>
                            <div 
                              className="timeline-fill"
                              style={{ height: `${(item.responses / maxResponses) * 100}%` }}
                              title={`${item.date}: ${item.responses} responses`}
                            ></div>
                            <span className="timeline-label">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question Selector */}
                {publicAnalyticsData.analytics.questionAnalytics.length > 0 && (
                  <div className="question-selector" style={{ marginBottom: '40px' }}>
                    <h3>Question Analysis</h3>
                    <div className="question-tabs">
                      {publicAnalyticsData.analytics.questionAnalytics.map((question: any, index: number) => (
                        <button
                          key={question.questionId}
                          className={`question-tab ${selectedPublicQuestion === question.questionId ? 'active' : ''}`}
                          onClick={() => setSelectedPublicQuestion(question.questionId)}
                        >
                          Q{index + 1}: {question.question.substring(0, 50)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Analytics */}
                {selectedPublicQuestion && (() => {
                  const selectedQuestionData = publicAnalyticsData.analytics.questionAnalytics.find(
                    (q: any) => q.questionId === selectedPublicQuestion
                  );
                  
                  if (!selectedQuestionData) return null;

                  return (
                    <div className="question-analytics">
                      <div className="question-info">
                        <h4>{selectedQuestionData.question}</h4>
                        <div className="question-stats">
                          <span className="stat">
                            <FiBarChart2 style={{ display: 'inline', marginRight: '4px' }} /> {selectedQuestionData.responseCount} responses ({selectedQuestionData.responseRate.toFixed(1)}% response rate)
                          </span>
                          {selectedQuestionData.averageRating && (
                            <span className="stat">
                              <FiStar style={{ display: 'inline', marginRight: '4px' }} /> {selectedQuestionData.averageRating.toFixed(1)} avg rating
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedQuestionData.optionBreakdown && selectedQuestionData.optionBreakdown.length > 0 && (
                        <div className="charts-grid">
                          <div className="chart-section">
                            {renderPublicPieChart(selectedQuestionData.optionBreakdown.map((item: any) => ({
                              option: item.option,
                              count: item.count,
                              percentage: item.percentage
                            })), 'Response Distribution')}
                          </div>
                          <div className="chart-section">
                            {renderPublicBarChart(selectedQuestionData.optionBreakdown.map((item: any) => ({
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
                            {renderPublicPieChart(selectedQuestionData.ratingBreakdown.map((item: any) => ({
                              rating: item.rating,
                              count: item.count,
                              percentage: item.percentage
                            })), 'Rating Distribution')}
                          </div>
                          <div className="chart-section">
                            {renderPublicBarChart(selectedQuestionData.ratingBreakdown.map((item: any) => ({
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
                            {selectedQuestionData.sampleResponses.map((response: string, index: number) => (
                              <div key={index} className="text-response-item">
                                "{response}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <EmptyState
                icon={<FiGlobe />}
                title="No Public Data Available"
                message="Public survey analytics data will appear here once available."
              />
            )}
          </div>
        )}
      </div>

      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;
