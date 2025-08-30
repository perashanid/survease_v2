// Global test setup
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  createTestUser: () => ({
    email: 'test@example.com',
    password: 'password123',
    first_name: 'Test',
    last_name: 'User'
  }),
  
  createTestSurvey: (userId: string) => ({
    user_id: userId,
    title: 'Test Survey',
    description: 'A test survey',
    slug: 'test-survey',
    configuration: {
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What is your name?',
          required: true
        }
      ],
      settings: {
        allowAnonymous: true,
        requireLogin: false,
        showProgress: true
      }
    },
    is_public: true,
    is_active: true
  }),
  
  createTestResponse: (surveyId: string) => ({
    survey_id: surveyId,
    response_data: {
      responses: {
        q1: 'John Doe'
      },
      metadata: {
        completionTime: 120,
        userAgent: 'Test Browser'
      }
    },
    is_anonymous: true
  })
};

// Extend global namespace for TypeScript
declare global {
  var testUtils: {
    createTestUser: () => any;
    createTestSurvey: (userId: string) => any;
    createTestResponse: (surveyId: string) => any;
  };
}