import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataQualityManager.css';

interface QualityRule {
  min_completion_time: number;
  total_flagged: number;
  total_overridden: number;
}

interface FlaggedResponse {
  _id: string;
  completion_time: number;
  submitted_at: string;
  quality_status: string;
  manual_override?: {
    overridden_by: string;
    overridden_at: string;
    reason?: string;
  };
}

interface Props {
  surveyId: string;
}

const DataQualityManager: React.FC<Props> = ({ surveyId }) => {
  const [rules, setRules] = useState<QualityRule>({ min_completion_time: 30, total_flagged: 0, total_overridden: 0 });
  const [threshold, setThreshold] = useState(30);
  const [flaggedResponses, setFlaggedResponses] = useState<FlaggedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{ show: boolean; responseId: string | null; reason: string }>({
    show: false,
    responseId: null,
    reason: ''
  });

  useEffect(() => {
    loadQualityRules();
  }, [surveyId]);

  const loadQualityRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/quality/rules`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRules(response.data.rules);
      setThreshold(response.data.rules.min_completion_time);
    } catch (error) {
      console.error('Error loading quality rules:', error);
    }
  };

  const saveQualityRules = async () => {
    if (threshold < 5 || threshold > 3600) {
      alert('Threshold must be between 5 and 3600 seconds');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/quality/rules`,
        { min_completion_time: threshold },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await loadQualityRules();
      alert('Quality rules updated successfully!');
    } catch (error: any) {
      console.error('Error saving quality rules:', error);
      alert(error.response?.data?.error || 'Failed to save quality rules');
    } finally {
      setSaving(false);
    }
  };

  const loadFlaggedResponses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/quality/flagged-responses`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setFlaggedResponses(response.data.responses);
      setShowFlagged(true);
    } catch (error) {
      console.error('Error loading flagged responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideModal.responseId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/surveys/${surveyId}/quality/override/${overrideModal.responseId}`,
        {
          newStatus: 'quality',
          reason: overrideModal.reason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setOverrideModal({ show: false, responseId: null, reason: '' });
      await loadFlaggedResponses();
      await loadQualityRules();
      alert('Response classification overridden successfully!');
    } catch (error: any) {
      console.error('Error overriding classification:', error);
      alert(error.response?.data?.error || 'Failed to override classification');
    }
  };

  return (
    <div className="data-quality-manager">
      <div className="quality-settings">
        <h3>⚙️ Data Quality Settings</h3>
        
        <div className="settings-card">
          <div className="setting-row">
            <label htmlFor="threshold">Minimum Completion Time (seconds)</label>
            <div className="input-group">
              <input
                id="threshold"
                type="number"
                min="5"
                max="3600"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="threshold-input"
              />
              <button 
                onClick={saveQualityRules} 
                disabled={saving || threshold === rules.min_completion_time}
                className="save-button"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="setting-help">
              Responses completed faster than this threshold will be flagged as low-quality.
            </p>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Current Threshold:</span>
              <span className="stat-value">{rules.min_completion_time}s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Flagged:</span>
              <span className="stat-value">{rules.total_flagged}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Manually Overridden:</span>
              <span className="stat-value">{rules.total_overridden}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flagged-responses-section">
        <div className="section-header">
          <h3>🚩 Flagged Responses</h3>
          <button 
            onClick={loadFlaggedResponses} 
            disabled={loading}
            className="load-button"
          >
            {loading ? 'Loading...' : showFlagged ? 'Refresh' : 'View Flagged Responses'}
          </button>
        </div>

        {showFlagged && (
          <div className="flagged-list">
            {flaggedResponses.length === 0 ? (
              <div className="empty-state">
                <p>No flagged responses found.</p>
              </div>
            ) : (
              <div className="responses-table">
                <table>
                  <thead>
                    <tr>
                      <th>Response ID</th>
                      <th>Completion Time</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedResponses.map((response) => (
                      <tr key={response._id}>
                        <td>{response._id.substring(0, 8)}...</td>
                        <td>{response.completion_time}s</td>
                        <td>{new Date(response.submitted_at).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${response.quality_status}`}>
                            {response.quality_status === 'manually_overridden' ? 'Overridden' : 'Low Quality'}
                          </span>
                        </td>
                        <td>
                          {response.quality_status !== 'manually_overridden' && (
                            <button
                              onClick={() => setOverrideModal({ show: true, responseId: response._id, reason: '' })}
                              className="override-button"
                            >
                              Override
                            </button>
                          )}
                          {response.manual_override && (
                            <span className="override-info" title={response.manual_override.reason}>
                              ✓ Overridden
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {overrideModal.show && (
        <div className="modal-overlay" onClick={() => setOverrideModal({ show: false, responseId: null, reason: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Override Quality Classification</h3>
            <p>Are you sure you want to mark this response as quality? This will include it in analytics.</p>
            
            <div className="form-group">
              <label htmlFor="reason">Reason (optional)</label>
              <textarea
                id="reason"
                value={overrideModal.reason}
                onChange={(e) => setOverrideModal({ ...overrideModal, reason: e.target.value })}
                placeholder="Enter reason for override..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setOverrideModal({ show: false, responseId: null, reason: '' })}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleOverride}
                className="confirm-button"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityManager;
