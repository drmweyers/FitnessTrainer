import { Request, Response, NextFunction } from 'express';
import { tokenService } from '@/services/tokenService';
import { prisma } from '../index';
import { createError } from './errorHandler';
import { logger } from '@/config/logger';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'trainer' | 'client' | 'admin';
        isActive: boolean;
        isVerified: boolean;
      };
      tokenId?: string;
    }
  }
}

/**
 * Authentication middleware - verifies JWT access tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw createError(401, 'Access token required', 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const payload = tokenService.verifyAccessToken(token);
    
    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw createError(401, 'Token has been revoked', 'TOKEN_REVOKED');
    }

    // Get user from database (ensure they still exist and are active)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw createError(401, 'User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw createError(401, 'Account has been deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Attach user data to request
    req.user = user;
    req.tokenId = payload.jti;

    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenId: payload.jti,
    });

    next();
  } catch (error: any) {
    if (error.statusCode) {
      // Known authentication error
      return next(error);
    }

    // Token verification failed
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });

    if (error.message.includes('expired')) {
      return next(createError(401, 'Access token expired', 'TOKEN_EXPIRED'));
    } else if (error.message.includes('invalid')) {
      return next(createError(401, 'Invalid access token', 'INVALID_TOKEN'));
    }

    return next(createError(401, 'Authentication failed', 'AUTH_FAILED'));
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  // Use the main authenticate middleware
  return authenticate(req, res, next);
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: Array<'trainer' | 'client' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      
      return next(createError(403, 'Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

/**
 * Require email verification
 */
export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(createError(401, 'Authentication required', 'AUTH_REQUIRED'));
  }

  if (!req.user.isVerified) {
    return next(createError(403, 'Email verification required', 'EMAIL_NOT_VERIFIED'));
  }

  next();
};

/**
 * Admin only middleware
 */
export const adminOnly = [authenticate, authorize('admin')];

/**
 * Trainer only middleware
 */
export const trainerOnly = [authenticate, authorize('trainer')];

/**
 * Client only middleware
 */
export const clientOnly = [authenticate, authorize('client')];

/**
 * Trainer or admin middleware
 */
export const trainerOrAdmin = [authenticate, authorize('trainer', 'admin')];

/**
 * Any authenticated user middleware
 */
export const authenticated = [authenticate];

/**
 * Verified user only middleware
 */
export const verifiedOnly = [authenticate, requireVerified];

export default {
  authenticate,
  optionalAuth,
  authorize,
  requireVerified,
  adminOnly,
  trainerOnly,
  clientOnly,
  trainerOrAdmin,
  authenticated,
  verifiedOnly,
};