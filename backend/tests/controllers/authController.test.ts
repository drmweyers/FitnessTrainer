import { Request, Response } from 'express';
import authController from '../../src/controllers/authController';
import { tokenService } from '../../src/services/tokenService';
import { passwordService } from '../../src/services/passwordService';
import { emailService } from '../../src/services/emailService';

// Mock services
jest.mock('../../src/index', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    emailVerification: {
      create: jest.fn(),
    },
    securityAuditLog: {
      create: jest.fn(),
    },
    accountLockout: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/tokenService');
jest.mock('../../src/services/passwordService');
jest.mock('../../src/services/emailService');

describe('AuthController', () => {
  const mockPrisma = require('../../src/index').prisma;
  const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;
  const mockPasswordService = passwordService as jest.Mocked<typeof passwordService>;
  const mockEmailService = emailService as jest.Mocked<typeof emailService>;

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      role: 'client' as const,
      agreeToTerms: true,
      agreeToPrivacy: true,
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
        isVerified: false,
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.emailVerification.create.mockResolvedValue({});
      mockEmailService.sendEmailVerification.mockResolvedValue(undefined);
      mockTokenService.generateAccessToken.mockReturnValue('access-token');
      mockTokenService.generateRefreshToken.mockResolvedValue('refresh-token');
      mockPrisma.securityAuditLog.create.mockResolvedValue({});

      mockRequest.body = validRegisterData;

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('TestPassword123!');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Registration successful. Please check your email to verify your account.',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-id',
              email: 'test@example.com',
              role: 'client',
            }),
            tokens: expect.objectContaining({
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            }),
          }),
        })
      );
    });

    it('should reject registration if user already exists', async () => {
      const existingUser = { id: 'existing-id', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      mockRequest.body = validRegisterData;

      try {
        await authController.register(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('User already exists with this email');
        expect(error.code).toBe('USER_EXISTS');
      }
    });

    it('should handle email service failure gracefully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
        isVerified: false,
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.emailVerification.create.mockResolvedValue({});
      mockEmailService.sendEmailVerification.mockRejectedValue(new Error('Email failed'));
      mockTokenService.generateAccessToken.mockReturnValue('access-token');
      mockTokenService.generateRefreshToken.mockResolvedValue('refresh-token');
      mockPrisma.securityAuditLog.create.mockResolvedValue({});

      mockRequest.body = validRegisterData;

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      rememberMe: false,
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'client',
      passwordHash: 'hashed-password',
      isActive: true,
      isVerified: true,
      deletedAt: null,
      createdAt: new Date(),
      lastLoginAt: null,
      accountLockouts: [],
    };

    it('should login user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('access-token');
      mockTokenService.generateRefreshToken.mockResolvedValue('refresh-token');
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.securityAuditLog.create.mockResolvedValue({});
      mockPrisma.accountLockout.updateMany.mockResolvedValue({ count: 0 });

      mockRequest.body = validLoginData;

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          accountLockouts: {
            where: {
              lockedUntil: {
                gt: expect.any(Date),
              },
            },
            take: 1,
          },
        },
      });
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith('TestPassword123!', 'hashed-password');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-id',
              email: 'test@example.com',
              role: 'client',
            }),
            tokens: expect.objectContaining({
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            }),
          }),
        })
      );
    });

    it('should reject login with invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.securityAuditLog.create.mockResolvedValue({});

      mockRequest.body = validLoginData;

      try {
        await authController.login(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid email or password');
        expect(error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should reject login with wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue(false);
      mockPrisma.accountLockout.findFirst.mockResolvedValue(null);
      mockPrisma.accountLockout.create.mockResolvedValue({});
      mockPrisma.securityAuditLog.create.mockResolvedValue({});

      mockRequest.body = validLoginData;

      try {
        await authController.login(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid email or password');
        expect(error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);
      mockPrisma.securityAuditLog.create.mockResolvedValue({});

      mockRequest.body = validLoginData;

      try {
        await authController.login(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Account has been deactivated');
        expect(error.code).toBe('ACCOUNT_INACTIVE');
      }
    });

    it('should reject login for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        accountLockouts: [
          {
            id: 'lockout-id',
            lockedUntil: new Date(Date.now() + 900000), // 15 minutes from now
          },
        ],
      };
      mockPrisma.user.findUnique.mockResolvedValue(lockedUser);

      mockRequest.body = validLoginData;

      try {
        await authController.login(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(423);
        expect(error.message).toContain('Account is locked');
        expect(error.code).toBe('ACCOUNT_LOCKED');
      }
    });
  });

  describe('refreshToken', () => {
    const validRefreshData = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
        isActive: true,
        deletedAt: null,
      };

      mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'user-id', sessionId: 'session-id' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockTokenService.rotateRefreshToken.mockResolvedValue('new-refresh-token');
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');

      mockRequest.body = validRefreshData;

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          deletedAt: true,
        },
      });
      expect(mockTokenService.rotateRefreshToken).toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Tokens refreshed successfully',
          data: expect.objectContaining({
            tokens: expect.objectContaining({
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
            }),
          }),
        })
      );
    });

    it('should reject refresh for inactive user', async () => {
      const inactiveUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
        isActive: false,
        deletedAt: null,
      };

      mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'user-id', sessionId: 'session-id' });
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      mockRequest.body = validRefreshData;

      try {
        await authController.refreshToken(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('User not found or inactive');
        expect(error.code).toBe('USER_INACTIVE');
      }
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockRequest.user = { id: 'user-id', email: 'test@example.com', role: 'client', isActive: true, isVerified: true };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
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
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User retrieved successfully',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-id',
              email: 'test@example.com',
              role: 'client',
            }),
          }),
        })
      );
    });

    it('should reject request without authentication', async () => {
      mockRequest.user = undefined;

      try {
        await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Authentication required');
        expect(error.code).toBe('AUTH_REQUIRED');
      }
    });

    it('should handle user not found', async () => {
      mockRequest.user = { id: 'user-id', email: 'test@example.com', role: 'client', isActive: true, isVerified: true };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      try {
        await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
        expect(error.code).toBe('USER_NOT_FOUND');
      }
    });
  });

  describe('logout', () => {
    it('should logout from current device', async () => {
      mockRequest.body = { refreshToken: 'refresh-token' };
      mockRequest.user = { id: 'user-id', email: 'test@example.com', role: 'client', isActive: true, isVerified: true };
      mockRequest.tokenId = 'token-id';
      
      mockTokenService.revokeRefreshToken.mockResolvedValue(undefined);
      mockTokenService.blacklistToken.mockResolvedValue(undefined);
      mockPrisma.securityAuditLog.create.mockResolvedValue({});

      await authController.logout(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockTokenService.blacklistToken).toHaveBeenCalledWith('token-id');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged out successfully',
        })
      );
    });

    it('should logout from all devices', async () => {
      mockRequest.body = { logoutFromAll: true };
      mockRequest.user = { id: 'user-id', email: 'test@example.com', role: 'client', isActive: true, isVerified: true };
      mockRequest.tokenId = 'token-id';
      
      mockTokenService.revokeAllUserTokens.mockResolvedValue(3);
      mockTokenService.blacklistToken.mockResolvedValue(undefined);

      await authController.logout(mockRequest as Request, mockResponse as Response);

      expect(mockTokenService.revokeAllUserTokens).toHaveBeenCalledWith('user-id');
      expect(mockTokenService.blacklistToken).toHaveBeenCalledWith('token-id');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged out from all devices. 3 sessions terminated.',
        })
      );
    });
  });
});