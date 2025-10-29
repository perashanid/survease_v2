import React from 'react';
import './FunnelChartComponent.css';

interface FunnelStage {
  questionId: string;
  questionText: string;
  completionCount: number;
  completionRate: number;
  dropoffRate: number;
}

interface FunnelChartProps {
  data: FunnelStage[];
  highlightDropoffThreshold?: number;
}

const FunnelChartComponent: React.FC<FunnelChartProps> = ({
  data,
  highlightDropoffThreshold = 20
}) => {
  if (!data || data.length === 0) {
    return <div className="funnel-empty">No funnel data available</div>;
  }

  const maxCount = data[0]?.completionCount || 1;

  return (
    <div className="funnel-container">
      {data.map((stage, index) => {
        const width = (stage.completionCount / maxCount) * 100;
        const isHighDropoff = stage.dropoffRate > highlightDropoffThreshold;

        return (
          <div key={stage.questionId} className="funnel-stage">
            <div className="funnel-stage-header">
              <span className="funnel-stage-number">{index + 1}</span>
              <span className="funnel-stage-text">{stage.questionText}</span>
            </div>
            
            <div className="funnel-bar-container">
              <div
                className={`funnel-bar ${isHighDropoff ? 'high-dropoff' : ''}`}
                style={{ width: `${width}%` }}
              >
                <span className="funnel-bar-label">
                  {stage.completionCount} ({stage.completionRate.toFixed(1)}%)
                </span>
              </div>
            </div>

            {index < data.length - 1 && stage.dropoffRate > 0 && (
              <div className={`funnel-dropoff ${isHighDropoff ? 'high' : ''}`}>
                ↓ {stage.dropoffRate.toFixed(1)}% drop-off
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FunnelChartComponent;
