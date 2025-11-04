import React, { useState, useEffect } from 'react';
import segmentsService, { Segment } from '../../services/segmentsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './SegmentComparison.css';

interface SegmentComparisonProps {
  surveyId: string;
}

const SegmentComparison: React.FC<SegmentComparisonProps> = ({ surveyId }) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, [surveyId]);

  useEffect(() => {
    if (selectedSegments.length >= 2) {
      fetchComparison();
    } else {
      setComparisonData(null);
    }
  }, [selectedSegments]);

  const fetchSegments = async () => {
    try {
      const data = await segmentsService.getSegments(surveyId);
      setSegments(data || []);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const data = await segmentsService.compareSegments(surveyId, selectedSegments);
      console.log('Comparison data received:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      console.log('Has segments:', data?.segments);
      setComparisonData(data);
    } catch (error) {
      console.error('Error comparing segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSegment = (segmentId: string) => {
    if (selectedSegments.includes(segmentId)) {
      setSelectedSegments(selectedSegments.filter(id => id !== segmentId));
    } else {
      if (selectedSegments.length < 5) {
        setSelectedSegments([...selectedSegments, segmentId]);
      } else {
        alert('You can compare up to 5 segments at a time');
      }
    }
  };

  const getSegmentById = (id: string) => {
    return segments.find(s => s._id === id);
  };

  const getSegmentsArray = () => {
    if (!comparisonData) return [];
    return Array.isArray(comparisonData) ? comparisonData : (comparisonData.segments || []);
  };

  const getBestValue = (metric: string): number => {
    const segments = getSegmentsArray();
    if (segments.length === 0) return 0;
    return Math.max(...segments.map((d: any) => d.metrics?.[metric] || 0));
  };

  const prepareChartData = () => {
    const segments = getSegmentsArray();
    if (segments.length === 0) return [];
    const metrics = ['responseCount', 'completionRate', 'avgCompletionTime'];
    return metrics.map(metric => {
      const dataPoint: any = { 
        metric: metric.replace(/([A-Z])/g, ' $1').trim()
      };
      segments.forEach((segment: any) => {
        dataPoint[segment.segmentName || segment.name] = segment.metrics?.[metric] || 0;
      });
      return dataPoint;
    });
  };

  if (segments.length === 0) {
    return (
      <div className="segment-comparison">
        <div className="comparison-empty">
          <div className="comparison-empty-icon">📊</div>
          <p>No segments available. Create segments first to compare them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="segment-comparison">
      <div className="segment-comparison-header">
        <h3 className="segment-comparison-title">Compare Segments</h3>
        <p className="segment-comparison-subtitle">
          Select 2-5 segments to compare their performance metrics
        </p>
      </div>

      <div className="segment-selector">
        {segments.map((segment, index) => {
          const isSelected = selectedSegments.includes(segment._id);
          return (
            <div
              key={segment._id || `segment-${index}`}
              className={`segment-chip ${isSelected ? 'selected' : ''}`}
              style={{
                background: isSelected ? segment.color + '20' : '#f3f4f6',
                color: isSelected ? segment.color : '#6b7280'
              }}
              onClick={() => toggleSegment(segment._id)}
            >
              <div
                className="segment-chip-color"
                style={{ background: segment.color }}
              />
              <span>{segment.name}</span>
              {isSelected && (
                <button
                  className="segment-chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSegment(segment._id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedSegments.length < 2 && (
        <p className="comparison-limit-note">
          Select at least 2 segments to start comparison
        </p>
      )}

      {loading && (
        <div className="comparison-loading">Loading comparison data...</div>
      )}

      {!loading && comparisonData && (Array.isArray(comparisonData) ? comparisonData.length >= 2 : comparisonData.segments && comparisonData.segments.length >= 2) && (
        <>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                {getSegmentsArray().map((segment, index) => (
                  <th key={segment.segmentId || `segment-header-${index}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: getSegmentById(segment.segmentId)?.color || '#3b82f6'
                        }}
                      />
                      {segment.segmentName || segment.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="metric-cell">Response Count</td>
                {getSegmentsArray().map((segment, index) => {
                  const value = segment.metrics?.responseCount || 0;
                  const isBest = value === getBestValue('responseCount');
                  return (
                    <td key={segment.segmentId || `response-count-${index}`} className={isBest ? 'best-value' : ''}>
                      {value}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="metric-cell">Completion Rate</td>
                {getSegmentsArray().map((segment, index) => {
                  const value = segment.metrics?.completionRate || 0;
                  const isBest = value === getBestValue('completionRate');
                  return (
                    <td key={segment.segmentId || `completion-rate-${index}`} className={isBest ? 'best-value' : ''}>
                      {value.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="metric-cell">Avg Completion Time</td>
                {getSegmentsArray().map((segment, index) => {
                  const value = segment.metrics?.avgCompletionTime || 0;
                  const segments = getSegmentsArray();
                  const isBest = value === Math.min(...segments.map(d => d.metrics?.avgCompletionTime || Infinity));
                  return (
                    <td key={segment.segmentId || `completion-time-${index}`} className={isBest ? 'best-value' : ''}>
                      {value > 0 ? `${Math.round(value)}s` : 'N/A'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          <div className="comparison-charts">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                {getSegmentsArray().map((segment, index) => (
                  <Bar
                    key={segment.segmentId || `bar-${index}`}
                    dataKey={segment.segmentName || segment.name}
                    fill={getSegmentById(segment.segmentId)?.color || '#3b82f6'}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default SegmentComparison;
