import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

interface UserProfile {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    email_verified: boolean;
    created_at: string;
  };
  profile: {
    bio?: string;
    avatar_url?: string;
    institution?: string;
    field_of_study?: string;
    interests: string[];
    stats: {
      surveys_created: number;
      surveys_completed: number;
      contributions_made: number;
      contributions_received: number;
    };
  };
}

const Profile: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    institution: '',
    field_of_study: '',
    interests: [] as string[],
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data:', data);
        setProfile(data.data);
        setFormData({
          first_name: data.data.user.first_name || '',
          last_name: data.data.user.last_name || '',
          bio: data.data.profile.bio || '',
          institution: data.data.profile.institution || '',
          field_of_study: data.data.profile.field_of_study || '',
          interests: data.data.profile.interests || [],
        });
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile fetch error:', errorData);
        setError(errorData.error?.message || `Failed to load profile (${response.status})`);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
      setError(`Failed to load profile: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProfile();
        setIsEditing(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  if (authLoading) {
    return <div className="profile-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (error && !profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Failed to Load Profile</h2>
          <p>{error}</p>
          <button onClick={fetchProfile} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button 
          className="edit-button"
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-field">
            <label>Email</label>
            <p>{profile.user.email}</p>
          </div>
          <div className="profile-field">
            <label>First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            ) : (
              <p>{profile.user.first_name || 'Not set'}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            ) : (
              <p>{profile.user.last_name || 'Not set'}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            ) : (
              <p>{profile.profile.bio || 'No bio yet'}</p>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2>Academic Information</h2>
          <div className="profile-field">
            <label>Institution</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Your university or organization"
              />
            ) : (
              <p>{profile.profile.institution || 'Not set'}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Field of Study</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.field_of_study}
                onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                placeholder="Your major or field"
              />
            ) : (
              <p>{profile.profile.field_of_study || 'Not set'}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Research Interests</label>
            {isEditing ? (
              <div className="interests-editor">
                <div className="interests-list">
                  {formData.interests.map((interest, index) => (
                    <span key={index} className="interest-tag">
                      {interest}
                      <button onClick={() => removeInterest(interest)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="add-interest">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                    placeholder="Add an interest"
                  />
                  <button onClick={addInterest}>Add</button>
                </div>
              </div>
            ) : (
              <div className="interests-list">
                {profile.profile.interests.length > 0 ? (
                  profile.profile.interests.map((interest, index) => (
                    <span key={index} className="interest-tag">{interest}</span>
                  ))
                ) : (
                  <p>No interests added yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{profile.profile.stats.surveys_created}</div>
              <div className="stat-label">Surveys Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profile.profile.stats.surveys_completed}</div>
              <div className="stat-label">Surveys Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profile.profile.stats.contributions_made}</div>
              <div className="stat-label">Contributions Made</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profile.profile.stats.contributions_received}</div>
              <div className="stat-label">Contributions Received</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
