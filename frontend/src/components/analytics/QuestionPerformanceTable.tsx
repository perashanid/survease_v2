import React, { useState } from 'react';
import './QuestionPerformanceTable.css';

interface QuestionMetrics {
  questionId: string;
  questionText: string;
  questionType: string;
  completionRate: number;
  avgTimeSpent: number;
  dropoffCount: number;
  responseCount: number;
}

interface QuestionPerformanceTableProps {
  questions: QuestionMetrics[];
  onQuestionClick?: (questionId: string) => void;
}

type SortKey = 'completionRate' | 'avgTimeSpent' | 'dropoffCount';

const QuestionPerformanceTable: React.FC<QuestionPerformanceTableProps> = ({
  questions,
  onQuestionClick
}) => {
  const [sortBy, setSortBy] = useState<SortKey>('completionRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aVal - bVal) * multiplier;
  });

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const isProblematic = (question: QuestionMetrics): boolean => {
    return question.avgTimeSpent > 120 || question.completionRate < 50;
  };

  if (questions.length === 0) {
    return <div className="table-empty">No question data available</div>;
  }

  return (
    <div className="question-table-container">
      <table className="question-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Type</th>
            <th 
              className="sortable"
              onClick={() => handleSort('completionRate')}
            >
              Completion Rate {sortBy === 'completionRate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="sortable"
              onClick={() => handleSort('avgTimeSpent')}
            >
              Avg Time {sortBy === 'avgTimeSpent' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="sortable"
              onClick={() => handleSort('dropoffCount')}
            >
              Drop-offs {sortBy === 'dropoffCount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Responses</th>
          </tr>
        </thead>
        <tbody>
          {sortedQuestions.map((question, index) => (
            <tr
              key={question.questionId}
              className={`${isProblematic(question) ? 'problematic' : ''} ${onQuestionClick ? 'clickable' : ''}`}
              onClick={() => onQuestionClick?.(question.questionId)}
            >
              <td>{index + 1}</td>
              <td className="question-text">{question.questionText}</td>
              <td>
                <span className="question-type">{question.questionType}</span>
              </td>
              <td>
                <div className="completion-bar-container">
                  <div 
                    className="completion-bar"
                    style={{ width: `${question.completionRate}%` }}
                  />
                  <span className="completion-text">{question.completionRate.toFixed(1)}%</span>
                </div>
              </td>
              <td className={question.avgTimeSpent > 120 ? 'warning' : ''}>
                {formatTime(question.avgTimeSpent)}
              </td>
              <td className={question.dropoffCount > 0 ? 'warning' : ''}>
                {question.dropoffCount}
              </td>
              <td>{question.responseCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionPerformanceTable;
