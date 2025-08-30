import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <div className="container">
        <div className="not-found-content">
          <div className="not-found-icon">404</div>
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
            <Link to="/surveys" className="btn btn-outline">
              Browse Surveys
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;