import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import analyticsService, { FilterCriteria } from '../services/analyticsService';
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

      const [overview, trends, heatmap, funnel, questions, devices, forecast] = await Promise.all([
        analyticsService.getOverview(surveyId),
        analyticsService.getTrends(surveyId, 'day', startDate, endDate),
        analyticsService.getHeatmap(surveyId, startDate, endDate),
        analyticsService.getFunnel(surveyId, startDate, endDate),
        analyticsService.getQuestionMetrics(surveyId, 'completionRate', startDate, endDate),
        analyticsService.getDeviceAnalytics(surveyId, startDate, endDate),
        analyticsService.getForecast(surveyId, 7)
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
          icon="⚠️"
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
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          📝 Questions
        </button>
        <button
          className={`tab-button ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          🔄 Funnel
        </button>
        <button
          className={`tab-button ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          🔥 Heatmap
        </button>
        <button
          className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          📱 Devices
        </button>
        <button
          className={`tab-button ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          🎯 Segments
        </button>
        <button
          className={`tab-button ${activeTab === 'attention' ? 'active' : ''}`}
          onClick={() => setActiveTab('attention')}
        >
          🎯 Attention
        </button>
        <button
          className={`tab-button ${activeTab === 'ai-insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-insights')}
        >
          🤖 AI Insights
        </button>
        <button
          className={`tab-button ${activeTab === 'data-quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('data-quality')}
        >
          ⚙️ Data Quality
        </button>
        <button
          className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          🔮 Predictions
        </button>
        <button
          className={`tab-button ${activeTab === 'behavioral-trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('behavioral-trends')}
        >
          🧠 Behavioral
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
                    icon="📈"
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
                    icon="📝"
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
                    icon="📱"
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
              <AttentionDashboard surveyId={surveyId} />
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
