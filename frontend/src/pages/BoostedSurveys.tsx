import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBoostedSurveys } from '../services/api';
import { FiZap, FiUsers, FiCalendar } from 'react-icons/fi';
import './BoostedSurveys.css';

interface BoostedSurvey {
  _id: string;
  title: string;
  description: string;
  slug: string;
  boost: {
    bonusPoints: number;
    expiresAt?: Date;
  };
  response_count: number;
  created_at: Date;
}

const BoostedSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<BoostedSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page] = useState(1);
  const [limit] = useState(20);

  useEffect(() => {
    loadBoostedSurveys();
  }, [page, limit]);

  const loadBoostedSurveys = async () => {
    try {
      setLoading(true);
      const data = await getBoostedSurveys(page, limit);
      setSurveys(data.surveys || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load boosted surveys');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="boosted-surveys-page">
        <div className="container">
          <div className="loading">Loading boosted surveys...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boosted-surveys-page">
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="boosted-surveys-page">
      <div className="container">
        <div className="page-header">
          <h1><FiZap /> Boosted Surveys</h1>
          <p>Complete these surveys to earn bonus points!</p>
        </div>

        {surveys.length === 0 ? (
          <div className="empty-state">
            <p>No boosted surveys available at the moment.</p>
            <Link to="/surveys" className="btn btn-primary">
              Browse All Surveys
            </Link>
          </div>
        ) : (
          <div className="boosted-surveys-grid">
            {surveys.map((survey) => (
              <div key={survey._id} className="boosted-survey-card">
                <div className="boost-badge">
                  <FiZap /> +{survey.boost.bonusPoints} Bonus Points
                </div>
                <h3>{survey.title}</h3>
                {survey.description && <p className="survey-description">{survey.description}</p>}
                <div className="survey-meta">
                  <span><FiUsers /> {survey.response_count} responses</span>
                  <span><FiCalendar /> {new Date(survey.created_at).toLocaleDateString()}</span>
                </div>
                {survey.boost.expiresAt && (
                  <div className="boost-expiry">
                    Boost expires: {new Date(survey.boost.expiresAt).toLocaleDateString()}
                  </div>
                )}
                <Link to={`/survey/${survey.slug}`} className="btn btn-primary">
                  Take Survey & Earn Points
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoostedSurveys;
