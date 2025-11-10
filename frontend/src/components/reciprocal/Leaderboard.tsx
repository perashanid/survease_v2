import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../../services/api';
import { FiAward, FiStar } from 'react-icons/fi';
import './Leaderboard.css';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  points: number;
  rank: number;
}

interface LeaderboardProps {
  limit?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 10 }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard(limit);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return <FiAward className="medal gold" />;
      case 2: return <FiAward className="medal silver" />;
      case 3: return <FiStar className="medal bronze" />;
      default: return <span className="rank-number">#{rank}</span>;
    }
  };

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">{error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="leaderboard-empty">
        <p>No leaderboard data yet. Be the first to earn points!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3>🏆 Top Contributors</h3>
      <div className="leaderboard-list">
        {entries.map((entry, index) => (
          <div key={`${entry.userId}-${index}`} className={`leaderboard-entry rank-${entry.rank}`}>
            <div className="entry-rank">
              {getMedalIcon(entry.rank)}
            </div>
            <div className="entry-details">
              <span className="entry-name">{entry.userName}</span>
              <span className="entry-points">{entry.points} points</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
