import React from 'react';
import { useNavigate } from 'react-router-dom';
import PointsBalance from '../components/reciprocal/PointsBalance';
import PointsHistory from '../components/reciprocal/PointsHistory';
import Leaderboard from '../components/reciprocal/Leaderboard';
import { FiArrowLeft } from 'react-icons/fi';
import './PointsDashboard.css';

const PointsDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="points-dashboard-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FiArrowLeft /> Back to Dashboard
        </button>

        <div className="page-header">
          <h1>💰 Points Dashboard</h1>
          <p>Manage your points, view history, and see top contributors</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <PointsBalance />
            <PointsHistory limit={50} />
          </div>
          <div className="dashboard-sidebar">
            <Leaderboard limit={10} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsDashboard;
