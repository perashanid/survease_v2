import {
  userRegistrationSchema,
  userLoginSchema,
  createSurveySchema,
  submitResponseSchema,
  questionSchema,
  validateQuestionResponse,
  paginationSchema,
  objectIdSchema,
  slugSchema
} from '../validation/schemas';

describe('Validation Schemas', () => {
  describe('User Registration Schema', () => {
    it('should validate correct user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const { error, value } = userRegistrationSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const { error } = userRegistrationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email address');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      };

      const { error } = userRegistrationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 8 characters');
    });

    it('should allow optional names', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error } = userRegistrationSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('User Login Schema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error, value } = userLoginSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should require email and password', () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const { error } = userLoginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Password is required');
    });
  });

  describe('Question Schema', () => {
    it('should validate text question', () => {
      const validQuestion = {
        id: 'q1',
        type: 'text',
        question: 'What is your name?',
        required: true
      };

      const { error } = questionSchema.validate(validQuestion);
      expect(error).toBeUndefined();
    });

    it('should validate multiple choice question with options', () => {
      const validQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is your favorite color?',
        required: false,
        options: ['Red', 'Blue', 'Green']
      };

      const { error } = questionSchema.validate(validQuestion);
      expect(error).toBeUndefined();
    });

    it('should require options for multiple choice questions', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is your favorite color?',
        required: false
      };

      const { error } = questionSchema.validate(invalidQuestion);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Options are required');
    });

    it('should validate rating question with min/max', () => {
      const validQuestion = {
        id: 'q1',
        type: 'rating',
        question: 'Rate this service',
        required: true,
        min_rating: 1,
        max_rating: 5
      };

      const { error } = questionSchema.validate(validQuestion);
      expect(error).toBeUndefined();
    });

    it('should require min/max for rating questions', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'rating',
        question: 'Rate this service',
        required: true
      };

      const { error } = questionSchema.validate(invalidQuestion);
      expect(error).toBeDefined();
    });

    it('should reject invalid question types', () => {
      const invalidQuestion = {
        id: 'q1',
        type: 'invalid_type',
        question: 'Test question',
        required: false
      };

      const { error } = questionSchema.validate(invalidQuestion);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });
  });

  describe('Survey Creation Schema', () => {
    it('should validate complete survey data', () => {
      const validSurvey = {
        title: 'Test Survey',
        description: 'A test survey',
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
      };

      const { error } = createSurveySchema.validate(validSurvey);
      expect(error).toBeUndefined();
    });

    it('should require title and questions', () => {
      const invalidSurvey = {
        description: 'A test survey'
      };

      const { error } = createSurveySchema.validate(invalidSurvey);
      expect(error).toBeDefined();
    });

    it('should require at least one question', () => {
      const invalidSurvey = {
        title: 'Test Survey',
        questions: []
      };

      const { error } = createSurveySchema.validate(invalidSurvey);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 1 question');
    });

    it('should limit maximum questions', () => {
      const questions = Array.from({ length: 51 }, (_, i) => ({
        id: `q${i}`,
        type: 'text',
        question: `Question ${i}`,
        required: false
      }));

      const invalidSurvey = {
        title: 'Test Survey',
        questions
      };

      const { error } = createSurveySchema.validate(invalidSurvey);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('cannot have more than 50');
    });
  });

  describe('Survey Response Schema', () => {
    it('should validate response data', () => {
      const validResponse = {
        responses: {
          q1: 'John Doe',
          q2: 'Blue',
          q3: 5
        },
        respondent_email: 'test@example.com'
      };

      const { error } = submitResponseSchema.validate(validResponse);
      expect(error).toBeUndefined();
    });

    it('should allow array responses for checkbox questions', () => {
      const validResponse = {
        responses: {
          q1: ['Option 1', 'Option 2']
        }
      };

      const { error } = submitResponseSchema.validate(validResponse);
      expect(error).toBeUndefined();
    });

    it('should require responses object', () => {
      const invalidResponse = {
        respondent_email: 'test@example.com'
      };

      const { error } = submitResponseSchema.validate(invalidResponse);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Responses are required');
    });
  });

  describe('Pagination Schema', () => {
    it('should validate pagination parameters', () => {
      const validPagination = {
        page: 2,
        limit: 20
      };

      const { error, value } = paginationSchema.validate(validPagination);
      expect(error).toBeUndefined();
      expect(value.page).toBe(2);
      expect(value.limit).toBe(20);
    });

    it('should set default values', () => {
      const { error, value } = paginationSchema.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('should reject invalid page numbers', () => {
      const invalidPagination = {
        page: 0,
        limit: 10
      };

      const { error } = paginationSchema.validate(invalidPagination);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 1');
    });
  });

  describe('ObjectId Schema', () => {
    it('should validate valid ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      const { error } = objectIdSchema.validate(validId);
      expect(error).toBeUndefined();
    });

    it('should reject invalid ObjectId', () => {
      const invalidId = 'invalid-id';
      const { error } = objectIdSchema.validate(invalidId);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Invalid ID format');
    });
  });

  describe('Slug Schema', () => {
    it('should validate valid slug', () => {
      const validSlug = 'my-survey-title';
      const { error } = slugSchema.validate(validSlug);
      expect(error).toBeUndefined();
    });

    it('should reject slug with uppercase letters', () => {
      const invalidSlug = 'My-Survey-Title';
      const { error } = slugSchema.validate(invalidSlug);
      expect(error).toBeDefined();
    });

    it('should reject slug with special characters', () => {
      const invalidSlug = 'my_survey@title!';
      const { error } = slugSchema.validate(invalidSlug);
      expect(error).toBeDefined();
    });
  });

  describe('Question Response Validation', () => {
    it('should validate required text question', () => {
      const question = {
        id: 'q1',
        type: 'text',
        question: 'What is your name?',
        required: true
      };

      const result = validateQuestionResponse(question, 'John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty required question', () => {
      const question = {
        id: 'q1',
        type: 'text',
        question: 'What is your name?',
        required: true
      };

      const result = validateQuestionResponse(question, '');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should validate email question', () => {
      const question = {
        id: 'q1',
        type: 'email',
        question: 'What is your email?',
        required: true
      };

      const validResult = validateQuestionResponse(question, 'test@example.com');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateQuestionResponse(question, 'invalid-email');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('valid email');
    });

    it('should validate number question', () => {
      const question = {
        id: 'q1',
        type: 'number',
        question: 'What is your age?',
        required: true,
        validation: {
          min: 18,
          max: 100
        }
      };

      const validResult = validateQuestionResponse(question, 25);
      expect(validResult.isValid).toBe(true);

      const tooLowResult = validateQuestionResponse(question, 15);
      expect(tooLowResult.isValid).toBe(false);
      expect(tooLowResult.error).toContain('at least 18');

      const tooHighResult = validateQuestionResponse(question, 150);
      expect(tooHighResult.isValid).toBe(false);
      expect(tooHighResult.error).toContain('cannot exceed 100');
    });

    it('should validate multiple choice question', () => {
      const question = {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is your favorite color?',
        required: true,
        options: ['Red', 'Blue', 'Green']
      };

      const validResult = validateQuestionResponse(question, 'Blue');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateQuestionResponse(question, 'Purple');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('provided options');
    });

    it('should validate checkbox question', () => {
      const question = {
        id: 'q1',
        type: 'checkbox',
        question: 'Which colors do you like?',
        required: true,
        options: ['Red', 'Blue', 'Green']
      };

      const validResult = validateQuestionResponse(question, ['Red', 'Blue']);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateQuestionResponse(question, ['Red', 'Purple']);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('provided list');
    });

    it('should validate rating question', () => {
      const question = {
        id: 'q1',
        type: 'rating',
        question: 'Rate this service',
        required: true,
        min_rating: 1,
        max_rating: 5
      };

      const validResult = validateQuestionResponse(question, 4);
      expect(validResult.isValid).toBe(true);

      const tooLowResult = validateQuestionResponse(question, 0);
      expect(tooLowResult.isValid).toBe(false);
      expect(tooLowResult.error).toContain('between 1 and 5');

      const tooHighResult = validateQuestionResponse(question, 6);
      expect(tooHighResult.isValid).toBe(false);
      expect(tooHighResult.error).toContain('between 1 and 5');
    });

    it('should allow empty responses for non-required questions', () => {
      const question = {
        id: 'q1',
        type: 'text',
        question: 'Optional question',
        required: false
      };

      const result = validateQuestionResponse(question, '');
      expect(result.isValid).toBe(true);
    });
  });
});