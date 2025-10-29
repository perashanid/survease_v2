import React from 'react';
import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  type?: 'chart' | 'table' | 'card';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'chart',
  count = 1
}) => {
  if (type === 'chart') {
    return (
      <div className="skeleton-chart">
        <div className="skeleton-chart-header">
          <div className="skeleton-line" style={{ width: '40%' }} />
        </div>
        <div className="skeleton-chart-body">
          <div className="skeleton-bars">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="skeleton-bar"
                style={{ height: `${Math.random() * 60 + 40}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-line" />
          ))}
        </div>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="skeleton-table-row">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="skeleton-line" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton-line" style={{ width: '40%', height: '32px', marginTop: '12px' }} />
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
