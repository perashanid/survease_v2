import express, { Request, Response } from 'express';
import Joi from 'joi';
import { User } from '../models';
import { AuthUtils } from '../utils/auth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details[0].message
        }
      });
      return;
    }

    const { email, password, firstName, lastName } = value;

    // Additional password validation
    const passwordValidation = AuthUtils.isValidPassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: passwordValidation.message
        }
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
      return;
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      email_verified: true // For now, skip email verification
    });

    await user.save();

    // Generate tokens
    const userId = (user._id as any).toString();
    const accessToken = AuthUtils.generateAccessToken(userId, user.email);
    const refreshToken = AuthUtils.generateRefreshToken(userId, user.email);

    // Create session
    await AuthUtils.createSession(userId, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details[0].message
        }
      });
      return;
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
      return;
    }

    // Generate tokens
    const userId = (user._id as any).toString();
    const accessToken = AuthUtils.generateAccessToken(userId, user.email);
    const refreshToken = AuthUtils.generateRefreshToken(userId, user.email);

    // Create session
    await AuthUtils.createSession(userId, refreshToken);

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed'
      }
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
      return;
    }

    // Verify refresh token
    const decoded = AuthUtils.verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type'
        }
      });
      return;
    }

    // Validate session
    const isValidSession = await AuthUtils.validateSession(decoded.userId, refreshToken);
    if (!isValidSession) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Invalid or expired session'
        }
      });
      return;
    }

    // Generate new access token
    const newAccessToken = AuthUtils.generateAccessToken(decoded.userId, decoded.email);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user!.id;

    // Remove session
    await AuthUtils.removeSession(userId, refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Logout failed'
      }
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify current token and return user info
 */
router.get('/verify', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified
        }
      }
    });

  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Token verification failed'
      }
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate password reset (placeholder for now)
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = forgotPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        }
      });
      return;
    }

    // For now, just return success (in production, send email)
    res.json({
      success: true,
      message: 'Password reset instructions sent to email'
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Password reset failed'
      }
    });
  }
});

export default router;