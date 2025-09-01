import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../services/api';

const PublicSurveyAnalyticsSimple: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (surveyId) {
      fetchData();
    }
  }, [surveyId]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for survey:', surveyId);
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/public/surveys/${surveyId}/analytics`);
      console.log('Response:', response.data);
      setData(response.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/surveys')}>Back to Surveys</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Public Survey Analytics</h1>
      <p>Survey ID: {surveyId}</p>
      {data && (
        <div>
          <h2>{data.data?.survey?.title || 'No title'}</h2>
          <p>Total Responses: {data.data?.analytics?.totalResponses || 0}</p>
        </div>
      )}
      <button onClick={() => navigate('/surveys')}>Back to Surveys</button>
    </div>
  );
};

export default PublicSurveyAnalyticsSimple;