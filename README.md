# Survey Platform

A modern, full-stack survey creation and response platform built with React, Node.js, TypeScript, and MongoDB.

## Features

### Core Features
- **Survey Creation**: Intuitive survey builder with multiple question types
- **Real-time Analytics**: Live response tracking and data visualization
- **User Authentication**: Secure login and registration system
- **Private Survey Invitations**: Generate unique invitation links for private surveys
- **Response Time Tracking**: Track completion times for survey responses
- **Data Export**: Export survey results to CSV and JSON formats
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Advanced Features
- **Anonymous Responses**: Option for anonymous survey participation
- **Public/Private Surveys**: Control survey visibility and access
- **Invitation Management**: Create, manage, and revoke invitation links
- **Response Validation**: Built-in validation for survey responses
- **Custom Branding**: Customize survey appearance

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Chart.js** for data visualization
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Joi** for data validation

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm package manager

### Environment Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd survey-platform
   npm run install:all
   ```

2. **Set up environment variables**
   
   Create `.env` files from examples:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Configure your environment variables**

#### Backend (.env)
```env
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey-platform
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Running the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Backend only (port 8000)
npm run dev:backend

# Frontend only (port 5173)
npm run dev:frontend
```

Visit `http://localhost:5173` to access the application.

## Deployment to Vercel

This project is optimized for Vercel deployment with a serverless backend and static frontend.

### Prerequisites
- Vercel account
- MongoDB Atlas database
- GitHub repository

### Deployment Steps

1. **Prepare your MongoDB Atlas database**
   - Create a MongoDB Atlas cluster
   - Get your connection string
   - Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Set Environment Variables in Vercel**
   
   In your Vercel dashboard, add these environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/survey-platform
   JWT_SECRET=your-production-jwt-secret-key
   NODE_ENV=production
   FRONTEND_URL=https://your-domain.vercel.app
   VITE_API_BASE_URL=https://your-domain.vercel.app/api
   ```

4. **Update CORS settings**
   
   Make sure to update the CORS configuration in `backend/src/app.ts` with your production domain.

### Project Structure for Deployment

```
survey-platform/
├── api/                     # Vercel serverless function entry
│   └── index.js            # Routes to backend
├── backend/                 # Node.js API
│   ├── src/                # Source code
│   ├── dist/               # Built JavaScript (auto-generated)
│   └── package.json        # Backend dependencies
├── frontend/                # React app
│   ├── src/                # Source code
│   ├── dist/               # Built static files (auto-generated)
│   └── package.json        # Frontend dependencies
├── vercel.json             # Vercel configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Surveys
- `GET /api/surveys` - Get user's surveys
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:slug` - Get survey by slug
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey

### Survey Responses
- `POST /api/surveys/:id/responses` - Submit survey response
- `GET /api/surveys/:id/responses` - Get survey responses
- `GET /api/surveys/:id/analytics` - Get survey analytics

### Invitations (Private Surveys)
- `POST /api/surveys/:id/invitations` - Create invitation token
- `GET /api/surveys/:id/invitations` - List invitation tokens
- `PUT /api/surveys/:id/invitations/:tokenId` - Update invitation
- `DELETE /api/surveys/:id/invitations/:tokenId` - Revoke invitation

### Data Export
- `GET /api/surveys/:id/export/csv` - Export as CSV
- `GET /api/surveys/:id/export/json` - Export as JSON

## Features in Detail

### Private Survey Invitations
- Generate unique invitation tokens for private surveys
- Set expiration dates and usage limits
- Track invitation usage and analytics
- Copy invitation links to clipboard
- Revoke invitations when needed

### Response Time Tracking
- Automatically track survey start and completion times
- Calculate and display average completion times
- Export completion time data with responses
- Handle page refresh scenarios

### Analytics Dashboard
- Real-time response tracking
- Response distribution by hour
- Completion time analytics
- Response trends over time
- Export capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the GitHub repository.