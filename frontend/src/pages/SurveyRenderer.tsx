import React from 'react';
import { useParams } from 'react-router-dom';

const SurveyRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="container">
      <div style={{ padding: '40px 0' }}>
        <h1>Survey: {slug}</h1>
        <p>Survey response interface coming soon!</p>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Survey Response Form</h2>
          </div>
          <p>The survey response form will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default SurveyRenderer;