import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Survey, Response, Session } from '../models';
import bcrypt from 'bcrypt';

describe('Data Models', () => {
  let mongoServer: MongoMemoryServer;

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
    // Clear all collections before each test
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});
    await Session.deleteMany({});
  });

  describe('User Model', () => {
    it('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Test',
        last_name: 'User',
        email_verified: true
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.first_name).toBe('Test');
      expect(savedUser.last_name).toBe('User');
      expect(savedUser.email_verified).toBe(true);
      expect(savedUser.created_at).toBeDefined();
      expect(savedUser.updated_at).toBeDefined();
    });

    it('should require email and password_hash', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password_hash: await bcrypt.hash('password123', 10)
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });

    it('should trim whitespace from names', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: '  Test  ',
        last_name: '  User  '
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.first_name).toBe('Test');
      expect(savedUser.last_name).toBe('User');
    });
  });

  describe('Survey Model', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      });
      await testUser.save();
    });

    it('should create a valid survey', async () => {
      const surveyData = {
        user_id: testUser._id,
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
            is_public: false,
            allow_anonymous: true,
            collect_email: false,
            one_response_per_user: false,
            show_results: false
          }
        },
        is_public: true,
        is_active: true
      };

      const survey = new Survey(surveyData);
      const savedSurvey = await survey.save();

      expect(savedSurvey._id).toBeDefined();
      expect(savedSurvey.title).toBe('Test Survey');
      expect(savedSurvey.slug).toBe('test-survey');
      expect(savedSurvey.configuration.questions).toHaveLength(1);
      expect(savedSurvey.is_public).toBe(true);
      expect(savedSurvey.created_at).toBeDefined();
    });

    it('should require user_id, title, and slug', async () => {
      const survey = new Survey({});
      
      await expect(survey.save()).rejects.toThrow();
    });

    it('should enforce unique slug constraint', async () => {
      const surveyData = {
        user_id: testUser._id,
        title: 'Test Survey',
        slug: 'test-survey',
        configuration: {
          questions: [],
          settings: { 
            is_public: false, 
            allow_anonymous: true, 
            collect_email: false, 
            one_response_per_user: false, 
            show_results: false 
          }
        }
      };

      const survey1 = new Survey(surveyData);
      await survey1.save();

      const survey2 = new Survey(surveyData);
      await expect(survey2.save()).rejects.toThrow();
    });

    it('should validate question types', async () => {
      const surveyData = {
        user_id: testUser._id,
        title: 'Test Survey',
        slug: 'test-survey',
        configuration: {
          questions: [
            {
              id: 'q1',
              type: 'invalid_type',
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
      };

      const survey = new Survey(surveyData);
      await expect(survey.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const surveyData = {
        user_id: testUser._id,
        title: 'Test Survey',
        slug: 'test-survey',
        configuration: {
          questions: [],
          settings: { 
            is_public: false, 
            allow_anonymous: true, 
            collect_email: false, 
            one_response_per_user: false, 
            show_results: false 
          }
        }
      };

      const survey = new Survey(surveyData);
      const savedSurvey = await survey.save();

      expect(savedSurvey.is_public).toBe(false);
      expect(savedSurvey.is_active).toBe(true);
    });
  });

  describe('Response Model', () => {
    let testSurvey: any;

    beforeEach(async () => {
      const testUser = new User({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      });
      await testUser.save();

      testSurvey = new Survey({
        user_id: testUser._id,
        title: 'Test Survey',
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
            is_public: false, 
            allow_anonymous: true, 
            collect_email: false, 
            one_response_per_user: false, 
            show_results: false 
          }
        }
      });
      await testSurvey.save();
    });

    it('should create a valid response', async () => {
      const responseData = {
        survey_id: testSurvey._id,
        respondent_email: 'respondent@example.com',
        response_data: {
          q1: 'John Doe'
        },
        is_anonymous: false
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse._id).toBeDefined();
      expect(savedResponse.survey_id).toEqual(testSurvey._id);
      expect(savedResponse.respondent_email).toBe('respondent@example.com');
      expect(savedResponse.response_data.q1).toBe('John Doe');
      expect(savedResponse.is_anonymous).toBe(false);
      expect(savedResponse.submitted_at).toBeDefined();
    });

    it('should require survey_id and response_data', async () => {
      const response = new Response({});
      
      await expect(response.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const responseData = {
        survey_id: testSurvey._id,
        response_data: {
          q1: 'John Doe'
        }
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.is_anonymous).toBe(true);
      expect(savedResponse.submitted_at).toBeDefined();
    });

    it('should convert email to lowercase', async () => {
      const responseData = {
        survey_id: testSurvey._id,
        respondent_email: 'RESPONDENT@EXAMPLE.COM',
        response_data: {
          q1: 'John Doe'
        }
      };

      const response = new Response(responseData);
      const savedResponse = await response.save();

      expect(savedResponse.respondent_email).toBe('respondent@example.com');
    });
  });

  describe('Session Model', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      });
      await testUser.save();
    });

    it('should create a valid session', async () => {
      const sessionData = {
        user_id: testUser._id,
        token_hash: 'hashed_token_value',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      const session = new Session(sessionData);
      const savedSession = await session.save();

      expect(savedSession._id).toBeDefined();
      expect(savedSession.user_id).toEqual(testUser._id);
      expect(savedSession.token_hash).toBe('hashed_token_value');
      expect(savedSession.expires_at).toBeDefined();
      expect(savedSession.created_at).toBeDefined();
    });

    it('should require user_id, token_hash, and expires_at', async () => {
      const session = new Session({});
      
      await expect(session.save()).rejects.toThrow();
    });

    it('should set created_at automatically', async () => {
      const sessionData = {
        user_id: testUser._id,
        token_hash: 'hashed_token_value',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const session = new Session(sessionData);
      const savedSession = await session.save();

      expect(savedSession.created_at).toBeDefined();
      expect(savedSession.created_at).toBeInstanceOf(Date);
    });
  });

  describe('Model Relationships', () => {
    it('should populate user data in survey', async () => {
      const testUser = new User({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Test',
        last_name: 'User'
      });
      await testUser.save();

      const survey = new Survey({
        user_id: testUser._id,
        title: 'Test Survey',
        slug: 'test-survey',
        configuration: {
          questions: [],
          settings: { 
            is_public: false, 
            allow_anonymous: true, 
            collect_email: false, 
            one_response_per_user: false, 
            show_results: false 
          }
        }
      });
      await survey.save();

      const populatedSurvey = await Survey.findById(survey._id).populate('user_id');
      
      expect(populatedSurvey?.user_id).toBeDefined();
      expect((populatedSurvey?.user_id as any).email).toBe('test@example.com');
    });

    it('should populate survey data in response', async () => {
      const testUser = new User({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      });
      await testUser.save();

      const survey = new Survey({
        user_id: testUser._id,
        title: 'Test Survey',
        slug: 'test-survey',
        configuration: {
          questions: [],
          settings: { 
            is_public: false, 
            allow_anonymous: true, 
            collect_email: false, 
            one_response_per_user: false, 
            show_results: false 
          }
        }
      });
      await survey.save();

      const response = new Response({
        survey_id: survey._id,
        response_data: {
          q1: 'Test response'
        }
      });
      await response.save();

      const populatedResponse = await Response.findById(response._id).populate('survey_id');
      
      expect(populatedResponse?.survey_id).toBeDefined();
      expect((populatedResponse?.survey_id as any).title).toBe('Test Survey');
    });
  });
});