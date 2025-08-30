import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app';
import { User, Survey, Response as SurveyResponse } from '../models';
import jwt from 'jsonwebtoken';

describe('Analytics Functionality', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;
  let surveyId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Survey.deleteMany({});
    await SurveyResponse.deleteMany({});

    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User'
    });
    userId = (user._id as any).toString();

    // Generate auth token
    authToken = jwt.sign(
      { id: userId, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test survey
    const survey = await Survey.create({
      title: 'Test Analytics Survey',
      description: 'Survey for testing analytics',
      slug: 'test-analytics-survey',
      user_id: userId,
      configuration: {
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'What is your name?',
            required: true
          },
          {
            id: 'q2',
            type: 'rating',
            question: 'Rate our service',
            required: false,
            min_rating: 1,
            max_rating: 5
          },
          {
            id: 'q3',
            type: 'multiple_choice',
            question: 'Choose your favorite color',
            required: false,
            options: ['Red', 'Blue', 'Green', 'Yellow']
          }
        ],
        settings: {
          is_public: true,
          allow_anonymous: true,
          collect_email: false,
          one_response_per_user: false,
          show_results: false
        }
      },
      is_active: true,
      is_public: true
    });
    surveyId = (survey._id as any).toString();
  });

  describe('Time Tracking', () => {
    it('should accept responses with completion time data', async () => {
      const startTime = new Date(Date.now() - 120000); // 2 minutes ago
      const completionTime = 120; // 2 minutes in seconds

      const response = await request(app)
        .post(`/api/surveys/test-analytics-survey/responses`)
        .send({
          responses: {
            q1: 'John Doe',
            q2: 4,
            q3: 'Blue'
          },
          completion_time: completionTime,
          started_at: startTime
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verify the response was saved with timing data
      const savedResponse = await SurveyResponse.findOne({ survey_id: surveyId });
      expect(savedResponse).toBeTruthy();
      expect(savedResponse!.completion_time).toBe(completionTime);
      expect(savedResponse!.started_at).toBeTruthy();
    });

    it('should reject invalid completion time data', async () => {
      const response = await request(app)
        .post(`/api/surveys/test-analytics-survey/responses`)
        .send({
          responses: {
            q1: 'John Doe'
          },
          completion_time: -10 // Invalid negative time
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject completion time exceeding maximum', async () => {
      const response = await request(app)
        .post(`/api/surveys/test-analytics-survey/responses`)
        .send({
          responses: {
            q1: 'John Doe'
          },
          completion_time: 90000 // More than 24 hours
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Analytics API', () => {
    beforeEach(async () => {
      // Create test responses with timing data
      const responses = [
        {
          survey_id: surveyId,
          response_data: { q1: 'Alice', q2: 5, q3: 'Red' },
          completion_time: 60,
          started_at: new Date(Date.now() - 60000),
          submitted_at: new Date(Date.now() - 3600000), // 1 hour ago
          is_anonymous: true
        },
        {
          survey_id: surveyId,
          response_data: { q1: 'Bob', q2: 3, q3: 'Blue' },
          completion_time: 90,
          started_at: new Date(Date.now() - 90000),
          submitted_at: new Date(Date.now() - 7200000), // 2 hours ago
          is_anonymous: true
        },
        {
          survey_id: surveyId,
          response_data: { q1: 'Charlie', q2: 4, q3: 'Green' },
          completion_time: 45,
          started_at: new Date(Date.now() - 45000),
          submitted_at: new Date(Date.now() - 10800000), // 3 hours ago
          is_anonymous: true
        }
      ];

      await SurveyResponse.insertMany(responses);
    });

    it('should return general analytics data with completion times', async () => {
      const response = await request(app)
        .get('/api/surveys/analytics/data')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSurveys');
      expect(response.body.data).toHaveProperty('totalResponses');
      expect(response.body.data).toHaveProperty('overallAverageCompletionTime');
      expect(response.body.data).toHaveProperty('responsesWithTiming');
      
      // Check completion time calculation
      expect(response.body.data.overallAverageCompletionTime).toBe(65); // (60+90+45)/3 = 65
      expect(response.body.data.responsesWithTiming).toBe(3);
    });

    it('should return survey-specific analytics with hourly distribution', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('survey');
      expect(response.body.data).toHaveProperty('responses');
      expect(response.body.data).toHaveProperty('questionAnalytics');
      expect(response.body.data).toHaveProperty('demographics');

      // Check demographics data
      const demographics = response.body.data.demographics;
      expect(demographics).toHaveProperty('responsesByHour');
      expect(demographics).toHaveProperty('averageCompletionTime');
      expect(demographics.averageCompletionTime).toBe(65);
      expect(demographics.responsesByHour).toHaveLength(24);

      // Check question analytics
      const questionAnalytics = response.body.data.questionAnalytics;
      expect(questionAnalytics).toHaveProperty('q2'); // Rating question
      expect(questionAnalytics.q2).toHaveProperty('averageRating');
      expect(questionAnalytics.q2.averageRating).toBe(4); // (5+3+4)/3 = 4
    });

    it('should handle surveys with no responses', async () => {
      // Delete all responses
      await SurveyResponse.deleteMany({});

      const response = await request(app)
        .get(`/api/surveys/${surveyId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.demographics.averageCompletionTime).toBeUndefined();
      expect(response.body.data.responses).toHaveLength(0);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      // Create test responses for export
      const responses = [
        {
          survey_id: surveyId,
          response_data: { q1: 'Export Test 1', q2: 5, q3: 'Red' },
          completion_time: 120,
          started_at: new Date('2024-01-01T10:00:00Z'),
          submitted_at: new Date('2024-01-01T10:02:00Z'),
          is_anonymous: true,
          respondent_email: 'test1@example.com'
        },
        {
          survey_id: surveyId,
          response_data: { q1: 'Export Test 2', q2: 3, q3: 'Blue' },
          completion_time: 180,
          started_at: new Date('2024-01-01T11:00:00Z'),
          submitted_at: new Date('2024-01-01T11:03:00Z'),
          is_anonymous: false,
          respondent_email: 'test2@example.com'
        }
      ];

      await SurveyResponse.insertMany(responses);
    });

    it('should export CSV with timing data', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/export`)
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      
      const csvContent = response.text;
      expect(csvContent).toContain('Completion Time (seconds)');
      expect(csvContent).toContain('Completion Time (minutes)');
      expect(csvContent).toContain('Started At');
      expect(csvContent).toContain('120'); // First response completion time
      expect(csvContent).toContain('180'); // Second response completion time
      expect(csvContent).toContain('SUMMARY STATISTICS');
      expect(csvContent).toContain('Average Completion Time');
    });

    it('should export JSON with timing data and analytics', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/export`)
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const jsonData = response.body;
      expect(jsonData).toHaveProperty('survey');
      expect(jsonData).toHaveProperty('responses');
      expect(jsonData).toHaveProperty('analytics');
      expect(jsonData).toHaveProperty('export_metadata');

      // Check analytics section
      expect(jsonData.analytics.total_responses).toBe(2);
      expect(jsonData.analytics.responses_with_timing).toBe(2);
      expect(jsonData.analytics.average_completion_time_seconds).toBe(150); // (120+180)/2
      expect(jsonData.analytics.fastest_completion_seconds).toBe(120);
      expect(jsonData.analytics.slowest_completion_seconds).toBe(180);

      // Check response data includes timing
      expect(jsonData.responses[0]).toHaveProperty('completion_time_seconds');
      expect(jsonData.responses[0]).toHaveProperty('completion_time_minutes');
      expect(jsonData.responses[0]).toHaveProperty('started_at');
    });

    it('should handle export with no timing data', async () => {
      // Create response without timing data
      await SurveyResponse.deleteMany({});
      await SurveyResponse.create({
        survey_id: surveyId,
        response_data: { q1: 'No Timing', q2: 4 },
        submitted_at: new Date(),
        is_anonymous: true
      });

      const response = await request(app)
        .get(`/api/surveys/${surveyId}/export`)
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const jsonData = response.body;
      expect(jsonData.analytics.responses_with_timing).toBe(0);
      expect(jsonData.analytics.average_completion_time_seconds).toBeNull();
      expect(jsonData.responses[0].completion_time_seconds).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthenticated analytics requests', async () => {
      const response = await request(app)
        .get('/api/surveys/analytics/data');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent survey analytics', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/surveys/${fakeId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid survey ID in analytics', async () => {
      const response = await request(app)
        .get('/api/surveys/invalid-id/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle export errors gracefully', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/surveys/${fakeId}/export`)
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});