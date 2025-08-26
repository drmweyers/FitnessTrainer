import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { tokenService } from '@/services/tokenService';
import { passwordService } from '@/services/passwordService';
import { emailService } from '@/services/emailService';
import { logger } from '@/config/logger';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import type { 
  RegisterRequest, 
  LoginRequest, 
  RefreshTokenRequest,
  AuthResponse,
  RefreshResponse,
  UserResponse 
} from '@/types/auth';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>) => {
  const { email, password, role, agreeToTerms, agreeToPrivacy } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError(409, 'User already exists with this email', 'USER_EXISTS');
  }

  // Hash password
  const passwordHash = await passwordService.hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      isActive: true,
      isVerified: false,
    },
  });

  // Generate email verification token
  const verificationToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token: verificationToken,
      expiresAt,
    },
  });

  // Send verification email
  try {
    await emailService.sendEmailVerification(email, verificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await tokenService.generateRefreshToken({
    userId: user.id,
    deviceInfo: req.body.deviceInfo,
    ipAddress: req.ip,
  });

  // Log security event
  await prisma.securityAuditLog.create({
    data: {
      userId: user.id,
      eventType: 'registration',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    },
  });

  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
      },
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>) => {
  const { email, password, rememberMe, deviceInfo } = req.body;

  // Find user with password
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accountLockouts: {
        where: {
          lockedUntil: {
            gt: new Date(),
          },
        },
        take: 1,
      },
    },
  });

  if (!user || !user.passwordHash) {
    // Log failed attempt
    await prisma.securityAuditLog.create({
      data: {
        eventType: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'user_not_found',
      },
    });

    throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Check if account is locked
  if (user.accountLockouts.length > 0) {
    const lockout = user.accountLockouts[0];
    if (lockout?.lockedUntil) {
      const remainingTime = Math.ceil((lockout.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      throw createError(423, `Account is locked. Try again in ${remainingTime} minutes.`, 'ACCOUNT_LOCKED');
    }
  }

  // Check if account is active
  if (!user.isActive || user.deletedAt) {
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'account_inactive',
      },
    });

    throw createError(403, 'Account has been deactivated', 'ACCOUNT_INACTIVE');
  }

  // Verify password
  const isValidPassword = await passwordService.verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    // Handle failed login attempt
    await handleFailedLogin(user.id, req.ip || '');
    
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'login_failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'invalid_password',
      },
    });

    throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Reset failed attempts on successful login
  await resetFailedAttempts(user.id);

  // Generate tokens
  const accessToken = tokenService.generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = await tokenService.generateRefreshToken({
    userId: user.id,
    deviceInfo,
    ipAddress: req.ip,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Log successful login
  await prisma.securityAuditLog.create({
    data: {
      userId: user.id,
      eventType: 'login',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceInfo: deviceInfo as any,
      success: true,
    },
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
      },
    },
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request<{}, RefreshResponse, RefreshTokenRequest>, res: Response<RefreshResponse>) => {
  const { refreshToken: token, deviceInfo } = req.body;

  // Verify refresh token
  const { userId } = await tokenService.verifyRefreshToken(token);

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!user || !user.isActive || user.deletedAt) {
    throw createError(401, 'User not found or inactive', 'USER_INACTIVE');
  }

  // Rotate refresh token (invalidate old, create new)
  const newRefreshToken = await tokenService.rotateRefreshToken(token, {
    userId: user.id,
    deviceInfo,
    ipAddress: req.ip,
  });

  // Generate new access token
  const accessToken = tokenService.generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  logger.debug('Tokens refreshed successfully', { userId: user.id });

  res.json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
      },
    },
  });
});

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response<UserResponse>) => {
  if (!req.user) {
    throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw createError(404, 'User not found', 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'User retrieved successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
      },
    },
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token, logoutFromAll } = req.body;

  if (logoutFromAll && req.user) {
    // Logout from all devices
    const deletedCount = await tokenService.revokeAllUserTokens(req.user.id);
    
    // Blacklist current access token
    if (req.tokenId) {
      await tokenService.blacklistToken(req.tokenId);
    }

    logger.info('User logged out from all devices', {
      userId: req.user.id,
      sessionsRevoked: deletedCount,
    });

    return res.json({
      success: true,
      message: `Logged out from all devices. ${deletedCount} sessions terminated.`,
    });
  }

  if (token) {
    // Logout from current device only
    await tokenService.revokeRefreshToken(token);
  }

  // Blacklist current access token
  if (req.tokenId) {
    await tokenService.blacklistToken(req.tokenId);
  }

  // Log security event
  if (req.user) {
    await prisma.securityAuditLog.create({
      data: {
        userId: req.user.id,
        eventType: 'logout',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      },
    });

    logger.info('User logged out', { userId: req.user.id });
  }

  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Helper: Handle failed login attempts
 */
async function handleFailedLogin(userId: string, ipAddress: string): Promise<void> {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
  const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION_MS || '900000'); // 15 minutes

  // Get or create lockout record
  let lockout = await prisma.accountLockout.findFirst({
    where: { userId },
  });

  if (!lockout) {
    lockout = await prisma.accountLockout.create({
      data: {
        userId,
        failedAttempts: 1,
        lastAttemptAt: new Date(),
      },
    });
  } else {
    const updatedAttempts = lockout.failedAttempts + 1;
    const shouldLock = updatedAttempts >= maxAttempts;

    await prisma.accountLockout.update({
      where: { id: lockout.id },
      data: {
        failedAttempts: updatedAttempts,
        lastAttemptAt: new Date(),
        ...(shouldLock && {
          lockedUntil: new Date(Date.now() + lockoutDuration),
        }),
      },
    });

    if (shouldLock) {
      logger.warn('Account locked due to too many failed attempts', {
        userId,
        attempts: updatedAttempts,
        ipAddress,
      });
    }
  }
}

/**
 * Helper: Reset failed login attempts
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  await prisma.accountLockout.updateMany({
    where: { userId },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      unlockedAt: new Date(),
    },
  });
}

export default {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
};