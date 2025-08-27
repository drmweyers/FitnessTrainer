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
 * Verify email address
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw createError(400, 'Verification token is required', 'TOKEN_REQUIRED');
  }

  // Find the verification record
  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verification) {
    throw createError(400, 'Invalid or expired verification token', 'INVALID_TOKEN');
  }

  // Check if token is expired
  if (verification.expiresAt < new Date()) {
    throw createError(400, 'Verification token has expired', 'TOKEN_EXPIRED');
  }

  // Check if already verified
  if (verification.verifiedAt) {
    throw createError(400, 'Email is already verified', 'ALREADY_VERIFIED');
  }

  // Update verification record and user
  await prisma.$transaction(async (tx) => {
    // Mark verification as completed
    await tx.emailVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });

    // Mark user as verified
    await tx.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });
  });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(
      verification.user.email,
      verification.user.email.split('@')[0] || 'User', // Use email prefix as name fallback
      verification.user.role as 'trainer' | 'client'
    );
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    // Don't fail the verification if welcome email fails
  }

  // Log security event
  await prisma.securityAuditLog.create({
    data: {
      userId: verification.userId,
      eventType: 'email_verified',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    },
  });

  logger.info('Email verified successfully', {
    userId: verification.userId,
    email: verification.user.email,
  });

  res.json({
    success: true,
    message: 'Email verified successfully! Welcome to EvoFit.',
    data: {
      user: {
        id: verification.user.id,
        email: verification.user.email,
        isVerified: true,
      },
    },
  });
});

/**
 * Resend email verification
 * POST /api/auth/resend-verification
 */
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw createError(400, 'Email address is required', 'EMAIL_REQUIRED');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists for security
    res.json({
      success: true,
      message: 'If an account with this email exists, a verification email has been sent.',
    });
    return;
  }

  // Check if user is already verified
  if (user.isVerified) {
    throw createError(400, 'Email is already verified', 'ALREADY_VERIFIED');
  }

  // Check for recent verification emails (rate limiting)
  const recentVerification = await prisma.emailVerification.findFirst({
    where: {
      userId: user.id,
      createdAt: {
        gt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
    },
  });

  if (recentVerification) {
    throw createError(429, 'Please wait before requesting another verification email', 'RATE_LIMITED');
  }

  // Generate new verification token
  const verificationToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Invalidate old tokens and create new one
  await prisma.$transaction(async (tx) => {
    // Mark old verifications as expired
    await tx.emailVerification.updateMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });

    // Create new verification
    await tx.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });
  });

  // Send verification email
  try {
    await emailService.sendEmailVerification(email, verificationToken);
    
    // Log security event
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'verification_resent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      },
    });

    logger.info('Verification email resent', {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    logger.error('Failed to resend verification email:', error);
    throw createError(500, 'Failed to send verification email', 'EMAIL_SEND_FAILED');
  }

  res.json({
    success: true,
    message: 'Verification email sent! Please check your inbox.',
  });
});

/**
 * Send password reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Find user - don't reveal if user exists for security
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return success even if user doesn't exist for security
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
    return;
  }

  // Check if account is active
  if (!user.isActive || user.deletedAt) {
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
    return;
  }

  // Check for recent password reset requests (rate limiting)
  const recentReset = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      createdAt: {
        gt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
    },
  });

  if (recentReset) {
    throw createError(429, 'Please wait before requesting another password reset', 'RATE_LIMITED');
  }

  // Generate reset token
  const resetToken = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate old reset tokens and create new one
  await prisma.$transaction(async (tx) => {
    // Mark old reset tokens as used
    await tx.passwordReset.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used
      },
    });

    // Create new reset token
    await tx.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });
  });

  // Send password reset email
  try {
    await emailService.sendPasswordReset(email, resetToken);
    
    // Log security event
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'password_reset_requested',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
      },
    });

    logger.info('Password reset email sent', {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw createError(500, 'Failed to send password reset email', 'EMAIL_SEND_FAILED');
  }

  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent.',
  });
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  // Find the reset record
  const passwordReset = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!passwordReset) {
    throw createError(400, 'Invalid or expired reset token', 'INVALID_TOKEN');
  }

  // Check if token is expired
  if (passwordReset.expiresAt < new Date()) {
    throw createError(400, 'Reset token has expired', 'TOKEN_EXPIRED');
  }

  // Check if token is already used
  if (passwordReset.usedAt) {
    throw createError(400, 'Reset token has already been used', 'TOKEN_USED');
  }

  // Check if user account is still active
  if (!passwordReset.user.isActive || passwordReset.user.deletedAt) {
    throw createError(403, 'Account is not active', 'ACCOUNT_INACTIVE');
  }

  // Hash new password
  const passwordHash = await passwordService.hashPassword(password);

  // Update password and mark reset token as used
  await prisma.$transaction(async (tx) => {
    // Update user password
    await tx.user.update({
      where: { id: passwordReset.userId },
      data: { passwordHash },
    });

    // Mark reset token as used
    await tx.passwordReset.update({
      where: { id: passwordReset.id },
      data: { usedAt: new Date() },
    });

    // Revoke all existing sessions for security
    await tx.userSession.deleteMany({
      where: { userId: passwordReset.userId },
    });

    // Reset any account lockouts
    await tx.accountLockout.updateMany({
      where: { userId: passwordReset.userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        unlockedAt: new Date(),
      },
    });
  });

  // Send security notification email
  try {
    await emailService.sendSecurityNotification(
      passwordReset.user.email,
      'Password Changed',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
      }
    );
  } catch (error) {
    logger.error('Failed to send security notification:', error);
    // Don't fail the password reset if notification fails
  }

  // Log security event
  await prisma.securityAuditLog.create({
    data: {
      userId: passwordReset.userId,
      eventType: 'password_reset_completed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    },
  });

  logger.info('Password reset completed successfully', {
    userId: passwordReset.userId,
    email: passwordReset.user.email,
  });

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.',
    data: {
      user: {
        id: passwordReset.user.id,
        email: passwordReset.user.email,
      },
    },
  });
});

/**
 * Change password for authenticated user
 * PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with current password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!user || !user.passwordHash || !user.isActive || user.deletedAt) {
    throw createError(404, 'User not found or inactive', 'USER_NOT_FOUND');
  }

  // Verify current password
  const isValidCurrentPassword = await passwordService.verifyPassword(currentPassword, user.passwordHash);
  
  if (!isValidCurrentPassword) {
    // Log failed attempt
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'password_change_failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        failureReason: 'invalid_current_password',
      },
    });

    throw createError(400, 'Current password is incorrect', 'INVALID_PASSWORD');
  }

  // Check if new password is different from current
  const isSamePassword = await passwordService.verifyPassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw createError(400, 'New password must be different from current password', 'SAME_PASSWORD');
  }

  // Hash new password
  const newPasswordHash = await passwordService.hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  // Revoke all sessions except current one
  if (req.tokenId) {
    await prisma.userSession.deleteMany({
      where: {
        userId: user.id,
        tokenHash: { not: req.tokenId },
      },
    });
  }

  // Send security notification
  try {
    await emailService.sendSecurityNotification(
      user.email,
      'Password Changed',
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
      }
    );
  } catch (error) {
    logger.error('Failed to send security notification:', error);
    // Don't fail the password change if notification fails
  }

  // Log security event
  await prisma.securityAuditLog.create({
    data: {
      userId: user.id,
      eventType: 'password_changed',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    },
  });

  logger.info('Password changed successfully', {
    userId: user.id,
    email: user.email,
  });

  res.json({
    success: true,
    message: 'Password changed successfully. You have been logged out of other devices for security.',
  });
});

/**
 * Get user sessions
 * GET /api/auth/sessions
 */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const sessions = await prisma.userSession.findMany({
    where: { userId: req.user.id },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      lastActivityAt: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { lastActivityAt: 'desc' },
  });

  // Format sessions for response
  const formattedSessions = sessions.map((session) => ({
    id: session.id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    lastActivityAt: session.lastActivityAt?.toISOString() || session.createdAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    isCurrentSession: req.tokenId === session.id,
  }));

  logger.debug('Sessions retrieved', {
    userId: req.user.id,
    sessionCount: sessions.length,
  });

  res.json({
    success: true,
    message: 'Sessions retrieved successfully',
    data: {
      sessions: formattedSessions,
    },
  });
});

/**
 * Revoke a specific session
 * DELETE /api/auth/sessions/:sessionId
 */
export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const { sessionId } = req.params;

  if (!sessionId) {
    throw createError(400, 'Session ID is required', 'SESSION_ID_REQUIRED');
  }

  // Find and verify session belongs to current user
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId: req.user.id,
    },
  });

  if (!session) {
    throw createError(404, 'Session not found or access denied', 'SESSION_NOT_FOUND');
  }

  // Check if user is trying to revoke their current session
  const isCurrentSession = req.tokenId === sessionId;

  // Delete the session
  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  // If current session was revoked, blacklist the access token
  if (isCurrentSession && req.tokenId) {
    await tokenService.blacklistToken(req.tokenId);
  }

  // Log security event
  await prisma.securityAuditLog.create({
    data: {
      userId: req.user.id,
      eventType: isCurrentSession ? 'current_session_revoked' : 'session_revoked',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    },
  });

  logger.info('Session revoked', {
    userId: req.user.id,
    sessionId,
    isCurrentSession,
  });

  res.json({
    success: true,
    message: isCurrentSession 
      ? 'Current session revoked successfully. Please log in again.'
      : 'Session revoked successfully',
    data: {
      sessionId,
      isCurrentSession,
    },
  });
});

/**
 * Get security audit logs for current user
 * GET /api/auth/security-logs
 */
export const getSecurityLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const { page = '1', limit = '50' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    prisma.securityAuditLog.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        eventType: true,
        ipAddress: true,
        userAgent: true,
        success: true,
        failureReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.securityAuditLog.count({
      where: { userId: req.user.id },
    }),
  ]);

  // Format logs for response
  const formattedLogs = logs.map((log) => ({
    id: log.id,
    eventType: log.eventType,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    success: log.success,
    failureReason: log.failureReason,
    timestamp: log.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / limitNum);

  logger.debug('Security logs retrieved', {
    userId: req.user.id,
    page: pageNum,
    limit: limitNum,
    total,
  });

  res.json({
    success: true,
    message: 'Security logs retrieved successfully',
    data: {
      logs: formattedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

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
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getSessions,
  revokeSession,
  getSecurityLogs,
};