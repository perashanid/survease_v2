import React, { useEffect } from 'react';
import { usePoints } from '../../contexts/PointsContext';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import './PointsBalance.css';

interface PointsBalanceProps {
  compact?: boolean;
  showHistory?: boolean;
}

const PointsBalance: React.FC<PointsBalanceProps> = ({ compact = false, showHistory = false }) => {
  const { points, loading, error, refreshPoints } = usePoints();

  useEffect(() => {
    // Load points only once when component mounts
    console.log('[PointsBalance] Component mounted, loading points...');
    refreshPoints();
  }, []);

  if (loading) {
    return (
      <div className={`points-balance ${compact ? 'compact' : ''}`}>
        <div className="points-loading">Loading points...</div>
      </div>
    );
  }

  if (error) {
    console.error('Points loading error:', error);
    return (
      <div className="points-balance">
        <div className="points-error">Failed to load points: {error}</div>
      </div>
    );
  }

  if (!points) {
    console.log('No points data received');
    return null;
  }

  if (compact) {
    return (
      <div className="points-balance compact">
        <FiAward className="points-icon" />
        <span className="points-value">{points.total_points}</span>
      </div>
    );
  }

  return (
    <div className="points-balance">
      <div className="points-header">
        <FiAward className="points-icon-large" />
        <h3>Your Points</h3>
      </div>
      
      <div className="points-stats">
        <div className="points-stat-card primary">
          <div className="stat-label">Current Balance</div>
          <div className="stat-value">{points.total_points}</div>
        </div>
        
        <div className="points-stat-card">
          <div className="stat-label">
            <FiTrendingUp /> Lifetime Earned
          </div>
          <div className="stat-value">{points.lifetime_points}</div>
        </div>
        
        {points.points_spent > 0 && (
          <div className="points-stat-card">
            <div className="stat-label">Points Spent</div>
            <div className="stat-value">{points.points_spent}</div>
          </div>
        )}
      </div>
      
      {showHistory && (
        <div className="points-actions">
          <button 
            className="btn-secondary"
            onClick={() => window.location.href = '/#/points'}
          >
            View History
          </button>
        </div>
      )}
    </div>
  );
};

export default PointsBalance;
