import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getUserPoints } from '../services/api';

interface UserPoints {
  total_points: number;
  lifetime_points: number;
  points_spent: number;
  last_updated: string;
}

interface PointsContextType {
  points: UserPoints | null;
  loading: boolean;
  error: string | null;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

interface PointsProviderProps {
  children: ReactNode;
}

const CACHE_DURATION = 30000; // 30 seconds cache
let lastFetchTime = 0;
let cachedPoints: UserPoints | null = null;
let ongoingRequest: Promise<void> | null = null;

export const PointsProvider: React.FC<PointsProviderProps> = ({ children }) => {
  const [points, setPoints] = useState<UserPoints | null>(cachedPoints);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPoints = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Use cache if it's fresh and not forcing refresh
    if (!forceRefresh && cachedPoints && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('[PointsContext] Using cached points, age:', now - lastFetchTime, 'ms');
      setPoints(cachedPoints);
      return;
    }

    // If there's already an ongoing request, wait for it
    if (ongoingRequest) {
      console.log('[PointsContext] Request already in progress, waiting...');
      await ongoingRequest;
      setPoints(cachedPoints);
      return;
    }

    // Create new request
    console.log('[PointsContext] Fetching fresh points from API...');
    setLoading(true);
    setError(null);

    ongoingRequest = (async () => {
      try {
        const data = await getUserPoints();
        cachedPoints = data.points;
        lastFetchTime = Date.now();
        setPoints(cachedPoints);
        console.log('[PointsContext] Points updated:', cachedPoints?.total_points);
      } catch (err: any) {
        console.error('[PointsContext] Failed to fetch points:', err);
        setError(err.response?.data?.message || 'Failed to load points');
      } finally {
        setLoading(false);
        ongoingRequest = null;
      }
    })();

    await ongoingRequest;
  }, []);

  useEffect(() => {
    console.log('[PointsContext] Provider mounted - lazy loading enabled (no initial fetch)');

    // Listen for points update events (only fetch when event is triggered)
    const handlePointsUpdate = () => {
      console.log('[PointsContext] pointsUpdated event received, forcing refresh...');
      refreshPoints(true); // Force refresh on event
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate);

    return () => {
      console.log('[PointsContext] Provider unmounting');
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
    };
  }, [refreshPoints]);

  const value: PointsContextType = {
    points,
    loading,
    error,
    refreshPoints: () => refreshPoints(true)
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
