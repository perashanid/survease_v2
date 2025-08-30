/**
 * Time Tracking Service for Survey Completion Analytics
 * Handles start time recording and completion time calculation
 */

export interface TimeTrackingData {
  startTime: Date;
  surveyId: string;
}

class TimeTrackingService {
  private readonly STORAGE_KEY = 'survey_time_tracking';

  /**
   * Start tracking time for a survey
   * @param surveyId - The ID of the survey being started
   */
  startSurvey(surveyId: string): boolean {
    if (!surveyId || typeof surveyId !== 'string') {
      console.warn('TimeTrackingService: Invalid surveyId provided to startSurvey:', surveyId);
      return false;
    }

    try {
      const startTime = new Date();
      const trackingData: TimeTrackingData = {
        startTime,
        surveyId
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trackingData));
      console.log(`TimeTrackingService: Started tracking for survey ${surveyId}`);
      return true;
    } catch (error) {
      console.warn('TimeTrackingService: Failed to save survey start time to localStorage:', error);
      // Fallback: try to use sessionStorage if localStorage fails
      try {
        const fallbackData = { startTime: new Date(), surveyId };
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(fallbackData));
        console.log(`TimeTrackingService: Fallback to sessionStorage for survey ${surveyId}`);
        return true;
      } catch (sessionError) {
        console.error('TimeTrackingService: Failed to save to sessionStorage as well:', sessionError);
        return false;
      }
    }
  }

  /**
   * Get the start time for the current survey
   * @param surveyId - The ID of the survey
   * @returns The start time or null if not found
   */
  getStartTime(surveyId: string): Date | null {
    if (!surveyId || typeof surveyId !== 'string') {
      return null;
    }

    try {
      let stored = localStorage.getItem(this.STORAGE_KEY);
      
      // Fallback to sessionStorage if localStorage fails
      if (!stored) {
        try {
          stored = sessionStorage.getItem(this.STORAGE_KEY);
        } catch (sessionError) {
          console.warn('Failed to access sessionStorage:', sessionError);
        }
      }
      
      if (!stored) return null;

      const trackingData: TimeTrackingData = JSON.parse(stored);
      
      // Verify this is for the correct survey and has valid data
      if (trackingData.surveyId !== surveyId || !trackingData.startTime) return null;
      
      const startTime = new Date(trackingData.startTime);
      
      // Validate the date is reasonable (not in the future, not too old)
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (startTime > now || (now.getTime() - startTime.getTime()) > maxAge) {
        console.warn('Invalid start time detected, clearing tracking data');
        this.clearSurveyTracking(surveyId);
        return null;
      }
      
      return startTime;
    } catch (error) {
      console.warn('Failed to retrieve survey start time:', error);
      return null;
    }
  }

  /**
   * Calculate completion time in seconds
   * @param surveyId - The ID of the survey
   * @returns Completion time in seconds or null if start time not found
   */
  calculateCompletionTime(surveyId: string): number | null {
    const startTime = this.getStartTime(surveyId);
    if (!startTime) return null;

    const endTime = new Date();
    const completionTimeMs = endTime.getTime() - startTime.getTime();
    
    // Validate completion time is reasonable (not negative, not too long)
    if (completionTimeMs < 0) {
      console.warn('Negative completion time detected');
      return null;
    }
    
    const maxCompletionTime = 24 * 60 * 60 * 1000; // 24 hours
    if (completionTimeMs > maxCompletionTime) {
      console.warn('Completion time exceeds maximum allowed time');
      return null;
    }
    
    // Return completion time in seconds, rounded to nearest second
    const completionTimeSeconds = Math.round(completionTimeMs / 1000);
    
    // Ensure minimum completion time of 1 second
    return Math.max(1, completionTimeSeconds);
  }

  /**
   * Clear tracking data for a survey (call after successful submission)
   * @param surveyId - The ID of the survey
   */
  clearSurveyTracking(surveyId: string): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const trackingData: TimeTrackingData = JSON.parse(stored);
      
      // Only clear if it matches the current survey
      if (trackingData.surveyId === surveyId) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear survey tracking data:', error);
    }
  }

  /**
   * Check if a survey is currently being tracked
   * @param surveyId - The ID of the survey
   * @returns True if the survey is being tracked
   */
  isSurveyTracked(surveyId: string): boolean {
    return this.getStartTime(surveyId) !== null;
  }

  /**
   * Format completion time for display
   * @param completionTimeSeconds - Time in seconds
   * @returns Formatted string like "2m 30s"
   */
  formatCompletionTime(completionTimeSeconds: number): string {
    const minutes = Math.floor(completionTimeSeconds / 60);
    const seconds = completionTimeSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Export singleton instance
export const timeTrackingService = new TimeTrackingService();