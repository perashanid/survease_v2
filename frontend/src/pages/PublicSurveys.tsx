import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SurveyService } from '../services/surveyService';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FiSearch, FiX, FiUser, FiCalendar, FiBarChart2, 
  FiDownload, FiChevronLeft, FiChevronRight, FiAlertCircle,
  FiCheckCircle, FiInfo
} from 'react-icons/fi';
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
      setLoading(true);
      const data = await SurveyService.getPublicSurveys(page, 12);
      setSurveys(data.surveys as PublicSurvey[]);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      console.error('Error fetching surveys:', err);
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
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Public Surveys</h1>
          <p>Discover and participate in surveys created by our community</p>
          
          <div className="search-container">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search surveys by title, description, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="clear-search"
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
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
        </motion.div>

        {error && (
          <motion.div 
            className="error"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FiAlertCircle /> {error}
          </motion.div>
        )}
        
        {importSuccess && (
          <motion.div 
            className="success"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FiCheckCircle /> {importSuccess}
          </motion.div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredSurveys.length === 0 && searchTerm ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon"><FiSearch /></div>
            <h3>No surveys found</h3>
            <p>No surveys match your search for "{searchTerm}"</p>
            <button 
              className="btn btn-outline"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          </motion.div>
        ) : surveys.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-icon"><FiBarChart2 /></div>
            <h3>No Public Surveys Yet</h3>
            <p>Be the first to create a public survey!</p>
            <Link to="/create" className="btn btn-primary">
              Create Survey
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="surveys-grid">
              {filteredSurveys.map((survey, index) => (
                <motion.div 
                  key={survey.id} 
                  className="survey-card"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <div className="survey-content">
                    <h3 className="survey-title">{survey.title}</h3>
                    {survey.description && (
                      <p className="survey-description">{survey.description}</p>
                    )}
                    <div className="survey-meta">
                      <div className="meta-row">
                        <span className="meta-item">
                          <FiUser /> By {survey.author?.name || 'Anonymous'}
                        </span>
                        <span className="meta-item">
                          <FiCalendar /> {new Date(survey.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-item">
                          <FiBarChart2 /> {survey.response_count} responses
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
                      <FiBarChart2 /> Analytics
                    </Link>
                    {isAuthenticated && survey.allow_import && (
                      <button
                        onClick={() => handleImportClick(survey)}
                        disabled={importingId === survey.id}
                        className="btn btn-outline"
                      >
                        {importingId === survey.id ? 'Importing...' : <><FiDownload /> Import</>}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && !searchTerm && (
              <motion.div 
                className="pagination"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="btn btn-outline"
                >
                  <FiChevronLeft /> Previous
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
                  Next <FiChevronRight />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {showImportDialog && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="import-dialog">
              <div className="import-dialog-header">
                <h3>Import Survey</h3>
                <button 
                  className="close-btn"
                  onClick={handleImportCancel}
                  aria-label="Close dialog"
                >
                  <FiX />
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
                    <div className="info-icon"><FiInfo /></div>
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
                  {importingId === showImportDialog.id ? 'Importing...' : <><FiDownload /> Import Survey</>}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PublicSurveys;
