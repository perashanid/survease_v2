// Mock database implementation for development/testing when PostgreSQL is not available
interface MockUser {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface MockSurvey {
  id: number;
  user_id: number;
  title: string;
  description: string;
  slug: string;
  configuration: any;
  is_public: boolean;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface MockResponse {
  id: number;
  survey_id: number;
  respondent_email?: string;
  response_data: any;
  is_anonymous: boolean;
  ip_address?: string;
  submitted_at: string;
}

class MockDatabase {
  private users: MockUser[] = [];
  private surveys: MockSurvey[] = [];
  private responses: MockResponse[] = [];
  private nextUserId = 1;
  private nextSurveyId = 1;
  private nextResponseId = 1;

  constructor() {
    this.seedMockData();
  }

  private seedMockData() {
    // Add test user
    this.users.push({
      id: this.nextUserId++,
      email: 'test@example.com',
      password_hash: '$2b$10$example.hash.for.password123',
      first_name: 'Test',
      last_name: 'User',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Add sample survey
    const sampleConfig = {
      questions: [
        {
          id: 'q1',
          type: 'text',
          title: 'What is your name?',
          required: true
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'What is your favorite color?',
          required: false,
          options: ['Red', 'Blue', 'Green', 'Yellow']
        }
      ],
      settings: {
        allowAnonymous: true,
        requireLogin: false,
        showProgress: true
      }
    };

    this.surveys.push({
      id: this.nextSurveyId++,
      user_id: 1,
      title: 'Sample Survey',
      description: 'This is a sample survey for testing',
      slug: 'sample-survey',
      configuration: sampleConfig,
      is_public: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Add sample responses
    this.responses.push({
      id: this.nextResponseId++,
      survey_id: 1,
      response_data: {
        responses: { q1: 'John Doe', q2: 'Blue' },
        metadata: { completionTime: 120 }
      },
      is_anonymous: true,
      submitted_at: new Date().toISOString()
    });
  }

  async query(text: string, params: any[] = []): Promise<any> {
    console.log('Mock DB Query:', text, params);
    
    // Simple mock responses for common queries
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }], rowCount: 1 };
    }
    
    if (text.includes('SELECT * FROM users')) {
      return { rows: this.users, rowCount: this.users.length };
    }
    
    if (text.includes('SELECT * FROM surveys')) {
      return { rows: this.surveys, rowCount: this.surveys.length };
    }
    
    if (text.includes('SELECT * FROM responses')) {
      return { rows: this.responses, rowCount: this.responses.length };
    }

    // Default response
    return { rows: [], rowCount: 0 };
  }

  async testConnection(): Promise<boolean> {
    console.log('✅ Mock database connection successful');
    return true;
  }

  async closePool(): Promise<void> {
    console.log('📊 Mock database pool closed');
  }
}

export const mockDb = new MockDatabase();