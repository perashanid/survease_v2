import React, { useState, useEffect } from 'react';
import { getPointsHistory } from '../../services/api';
import './PointsHistory.css';

interface PointsTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'unlock';
  description: string;
  relatedSurveyId?: string;
  relatedResponseId?: string;
  createdAt: Date;
}

interface PointsHistoryProps {
  limit?: number;
}

const PointsHistory: React.FC<PointsHistoryProps> = ({ limit = 20 }) => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await getPointsHistory(limit);
      setTransactions(history);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load points history');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn': return '💰';
      case 'spend': return '💸';
      case 'unlock': return '🔓';
      default: return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn': return 'positive';
      case 'spend': return 'negative';
      case 'unlock': return 'neutral';
      default: return '';
    }
  };

  if (loading) {
    return <div className="points-history-loading">Loading history...</div>;
  }

  if (error) {
    return <div className="points-history-error">{error}</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="points-history-empty">
        <p>No transaction history yet. Complete surveys to earn points!</p>
      </div>
    );
  }

  return (
    <div className="points-history">
      <h3>Points History</h3>
      <div className="transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction._id} className={`transaction-item ${getTransactionColor(transaction.type)}`}>
            <div className="transaction-icon">{getTransactionIcon(transaction.type)}</div>
            <div className="transaction-details">
              <p className="transaction-description">{transaction.description}</p>
              <p className="transaction-date">
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            </div>
            <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointsHistory;
