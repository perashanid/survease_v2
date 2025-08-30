# Survey Platform API Documentation

## Overview

The Survey Platform API provides comprehensive endpoints for managing surveys, responses, and user authentication. All endpoints return JSON responses with a consistent structure.

## Base URL

```
http://localhost:8000/api
```

## Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "code": string,
    "message": string,
    "details": string | null
  } | null
}
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Survey Management Endpoints

### Create Survey

**POST** `/surveys`

Creates a new survey with questions and settings.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Survey Title",
  "description": "Optional survey description",
  "questions": [
    {
      "id": "q1",
      "type": "text",
      "question": "What is your name?",
      "required": true,
      "options": null
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "What is your favorite color?",
      "required": false,
      "options": ["Red", "Blue", "Green", "Yellow"]
    }
  ],
  "settings": {
    "is_public": true,
    "allow_anonymous": true,
    "collect_email": false,
    "one_response_per_user": false,
    "show_results": false,
    "close_date": "2024-12-31T23:59:59.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "survey_id",
      "title": "Survey Title",
      "description": "Optional survey description",
      "slug": "survey-title",
      "url": "http://localhost:5173/survey/survey-title",
      "questions": [...],
      "settings": {...},
      "is_public": true,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "response_count": 0
    }
  }
}
```

### Get User's Surveys

**GET** `/surveys`

Retrieves all surveys created by the authenticated user with pagination.

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": "survey_id",
        "title": "Survey Title",
        "description": "Survey description",
        "slug": "survey-title",
        "url": "http://localhost:5173/survey/survey-title",
        "is_public": true,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "response_count": 5,
        "questions": [...],
        "settings": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Public Surveys

**GET** `/surveys/public`

Retrieves all public and active surveys with author information.

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "surveys": [
    {
      "id": "survey_id",
      "title": "Public Survey",
      "description": "A public survey",
      "slug": "public-survey",
      "url": "http://localhost:5173/survey/public-survey",
      "created_at": "2024-01-01T00:00:00.000Z",
      "response_count": 10,
      "author": {
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

### Get Survey by Slug

**GET** `/surveys/:slug`

Retrieves a survey by its slug for responding. Includes access control checks.

**Authentication:** Optional (required for private surveys owned by user)

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "survey_id",
      "title": "Survey Title",
      "description": "Survey description",
      "slug": "survey-title",
      "questions": [
        {
          "id": "q1",
          "type": "text",
          "question": "What is your name?",
          "required": true,
          "options": null
        }
      ],
      "settings": {
        "is_public": true,
        "allow_anonymous": true,
        "collect_email": false,
        "one_response_per_user": false,
        "show_results": false,
        "close_date": null
      },
      "response_count": 5,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404` - Survey not found
- `403` - Survey is private (not accessible)
- `410` - Survey is closed
- `409` - User already responded (when one_response_per_user is enabled)

### Submit Survey Response

**POST** `/surveys/:slug/responses`

Submits a response to a survey with comprehensive validation.

**Authentication:** Optional (required if survey doesn't allow anonymous responses)

**Request Body:**
```json
{
  "responses": {
    "q1": "John Doe",
    "q2": "Blue",
    "q3": "5"
  },
  "respondent_email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response_id": "response_id",
    "message": "Response submitted successfully"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing required questions, invalid data)
- `401` - Authentication required (for surveys that don't allow anonymous responses)
- `404` - Survey not found
- `409` - Already responded (duplicate response prevention)

### Update Survey

**PUT** `/surveys/:id`

Updates an existing survey. Only the survey owner can update.

**Authentication:** Required

**Request Body:** (partial update supported)
```json
{
  "title": "Updated Survey Title",
  "description": "Updated description",
  "questions": [...],
  "settings": {
    "is_public": false,
    "allow_anonymous": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "survey_id",
      "title": "Updated Survey Title",
      "description": "Updated description",
      "slug": "original-slug",
      "url": "http://localhost:5173/survey/original-slug",
      "questions": [...],
      "settings": {...},
      "is_public": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-02T00:00:00.000Z",
      "response_count": 5
    }
  }
}
```

### Get Analytics Data

**GET** `/surveys/analytics/data`

Retrieves comprehensive analytics data for the authenticated user's surveys.

**Authentication:** Required

**Query Parameters:**
- `range` (optional): Time range for analytics ('7d', '30d', '90d', '1y', default: '30d')

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSurveys": 5,
    "totalResponses": 150,
    "recentResponses": 25,
    "averageResponseRate": 65.5,
    "activeSurveys": 4,
    "publicSurveys": 3,
    "totalQuestions": 45,
    "averageQuestionsPerSurvey": 9.0,
    "responseGrowth": 15.2,
    "topPerformingSurveys": [
      {
        "id": "survey_id",
        "title": "Customer Satisfaction Survey",
        "responseCount": 75,
        "recentResponseCount": 12,
        "responseRate": 85.2,
        "responsesPerDay": 2.5,
        "daysSinceCreation": 30,
        "isActive": true,
        "isPublic": true,
        "questionCount": 8,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "recentActivity": [
      {
        "id": "survey_id",
        "surveyTitle": "Product Feedback Survey",
        "responseCount": 5,
        "date": "2024-01-15T10:30:00.000Z"
      }
    ],
    "responsesByMonth": [
      {
        "month": "Jan",
        "responses": 45
      },
      {
        "month": "Feb",
        "responses": 62
      }
    ],
    "timeRange": "30d"
  }
}
```

### Get Survey Analytics

**GET** `/surveys/:id/analytics`

Retrieves detailed analytics for a specific survey including question-level insights, response patterns, and demographic data.

**Authentication:** Required (survey owner only)

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": "survey_id",
      "title": "Customer Satisfaction Survey",
      "description": "Survey description",
      "questions": [...],
      "responseCount": 150,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "responses": [
      {
        "id": "response_id",
        "submitted_at": "2024-01-15T10:30:00.000Z",
        "is_anonymous": true,
        "respondent_email": null,
        "response_data": {
          "q1": "John Doe",
          "q2": "Blue",
          "q3": "5"
        }
      }
    ],
    "questionAnalytics": {
      "q1": {
        "type": "text",
        "question": "What is your name?",
        "totalResponses": 145,
        "responseDistribution": {
          "John": 5,
          "Jane": 8,
          "Mike": 3
        },
        "mostCommonAnswer": "John",
        "responseRate": 96.7
      },
      "q2": {
        "type": "multiple_choice",
        "question": "What is your favorite color?",
        "totalResponses": 150,
        "responseDistribution": {
          "Blue": 45,
          "Red": 35,
          "Green": 40,
          "Yellow": 30
        },
        "mostCommonAnswer": "Blue",
        "responseRate": 100.0
      },
      "q3": {
        "type": "rating",
        "question": "Rate our service",
        "totalResponses": 148,
        "responseDistribution": {
          "1": 5,
          "2": 10,
          "3": 25,
          "4": 58,
          "5": 50
        },
        "averageRating": 4.2,
        "mostCommonAnswer": "4",
        "responseRate": 98.7
      }
    },
    "demographics": {
      "responsesByDate": [
        {
          "date": "2024-01-01",
          "count": 12
        },
        {
          "date": "2024-01-02",
          "count": 8
        }
      ],
      "responsesByHour": [
        {
          "hour": 0,
          "count": 2
        },
        {
          "hour": 1,
          "count": 1
        },
        {
          "hour": 9,
          "count": 15
        }
      ],
      "completionRate": 100,
      "averageCompletionTime": null
    }
  }
}
```

**Error Responses:**
- `400` - Invalid survey ID format
- `404` - Survey not found or not owned by user
- `500` - Internal server error

### Export Survey Data

**GET** `/surveys/:id/export`

Exports survey data and responses in JSON or CSV format for analysis.

**Authentication:** Required (survey owner only)

**Query Parameters:**
- `format` (optional): Export format ('json' or 'csv', default: 'json')

**JSON Export Response:**
```json
{
  "survey": {
    "id": "survey_id",
    "title": "Customer Satisfaction Survey",
    "description": "Survey description",
    "questions": [...],
    "settings": {...},
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "responses": [
    {
      "id": "response_id",
      "submitted_at": "2024-01-15T10:30:00.000Z",
      "is_anonymous": true,
      "respondent_email": null,
      "response_data": {
        "q1": "John Doe",
        "q2": "Blue",
        "q3": "5"
      },
      "ip_address": "192.168.1.1"
    }
  ],
  "export_metadata": {
    "exported_at": "2024-01-20T15:45:00.000Z",
    "total_responses": 150,
    "exported_by": "user@example.com"
  }
}
```

**CSV Export Response:**
Returns a CSV file with headers and response data:
```
Response ID,Submitted At,Is Anonymous,What is your name?,What is your favorite color?,Rate our service
response_id_1,2024-01-15T10:30:00.000Z,true,John Doe,Blue,5
response_id_2,2024-01-15T11:15:00.000Z,false,Jane Smith,Red,4
```

**Response Headers:**
- `Content-Type`: `application/json` or `text/csv`
- `Content-Disposition`: `attachment; filename="survey-title-data.json"` or `attachment; filename="survey-title-data.csv"`

**Error Responses:**
- `400` - Invalid survey ID format
- `404` - Survey not found or not owned by user
- `500` - Internal server error

### Delete Survey

**DELETE** `/surveys/:id`

Deletes a survey and all associated responses. Only the survey owner can delete.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Survey deleted successfully"
}
```

## Question Types

The API supports the following question types:

### Text Input
```json
{
  "id": "q1",
  "type": "text",
  "question": "What is your name?",
  "required": true,
  "options": null
}
```

### Textarea
```json
{
  "id": "q2",
  "type": "textarea",
  "question": "Please provide detailed feedback",
  "required": false,
  "options": null
}
```

### Multiple Choice (Radio)
```json
{
  "id": "q3",
  "type": "multiple_choice",
  "question": "What is your favorite color?",
  "required": true,
  "options": ["Red", "Blue", "Green", "Yellow"]
}
```

### Checkboxes (Multiple Selection)
```json
{
  "id": "q4",
  "type": "checkbox",
  "question": "Which programming languages do you know?",
  "required": false,
  "options": ["JavaScript", "Python", "Java", "C++"]
}
```

### Dropdown
```json
{
  "id": "q5",
  "type": "dropdown",
  "question": "Select your country",
  "required": true,
  "options": ["USA", "Canada", "UK", "Australia"]
}
```

### Rating Scale
```json
{
  "id": "q6",
  "type": "rating",
  "question": "Rate our service",
  "required": true,
  "options": ["1", "2", "3", "4", "5"],
  "min_rating": 1,
  "max_rating": 5
}
```

### Date
```json
{
  "id": "q7",
  "type": "date",
  "question": "What is your birth date?",
  "required": false,
  "options": null
}
```

### Email
```json
{
  "id": "q8",
  "type": "email",
  "question": "What is your email address?",
  "required": true,
  "options": null
}
```

### Number
```json
{
  "id": "q9",
  "type": "number",
  "question": "How old are you?",
  "required": false,
  "options": null
}
```

## Survey Settings

### Available Settings
- `is_public`: Whether the survey is publicly accessible
- `allow_anonymous`: Whether anonymous responses are allowed
- `collect_email`: Whether to collect respondent email addresses
- `one_response_per_user`: Prevent multiple responses from the same user/IP
- `show_results`: Whether to show results to respondents (future feature)
- `close_date`: When the survey stops accepting responses

## Error Codes

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Valid JWT token required
- `SURVEY_NOT_FOUND`: Survey does not exist
- `SURVEY_PRIVATE`: Survey is private and not accessible
- `SURVEY_CLOSED`: Survey is no longer accepting responses
- `ALREADY_RESPONDED`: User has already submitted a response
- `REQUIRED_QUESTION`: Required question not answered
- `INVALID_ID`: Invalid MongoDB ObjectId format
- `INTERNAL_ERROR`: Server error occurred

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP address
- Higher limits may apply for authenticated users

## Data Validation

All input data is validated using Joi schemas:
- Survey titles must be 1-200 characters
- Descriptions are optional, max 1000 characters
- Question titles must be 1-500 characters
- Options arrays must have 2-20 items for choice-based questions
- Email addresses must be valid format
- Dates must be valid ISO 8601 format

## Type Safety

The API implements comprehensive TypeScript type safety:
- **Response ID Handling**: Proper type casting for MongoDB ObjectId fields in analytics and export endpoints
- **Data Consistency**: Consistent response formatting across all endpoints with proper type definitions
- **Error Prevention**: Enhanced type checking to prevent runtime errors and improve developer experience
- **Code Quality**: Improved maintainability through strict TypeScript configuration and proper type annotations

## Authentication Endpoints

For complete authentication documentation, see the Authentication section in the main README.md file.