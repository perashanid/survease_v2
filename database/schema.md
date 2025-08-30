# MongoDB Schema Documentation

## Collections

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password_hash: String (required),
  first_name: String (optional),
  last_name: String (optional),
  email_verified: Boolean (default: false),
  created_at: Date,
  updated_at: Date
}
```

### Surveys Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, required),
  title: String (required),
  description: String (optional),
  slug: String (unique, required),
  configuration: {
    questions: [{
      id: String (required),
      type: String (enum: ['text', 'multiple_choice', 'checkbox', 'dropdown', 'rating']),
      title: String (required),
      required: Boolean (default: false),
      options: [String] (optional),
      validation: {
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number
      }
    }],
    settings: {
      allowAnonymous: Boolean (default: true),
      requireLogin: Boolean (default: false),
      showProgress: Boolean (default: true),
      customStyling: {
        primaryColor: String,
        backgroundColor: String
      }
    }
  },
  is_public: Boolean (default: false),
  is_active: Boolean (default: true),
  start_date: Date (optional),
  end_date: Date (optional),
  created_at: Date,
  updated_at: Date
}
```

### Responses Collection
```javascript
{
  _id: ObjectId,
  survey_id: ObjectId (ref: Survey, required),
  respondent_email: String (optional, for authenticated responses),
  response_data: {
    responses: Map<String, Mixed> (question_id -> answer),
    metadata: {
      completionTime: Number (seconds),
      userAgent: String,
      referrer: String
    }
  },
  is_anonymous: Boolean (default: true),
  ip_address: String (optional),
  submitted_at: Date (default: now)
}
```

### Sessions Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, required),
  token_hash: String (required),
  expires_at: Date (required, TTL index),
  created_at: Date (default: now)
}
```

## Indexes

### Users
- `email: 1` (unique)

### Surveys
- `user_id: 1`
- `slug: 1` (unique)
- `is_public: 1, is_active: 1` (compound)
- `created_at: -1`

### Responses
- `survey_id: 1`
- `respondent_email: 1`
- `submitted_at: -1`
- `is_anonymous: 1`

### Sessions
- `user_id: 1`
- `token_hash: 1`
- `expires_at: 1` (TTL index for automatic cleanup)

## Sample Data Structure

### Sample Survey Configuration
```javascript
{
  questions: [
    {
      id: "q1",
      type: "text",
      title: "What is your name?",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: "q2",
      type: "multiple_choice",
      title: "What is your favorite color?",
      required: false,
      options: ["Red", "Blue", "Green", "Yellow", "Other"]
    }
  ],
  settings: {
    allowAnonymous: true,
    requireLogin: false,
    showProgress: true,
    customStyling: {
      primaryColor: "#007bff",
      backgroundColor: "#ffffff"
    }
  }
}
```

### Sample Response Data
```javascript
{
  responses: {
    "q1": "John Doe",
    "q2": "Blue"
  },
  metadata: {
    completionTime: 120,
    userAgent: "Mozilla/5.0...",
    referrer: "https://example.com"
  }
}
```