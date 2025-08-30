import { timeTrackingService } from '../timeTrackingService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('TimeTrackingService', () => {
  const testSurveyId = 'test-survey-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startSurvey', () => {
    it('should start tracking time for a survey', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate.toISOString() as any);

      timeTrackingService.startSurvey(testSurveyId);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'survey_time_tracking',
        JSON.stringify({
          startTime: mockDate,
          surveyId: testSurveyId
        })
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      timeTrackingService.startSurvey(testSurveyId);

      expect(sessionStorageMock.setItem).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to save survey start time to localStorage:',
        expect.any(Error)
      );
    });

    it('should not start tracking for invalid survey ID', () => {
      timeTrackingService.startSurvey('');
      timeTrackingService.startSurvey(null as any);
      timeTrackingService.startSurvey(undefined as any);

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStartTime', () => {
    it('should retrieve start time for correct survey', () => {
      const mockStartTime = new Date('2024-01-01T10:00:00Z');
      const trackingData = {
        startTime: mockStartTime.toISOString(),
        surveyId: testSurveyId
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toEqual(mockStartTime);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('survey_time_tracking');
    });

    it('should return null for different survey ID', () => {
      const trackingData = {
        startTime: new Date().toISOString(),
        surveyId: 'different-survey'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toBeNull();
    });

    it('should return null when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toBeNull();
    });

    it('should handle invalid stored data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should reject future start times', () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      const trackingData = {
        startTime: futureTime.toISOString(),
        surveyId: testSurveyId
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Invalid start time detected, clearing tracking data'
      );
    });

    it('should reject very old start times', () => {
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const trackingData = {
        startTime: oldTime.toISOString(),
        surveyId: testSurveyId
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toBeNull();
    });

    it('should fallback to sessionStorage when localStorage fails', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const trackingData = {
        startTime: new Date().toISOString(),
        surveyId: testSurveyId
      };
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      const result = timeTrackingService.getStartTime(testSurveyId);

      expect(result).toBeTruthy();
      expect(sessionStorageMock.getItem).toHaveBeenCalled();
    });
  });

  describe('calculateCompletionTime', () => {
    it('should calculate completion time correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:02:30Z'); // 2.5 minutes later
      
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(startTime);
      jest.spyOn(global, 'Date').mockImplementation(() => endTime.toISOString() as any);

      const result = timeTrackingService.calculateCompletionTime(testSurveyId);

      expect(result).toBe(150); // 2.5 minutes = 150 seconds
    });

    it('should return null when no start time exists', () => {
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(null);

      const result = timeTrackingService.calculateCompletionTime(testSurveyId);

      expect(result).toBeNull();
    });

    it('should handle negative completion times', () => {
      const startTime = new Date('2024-01-01T10:02:00Z');
      const endTime = new Date('2024-01-01T10:00:00Z'); // Earlier than start
      
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(startTime);
      jest.spyOn(global, 'Date').mockImplementation(() => endTime.toISOString() as any);

      const result = timeTrackingService.calculateCompletionTime(testSurveyId);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Negative completion time detected');
    });

    it('should handle extremely long completion times', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-02T11:00:00Z'); // 25 hours later
      
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(startTime);
      jest.spyOn(global, 'Date').mockImplementation(() => endTime.toISOString() as any);

      const result = timeTrackingService.calculateCompletionTime(testSurveyId);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Completion time exceeds maximum allowed time');
    });

    it('should ensure minimum completion time of 1 second', () => {
      const startTime = new Date('2024-01-01T10:00:00.000Z');
      const endTime = new Date('2024-01-01T10:00:00.500Z'); // 0.5 seconds later
      
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(startTime);
      jest.spyOn(global, 'Date').mockImplementation(() => endTime.toISOString() as any);

      const result = timeTrackingService.calculateCompletionTime(testSurveyId);

      expect(result).toBe(1); // Minimum 1 second
    });
  });

  describe('formatCompletionTime', () => {
    it('should format seconds only for times under 1 minute', () => {
      expect(timeTrackingService.formatCompletionTime(30)).toBe('30s');
      expect(timeTrackingService.formatCompletionTime(59)).toBe('59s');
    });

    it('should format minutes and seconds for times over 1 minute', () => {
      expect(timeTrackingService.formatCompletionTime(60)).toBe('1m 0s');
      expect(timeTrackingService.formatCompletionTime(90)).toBe('1m 30s');
      expect(timeTrackingService.formatCompletionTime(150)).toBe('2m 30s');
      expect(timeTrackingService.formatCompletionTime(3661)).toBe('61m 1s');
    });

    it('should handle zero and edge cases', () => {
      expect(timeTrackingService.formatCompletionTime(0)).toBe('0s');
      expect(timeTrackingService.formatCompletionTime(1)).toBe('1s');
    });
  });

  describe('clearSurveyTracking', () => {
    it('should clear tracking data for correct survey', () => {
      const trackingData = {
        startTime: new Date().toISOString(),
        surveyId: testSurveyId
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      timeTrackingService.clearSurveyTracking(testSurveyId);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('survey_time_tracking');
    });

    it('should not clear tracking data for different survey', () => {
      const trackingData = {
        startTime: new Date().toISOString(),
        surveyId: 'different-survey'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(trackingData));

      timeTrackingService.clearSurveyTracking(testSurveyId);

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('isSurveyTracked', () => {
    it('should return true when survey is being tracked', () => {
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(new Date());

      const result = timeTrackingService.isSurveyTracked(testSurveyId);

      expect(result).toBe(true);
    });

    it('should return false when survey is not being tracked', () => {
      jest.spyOn(timeTrackingService, 'getStartTime').mockReturnValue(null);

      const result = timeTrackingService.isSurveyTracked(testSurveyId);

      expect(result).toBe(false);
    });
  });
});