import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SurveyService } from '../services/surveyService';
import './PublicSurveys.css';

interface PublicSurvey {
  id: string;
  title: string;
  description?: string;
  slug: string;
  url: string;
  created_at: string;
  response_count: number;
  author?: {
    name: string;
  };
}

const PublicSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<PublicSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSurveys();
  }, [page]);

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

  return (
    <div className="public-surveys">
      <div className="container">
        <div className="page-header">
          <h1>Public Surveys</h1>
          <p>Discover and participate in surveys created by our community</p>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
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
              {surveys.map((survey) => (
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
                      className="btn btn-primary btn-full"
                    >
                      Take Survey
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
    </div>
  );
};

export default PublicSurveys;