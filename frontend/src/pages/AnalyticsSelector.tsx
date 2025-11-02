import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SurveyService as surveyService } from '../services/surveyService';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, FiTrendingUp, FiActivity, FiZap, 
  FiTarget, FiEye, FiArrowRight, FiStar
} from 'react-icons/fi';
import './AnalyticsSelector.css';

interface Survey {
  id: string;
  title: string;
  responseCount: number;
  isActive: boolean;
}

const AnalyticsSelector: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyData();
    }
  }, [surveyId]);

  const fetchSurveyData = async () => {
    try {
      // Get survey data from user surveys list
      const surveys = await surveyService.getUserSurveys();
      const foundSurvey = surveys.find(s => s.id === surveyId);
      
      if (foundSurvey) {
        setSurvey({
          id: foundSurvey.id,
          title: foundSurvey.title,
          responseCount: foundSurvey.response_count || 0,
          isActive: foundSurvey.is_active
        });
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyticsOptions = [
    {
      id: 'basic',
      title: 'Basic Analytics',
      description: 'Essential metrics and key insights',
      icon: <FiBarChart2 />,
      color: '#3b82f6',
      features: ['Response count', 'Completion rate', 'Basic trends', 'Quick insights'],
      path: `/basic-analytics/${surveyId}`,
      recommended: false
    },
    {
      id: 'enhanced',
      title: 'Enhanced Analytics',
      description: 'Detailed visualizations with filtering',
      icon: <FiTrendingUp />,
      color: '#8b5cf6',
      features: ['Advanced charts', 'Funnel analysis', 'Heatmaps', 'Device breakdown'],
      path: `/enhanced-analytics/${surveyId}`,
      recommended: false
    },
    {
      id: 'advanced',
      title: 'Advanced Dashboard',
      description: 'Comprehensive analysis tools',
      icon: <FiActivity />,
      color: '#06b6d4',
      features: ['Question analysis', 'Response patterns', 'Time-based insights', 'Export options'],
      path: `/advanced-analytics/${surveyId}`,
      recommended: false
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Dashboard',
      description: 'All features with AI-powered insights',
      icon: <FiZap />,
      color: '#10b981',
      features: ['AI insights', 'Predictive analytics', 'Data quality', 'Segment comparison'],
      path: `/comprehensive-analytics/${surveyId}`,
      recommended: true
    },
    {
      id: 'attention',
      title: 'Attention Analytics',
      description: 'Monitor survey health and issues',
      icon: <FiTarget />,
      color: '#f59e0b',
      features: ['Health monitoring', 'Issue detection', 'Smart recommendations', 'Alert system'],
      path: `/attention-analytics/${surveyId}`,
      recommended: false
    }
  ];

  if (loading) {
    return (
      <div className="analytics-selector">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-selector">
      <motion.div 
        className="selector-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>📊 Choose Your Analytics Experience</h1>
          {survey && (
            <div className="survey-info">
              <h2>{survey.title}</h2>
              <div className="survey-stats">
                <span className="stat">
                  <FiEye /> {survey.responseCount} responses
                </span>
                <span className={`status ${survey.isActive ? 'active' : 'inactive'}`}>
                  {survey.isActive ? '🟢 Active' : '⏸️ Inactive'}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="analytics-options">
        {analyticsOptions.map((option, index) => (
          <motion.div
            key={option.id}
            className={`analytics-option ${option.recommended ? 'recommended' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {option.recommended && (
              <div className="recommended-badge">
                <FiStar /> Recommended
              </div>
            )}
            
            <Link to={option.path} className="option-link">
              <div className="option-header">
                <div 
                  className="option-icon"
                  style={{ backgroundColor: `${option.color}20`, color: option.color }}
                >
                  {option.icon}
                </div>
                <div className="option-info">
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                </div>
                <div className="option-arrow">
                  <FiArrowRight />
                </div>
              </div>
              
              <div className="option-features">
                <ul>
                  {option.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="feature-bullet">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="selector-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="footer-content">
          <h3>💡 Not sure which to choose?</h3>
          <p>
            Start with <strong>Basic Analytics</strong> for quick insights, or jump to 
            <strong> Comprehensive Dashboard</strong> for the full experience with AI-powered features.
          </p>
          <div className="quick-links">
            <Link to="/attention-analytics" className="quick-link">
              🎯 View All Survey Health
            </Link>
            <Link to="/analytics" className="quick-link">
              📈 Overall Analytics
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsSelector;