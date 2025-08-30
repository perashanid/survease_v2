import Joi from 'joi';

// User validation schemas
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  }),
  first_name: Joi.string().min(1).max(50).optional().messages({
    'string.min': 'First name cannot be empty',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  last_name: Joi.string().min(1).max(50).optional().messages({
    'string.min': 'Last name cannot be empty',
    'string.max': 'Last name cannot exceed 50 characters'
  })
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  })
});

// Survey question validation schema
export const questionSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Question ID is required'
  }),
  type: Joi.string().valid('text', 'textarea', 'multiple_choice', 'checkbox', 'dropdown', 'rating', 'date', 'email', 'number').required().messages({
    'any.only': 'Question type must be one of: text, textarea, multiple_choice, checkbox, dropdown, rating, date, email, number',
    'any.required': 'Question type is required'
  }),
  question: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Question text cannot be empty',
    'string.max': 'Question text cannot exceed 500 characters',
    'any.required': 'Question text is required'
  }),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.string().min(1).max(200)).when('type', {
    is: Joi.string().valid('multiple_choice', 'checkbox', 'dropdown'),
    then: Joi.array().min(2).required().messages({
      'array.min': 'Multiple choice, checkbox, and dropdown questions must have at least 2 options',
      'any.required': 'Options are required for multiple choice, checkbox, and dropdown questions'
    }),
    otherwise: Joi.optional()
  }),
  min_rating: Joi.number().integer().min(1).max(10).when('type', {
    is: 'rating',
    then: Joi.required().messages({
      'any.required': 'Minimum rating is required for rating questions'
    }),
    otherwise: Joi.optional()
  }),
  max_rating: Joi.number().integer().min(2).max(10).when('type', {
    is: 'rating',
    then: Joi.number().required().greater(Joi.ref('min_rating')).messages({
      'any.required': 'Maximum rating is required for rating questions',
      'number.greater': 'Maximum rating must be greater than minimum rating'
    }),
    otherwise: Joi.optional()
  }),
  validation: Joi.object({
    minLength: Joi.number().integer().min(0).max(1000).optional(),
    maxLength: Joi.number().integer().min(1).max(10000).optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional()
  }).optional()
});

// Survey settings validation schema
export const surveySettingsSchema = Joi.object({
  is_public: Joi.boolean().default(false),
  allow_anonymous: Joi.boolean().default(true),
  collect_email: Joi.boolean().default(false),
  one_response_per_user: Joi.boolean().default(false),
  show_results: Joi.boolean().default(false),
  close_date: Joi.date().greater('now').optional().messages({
    'date.greater': 'Close date must be in the future'
  })
});

// Survey creation validation schema
export const createSurveySchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Survey title cannot be empty',
    'string.max': 'Survey title cannot exceed 200 characters',
    'any.required': 'Survey title is required'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Survey description cannot exceed 1000 characters'
  }),
  questions: Joi.array().items(questionSchema).min(1).max(50).required().messages({
    'array.min': 'Survey must have at least 1 question',
    'array.max': 'Survey cannot have more than 50 questions',
    'any.required': 'Questions are required'
  }),
  settings: surveySettingsSchema.default({})
});

// Survey update validation schema
export const updateSurveySchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.min': 'Survey title cannot be empty',
    'string.max': 'Survey title cannot exceed 200 characters'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Survey description cannot exceed 1000 characters'
  }),
  questions: Joi.array().items(questionSchema).min(1).max(50).optional().messages({
    'array.min': 'Survey must have at least 1 question',
    'array.max': 'Survey cannot have more than 50 questions'
  }),
  settings: surveySettingsSchema.optional()
});

// Survey response validation schema
export const submitResponseSchema = Joi.object({
  responses: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string().max(10000),
      Joi.number(),
      Joi.array().items(Joi.string().max(1000)),
      Joi.boolean(),
      Joi.date()
    )
  ).required().messages({
    'any.required': 'Responses are required'
  }),
  respondent_email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  completion_time: Joi.number().integer().min(1).max(86400).optional().messages({
    'number.min': 'Completion time must be at least 1 second',
    'number.max': 'Completion time cannot exceed 24 hours (86400 seconds)'
  }),
  started_at: Joi.date().optional().messages({
    'date.base': 'Started at must be a valid date'
  })
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  })
});

// MongoDB ObjectId validation
export const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Invalid ID format'
});

// Slug validation schema
export const slugSchema = Joi.string().pattern(/^[a-z0-9-]+$/).min(1).max(100).messages({
  'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
  'string.min': 'Slug cannot be empty',
  'string.max': 'Slug cannot exceed 100 characters'
});

// Custom validation functions
export const validateQuestionResponse = (question: any, response: any): { isValid: boolean; error?: string } => {
  // Check if required question has a response
  if (question.required && (response === undefined || response === null || response === '')) {
    return { isValid: false, error: `Question "${question.question}" is required` };
  }

  // Skip validation if response is empty and not required
  if (!question.required && (response === undefined || response === null || response === '')) {
    return { isValid: true };
  }

  // Type-specific validation
  switch (question.type) {
    case 'text':
    case 'textarea':
      if (typeof response !== 'string') {
        return { isValid: false, error: 'Response must be text' };
      }
      if (question.validation?.minLength && response.length < question.validation.minLength) {
        return { isValid: false, error: `Response must be at least ${question.validation.minLength} characters` };
      }
      if (question.validation?.maxLength && response.length > question.validation.maxLength) {
        return { isValid: false, error: `Response cannot exceed ${question.validation.maxLength} characters` };
      }
      break;

    case 'email':
      if (typeof response !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response)) {
        return { isValid: false, error: 'Response must be a valid email address' };
      }
      break;

    case 'number':
      const num = Number(response);
      if (isNaN(num)) {
        return { isValid: false, error: 'Response must be a number' };
      }
      if (question.validation?.min !== undefined && num < question.validation.min) {
        return { isValid: false, error: `Response must be at least ${question.validation.min}` };
      }
      if (question.validation?.max !== undefined && num > question.validation.max) {
        return { isValid: false, error: `Response cannot exceed ${question.validation.max}` };
      }
      break;

    case 'date':
      if (!(response instanceof Date) && isNaN(Date.parse(response))) {
        return { isValid: false, error: 'Response must be a valid date' };
      }
      break;

    case 'multiple_choice':
    case 'dropdown':
      if (typeof response !== 'string' || !question.options?.includes(response)) {
        return { isValid: false, error: 'Response must be one of the provided options' };
      }
      break;

    case 'checkbox':
      if (!Array.isArray(response)) {
        return { isValid: false, error: 'Response must be an array of options' };
      }
      for (const item of response) {
        if (!question.options?.includes(item)) {
          return { isValid: false, error: 'All selected options must be from the provided list' };
        }
      }
      break;

    case 'rating':
      const rating = Number(response);
      if (isNaN(rating) || rating < question.min_rating || rating > question.max_rating) {
        return { isValid: false, error: `Rating must be between ${question.min_rating} and ${question.max_rating}` };
      }
      break;

    default:
      return { isValid: false, error: 'Unknown question type' };
  }

  return { isValid: true };
};