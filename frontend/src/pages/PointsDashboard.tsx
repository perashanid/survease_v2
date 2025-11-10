import React from 'react';
import { useNavigate } from 'react-router-dom';
import PointsBalance from '../components/reciprocal/PointsBalance';
import PointsHistory from '../components/reciprocal/PointsHistory';
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
          <p>Manage your points and view transaction history</p>
        </div>

        <div className="dashboard-content">
          <PointsBalance />
          <PointsHistory limit={50} />
        </div>
      </div>
    </div>
  );
};

export default PointsDashboard;
