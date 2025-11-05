import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint with environment variable verification
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const envCheck = {
    server: {
      port: process.env.PORT || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
    },
    database: {
      mongodbUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      dbName: process.env.DB_NAME || 'NOT SET',
    },
    email: {
      smtpHost: process.env.SMTP_HOST || 'NOT SET',
      smtpPort: process.env.SMTP_PORT || 'NOT SET',
      smtpSecure: process.env.SMTP_SECURE || 'NOT SET',
      smtpUser: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      smtpPassword: process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET',
      emailFrom: process.env.EMAIL_FROM || 'NOT SET',
    },
    urls: {
      frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
      backendUrl: process.env.BACKEND_URL || 'NOT SET',
      apiBaseUrl: process.env.API_BASE_URL || 'NOT SET',
    },
    security: {
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET',
      sessionSecret: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
    },
    features: {
      aiEnabled: process.env.ENABLE_AI_FEATURES || 'NOT SET',
      geminiApiKey: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    }
  };

  const allEmailVarsSet = 
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.EMAIL_FROM;

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    emailConfigured: allEmailVarsSet ? 'YES' : 'NO',
    environmentVariables: envCheck
  });
});

/**
 * GET /api/health/email
 * Email service specific health check
 */
router.get('/email', async (req: Request, res: Response): Promise<void> => {
  const emailVars = {
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 10)}...` : 'NOT SET',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET (hidden)' : 'NOT SET',
    EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
  };

  const allSet = 
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.EMAIL_FROM;

  res.json({
    emailServiceConfigured: allSet ? 'YES' : 'NO',
    variables: emailVars,
    missingVariables: Object.entries(emailVars)
      .filter(([_, value]) => value === 'NOT SET')
      .map(([key]) => key)
  });
});

export default router;
