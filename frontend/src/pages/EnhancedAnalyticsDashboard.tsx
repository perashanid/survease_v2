import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import analyticsService, { FilterCriteria } from '../services/analyticsService';
import { 
  FiTrendingUp, 
  FiBarChart2, 
  FiRefreshCw, 
  FiActivity, 
  FiSmartphone, 
  FiUsers, 
  FiTarget,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle
} from 'react-icons/fi';
import ErrorBoundary from '../components/analytics/ErrorBoundary';
import LoadingSkeleton from '../components/analytics/LoadingSkeleton';
import EmptyState from '../components/analytics/EmptyState';
import LineChartComponent from '../components/analytics/LineChartComponent';
import DeviceBreakdownChart from '../components/analytics/DeviceBreakdownChart';
import HeatmapComponent from '../components/analytics/HeatmapComponent';
import FunnelChartComponent from '../components/analytics/FunnelChartComponent';
import FilterPanel from '../components/analytics/FilterPanel';
import ExportButton from '../components/analytics/ExportButton';
import SparklineComponent from '../components/analytics/SparklineComponent';
import './EnhancedAnalyticsDashboard.css';

const EnhancedAnalyticsDashboard: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'heatmap' | 'devices'>('overview');
  
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [overviewData, setOverviewData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[][]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any>(null);

  useEffect(() => {
    if (surveyId) {
      fetchEnhancedAnalytics();
    }
  }, [surveyId, filters]);

  const fetchEnhancedAnalytics = async () => {
    if (!surveyId) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = filters.dateRange?.start;
      const endDate = filters.dateRange?.end;

      const [overview, trends, heatmap, funnel, devices] = await Promise.all([
        analyticsService.getOverview(surveyId),
        analyticsService.getTrends(surveyId, 'day', startDate, endDate),
        analyticsService.getHeatmap(surveyId, startDate, endDate),
        analyticsService.getFunnel(surveyId, startDate, endDate),
        analyticsService.getDeviceAnalytics(surveyId, startDate, endDate)
      ]);

      setOverviewData(overview);
      setTrendData(trends.data || []);
      setHeatmapData(heatmap.data || []);
      setFunnelData(funnel.data || []);
      setDeviceData(devices);
    } catch (err: any) {
      console.error('Error fetching enhanced analytics:', err);
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
      <div className="enhanced-analytics">
        <div className="analytics-page-header">
          <h1 className="analytics-page-title">Enhanced Analytics</h1>
          <p className="analytics-page-subtitle">Loading your detailed insights...</p>
        </div>
        <LoadingSkeleton type="chart" />
        <LoadingSkeleton type="table" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-analytics">
        <EmptyState
          icon="⚠️"
          title="Failed to Load Analytics"
          message={error}
          action={{
            label: 'Retry',
            onClick: fetchEnhancedAnalytics
          }}
        />
      </div>
    );
  }

  return (
    <div className="enhanced-analytics">
      <div className="analytics-page-header">
        <div>
          <h1 className="analytics-page-title"><FiTrendingUp /> Enhanced Analytics</h1>
          <p className="analytics-page-subtitle">
            Detailed insights with advanced visualizations and filtering
          </p>
        </div>
        <ExportButton
          data={{ overview: overviewData, trends: trendData, funnel: funnelData, devices: deviceData }}
          type="full"
          filename="enhanced-analytics-report"
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
          className={`tab-button ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          <FiRefreshCw /> Funnel
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
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="analytics-section">
            {/* Enhanced Metrics */}
            {overviewData && (
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-icon"><FiUsers /></div>
                    <div className="metric-label">Total Responses</div>
                  </div>
                  <div className="metric-value">{overviewData.totalResponses || 0}</div>
                  <div className="metric-trend">
                    {overviewData.sparklineData && overviewData.sparklineData.length > 0 && (
                      <SparklineComponent 
                        data={overviewData.sparklineData.map((d: any) => d.count)} 
                        width={100}
                        height={30}
                      />
                    )}
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-icon">✅</div>
                    <div className="metric-label">Completion Rate</div>
                  </div>
                  <div className="metric-value">
                    {overviewData.completionRate ? `${overviewData.completionRate.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="metric-description">
                    {overviewData.completionRate > 70 ? 'Excellent' : 
                     overviewData.completionRate > 50 ? 'Good' : 'Needs improvement'}
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-label">Avg Completion Time</div>
                  </div>
                  <div className="metric-value">
                    {overviewData.avgCompletionTime ? `${overviewData.avgCompletionTime}s` : 'N/A'}
                  </div>
                  <div className="metric-description">Per response</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-icon"><FiTarget /></div>
                    <div className="metric-label">Attention Score</div>
                  </div>
                  <div className="metric-value">{overviewData.attentionScore || 0}</div>
                  <div className="metric-description">
                    {(overviewData.attentionScore || 0) < 30 ? <><FiCheckCircle style={{color: 'green'}} /> Healthy</> : 
                     (overviewData.attentionScore || 0) < 70 ? <><FiAlertCircle style={{color: 'orange'}} /> Monitor</> : 
                     <><FiXCircle style={{color: 'red'}} /> Critical</>}
                  </div>
                </div>
              </div>
            )}

            {/* Response Trends */}
            <ErrorBoundary>
              <div className="chart-card">
                <div className="chart-header">
                  <h3><FiTrendingUp /> Response Trends</h3>
                  <p>Daily response activity with filtering applied</p>
                </div>
                {trendData && trendData.length > 0 ? (
                  <LineChartComponent
                    data={trendData.map(d => ({ date: d.label, count: d.count }))}
                    xAxisKey="date"
                    yAxisKey="count"
                    height={350}
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
          </div>
        )}

        {activeTab === 'funnel' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div className="chart-header">
                  <h3><FiRefreshCw /> Response Funnel</h3>
                  <p>Track user progression through your survey questions</p>
                </div>
                {funnelData && funnelData.length > 0 ? (
                  <FunnelChartComponent data={funnelData} />
                ) : (
                  <EmptyState
                    icon={<FiRefreshCw />}
                    title="No Funnel Data"
                    message="Funnel analysis will appear here once you have survey responses."
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div className="chart-header">
                  <h3><FiActivity /> Response Heatmap</h3>
                  <p>Visualize response patterns by time of day and day of week</p>
                </div>
                {heatmapData && heatmapData.length > 0 ? (
                  <HeatmapComponent 
                    data={heatmapData}
                    xLabels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
                    yLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                  />
                ) : (
                  <EmptyState
                    icon={<FiActivity />}
                    title="No Heatmap Data"
                    message="Response heatmap will appear here once you have survey responses."
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="analytics-section">
            <ErrorBoundary>
              <div className="chart-card">
                <div className="chart-header">
                  <h3><FiSmartphone /> Device & Browser Analytics</h3>
                  <p>Understand how users access your survey</p>
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
                    message="Device analytics will appear here once you have survey responses."
                  />
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;