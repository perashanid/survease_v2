import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SurveyService } from '../services/surveyService';
import { useAuth } from '../contexts/AuthContext';
import './PublicSurveys.css';

interface PublicSurvey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  url?: string;
  created_at: string;
  response_count: number;
  import_count?: number;
  allow_import?: boolean;
  questions?: any[];
  author?: {
    name: string;
  };
}

const PublicSurveys: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [surveys, setSurveys] = useState<PublicSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState<PublicSurvey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSurveys, setFilteredSurveys] = useState<PublicSurvey[]>([]);

  useEffect(() => {
    fetchSurveys();
  }, [page]);

  useEffect(() => {
    // Filter surveys based on search term
    if (searchTerm.trim() === '') {
      setFilteredSurveys(surveys);
    } else {
      const filtered = surveys.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (survey.author?.name && survey.author.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSurveys(filtered);
    }
  }, [surveys, searchTerm]);

  const fetchSurveys = async () => {
    try {
      console.log('PublicSurveys: Starting to fetch surveys...');
      setLoading(true);
      const data = await SurveyService.getPublicSurveys(page, 12);
      console.log('PublicSurveys: Received data:', data);
      setSurveys(data.surveys as PublicSurvey[]);
      setTotalPages(data.pagination.pages);
      console.log('PublicSurveys: Set surveys:', data.surveys?.length);
    } catch (err: any) {
      console.error('PublicSurveys: Error fetching surveys:', err);
      setError('Failed to load surveys: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleImportClick = (survey: PublicSurvey) => {
    setShowImportDialog(survey);
  };

  const handleImportConfirm = async () => {
    if (!showImportDialog) return;

    try {
      setImportingId(showImportDialog.id);
      await SurveyService.importSurvey(showImportDialog.id);
      setImportSuccess(`Successfully imported "${showImportDialog.title}"!`);
      setShowImportDialog(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setImportSuccess(null), 5000);
    } catch (err: any) {
      console.error('Import error:', err);
      setError('Failed to import survey: ' + (err.message || 'Unknown error'));
    } finally {
      setImportingId(null);
    }
  };

  const handleImportCancel = () => {
    setShowImportDialog(null);
  };

  return (
    <div className="public-surveys">
      <div className="container">
        <div className="page-header">
          <h1>Public Surveys</h1>
          <p>Discover and participate in surveys created by our community</p>
          
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search surveys by title, description, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            {searchTerm && (
              <div className="search-results-info">
                Showing {filteredSurveys.length} of {surveys.length} surveys
                {filteredSurveys.length === 0 && (
                  <span className="no-results"> - No matches found</span>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {importSuccess && <div className="success">{importSuccess}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredSurveys.length === 0 && searchTerm ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No surveys found</h3>
            <p>No surveys match your search for "{searchTerm}"</p>
            <button 
              className="btn btn-outline"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Public Surveys Yet</h3>
            <p>Be the first to create a public survey!</p>
            <Link to="/create" className="btn btn-primary">
              Create Survey
            </Link>
          </div>
        ) : (
          <>
            <div className="surveys-grid">
              {filteredSurveys.map((survey) => (
                <div key={survey.id} className="survey-card">
                  <div className="survey-content">
                    <h3 className="survey-title">{survey.title}</h3>
                    {survey.description && (
                      <p className="survey-description">{survey.description}</p>
                    )}
                    <div className="survey-meta">
                      <div className="meta-row">
                        <span className="meta-item">
                          👤 By {survey.author?.name || 'Anonymous'}
                        </span>
                        <span className="meta-item">
                          📅 {new Date(survey.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-item">
                          📊 {survey.response_count} responses
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="survey-actions">
                    <Link
                      to={`/survey/${survey.slug}`}
                      className="btn btn-primary"
                    >
                      Take Survey
                    </Link>
                    <Link
                      to={`/public-survey-analytics/${survey.id}`}
                      className="btn btn-outline btn-sm"
                      title="View survey analytics"
                    >
                      📊 Analytics
                    </Link>
                    {isAuthenticated && survey.allow_import && (
                      <button
                        onClick={() => handleImportClick(survey)}
                        disabled={importingId === survey.id}
                        className="btn btn-outline"
                      >
                        {importingId === survey.id ? '⏳ Importing...' : '📥 Import'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - only show if not searching */}
            {totalPages > 1 && !searchTerm && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="btn btn-outline"
                >
                  ← Previous
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn ${page === pageNum ? 'btn-primary' : 'btn-outline'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="btn btn-outline"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Confirmation Dialog */}
      {showImportDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="import-dialog">
              <div className="import-dialog-header">
                <h3>Import Survey</h3>
                <button 
                  className="close-btn"
                  onClick={handleImportCancel}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>
              
              <div className="import-dialog-body">
                <div className="survey-preview">
                  <h4>{showImportDialog.title}</h4>
                  {showImportDialog.description && (
                    <p className="survey-description">{showImportDialog.description}</p>
                  )}
                  
                  <div className="survey-details">
                    <div className="detail-item">
                      <span className="detail-label">Questions:</span>
                      <span className="detail-value">{showImportDialog.questions?.length || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Responses:</span>
                      <span className="detail-value">{showImportDialog.response_count}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Author:</span>
                      <span className="detail-value">{showImportDialog.author?.name || 'Anonymous'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{new Date(showImportDialog.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="import-info">
                  <div className="info-box">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-text">
                      <p><strong>What happens when you import?</strong></p>
                      <ul>
                        <li>A copy of this survey will be added to your dashboard</li>
                        <li>The imported survey will be private by default</li>
                        <li>You can customize and modify the imported survey</li>
                        <li>No existing responses will be copied</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="import-dialog-footer">
                <button 
                  className="btn btn-outline"
                  onClick={handleImportCancel}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleImportConfirm}
                  disabled={importingId === showImportDialog.id}
                >
                  {importingId === showImportDialog.id ? '⏳ Importing...' : '📥 Import Survey'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSurveys;