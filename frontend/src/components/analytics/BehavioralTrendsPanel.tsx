import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/analyticsService';
import './BehavioralTrendsPanel.css';

interface BehavioralTrend {
  id: string;
  title: string;
  description: string;
  category: 'common_behavior' | 'sentiment_pattern' | 'demographic_trend' | 'usage_pattern' | 'preference_cluster';
  confidence: number;
  supportingData: {
    responseCount: number;
    percentage: number;
    examples: string[];
    relatedQuestions: string[];
  };
  insights: string[];
  recommendations: string[];
}

interface BehavioralAnalysis {
  trends: BehavioralTrend[];
  summary: {
    totalResponses: number;
    analysisDate: string;
    keyFindings: string[];
    overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    confidenceScore: number;
  };
  patterns: {
    mostCommonBehaviors: string[];
    emergingTrends: string[];
    demographicInsights: string[];
    correlations: Array<{
      question1: string;
      question2: string;
      correlation: string;
      strength: number;
    }>;
  };
}

interface BehavioralTrendsPanelProps {
  surveyId: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

const BehavioralTrendsPanel: React.FC<BehavioralTrendsPanelProps> = ({
  surveyId,
  dateRange
}) => {
  const [analysis, setAnalysis] = useState<BehavioralAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

  useEffect(() => {
    fetchBehavioralTrends();
  }, [surveyId, dateRange]);

  const fetchBehavioralTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await analyticsService.getBehavioralTrends(
        surveyId,
        dateRange?.start,
        dateRange?.end
      );
      
      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching behavioral trends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load behavioral trends');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      common_behavior: '👥',
      sentiment_pattern: '💭',
      demographic_trend: '📊',
      usage_pattern: '🔄',
      preference_cluster: '🎯'
    };
    return icons[category as keyof typeof icons] || '📈';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      common_behavior: '#3b82f6',
      sentiment_pattern: '#8b5cf6',
      demographic_trend: '#06b6d4',
      usage_pattern: '#10b981',
      preference_cluster: '#f59e0b'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getSentimentIcon = (sentiment: string) => {
    const icons = {
      positive: '😊',
      neutral: '😐',
      negative: '😔',
      mixed: '🤔'
    };
    return icons[sentiment as keyof typeof icons] || '😐';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const filteredTrends = analysis?.trends.filter(trend => 
    selectedCategory === 'all' || trend.category === selectedCategory
  ) || [];

  if (loading) {
    return (
      <div className="behavioral-trends-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>🧠 Analyzing behavioral patterns...</p>
          <small>This may take a moment as we process your survey data</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="behavioral-trends-panel">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Behavioral Trends</h3>
          <p>{error}</p>
          <button onClick={fetchBehavioralTrends} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="behavioral-trends-panel">
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <h3>No Behavioral Analysis Available</h3>
          <p>Unable to analyze behavioral trends at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="behavioral-trends-panel">
      <div className="panel-header">
        <h2>🧠 Behavioral Trends Analysis</h2>
        <p>AI-powered insights into response patterns and user behavior</p>
      </div>

      {/* Summary Section */}
      <div className="analysis-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h3>{analysis.summary.totalResponses}</h3>
              <p>Responses Analyzed</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">{getSentimentIcon(analysis.summary.overallSentiment)}</div>
            <div className="summary-content">
              <h3>{analysis.summary.overallSentiment}</h3>
              <p>Overall Sentiment</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <h3>{Math.round(analysis.summary.confidenceScore * 100)}%</h3>
              <p>Analysis Confidence</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon">🔍</div>
            <div className="summary-content">
              <h3>{analysis.trends.length}</h3>
              <p>Trends Identified</p>
            </div>
          </div>
        </div>

        {/* Key Findings */}
        <div className="key-findings">
          <h3>🔑 Key Findings</h3>
          <ul>
            {analysis.summary.keyFindings.map((finding, index) => (
              <li key={index}>{finding}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          All Trends ({analysis.trends.length})
        </button>
        {['common_behavior', 'sentiment_pattern', 'demographic_trend', 'usage_pattern', 'preference_cluster'].map(category => {
          const count = analysis.trends.filter(t => t.category === category).length;
          if (count === 0) return null;
          
          return (
            <button
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryIcon(category)} {category.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Trends List */}
      <div className="trends-list">
        {filteredTrends.map((trend) => (
          <div key={trend.id} className="trend-card">
            <div className="trend-header" onClick={() => setExpandedTrend(expandedTrend === trend.id ? null : trend.id)}>
              <div className="trend-title">
                <span className="trend-icon" style={{ color: getCategoryColor(trend.category) }}>
                  {getCategoryIcon(trend.category)}
                </span>
                <h3>{trend.title}</h3>
                <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(trend.confidence) }}>
                  {Math.round(trend.confidence * 100)}%
                </div>
              </div>
              <div className="trend-stats">
                <span className="response-count">{trend.supportingData.responseCount} responses</span>
                <span className="percentage">{trend.supportingData.percentage}%</span>
                <span className="expand-icon">{expandedTrend === trend.id ? '▼' : '▶'}</span>
              </div>
            </div>

            <div className="trend-description">
              <p>{trend.description}</p>
            </div>

            {expandedTrend === trend.id && (
              <div className="trend-details">
                {trend.insights.length > 0 && (
                  <div className="insights-section">
                    <h4>💡 Insights</h4>
                    <ul>
                      {trend.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {trend.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h4>🎯 Recommendations</h4>
                    <ul>
                      {trend.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {trend.supportingData.examples.length > 0 && (
                  <div className="examples-section">
                    <h4>📝 Examples</h4>
                    <ul>
                      {trend.supportingData.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Patterns Section */}
      {(analysis.patterns.mostCommonBehaviors.length > 0 || 
        analysis.patterns.emergingTrends.length > 0 || 
        analysis.patterns.correlations.length > 0) && (
        <div className="patterns-section">
          <h3>🔍 Behavioral Patterns</h3>
          
          <div className="patterns-grid">
            {analysis.patterns.mostCommonBehaviors.length > 0 && (
              <div className="pattern-card">
                <h4>👥 Most Common Behaviors</h4>
                <ul>
                  {analysis.patterns.mostCommonBehaviors.map((behavior, index) => (
                    <li key={index}>{behavior}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.patterns.emergingTrends.length > 0 && (
              <div className="pattern-card">
                <h4>📈 Emerging Trends</h4>
                <ul>
                  {analysis.patterns.emergingTrends.map((trend, index) => (
                    <li key={index}>{trend}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.patterns.correlations.length > 0 && (
              <div className="pattern-card">
                <h4>🔗 Question Correlations</h4>
                <div className="correlations-list">
                  {analysis.patterns.correlations.map((correlation, index) => (
                    <div key={index} className="correlation-item">
                      <div className="correlation-strength" style={{ 
                        backgroundColor: getConfidenceColor(correlation.strength) 
                      }}>
                        {Math.round(correlation.strength * 100)}%
                      </div>
                      <div className="correlation-description">
                        <p><strong>{correlation.question1}</strong> ↔ <strong>{correlation.question2}</strong></p>
                        <small>{correlation.correlation}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="analysis-footer">
        <small>
          Analysis completed on {new Date(analysis.summary.analysisDate).toLocaleDateString()} 
          using AI-powered behavioral pattern recognition
        </small>
      </div>
    </div>
  );
};

export default BehavioralTrendsPanel;