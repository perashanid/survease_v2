import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Simple in-memory cache for GET requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor to add auth token and handle caching
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests (unless explicitly disabled)
    if (config.method === 'get' && !config.params?.noCache) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Return cached data
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and cache responses
apiClient.interceptors.response.use(
  (response) => {
    // Cache GET responses
    if (response.config.method === 'get' && !response.config.params?.noCache) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          if (response.data.success) {
            const newAccessToken = response.data.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Clear cache function (useful after mutations)
export const clearCache = () => {
  cache.clear();
};


// ============================================
// Reciprocal System API Methods
// ============================================

/**
 * Get locked responses for a survey
 */
export const getLockedResponses = async (surveyId: string) => {
  const response = await apiClient.get(`/surveys/${surveyId}/responses/locked`);
  return response.data;
};

/**
 * Unlock a response by completing a survey
 */
export const unlockResponse = async (
  surveyId: string,
  responseId: string,
  completedSurveyId: string
) => {
  const response = await apiClient.post(
    `/surveys/${surveyId}/responses/${responseId}/unlock`,
    { completed_survey_id: completedSurveyId }
  );
  clearCache(); // Clear cache after mutation
  return response.data;
};

/**
 * Generate a custom link for a survey
 */
export const generateCustomLink = async (surveyId: string, expiresAt?: string) => {
  const response = await apiClient.post(`/surveys/${surveyId}/custom-link`, {
    expires_at: expiresAt
  });
  return response.data;
};

/**
 * Get all custom links for a survey
 */
export const getCustomLinks = async (surveyId: string) => {
  const response = await apiClient.get(`/surveys/${surveyId}/custom-links`);
  return response.data;
};

/**
 * Deactivate a custom link
 */
export const deactivateCustomLink = async (linkId: string) => {
  const response = await apiClient.delete(`/custom-links/${linkId}`);
  clearCache();
  return response.data;
};

/**
 * Boost a survey with bonus points
 */
export const boostSurvey = async (
  surveyId: string,
  bonusPoints: number,
  durationDays?: number
) => {
  const response = await apiClient.post(`/surveys/${surveyId}/boost`, {
    bonus_points: bonusPoints,
    duration_days: durationDays
  });
  clearCache();
  return response.data;
};

/**
 * Remove boost from a survey
 */
export const unboostSurvey = async (surveyId: string) => {
  const response = await apiClient.delete(`/surveys/${surveyId}/boost`);
  clearCache();
  return response.data;
};

/**
 * Get all boosted surveys
 */
export const getBoostedSurveys = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get('/boosted-surveys', {
    params: { page, limit }
  });
  return response.data.data;
};

/**
 * Get user's points balance and recent transactions
 */
export const getUserPoints = async () => {
  const response = await apiClient.get('/users/points');
  return response.data.data;
};

/**
 * Get user's points transaction history
 */
export const getPointsHistory = async (limit: number = 50) => {
  const response = await apiClient.get('/users/points/history', {
    params: { limit }
  });
  return response.data.data.transactions;
};

/**
 * Get points leaderboard
 */
export const getLeaderboard = async (limit: number = 10) => {
  const response = await apiClient.get('/leaderboard', {
    params: { limit }
  });
  return response.data.data.leaderboard;
};

/**
 * Validate a custom link token
 */
export const validateCustomLinkToken = async (token: string) => {
  const response = await apiClient.get(`/custom-link/validate/${token}`);
  return response.data;
};
