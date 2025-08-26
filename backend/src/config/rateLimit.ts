import rateLimit from 'express-rate-limit';
import { logger } from './logger';

// General rate limiting
export const rateLimitConfig = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
      },
    });
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + email combination for auth rate limiting
    const email = req.body?.email || 'unknown';
    return `${req.ip}:${email}`;
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded`, {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 900,
      },
    });
  },
});

// Password reset rate limiting
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600, // 1 hour in seconds
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `password-reset:${req.ip}:${email}`;
  },
});

// Registration rate limiting
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later',
    error: {
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default rateLimitConfig;