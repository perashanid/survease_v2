import React, { useEffect, useState } from 'react';

const ApiTest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Testing...');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    setApiUrl(baseUrl);
    
    // Test API connection
    fetch(`${baseUrl}/health`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(`HTTP ${response.status}`);
      })
      .then(data => {
        setApiStatus(`✅ Connected: ${data.message}`);
      })
      .catch(error => {
        setApiStatus(`❌ Failed: ${error.message}`);
      });
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>API URL: {apiUrl}</div>
      <div>Status: {apiStatus}</div>
    </div>
  );
};

export default ApiTest;