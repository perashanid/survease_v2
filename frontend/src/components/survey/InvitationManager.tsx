import React, { useState, useEffect } from 'react';
import { InvitationService, InvitationToken, CreateInvitationData } from '../../services/invitationService';
import './InvitationManager.css';

interface InvitationManagerProps {
  surveyId: string;
  surveyTitle: string;
  onClose: () => void;
}

const InvitationManager: React.FC<InvitationManagerProps> = ({ surveyId, surveyTitle, onClose }) => {
  const [invitations, setInvitations] = useState<InvitationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateInvitationData>({
    description: '',
    expires_at: '',
    max_uses: undefined
  });

  useEffect(() => {
    fetchInvitations();
  }, [surveyId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvitationService.getInvitations(surveyId);
      setInvitations(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const createData: CreateInvitationData = {
        description: formData.description || undefined,
        expires_at: formData.expires_at || undefined,
        max_uses: formData.max_uses || undefined
      };

      const newInvitation = await InvitationService.createInvitation(surveyId, createData);
      setInvitations([newInvitation, ...invitations]);
      setShowCreateForm(false);
      setFormData({ description: '', expires_at: '', max_uses: undefined });
      
      // Auto-copy the new invitation URL
      const copied = await InvitationService.copyInvitationUrl(newInvitation.invitation_url);
      if (copied) {
        setCopySuccess(newInvitation.id);
        setTimeout(() => setCopySuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create invitation');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyUrl = async (invitation: InvitationToken) => {
    const copied = await InvitationService.copyInvitationUrl(invitation.invitation_url);
    if (copied) {
      setCopySuccess(invitation.id);
      setTimeout(() => setCopySuccess(null), 3000);
    }
  };

  const handleRevokeInvitation = async (invitation: InvitationToken) => {
    if (!confirm('Are you sure you want to revoke this invitation? This action cannot be undone.')) {
      return;
    }

    try {
      await InvitationService.revokeInvitation(surveyId, invitation.id);
      setInvitations(invitations.map(inv => 
        inv.id === invitation.id ? { ...inv, is_active: false } : inv
      ));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to revoke invitation');
    }
  };

  if (loading) {
    return (
      <div className="invitation-manager">
        <div className="invitation-header">
          <h3>Manage Invitations</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-manager">
      <div className="invitation-header">
        <div>
          <h3>Manage Invitations</h3>
          <p>Create and manage invitation links for "{surveyTitle}"</p>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="invitation-actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={creating}
        >
          {showCreateForm ? 'Cancel' : '+ Create Invitation Link'}
        </button>
      </div>

      {showCreateForm && (
        <form className="create-invitation-form" onSubmit={handleCreateInvitation}>
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., For marketing team"
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expires_at">Expires At (optional)</label>
              <input
                type="datetime-local"
                id="expires_at"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="max_uses">Max Uses (optional)</label>
              <input
                type="number"
                id="max_uses"
                value={formData.max_uses || ''}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : undefined })}
                min="1"
                max="10000"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Invitation'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="invitations-list">
        <h4>Existing Invitations ({invitations.length})</h4>
        
        {invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔗</div>
            <p>No invitation links created yet</p>
            <small>Create your first invitation link to share this private survey</small>
          </div>
        ) : (
          <div className="invitations-table">
            {invitations.map((invitation) => {
              const status = InvitationService.getInvitationStatus(invitation);
              return (
                <div key={invitation.id} className="invitation-row">
                  <div className="invitation-info">
                    <div className="invitation-main">
                      <span className="invitation-description">
                        {invitation.description || 'Untitled Invitation'}
                      </span>
                      <span className={`status-badge status-${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="invitation-details">
                      <span>Created: {new Date(invitation.created_at).toLocaleDateString()}</span>
                      <span>Uses: {invitation.usage_count}{invitation.max_uses ? `/${invitation.max_uses}` : ''}</span>
                      <span>Expires: {InvitationService.formatExpiryDate(invitation.expires_at)}</span>
                    </div>
                  </div>
                  
                  <div className="invitation-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleCopyUrl(invitation)}
                      disabled={!invitation.is_active}
                    >
                      {copySuccess === invitation.id ? '✓ Copied!' : '📋 Copy Link'}
                    </button>
                    
                    {invitation.is_active && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRevokeInvitation(invitation)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;