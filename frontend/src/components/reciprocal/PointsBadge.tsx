import React, { useState, useEffect } from 'react';
import { getUserPoints } from '../../services/api';
import { FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './PointsBadge.css';

const PointsBadge: React.FC = () => {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoints();
    // Refresh points every 30 seconds
    const interval = setInterval(loadPoints, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPoints = async () => {
    try {
      const data = await getUserPoints();
      setPoints(data.points?.total_points || 0);
    } catch (err) {
      console.error('Failed to load points:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || points === null) {
    return null;
  }

  return (
    <Link to="/points" className="points-badge" title="View your points">
      <FiZap className="points-icon" />
      <span className="points-value">{points}</span>
    </Link>
  );
};

export default PointsBadge;
