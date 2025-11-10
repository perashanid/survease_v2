import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiUsers, FiZap, FiSettings } from 'react-icons/fi';
import './ReciprocalAdminPanel.css';

interface ReciprocalStats {
  totalPointsCirculation: number;
  totalTransactions: number;
  averagePointsPerUser: number;
  activeBoosts: number;
  customLinksGenerated: number;
  responsesLocked: number;
  responsesUnlocked: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    points: number;
  }>;
}

interface SystemSettings {
  basePointsPerSurvey: number;
  maxBoostBonus: number;
  maxBoostDuration: number;
  pointsEnabled: boolean;
}

const ReciprocalAdminPanel: React.FC = () => {
  const [stats, setStats] = useState<ReciprocalStats | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    basePointsPerSurvey: 10,
    maxBoostBonus: 100,
    maxBoostDuration: 30,
    pointsEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Implement API call
      // const response = await fetch('/api/admin/reciprocal/stats');
      // const data = await response.json();
      // setStats(data);
      
      // Mock data for now
      setStats({
        totalPointsCirculation: 15420,
        totalTransactions: 1234,
        averagePointsPerUser: 45.6,
        activeBoosts: 12,
        customLinksGenerated: 89,
        responsesLocked: 234,
        responsesUnlocked: 156,
        topUsers: [
          { userId: '1', userName: 'John Doe', points: 250 },
          { userId: '2', userName: 'Jane Smith', points: 180 },
          { userId: '3', userName: 'Bob Johnson', points: 150 }
        ]
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // TODO: Implement API call
      // const response = await fetch('/api/admin/reciprocal/settings');
      // const data = await response.json();
      // setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // TODO: Implement API call
      // await fetch('/api/admin/reciprocal/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify(settings)
      // });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="reciprocal-admin-loading">Loading...</div>;
  }

  return (
    <div className="reciprocal-admin-panel">
      <h2>🎁 Reciprocal System Administration</h2>

      {/* Stats Overview */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon"><FiDollarSign /></div>
          <div className="stat-content">
            <h3>Total Points</h3>
            <div className="stat-value">{stats?.totalPointsCirculation.toLocaleString()}</div>
            <p className="stat-label">In Circulation</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon"><FiTrendingUp /></div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <div className="stat-value">{stats?.totalTransactions.toLocaleString()}</div>
            <p className="stat-label">Total</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-content">
            <h3>Avg Points/User</h3>
            <div className="stat-value">{stats?.averagePointsPerUser.toFixed(1)}</div>
            <p className="stat-label">Average Balance</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon"><FiZap /></div>
          <div className="stat-content">
            <h3>Active Boosts</h3>
            <div className="stat-value">{stats?.activeBoosts}</div>
            <p className="stat-label">Currently Active</p>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="admin-details-grid">
        <div className="admin-detail-card">
          <h3>System Activity</h3>
          <div className="detail-row">
            <span>Custom Links Generated:</span>
            <strong>{stats?.customLinksGenerated}</strong>
          </div>
          <div className="detail-row">
            <span>Responses Locked:</span>
            <strong>{stats?.responsesLocked}</strong>
          </div>
          <div className="detail-row">
            <span>Responses Unlocked:</span>
            <strong>{stats?.responsesUnlocked}</strong>
          </div>
          <div className="detail-row">
            <span>Unlock Rate:</span>
            <strong>
              {stats && stats.responsesLocked > 0
                ? ((stats.responsesUnlocked / stats.responsesLocked) * 100).toFixed(1)
                : 0}%
            </strong>
          </div>
        </div>

        <div className="admin-detail-card">
          <h3>Top Contributors</h3>
          <div className="top-users-list">
            {stats?.topUsers.map((user, index) => (
              <div key={user.userId} className="top-user-item">
                <span className="user-rank">#{index + 1}</span>
                <span className="user-name">{user.userName}</span>
                <span className="user-points">{user.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="admin-settings-card">
        <h3><FiSettings /> System Settings</h3>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label htmlFor="basePoints">Base Points per Survey:</label>
            <input
              id="basePoints"
              type="number"
              min="1"
              max="100"
              value={settings.basePointsPerSurvey}
              onChange={(e) => setSettings({
                ...settings,
                basePointsPerSurvey: parseInt(e.target.value) || 10
              })}
            />
            <span className="setting-hint">Points awarded for completing a survey</span>
          </div>

          <div className="setting-item">
            <label htmlFor="maxBonus">Max Boost Bonus:</label>
            <input
              id="maxBonus"
              type="number"
              min="5"
              max="500"
              value={settings.maxBoostBonus}
              onChange={(e) => setSettings({
                ...settings,
                maxBoostBonus: parseInt(e.target.value) || 100
              })}
            />
            <span className="setting-hint">Maximum bonus points allowed per boost</span>
          </div>

          <div className="setting-item">
            <label htmlFor="maxDuration">Max Boost Duration (days):</label>
            <input
              id="maxDuration"
              type="number"
              min="1"
              max="90"
              value={settings.maxBoostDuration}
              onChange={(e) => setSettings({
                ...settings,
                maxBoostDuration: parseInt(e.target.value) || 30
              })}
            />
            <span className="setting-hint">Maximum duration for survey boosts</span>
          </div>

          <div className="setting-item">
            <label htmlFor="pointsEnabled">
              <input
                id="pointsEnabled"
                type="checkbox"
                checked={settings.pointsEnabled}
                onChange={(e) => setSettings({
                  ...settings,
                  pointsEnabled: e.target.checked
                })}
              />
              Enable Points System
            </label>
            <span className="setting-hint">Toggle entire points system on/off</span>
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="btn btn-primary"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            className="btn btn-outline"
            onClick={loadSettings}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="admin-actions-card">
        <h3>Admin Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            Export Points Data
          </button>
          <button className="action-btn">
            View All Transactions
          </button>
          <button className="action-btn">
            Manage Boosts
          </button>
          <button className="action-btn danger">
            Reset Points Economy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReciprocalAdminPanel;
