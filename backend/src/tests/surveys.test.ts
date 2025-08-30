import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app';
import { User, Survey, Response } from '../models';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Survey API Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let authToken: string;

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
    // Clear all collections
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = new User({
      email: 'test@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      email_verified: true
    });
    await testUser.save();

    // Generate auth token using AuthUtils
    authToken = jwt.sign(
      { 
        userId: testUser._id.toString(), 
        email: testUser.email,
        type: 'access'
      },
      process.env.JWT_SECRET || 'test-secret',
      { 
        expiresIn: '24h',
        issuer: 'survey-platform',
        audience: 'survey-platform-users'
      }
    );
  });

  describe('POST /api/surveys', () => {
    it('should create a new survey', async () => {
      const surveyData = {
        title: 'Test Survey',
        description: 'A test survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'What is your name?',
            required: true
          },
          {
            id: 'q2',
            type: 'multiple_choice',
            question: 'What is your favorite color?',
            required: false,
            options: ['Red', 'Blue', 'Green']
          }
        ],
        settings: {
          is_public: true,
          allow_anonymous: true,
          collect_email: false,
          one_response_per_user: false,
          show_results: false
        }
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(surveyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.survey).toBeDefined();
      expect(response.body.data.survey.title).toBe('Test Survey');
      expect(response.body.data.survey.slug).toBe('test-survey');
      expect(response.body.data.survey.questions).toHaveLength(2);
      expect(response.body.data.survey.url).toContain('/survey/test-survey');
    });

    it('should require authentication', async () => {
      const surveyData = {
        title: 'Test Survey',
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'What is your name?',
            required: true
          }
        ]
      };

      await request(app)
        .post('/api/surveys')
        .send(surveyData)
        .expect(401);
    });

    it('should validate survey data', async () => {
      const invalidSurveyData = {
        title: '', // Empty title
        questions: [] // No questions
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSurveyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should generate unique slugs for duplicate titles', async () => {
      const surveyData = {
        title: 'Duplicate Title',
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'Test question',
            required: false
          }
        ]
      };

      // Create first survey
      const response1 = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(surveyData)
        .expect(201);

      // Create second survey with same title
      const response2 = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(surveyData)
        .expect(201);

      expect(response1.body.data.survey.slug).toBe('duplicate-title');
      expect(response2.body.data.survey.slug).toBe('duplicate-title-1');
    });
  });

  describe('GET /api/surveys', () => {
    beforeEach(async () => {
      // Create test surveys
      const surveys = [
        {
          user_id: testUser._id,
          title: 'Survey 1',
          slug: 'survey-1',
          configuration: {
            questions: [{ id: 'q1', type: 'text', question: 'Question 1', required: false }],
            settings: { is_public: true, allow_anonymous: true, collect_email: false, one_response_per_user: false, show_results: false }
          },
          is_public: true
        },
        {
          user_id: testUser._id,
          title: 'Survey 2',
          slug: 'survey-2',
          configuration: {
            questions: [{ id: 'q1', type: 'text', question: 'Question 1', required: false }],
            settings: { is_public: false, allow_anonymous: true, collect_email: false, one_response_per_user: false, show_results: false }
          },
          is_public: false
        }
      ];

      for (const surveyData of surveys) {
        const survey = new Survey(surveyData);
        await survey.save();
      }
    });

    it('should get user surveys', async () => {
      const response = await request(app)
        .get('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.surveys).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/surveys')
        .expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/surveys?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.surveys).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/surveys/public', () => {
    beforeEach(async () => {
      // Create public and private surveys
      const surveys = [
        {
          user_id: testUser._id,
          title: 'Public Survey 1',
          slug: 'public-survey-1',
          configuration: {
            questions: [{ id: 'q1', type: 'text', question: 'Question 1', required: false }],
            settings: { is_public: true, allow_anonymous: true, collect_email: false, one_response_per_user: false, show_results: false }
          },
          is_public: true,
          is_active: true
        },
        {
          user_id: testUser._id,
          title: 'Private Survey',
          slug: 'private-survey',
          configuration: {
            questions: [{ id: 'q1', type: 'text', question: 'Question 1', required: false }],
            settings: { is_public: false, allow_anonymous: true, collect_email: false, one_response_per_user: false, show_results: false }
          },
          is_public: false,
          is_active: true
        },
        {
          user_id: testUser._id,
          title: 'Inactive Public Survey',
          slug: 'inactive-public-survey',
          configuration: {
            questions: [{ id: 'q1', type: 'text', question: 'Question 1', required: false }],
            settings: { is_public: true, allow_anonymous: true, collect_email: false, one_response_per_user: false, show_results: false }
          },
          is_public: true,
          is_active: false
        }
      ];

      for (const surveyData of surveys) {
        const survey = new Survey(surveyData);
        await survey.save();
      }
    });

    it('should get only public and active surveys', async () => {
      const response = await request(app)
        .get('/api/surveys/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.surveys).toHaveLength(1);
      expect(response.body.data.surveys[0].title).toBe('Public Survey 1');
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/surveys/public')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/surveys/:slug', () => {
    let publicSurvey: any;
    let privateSurvey: any;

    beforeEach(async () => {
      publicSurvey = new Survey({
        user_id: testUser._id,
        title: 'Public Survey',
        slug: 'public-survey',
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
            is_public: true,
            allow_anonymous: true,
            collect_email: false,
            one_response_per_user: false,
            show_results: false
          }
        },
        is_public: true,
        is_active: true
      });
      await publicSurvey.save();

      privateSurvey = new Survey({
        user_id: testUser._id,
        title: 'Private Survey',
        slug: 'private-survey',
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
            is_public: false,
            allow_anonymous: true,
            collect_email: false,
            one_response_per_user: false,
            show_results: false
          }
        },
        is_public: false,
        is_active: true
      });
      await privateSurvey.save();
    });

    it('should get public survey without authentication', async () => {
      const response = await request(app)
        .get('/api/surveys/public-survey')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.survey.title).toBe('Public Survey');
      expect(response.body.data.survey.questions).toHaveLength(1);
    });

    it('should get private survey with owner authentication', async () => {
      const response = await request(app)
        .get('/api/surveys/private-survey')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.survey.title).toBe('Private Survey');
    });

    it('should reject private survey without authentication', async () => {
      const response = await request(app)
        .get('/api/surveys/private-survey')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SURVEY_PRIVATE');
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app)
        .get('/api/surveys/non-existent-survey')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SURVEY_NOT_FOUND');
    });
  });

  describe('PUT /api/surveys/:id', () => {
    let testSurvey: any;

    beforeEach(async () => {
      testSurvey = new Survey({
        user_id: testUser._id,
        title: 'Original Title',
        slug: 'original-title',
        configuration: {
          questions: [
            {
              id: 'q1',
              type: 'text',
              question: 'Original question',
              required: true
            }
          ],
          settings: {
            is_public: false,
            allow_anonymous: true,
            collect_email: false,
            one_response_per_user: false,
            show_results: false
          }
        },
        is_public: false
      });
      await testSurvey.save();
    });

    it('should update survey', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'Updated question',
            required: false
          }
        ],
        settings: {
          is_public: true,
          allow_anonymous: false
        }
      };

      const response = await request(app)
        .put(`/api/surveys/${testSurvey._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.survey.title).toBe('Updated Title');
      expect(response.body.data.survey.description).toBe('Updated description');
      expect(response.body.data.survey.is_public).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/surveys/${testSurvey._id}`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });

    it('should only allow owner to update', async () => {
      // Create another user
      const anotherUser = new User({
        email: 'another@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      });
      await anotherUser.save();

      const anotherToken = jwt.sign(
        { 
          userId: (anotherUser._id as any).toString(), 
          email: anotherUser.email,
          type: 'access'
        },
        process.env.JWT_SECRET || 'test-secret',
        { 
          expiresIn: '24h',
          issuer: 'survey-platform',
          audience: 'survey-platform-users'
        }
      );

      const response = await request(app)
        .put(`/api/surveys/${testSurvey._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SURVEY_NOT_FOUND');
    });
  });

  describe('DELETE /api/surveys/:id', () => {
    let testSurvey: any;

    beforeEach(async () => {
      testSurvey = new Survey({
        user_id: testUser._id,
        title: 'Survey to Delete',
        slug: 'survey-to-delete',
        configuration: {
          questions: [
            {
              id: 'q1',
              type: 'text',
              question: 'Test question',
              required: false
            }
          ],
          settings: {
            is_public: false,
            allow_anonymous: true,
            collect_email: false,
            one_response_per_user: false,
            show_results: false
          }
        }
      });
      await testSurvey.save();

      // Add some responses
      const response1 = new Response({
        survey_id: testSurvey._id,
        response_data: { q1: 'Response 1' }
      });
      await response1.save();
    });

    it('should delete survey and its responses', async () => {
      const response = await request(app)
        .delete(`/api/surveys/${testSurvey._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify survey is deleted
      const deletedSurvey = await Survey.findById(testSurvey._id);
      expect(deletedSurvey).toBeNull();

      // Verify responses are deleted
      const responses = await Response.find({ survey_id: testSurvey._id });
      expect(responses).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/surveys/${testSurvey._id}`)
        .expect(401);
    });

    it('should only allow owner to delete', async () => {
      // Create another user
      const anotherUser = new User({
        email: 'another@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      });
      await anotherUser.save();

      const anotherToken = jwt.sign(
        { 
          userId: (anotherUser._id as any).toString(), 
          email: anotherUser.email,
          type: 'access'
        },
        process.env.JWT_SECRET || 'test-secret',
        { 
          expiresIn: '24h',
          issuer: 'survey-platform',
          audience: 'survey-platform-users'
        }
      );

      const response = await request(app)
        .delete(`/api/surveys/${testSurvey._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SURVEY_NOT_FOUND');
    });
  });
});