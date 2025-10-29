import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './QuestionDetailModal.css';

interface QuestionMetrics {
  questionId: string;
  questionText: string;
  questionType: string;
  completionRate: number;
  avgTimeSpent: number;
  dropoffCount: number;
  responseCount: number;
}

interface QuestionDetailModalProps {
  question: QuestionMetrics;
  responses?: any[];
  onClose: () => void;
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  responses = [],
  onClose
}) => {
  const [responseDistribution, setResponseDistribution] = useState<any[]>([]);
  const [timingData, setTimingData] = useState<number[]>([]);

  useEffect(() => {
    // Calculate response distribution for choice-based questions
    if (['multiple_choice', 'checkbox', 'dropdown', 'rating'].includes(question.questionType)) {
      const distribution: Record<string, number> = {};
      
      responses.forEach(response => {
        const answer = response[question.questionId];
        if (answer !== undefined && answer !== null) {
          if (Array.isArray(answer)) {
            answer.forEach(val => {
              distribution[val] = (distribution[val] || 0) + 1;
            });
          } else {
            distribution[String(answer)] = (distribution[String(answer)] || 0) + 1;
          }
        }
      });

      const distData = Object.entries(distribution)
        .map(([label, count]) => ({
          label,
          count,
          percentage: (count / question.responseCount) * 100
        }))
        .sort((a, b) => b.count - a.count);

      setResponseDistribution(distData);
    }

    // Generate timing histogram (mock data for now)
    const timings: number[] = [];
    for (let i = 0; i < 10; i++) {
      const time = Math.max(0, question.avgTimeSpent + (Math.random() - 0.5) * question.avgTimeSpent);
      timings.push(time);
    }
    setTimingData(timings);
  }, [question, responses]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{question.questionText}</h2>
            <p className="modal-subtitle">
              Type: <strong>{question.questionType}</strong>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="metric-grid">
            <div className="metric-box">
              <div className="metric-box-label">Completion Rate</div>
              <div className="metric-box-value">
                {question.completionRate.toFixed(1)}
                <span className="metric-box-unit">%</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-box-label">Responses</div>
              <div className="metric-box-value">{question.responseCount}</div>
            </div>

            <div className="metric-box">
              <div className="metric-box-label">Avg Time</div>
              <div className="metric-box-value">
                {formatTime(question.avgTimeSpent)}
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-box-label">Drop-offs</div>
              <div className="metric-box-value">{question.dropoffCount}</div>
            </div>
          </div>

          {responseDistribution.length > 0 && (
            <div className="chart-section">
              <h3 className="chart-section-title">Response Distribution</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="response-distribution">
                  {responseDistribution.slice(0, 5).map((item, index) => (
                    <div key={index} className="distribution-item">
                      <div className="distribution-label">{item.label}</div>
                      <div className="distribution-bar-container">
                        <div
                          className="distribution-bar"
                          style={{ width: `${item.percentage}%` }}
                        />
                        <span className="distribution-value">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={responseDistribution.slice(0, 5)}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ percentage }) => `${percentage.toFixed(0)}%`}
                      >
                        {responseDistribution.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="chart-section">
            <h3 className="chart-section-title">Time Spent Distribution</h3>
            <div className="timing-histogram">
              {timingData.map((time, index) => {
                const maxTime = Math.max(...timingData);
                const height = (time / maxTime) * 100;
                return (
                  <div
                    key={index}
                    className="histogram-bar"
                    style={{ height: `${height}%` }}
                    title={`${formatTime(time)}`}
                  />
                );
              })}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
              Distribution of time spent by respondents
            </p>
          </div>

          {question.avgTimeSpent > 120 && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#991b1b' }}>
                ⚠️ <strong>High average time:</strong> This question takes longer than 2 minutes on average. 
                Consider simplifying it or breaking it into multiple questions.
              </p>
            </div>
          )}

          {question.completionRate < 50 && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#991b1b' }}>
                ⚠️ <strong>Low completion rate:</strong> Less than 50% of respondents complete this question. 
                Consider making it optional or reviewing its clarity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailModal;
