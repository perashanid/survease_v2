import React, { useState, useEffect } from 'react';
import { getLockedResponses } from '../../services/api';
import './LockedResponsesList.css';

interface LockedResponse {
  _id: string;
  surveyId: string;
  submittedAt: Date;
  isAnonymous: boolean;
  sourceType: 'direct' | 'custom_link';
  customLinkId?: string;
}

interface LockedResponsesListProps {
  surveyId: string;
}

const LockedResponsesList: React.FC<LockedResponsesListProps> = ({ surveyId }) => {
  const [lockedResponses, setLockedResponses] = useState<LockedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLockedResponses();
  }, [surveyId]);

  const loadLockedResponses = async () => {
    try {
      setLoading(true);
      const responses = await getLockedResponses(surveyId);
      setLockedResponses(responses);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load locked responses');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    // This would typically open a dialog to select which survey they completed
    // For now, we'll show a message
    alert('To unlock this response, you need to complete another survey and provide its ID.');
  };

  if (loading) {
    return <div className="locked-responses-loading">Loading locked responses...</div>;
  }

  if (error) {
    return <div className="locked-responses-error">{error}</div>;
  }

  if (lockedResponses.length === 0) {
    return (
      <div className="locked-responses-empty">
        <p>No locked responses yet. All responses are visible!</p>
      </div>
    );
  }

  return (
    <div className="locked-responses-list">
      <h3>Locked Responses ({lockedResponses.length})</h3>
      <p className="locked-responses-description">
        These responses are locked. Complete other surveys to unlock them and earn points!
      </p>
      
      <div className="locked-responses-grid">
        {lockedResponses.map((response) => (
          <div key={response._id} className="locked-response-card">
            <div className="locked-response-icon">🔒</div>
            <div className="locked-response-info">
              <p className="locked-response-date">
                Submitted: {new Date(response.submittedAt).toLocaleDateString()}
              </p>
              <p className="locked-response-type">
                {response.isAnonymous ? 'Anonymous' : 'Identified'} • 
                {response.sourceType === 'custom_link' ? ' Custom Link' : ' Direct'}
              </p>
            </div>
            <button
              className="unlock-button"
              onClick={handleUnlock}
            >
              Unlock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LockedResponsesList;
