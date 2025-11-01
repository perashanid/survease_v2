import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SurveyService, Survey } from '../services/surveyService';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FiBarChart2, FiTrendingUp, FiPlus, FiSearch, FiX, 
  FiGlobe, FiLock, FiEye, FiTrash2, FiLink, FiCopy,
  FiCheckCircle, FiCalendar, FiHelpCircle, FiUsers
} from 'react-icons/fi';
import Analytics from './Analytics';
import InvitationManager from '../components/survey/InvitationManager';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [showInvitationManager, setShowInvitationManager] = useState<{ surveyId: string; surveyTitle: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      console.log('Fetching user surveys...');
      const data = await SurveyService.getUserSurveys();
      console.log('User surveys data:', data);
      setSurveys(data);
    } catch (err: any) {
      setError('Failed to load surveys');
      console.error('Error fetching surveys:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async (slug: string) => {
    try {
      // Generate the correct frontend URL
      const frontendUrl = `${window.location.origin}/survey/${slug}`;
      await navigator.clipboard.writeText(frontendUrl);
      setCopiedUrl(frontendUrl);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDeleteSurvey = async (surveyId: string, surveyTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${surveyTitle}"? This action cannot be undone.`)) {
      try {
        await SurveyService.deleteSurvey(surveyId);
        setSurveys(surveys.filter(s => s.id !== surveyId));
      } catch (err: any) {
        setError('Failed to delete survey');
        console.error('Error deleting survey:', err);
      }
    }
  };

  const handleToggleVisibility = async (surveyId: string, currentVisibility: boolean, surveyTitle: string) => {
    const newVisibility = !currentVisibility;
    const action = newVisibility ? 'public' : 'private';
    
    if (window.confirm(`Are you sure you want to make "${surveyTitle}" ${action}?`)) {
      try {
        await SurveyService.toggleSurveyVisibility(surveyId, newVisibility);
        setSurveys(surveys.map(s => 
          s.id === surveyId 
            ? { ...s, is_public: newVisibility }
            : s
        ));
      } catch (err: any) {
        setError('Failed to update survey visibility');
        console.error('Error updating survey visibility:', err);
      }
    }
  };

  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (survey.description && survey.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalResponses = surveys.reduce((sum, survey) => sum + survey.response_count, 0);
  const activeSurveys = surveys.filter(s => s.is_active).length;
  const publicSurveys = surveys.filter(s => s.is_public).length;

  if (activeTab !== 'overview') {
    return <Analytics />;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.firstName || user?.email}!</p>
          </div>
          <div className="header-actions">
            <div className="dashboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <FiBarChart2 /> Overview
              </button>
              <button 
                className={`tab-btn ${activeTab !== 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <FiTrendingUp /> Analytics
              </button>
            </div>
            <Link to="/create" className="btn btn-primary">
              <FiPlus /> Create New Survey
            </Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Statistics */}
        <div className="stats-grid">
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
          >
            <div className="stat-icon"><FiBarChart2 /></div>
            <div className="stat-number">{surveys.length}</div>
            <div className="stat-label">Total Surveys</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="stat-icon"><FiUsers /></div>
            <div className="stat-number">{totalResponses}</div>
            <div className="stat-label">Total Responses</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="stat-icon"><FiCheckCircle /></div>
            <div className="stat-number">{activeSurveys}</div>
            <div className="stat-label">Active Surveys</div>
          </motion.div>
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="stat-icon"><FiGlobe /></div>
            <div className="stat-number">{publicSurveys}</div>
            <div className="stat-label">Public Surveys</div>
          </motion.div>
        </div>



        {/* Surveys List */}
        <div className="surveys-section">
          <div className="surveys-header">
            <h2>Your Surveys</h2>
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search surveys by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="clear-search"
                  title="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : surveys.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="empty-icon"><FiBarChart2 /></div>
              <h3>No Surveys Yet</h3>
              <p>Create your first survey to start collecting responses!</p>
              <Link to="/create" className="btn btn-primary">
                <FiPlus /> Create Your First Survey
              </Link>
            </motion.div>
          ) : (
            <>
              {searchQuery && (
                <div className="search-results-info">
                  Found {filteredSurveys.length} survey{filteredSurveys.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </div>
              )}
              <div className="surveys-list">
                {(searchQuery ? filteredSurveys : surveys).map((survey) => (
                <div key={survey.id} className="survey-item">
                  <div className="survey-info">
                    <div className="survey-header">
                      <h3 className="survey-title">{survey.title}</h3>
                      <div className="survey-badges">
                        {survey.is_public && (
                          <span className="badge badge-public">Public</span>
                        )}
                        {!survey.is_active && (
                          <span className="badge badge-inactive">Inactive</span>
                        )}
                        {survey.original_survey_id && (
                          <span className="badge badge-imported">Imported</span>
                        )}
                      </div>
                    </div>
                    {survey.description && (
                      <p className="survey-description">{survey.description}</p>
                    )}
                    <div className="survey-meta">
                      <span className="meta-item">
                        <FiBarChart2 /> {survey.response_count} responses
                      </span>
                      <span className="meta-item">
                        <FiCalendar /> {new Date(survey.created_at).toLocaleDateString()}
                      </span>
                      <span className="meta-item">
                        <FiHelpCircle /> {survey.questions.length} questions
                      </span>
                    </div>
                  </div>
                  <div className="survey-actions">
                    <div className="analytics-dropdown">
                      <Link
                        to={`/comprehensive-analytics/${survey.id}`}
                        className="btn btn-primary btn-sm"
                        title="View comprehensive analytics dashboard"
                      >
                        <FiBarChart2 /> Analytics
                      </Link>
                      <div className="analytics-dropdown-menu">
                        <Link to={`/survey-analytics/${survey.id}`} className="dropdown-item">
                          📊 Basic Analytics
                        </Link>
                        <Link to={`/enhanced-analytics/${survey.id}`} className="dropdown-item">
                          📈 Enhanced Analytics
                        </Link>
                        <Link to={`/advanced-analytics/${survey.id}`} className="dropdown-item">
                          🎯 Advanced Dashboard
                        </Link>
                        <Link to={`/comprehensive-analytics/${survey.id}`} className="dropdown-item">
                          🚀 Comprehensive Dashboard
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility(survey.id, survey.is_public, survey.title)}
                      className={`btn btn-sm ${survey.is_public ? 'btn-warning' : 'btn-success'}`}
                      title={survey.is_public ? 'Make survey private' : 'Make survey public'}
                    >
                      {survey.is_public ? <><FiLock /> Make Private</> : <><FiGlobe /> Make Public</>}
                    </button>
                    {survey.is_public ? (
                      <button
                        onClick={() => handleCopyUrl(survey.slug)}
                        className="btn btn-outline btn-sm"
                        title="Copy survey URL"
                      >
                        {copiedUrl === `${window.location.origin}/survey/${survey.slug}` ? <><FiCheckCircle /> Copied!</> : <><FiCopy /> Copy Link</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowInvitationManager({ surveyId: survey.id, surveyTitle: survey.title })}
                        className="btn btn-outline btn-sm"
                        title="Manage invitation links"
                      >
                        <FiLink /> Invitations
                      </button>
                    )}
                    <Link
                      to={`/survey/${survey.slug}`}
                      className="btn btn-outline btn-sm"
                      target="_blank"
                    >
                      <FiEye /> Preview
                    </Link>
                    <button
                      onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                      className="btn btn-danger btn-sm"
                      title="Delete survey"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
                ))}
              </div>
              {searchQuery && filteredSurveys.length === 0 && (
                <motion.div 
                  className="no-search-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="empty-icon"><FiSearch /></div>
                  <h3>No surveys found</h3>
                  <p>No surveys match your search for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="btn btn-outline"
                  >
                    Clear search
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invitation Manager Modal */}
      {showInvitationManager && (
        <div className="modal-overlay">
          <div className="modal-content">
            <InvitationManager
              surveyId={showInvitationManager.surveyId}
              surveyTitle={showInvitationManager.surveyTitle}
              onClose={() => setShowInvitationManager(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;