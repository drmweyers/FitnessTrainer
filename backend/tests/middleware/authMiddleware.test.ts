import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../src/middleware/auth';
import { tokenService } from '../../src/services/tokenService';

// Mock the token service
jest.mock('../../src/services/tokenService');

describe('AuthMiddleware', () => {
  const mockTokenService = tokenService as jest.Mocked<typeof tokenService>;
  
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token', async () => {
      const mockPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'client' as const,
        jti: 'token-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockTokenService.verifyAccessToken.mockReturnValue(mockPayload);
      mockTokenService.isTokenBlacklisted.mockResolvedValue(false);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('token-id');
      expect(mockRequest.user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
      });
      expect(mockRequest.tokenId).toBe('token-id');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', async () => {
      mockRequest.headers = {
        authorization: 'Invalid token',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>',
        code: 'INVALID_TOKEN_FORMAT',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockTokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid access token',
        code: 'INVALID_TOKEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      mockTokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Access token expired');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      const mockPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'client' as const,
        jti: 'blacklisted-token-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
      };

      mockRequest.headers = {
        authorization: 'Bearer blacklisted-token',
      };

      mockTokenService.verifyAccessToken.mockReturnValue(mockPayload);
      mockTokenService.isTokenBlacklisted.mockResolvedValue(true);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token service errors', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockTokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Token service error');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token service error',
        code: 'INVALID_TOKEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'client',
        isActive: true,
        isVerified: true,
      };
    });

    it('should authorize user with correct role', () => {
      const authorizeClient = authorize('client');

      authorizeClient(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize user with multiple allowed roles', () => {
      const authorizeMultiple = authorize('client', 'trainer');

      authorizeMultiple(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user without authentication', () => {
      mockRequest.user = undefined;
      const authorizeClient = authorize('client');

      authorizeClient(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject user with insufficient permissions', () => {
      const authorizeAdmin = authorize('admin');

      authorizeAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authorize admin for any role', () => {
      mockRequest.user = {
        id: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
        isActive: true,
        isVerified: true,
      };

      const authorizeTrainer = authorize('trainer');

      authorizeTrainer(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      const authorizeNone = authorize();

      authorizeNone(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});