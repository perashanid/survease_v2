# SurvEase - Modern Survey Platform

A full-stack survey creation and analytics platform built with React, TypeScript, Node.js, Express, and MongoDB. Create, share, and analyze surveys with powerful real-time analytics and AI-powered insights.

## 🎯 Problem Statement

Organizations and individuals need an efficient way to:
- Create and distribute surveys quickly without technical expertise
- Collect responses from diverse audiences (authenticated or anonymous)
- Analyze survey data with comprehensive, real-time analytics
- Export and share survey results in multiple formats
- Ensure data quality and detect low-quality responses
- Get AI-powered insights from survey data

SurvEase solves these challenges by providing an intuitive, feature-rich platform that handles everything from survey creation to advanced analytics.

## ✨ Key Features

### Survey Creation & Management
- **Intuitive Survey Builder**: Drag-and-drop interface with multiple question types
  - Text, Textarea, Multiple Choice, Checkbox, Dropdown
  - Rating scales, Date pickers, Email, Number inputs
- **Flexible Privacy Settings**: Public/private surveys with customizable access controls
- **Survey Import/Export**: Share survey templates and import from other users
- **Unique Shareable URLs**: Each survey gets a custom slug for easy sharing
- **Response Controls**: Configure anonymous responses, email collection, one-response-per-user limits

### Response Collection
- **Anonymous & Authenticated Responses**: Support for both logged-in and guest users
- **Mobile-Responsive Design**: Perfect experience across all devices
- **Real-time Validation**: Instant feedback on required fields and input formats
- **Progress Tracking**: Track completion time and user engagement
- **Device Detection**: Automatic capture of device type, OS, and browser information
- **IP-based Duplicate Prevention**: Optional one-response-per-IP enforcement

### Analytics & Insights

#### Multi-Tier Analytics Dashboards
1. **Basic Analytics**: Response counts, completion rates, question-level breakdowns
2. **Enhanced Analytics**: Time-series trends, demographic analysis, device analytics
3. **Advanced Analytics**: Statistical analysis, correlation matrices, sentiment analysis
4. **Comprehensive Analytics**: All features combined with export capabilities
5. **Attention Analytics**: Response quality detection, completion time analysis, engagement metrics

#### AI-Powered Features
- **Gemini AI Integration**: Generate insights from survey responses
- **Automated Summaries**: AI-generated executive summaries of survey results
- **Sentiment Analysis**: Understand emotional tone in text responses
- **Pattern Detection**: Identify trends and correlations in data
- **Quality Classification**: Automatic detection of low-quality responses

#### Data Visualization
- **Interactive Charts**: Bar charts, line graphs, pie charts using Recharts and Chart.js
- **Response Timeline**: Track responses over time with customizable date ranges
- **Question Analytics**: Detailed breakdowns for each question type
- **Export Options**: Download data in JSON, CSV, or PDF formats

### Quality Control
- **Response Quality Detection**: Automatic flagging of suspicious responses
- **Completion Time Analysis**: Identify rushed or abandoned surveys
- **Manual Override System**: Review and reclassify flagged responses
- **Quality Audit Logs**: Track all quality-related actions

### User Experience
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Error Boundaries**: Graceful error handling with user-friendly messages
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Smooth loading indicators and skeleton screens
- **Connection Status**: Real-time WebSocket connection monitoring

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6 (HashRouter for compatibility)
- **State Management**: Context API (AuthContext, ThemeContext)
- **Styling**: CSS Modules with custom properties
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts & Chart.js for data visualization
- **Icons**: React Icons (Feather Icons)
- **Build Tool**: Vite for fast development and optimized builds
- **HTTP Client**: Axios for API communication

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Security**: Helmet, CORS, Rate Limiting (express-rate-limit)
- **AI Integration**: Google Generative AI (Gemini)
- **Email**: Nodemailer for notifications
- **PDF Generation**: PDFKit for report exports
- **Validation**: Joi for request validation
- **WebSockets**: ws library for real-time features

### Project Structure

```
survey-platform/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── analytics/   # Analytics-specific components
│   │   │   └── shared/      # Shared components (Navbar, Footer, etc.)
│   │   ├── contexts/        # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SurveyCreator.tsx
│   │   │   ├── SurveyResponse.tsx
│   │   │   ├── PublicSurveys.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── SurveyAnalytics.tsx
│   │   │   ├── BasicAnalyticsDashboard.tsx
│   │   │   ├── EnhancedAnalyticsDashboard.tsx
│   │   │   ├── AdvancedAnalyticsDashboard.tsx
│   │   │   ├── ComprehensiveAnalyticsDashboard.tsx
│   │   │   └── AttentionAnalyticsDashboard.tsx
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   ├── styles/          # Global styles
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   └── database.ts  # MongoDB connection
│   │   ├── middleware/      # Express middleware
│   │   │   └── auth.ts      # JWT authentication
│   │   ├── models/          # Mongoose models
│   │   │   ├── User.ts
│   │   │   ├── Survey.ts
│   │   │   ├── Response.ts
│   │   │   ├── InvitationToken.ts
│   │   │   ├── Segment.ts
│   │   │   ├── QualityRule.ts
│   │   │   ├── QualityAuditLog.ts
│   │   │   ├── AIInsight.ts
│   │   │   └── AnalyticsCache.ts
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.ts      # Authentication endpoints
│   │   │   ├── surveys.ts   # Survey CRUD operations
│   │   │   ├── invitations.ts
│   │   │   ├── analytics.ts # Analytics endpoints
│   │   │   ├── attention.ts # Attention analytics
│   │   │   ├── quality.ts   # Quality control
│   │   │   ├── ai.ts        # AI insights
│   │   │   ├── segments.ts  # User segmentation
│   │   │   ├── predictions.ts
│   │   │   ├── stats.ts     # Platform statistics
│   │   │   ├── contact.ts   # Contact form
│   │   │   └── public.ts    # Public endpoints
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Utility functions
│   │   │   ├── errorHandler.ts
│   │   │   ├── logger.ts
│   │   │   └── deviceDetection.ts
│   │   ├── validation/      # Request validation schemas
│   │   │   └── schemas.ts
│   │   ├── scripts/         # Database migration scripts
│   │   └── app.ts           # Express app setup
│   ├── dist/                # Compiled JavaScript (build output)
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── tsconfig.json
│
├── package.json             # Root package.json for monorepo scripts
└── README.md                # This file
```

### Database Schema

#### Users Collection
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed),
  first_name: string,
  last_name: string,
  created_at: Date,
  updated_at: Date
}
```

#### Surveys Collection
```typescript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, indexed),
  title: string,
  description: string,
  slug: string (unique, indexed),
  configuration: {
    questions: [{
      id: string,
      type: enum,
      question: string,
      required: boolean,
      options: string[],
      min_rating: number,
      max_rating: number
    }],
    settings: {
      is_public: boolean,
      allow_anonymous: boolean,
      collect_email: boolean,
      one_response_per_user: boolean,
      show_results: boolean,
      close_date: Date
    }
  },
  is_public: boolean (indexed),
  is_active: boolean (indexed),
  allow_import: boolean,
  import_count: number,
  original_survey_id: ObjectId (ref: Survey),
  created_at: Date (indexed),
  updated_at: Date
}
```

#### Responses Collection
```typescript
{
  _id: ObjectId,
  survey_id: ObjectId (ref: Survey, indexed),
  user_id: ObjectId (ref: User, optional),
  respondent_email: string,
  response_data: Mixed (question_id: answer),
  is_anonymous: boolean (indexed),
  ip_address: string,
  submitted_at: Date (indexed),
  completion_time: number (seconds),
  started_at: Date,
  device_info: {
    type: enum ['mobile', 'desktop', 'tablet'],
    os: string,
    browser: string,
    browserVersion: string
  },
  quality_status: enum ['quality', 'low_quality', 'manually_overridden'],
  quality_flags: [{
    flag_type: enum,
    flagged_at: Date,
    threshold_value: number
  }],
  manual_override: {
    overridden_by: ObjectId,
    overridden_at: Date,
    reason: string
  }
}
```

### API Architecture

#### RESTful Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

**Surveys**
- `POST /api/surveys` - Create survey (authenticated)
- `GET /api/surveys` - Get user's surveys (authenticated)
- `GET /api/surveys/:slug` - Get survey by slug (public/authenticated)
- `PUT /api/surveys/:id` - Update survey (authenticated)
- `PUT /api/surveys/:id/visibility` - Toggle public/private (authenticated)
- `GET /api/surveys/public` - Get all public surveys
- `GET /api/surveys/public/importable` - Get importable surveys (authenticated)
- `POST /api/surveys/:id/import` - Import survey (authenticated)

**Responses**
- `POST /api/surveys/:slug/responses` - Submit response (public/authenticated)
- `GET /api/surveys/:id/responses` - Get survey responses (authenticated)

**Analytics**
- `GET /api/surveys/:id/analytics` - Get survey analytics (authenticated)
- `GET /api/public/surveys/:id/analytics` - Get public survey analytics
- `GET /api/analytics/data` - Get user analytics dashboard (authenticated)
- `GET /api/attention/:surveyId` - Get attention analytics (authenticated)

**Quality Control**
- `GET /api/surveys/:surveyId/quality` - Get quality metrics (authenticated)
- `POST /api/surveys/:surveyId/responses/:responseId/override` - Override quality status (authenticated)

**AI Insights**
- `POST /api/surveys/:surveyId/ai/insights` - Generate AI insights (authenticated)
- `GET /api/surveys/:surveyId/ai/insights` - Get cached insights (authenticated)

**Export**
- `GET /api/surveys/:id/export?format=json|csv` - Export survey data (authenticated)
- `GET /api/public/surveys/:id/export/csv` - Export public survey CSV
- `GET /api/public/surveys/:id/export/json` - Export public survey JSON

**Platform Stats**
- `GET /api/stats/platform` - Get platform statistics (public)

### Security Features

1. **Authentication & Authorization**
   - JWT-based authentication with secure token storage
   - Password hashing with bcrypt (10 rounds)
   - Protected routes with middleware
   - Optional authentication for public surveys

2. **Rate Limiting**
   - Configurable rate limits (default: 1000 requests/minute in dev)
   - Per-IP tracking
   - Graceful error responses

3. **Input Validation**
   - Joi schema validation for all inputs
   - XSS protection
   - SQL injection prevention (NoSQL)
   - File upload restrictions

4. **Security Headers**
   - Helmet.js for security headers
   - CORS configuration
   - CSP policies

5. **Data Privacy**
   - Anonymous response support
   - IP address hashing option
   - GDPR-compliant data handling
   - Secure data export

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd survey-platform
```

2. **Install dependencies**
```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all

# Or install individually
npm install              # Root dependencies
cd backend && npm install
cd ../frontend && npm install
```

3. **Set up environment variables**

**Backend** (`backend/.env`):
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit backend/.env with your values
```

Required backend environment variables:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/survey_platform
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey_platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# AI (Optional - for AI insights feature)
GEMINI_API_KEY=your-gemini-api-key
ENABLE_AI_FEATURES=true
```

**Frontend** (`frontend/.env`):
```bash
# Copy the example file
cp frontend/.env.example frontend/.env

# Edit frontend/.env with your values
```

Required frontend environment variables:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENV=development
```

4. **Start MongoDB**

If using local MongoDB:
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB
```

If using MongoDB Atlas, ensure your connection string is correct in `backend/.env`.

### Running the Application

#### Development Mode

**Option 1: Run everything together (recommended)**
```bash
# From the root directory
npm run dev
```
This starts both backend (port 3000) and frontend (port 5173) concurrently.

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
npm run dev:backend
# or
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev:frontend
# or
cd frontend && npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/health

#### Production Build

```bash
# Build both frontend and backend
npm run build

# Or build separately
npm run build:backend
npm run build:frontend

# Start production server
npm start
```

### First-Time Setup

1. **Create an account**
   - Navigate to http://localhost:5173
   - Click "Get Started" or browse to create an account
   - Fill in your details and register

2. **Create your first survey**
   - Go to Dashboard → Create Survey
   - Add questions with different types
   - Configure privacy settings
   - Save and get your shareable link

3. **Test the survey**
   - Open the survey link in an incognito window
   - Submit a test response
   - View analytics in your dashboard

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development

2. **API Testing**: Use the health check endpoint to verify backend is running:
```bash
curl http://localhost:3000/health
```

3. **Database Inspection**: Use MongoDB Compass or mongosh to inspect data:
```bash
mongosh mongodb://localhost:27017/survey_platform
```

4. **Clear Build Cache**: If you encounter issues:
```bash
# Frontend
cd frontend && rm -rf node_modules dist && npm install

# Backend
cd backend && rm -rf node_modules dist && npm install
```

5. **Environment Variables**: Ensure all required variables are set. The backend validates on startup.

## 📊 Usage Examples

### Creating a Survey

1. Navigate to Dashboard
2. Click "Create New Survey"
3. Add survey title and description
4. Add questions:
   - Click "Add Question"
   - Select question type
   - Enter question text
   - Add options (for multiple choice/checkbox)
   - Mark as required if needed
5. Configure settings:
   - Public/Private
   - Allow anonymous responses
   - Collect emails
   - One response per user
6. Save survey
7. Share the generated URL

### Analyzing Results

1. Go to Dashboard
2. Click "View Analytics" on any survey
3. Choose analytics level:
   - Basic: Quick overview
   - Enhanced: Detailed charts
   - Advanced: Statistical analysis
   - Comprehensive: Full report
   - Attention: Quality metrics
4. Export data as needed (JSON/CSV/PDF)

### Importing a Survey

1. Browse Public Surveys
2. Find a survey you like
3. Click "Import"
4. Survey is copied to your dashboard
5. Customize as needed

## 🔮 Future Plans

### Short-term (Next 3-6 months)
- [ ] **Survey Templates**: Pre-built templates for common use cases
- [ ] **Conditional Logic**: Show/hide questions based on previous answers
- [ ] **Multi-language Support**: Internationalization (i18n)
- [ ] **Email Notifications**: Automated response notifications
- [ ] **Survey Scheduling**: Auto-open/close surveys at specific times
- [ ] **Response Quotas**: Limit total number of responses
- [ ] **Custom Branding**: Logo and color customization
- [ ] **Collaboration**: Multi-user survey editing

### Mid-term (6-12 months)
- [ ] **Advanced Question Types**: 
  - Matrix/Grid questions
  - File upload
  - Signature capture
  - Location picker
- [ ] **Integration APIs**: 
  - Zapier integration
  - Webhook support
  - REST API for third-party apps
- [ ] **Advanced Analytics**:
  - Cross-tabulation
  - Cohort analysis
  - Funnel analysis
  - A/B testing
- [ ] **Mobile Apps**: Native iOS and Android apps
- [ ] **White-label Solution**: Custom domain support
- [ ] **Team Workspaces**: Organization accounts with role-based access

### Long-term (12+ months)
- [ ] **AI Enhancements**:
  - Auto-generate surveys from descriptions
  - Smart question suggestions
  - Predictive analytics
  - Automated report generation
- [ ] **Enterprise Features**:
  - SSO (Single Sign-On)
  - Advanced security controls
  - Audit logs
  - SLA guarantees
- [ ] **Marketplace**: Buy/sell survey templates
- [ ] **Video Surveys**: Record video responses
- [ ] **Live Polling**: Real-time audience polling
- [ ] **Survey Panels**: Managed respondent pools

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React and the React team
- Express.js community
- MongoDB team
- Google Generative AI (Gemini)
- All open-source contributors

## 📧 Contact

For questions, issues, or suggestions:
- Create an issue in the repository
- Contact through the platform's contact form
- Email: [your-email@example.com]

---

**Built with ❤️ using React, TypeScript, Node.js, and MongoDB**
