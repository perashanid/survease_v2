import React, { useState, useEffect } from 'react';
import { usePoints } from '../../contexts/PointsContext';
import { FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './PointsBadge.css';

const PointsBadge: React.FC = () => {
  const { points, loading, refreshPoints } = usePoints();
  const [isUpdating, setIsUpdating] = useState(false);
  const [prevPoints, setPrevPoints] = useState<number | null>(null);

  useEffect(() => {
    // Load points only once when component mounts
    console.log('[PointsBadge] Component mounted, loading points...');
    refreshPoints();
  }, []);

  useEffect(() => {
    // Trigger animation when points change
    if (points && prevPoints !== null && points.total_points !== prevPoints) {
      console.log('[PointsBadge] Points changed from', prevPoints, 'to', points.total_points);
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 1000);
    }
    if (points) {
      setPrevPoints(points.total_points);
    }
  }, [points]);

  if (loading || !points) {
    return null;
  }

  return (
    <Link 
      to="/points" 
      className={`points-badge ${isUpdating ? 'updating' : ''}`} 
      title="View your points"
    >
      <FiZap className="points-icon" />
      <span className="points-value">{points.total_points}</span>
    </Link>
  );
};

export default PointsBadge;
