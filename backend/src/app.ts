import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
function validateEnvironment() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

validateEnvironment();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy to get real IP addresses
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-survey-platform.vercel.app']
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Survey Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Import survey routes
import surveyRoutes from './routes/surveys';
app.use('/api/surveys', surveyRoutes);

// Import invitation routes
import invitationRoutes from './routes/invitations';
app.use('/api/surveys', invitationRoutes);

// Import stats routes
import statsRoutes from './routes/stats';
app.use('/api/stats', statsRoutes);

// Import contact routes
import contactRoutes from './routes/contact';
app.use('/api/contact', contactRoutes);

// Import public routes
import publicRoutes from './routes/public';
app.use('/api/public', publicRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// Initialize database connection for serverless
let dbConnected = false;

async function initializeDatabase() {
  if (!dbConnected) {
    try {
      const connected = await connectDatabase();
      if (connected) {
        dbConnected = true;
        console.log('📊 Database connected successfully');
      }
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
    }
  }
}

// Initialize database connection
initializeDatabase();

// Start server (for local development)
async function startServer() {
  try {
    // Connect to database
    await initializeDatabase();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database connected successfully`);
      console.log(`🔒 Authentication system ready`);
      console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📊 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📊 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the server only if running directly (not in serverless)
if (require.main === module) {
  startServer();
}

export { app };
export default app;