import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Use axios directly to avoid the /api prefix from apiClient
      const response = await fetch('http://localhost:8000/health');
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null || isConnected === true) {
    return null; // Don't show anything if connected or still checking initially
  }

  return (
    <div className="connection-status-banner">
      <div className="connection-status-content">
        <span className="status-icon">⚠️</span>
        <span className="status-message">
          Backend server is not responding. Please ensure the backend is running.
        </span>
        <button 
          className="retry-button" 
          onClick={checkConnection}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
