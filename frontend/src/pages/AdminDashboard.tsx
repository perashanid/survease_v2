import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService, AdminSurvey, AdminStats } from '../services/adminService';
import { useToast } from '../components/shared/ToastContainer';
import ReciprocalAdminPanel from '../components/admin/ReciprocalAdminPanel';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'surveys' | 'users' | 'reciprocal'>('overview');

  useEffect(() => {
    // Check if user is admin
    if (!user?.isAdmin) {
      showToast('error', 'Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    loadData();
  }, [user, page, search, filter, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'overview') {
        const statsData = await adminService.getStats();
        setStats(statsData.data);
      } else if (activeTab === 'surveys') {
        const surveysData = await adminService.getSurveys(page, 20, search, filter);
        setSurveys(surveysData.data.surveys);
        setTotalPages(surveysData.data.pagination.pages);
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (surveyId: string, currentStatus: boolean) => {
    try {
      await adminService.toggleFeatured(surveyId, !currentStatus);
      showToast('success', `Survey ${!currentStatus ? 'featured' : 'unfeatured'} successfully`);
      loadData();
    } catch (error: any) {
      showToast('error', error.response?.data?.error?.message || 'Failed to update survey');
    }
  };

  const handleToggleVisibility = async (surveyId: string, field: 'public' | 'active', currentStatus: boolean) => {
    try {
      if (field === 'public') {
        await adminService.updateVisibility(surveyId, !currentStatus, undefined);
      } else {
        await adminService.updateVisibility(surveyId, undefined, !currentStatus);
      }
      showToast('success', 'Survey visibility updated successfully');
      loadData();
    } catch (error: any) {
      showToast('error', error.response?.data?.error?.message || 'Failed to update survey');
    }
  };

  const handleDeleteSurvey = async (surveyId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also delete all responses.`)) {
      return;
    }

    try {
      await adminService.deleteSurvey(surveyId);
      showToast('success', 'Survey deleted successfully');
      loadData();
    } catch (error: any) {
      showToast('error', error.response?.data?.error?.message || 'Failed to delete survey');
    }
  };

  if (loading && !stats && surveys.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔐 Admin Dashboard</h1>
        <p>Manage surveys, users, and featured content</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'surveys' ? 'active' : ''}`}
          onClick={() => setActiveTab('surveys')}
        >
          📝 Surveys
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-button ${activeTab === 'reciprocal' ? 'active' : ''}`}
          onClick={() => setActiveTab('reciprocal')}
        >
          🎁 Reciprocal System
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.overview.totalUsers}</h3>
                <p>Total Users</p>
                <span className="stat-change">+{stats.recentActivity.newUsers} this month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>{stats.overview.totalSurveys}</h3>
                <p>Total Surveys</p>
                <span className="stat-change">+{stats.recentActivity.newSurveys} this month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🌐</div>
              <div className="stat-content">
                <h3>{stats.overview.publicSurveys}</h3>
                <p>Public Surveys</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>{stats.overview.featuredSurveys}</h3>
                <p>Featured Surveys</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.overview.totalResponses}</h3>
                <p>Total Responses</p>
                <span className="stat-change">+{stats.recentActivity.newResponses} this month</span>
              </div>
            </div>
          </div>

          <div className="top-surveys-section">
            <h2>🏆 Top Surveys by Responses</h2>
            <div className="top-surveys-list">
              {stats.topSurveys.map((survey) => (
                <div key={survey._id} className="top-survey-item">
                  <div className="survey-info">
                    <h3>{survey.title}</h3>
                    <div className="survey-badges">
                      {survey.is_featured && <span className="badge featured">⭐ Featured</span>}
                      {survey.is_public && <span className="badge public">🌐 Public</span>}
                    </div>
                  </div>
                  <div className="survey-stats">
                    <span className="response-count">{survey.response_count} responses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'surveys' && (
        <div className="surveys-section">
          <div className="surveys-controls">
            <input
              type="text"
              placeholder="Search surveys..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="search-input"
            />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="all">All Surveys</option>
              <option value="featured">Featured Only</option>
              <option value="public">Public Only</option>
              <option value="active">Active Only</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="surveys-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Responses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((survey) => (
                      <tr key={survey.id}>
                        <td>
                          <div className="survey-title-cell">
                            <strong>{survey.title}</strong>
                            {survey.description && (
                              <p className="survey-description">{survey.description}</p>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="author-cell">
                            <span>{survey.author.name}</span>
                            <small>{survey.author.email}</small>
                          </div>
                        </td>
                        <td>{survey.response_count}</td>
                        <td>
                          <div className="status-badges">
                            {survey.is_featured && <span className="badge featured">⭐</span>}
                            {survey.is_public && <span className="badge public">🌐</span>}
                            {survey.is_active && <span className="badge active">✓</span>}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleToggleFeatured(survey.id, survey.is_featured)}
                              className={`action-btn ${survey.is_featured ? 'featured' : ''}`}
                              title={survey.is_featured ? 'Unfeature' : 'Feature'}
                            >
                              ⭐
                            </button>
                            <button
                              onClick={() => handleToggleVisibility(survey.id, 'public', survey.is_public)}
                              className={`action-btn ${survey.is_public ? 'public' : ''}`}
                              title={survey.is_public ? 'Make Private' : 'Make Public'}
                            >
                              🌐
                            </button>
                            <button
                              onClick={() => handleToggleVisibility(survey.id, 'active', survey.is_active)}
                              className={`action-btn ${survey.is_active ? 'active' : ''}`}
                              title={survey.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {survey.is_active ? '✓' : '✗'}
                            </button>
                            <button
                              onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                              className="action-btn delete"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <p className="coming-soon">User management coming soon...</p>
        </div>
      )}

      {activeTab === 'reciprocal' && (
        <ReciprocalAdminPanel />
      )}
    </div>
  );
};

export default AdminDashboard;
