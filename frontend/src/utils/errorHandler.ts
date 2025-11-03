/**
 * Frontend error handling utilities
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * Extract error message from various error formats
 */
export const getErrorMessage = (error: any): string => {
  // API error response
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // Network error
  if (error.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection.';
  }

  // Timeout error
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Generic axios error
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `An error occurred (${status}). Please try again.`;
    }
  }

  // Generic error
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Get error code from error object
 */
export const getErrorCode = (error: any): string => {
  return error.response?.data?.error?.code || 'UNKNOWN_ERROR';
};

/**
 * Get error details from error object
 */
export const getErrorDetails = (error: any): any => {
  return error.response?.data?.error?.details;
};

/**
 * Check if error is a specific type
 */
export const isErrorType = (error: any, code: string): boolean => {
  return getErrorCode(error) === code;
};

/**
 * Check if error is authentication related
 */
export const isAuthError = (error: any): boolean => {
  const code = getErrorCode(error);
  return code === 'AUTHENTICATION_ERROR' || 
         code === 'INVALID_TOKEN' || 
         code === 'TOKEN_EXPIRED' ||
         error.response?.status === 401;
};

/**
 * Check if error is validation related
 */
export const isValidationError = (error: any): boolean => {
  return getErrorCode(error) === 'VALIDATION_ERROR' || 
         error.response?.status === 400;
};

/**
 * Check if error is network related
 */
export const isNetworkError = (error: any): boolean => {
  return error.message === 'Network Error' || 
         !error.response;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (error: any): Record<string, string> => {
  const details = getErrorDetails(error);
  
  if (!details || !Array.isArray(details)) {
    return {};
  }

  return details.reduce((acc, detail) => {
    if (detail.field && detail.message) {
      acc[detail.field] = detail.message;
    }
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Log error to console (development) or error tracking service (production)
 */
export const logError = (error: any, context?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { extra: context });
  }
};

/**
 * Show user-friendly error notification
 */
export const showErrorNotification = (error: any, fallbackMessage?: string): void => {
  const message = getErrorMessage(error) || fallbackMessage || 'An error occurred';
  
  // You can integrate with a toast/notification library here
  // Example: toast.error(message);
  
  // For now, just log it
  console.error(message);
};

/**
 * Retry failed request with exponential backoff
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Handle async errors in React components
 */
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  onError?: (error: any) => void
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    logError(error);
    
    if (onError) {
      onError(error);
    } else {
      showErrorNotification(error);
    }
    
    return null;
  }
};

/**
 * Create error boundary fallback component props
 */
export interface ErrorBoundaryProps {
  error: Error;
  resetError: () => void;
}

export default {
  getErrorMessage,
  getErrorCode,
  getErrorDetails,
  isErrorType,
  isAuthError,
  isValidationError,
  isNetworkError,
  formatValidationErrors,
  logError,
  showErrorNotification,
  retryRequest,
  handleAsyncError
};
