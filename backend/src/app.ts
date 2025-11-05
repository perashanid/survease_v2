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
import path from 'path';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy only for Render's IPs
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Security middleware with relaxed CSP for production
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP since we're serving frontend from same origin
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins temporarily for debugging
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute (reduced from 15)
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per minute (increased from 100)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    });
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

// Import all routes
import healthRoutes from './routes/health';
import surveyRoutes from './routes/surveys';
import invitationRoutes from './routes/invitations';
import statsRoutes from './routes/stats';
import contactRoutes from './routes/contact';
import publicRoutes from './routes/public';
import analyticsRoutes from './routes/analytics';
import segmentsRoutes from './routes/segments';
import attentionRoutes from './routes/attention';
import qualityRoutes from './routes/quality';
import aiRoutes from './routes/ai';
import predictionsRoutes from './routes/predictions';
import notificationRoutes from './routes/notifications';
import profileRoutes from './routes/profile';

// API routes with /api prefix
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/surveys', invitationRoutes);
app.use('/api/surveys', qualityRoutes);
app.use('/api/surveys', aiRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/segments', segmentsRoutes);
app.use('/api/attention', attentionRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);

// Serve static files from frontend build (for production)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found'
      }
    });
  });
}

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

// Verify email configuration on startup
console.log('='.repeat(80));
console.log('📧 EMAIL CONFIGURATION CHECK ON STARTUP');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('SMTP_SECURE:', process.env.SMTP_SECURE || '❌ NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('='.repeat(80));

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