import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import analyticsService, { FilterCriteria } from '../services/analyticsService';
import LineChartComponent from '../components/analytics/LineChartComponent';
import PieChartComponent from '../components/analytics/PieChartComponent';
import HeatmapComponent from '../components/analytics/HeatmapComponent';
import FunnelChartComponent from '../components/analytics/FunnelChartComponent';
import QuestionPerformanceTable from '../components/analytics/QuestionPerformanceTable';
import FilterPanel from '../components/analytics/FilterPanel';
import './SurveyAnalytics.css';

const EnhancedSurveyAnalytics: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'funnel' | 'heatmap' | 'devices'>('overview');
  
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[][]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [questionMetrics, setQuestionMetrics] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);

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

      // Fetch all analytics data
      const [trends, heatmap, funnel, questions, devices, forecast] = await Promise.all([
        analyticsService.getTrends(surveyId, 'day', startDate, endDate),
        analyticsService.getHeatmap(surveyId, startDate, endDate),
        analyticsService.getFunnel(surveyId, startDate, endDate),
        analyticsService.getQuestionMetrics(surveyId, 'completionRate', startDate, endDate),
        analyticsService.getDeviceAnalytics(surveyId, startDate, endDate),
        analyticsService.getForecast(surveyId, 7)
      ]);

      setTrendData(trends.data || []);
      setHeatmapData(heatmap.data || []);
      setFunnelData(funnel.data || []);
      setQuestionMetrics(questions.data || []);
      setDeviceData(devices);
      setForecastData(forecast.data || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
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

  const prepareDeviceChartData = () => {
    if (!deviceData?.devices) return [];
    
    return [
      { name: 'Mobile', value: deviceData.devices.mobile },
      { name: 'Desktop', value: deviceData.devices.desktop },
      { name: 'Tablet', value: deviceData.devices.tablet }
    ].filter(item => item.value > 0);
  };

  const prepareBrowserChartData = () => {
    if (!deviceData?.browsers) return [];
    
    return Object.entries(deviceData.browsers).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Survey Analytics</h1>
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
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Questions
        </button>
        <button
          className={`tab-button ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          Funnel
        </button>
        <button
          className={`tab-button ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          Heatmap
        </button>
        <button
          className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          Devices
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="analytics-section">
            <div className="chart-card">
              <h3>Response Trends</h3>
              <LineChartComponent
                data={trendData.map(d => ({ date: d.label, count: d.count }))}
                xAxisKey="date"
                yAxisKey="count"
                height={300}
              />
            </div>

            {forecastData.length > 0 && (
              <div className="chart-card">
                <h3>7-Day Forecast</h3>
                <LineChartComponent
                  data={forecastData.map(d => ({ 
                    date: new Date(d.date).toLocaleDateString(), 
                    count: d.count 
                  }))}
                  xAxisKey="date"
                  yAxisKey="count"
                  height={250}
                  color="#f59e0b"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="analytics-section">
            <div className="chart-card">
              <h3>Question Performance</h3>
              <QuestionPerformanceTable questions={questionMetrics} />
            </div>
          </div>
        )}

        {activeTab === 'funnel' && (
          <div className="analytics-section">
            <div className="chart-card">
              <h3>Completion Funnel</h3>
              <FunnelChartComponent data={funnelData} />
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="analytics-section">
            <div className="chart-card">
              <h3>Response Time Heatmap</h3>
              <HeatmapComponent
                data={heatmapData}
                xLabels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
                yLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
              />
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="analytics-section">
            <div className="chart-grid">
              <div className="chart-card">
                <h3>Device Types</h3>
                <PieChartComponent
                  data={prepareDeviceChartData()}
                  nameKey="name"
                  valueKey="value"
                  height={300}
                />
              </div>

              <div className="chart-card">
                <h3>Browser Distribution</h3>
                <PieChartComponent
                  data={prepareBrowserChartData()}
                  nameKey="name"
                  valueKey="value"
                  height={300}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSurveyAnalytics;
