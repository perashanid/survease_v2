import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SurveyService, Survey } from '../services/surveyService';
import { useAuth } from '../contexts/AuthContext';
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
                📊 Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                📈 Analytics
              </button>
            </div>
            <Link to="/create" className="btn btn-primary">
              Create New Survey
            </Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{surveys.length}</div>
            <div className="stat-label">Total Surveys</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalResponses}</div>
            <div className="stat-label">Total Responses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{activeSurveys}</div>
            <div className="stat-label">Active Surveys</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{publicSurveys}</div>
            <div className="stat-label">Public Surveys</div>
          </div>
        </div>

        {/* Surveys List */}
        <div className="surveys-section">
          <h2>Your Surveys</h2>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : surveys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Surveys Yet</h3>
              <p>Create your first survey to start collecting responses!</p>
              <Link to="/create" className="btn btn-primary">
                Create Your First Survey
              </Link>
            </div>
          ) : (
            <div className="surveys-list">
              {surveys.map((survey) => (
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
                      </div>
                    </div>
                    {survey.description && (
                      <p className="survey-description">{survey.description}</p>
                    )}
                    <div className="survey-meta">
                      <span className="meta-item">
                        📊 {survey.response_count} responses
                      </span>
                      <span className="meta-item">
                        📅 {new Date(survey.created_at).toLocaleDateString()}
                      </span>
                      <span className="meta-item">
                        ❓ {survey.questions.length} questions
                      </span>
                    </div>
                  </div>
                  <div className="survey-actions">
                    <Link
                      to={`/survey-analytics/${survey.id}`}
                      className="btn btn-primary btn-sm"
                      title="View detailed analytics"
                    >
                      📊 Analytics
                    </Link>
                    {survey.is_public ? (
                      <button
                        onClick={() => handleCopyUrl(survey.slug)}
                        className="btn btn-outline btn-sm"
                        title="Copy survey URL"
                      >
                        {copiedUrl === `${window.location.origin}/survey/${survey.slug}` ? '✓ Copied!' : '🔗 Copy Link'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowInvitationManager({ surveyId: survey.id, surveyTitle: survey.title })}
                        className="btn btn-outline btn-sm"
                        title="Manage invitation links"
                      >
                        🔗 Invitations
                      </button>
                    )}
                    <Link
                      to={`/survey/${survey.slug}`}
                      className="btn btn-outline btn-sm"
                      target="_blank"
                    >
                      👁️ Preview
                    </Link>
                    <button
                      onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                      className="btn btn-danger btn-sm"
                      title="Delete survey"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
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