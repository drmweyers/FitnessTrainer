import { tokenService } from '../../src/services/tokenService';
import jwt from 'jsonwebtoken';

// Mock Redis and Prisma
jest.mock('../../src/index', () => ({
  redis: {
    setEx: jest.fn(),
    get: jest.fn(),
  },
  prisma: {
    userSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('TokenService', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'client' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRE = '15m';
    process.env.JWT_REFRESH_EXPIRE = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = tokenService.generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT structure
    });

    it('should include correct payload in token', () => {
      const token = tokenService.generateAccessToken(mockUser);
      const decoded = jwt.verify(token, 'test-access-secret') as any;
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.jti).toBeDefined(); // unique token ID
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expires at
    });

    it('should generate different tokens for same user', () => {
      const token1 = tokenService.generateAccessToken(mockUser);
      const token2 = tokenService.generateAccessToken(mockUser);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = tokenService.generateAccessToken(mockUser);
      const payload = tokenService.verifyAccessToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        tokenService.verifyAccessToken('invalid-token');
      }).toThrow('Invalid access token');
    });

    it('should throw error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { sub: 'user-id', exp: Math.floor(Date.now() / 1000) - 1 },
        'test-access-secret'
      );
      
      expect(() => {
        tokenService.verifyAccessToken(expiredToken);
      }).toThrow('Access token expired');
    });

    it('should throw error for token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(
        { sub: 'user-id', exp: Math.floor(Date.now() / 1000) + 900 },
        'wrong-secret'
      );
      
      expect(() => {
        tokenService.verifyAccessToken(tokenWithWrongSecret);
      }).toThrow('Invalid access token');
    });
  });

  describe('generateRefreshToken', () => {
    const mockPrisma = require('../../src/index').prisma;
    
    beforeEach(() => {
      mockPrisma.userSession.create.mockResolvedValue({
        id: 'session-id',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should generate refresh token and store in database', async () => {
      const token = await tokenService.generateRefreshToken({
        userId: mockUser.id,
        ipAddress: '127.0.0.1',
      });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50); // Should be a long random string
      expect(mockPrisma.userSession.create).toHaveBeenCalledTimes(1);
    });

    it('should include device info in session', async () => {
      const deviceInfo = { userAgent: 'Test Browser', platform: 'test' };
      
      await tokenService.generateRefreshToken({
        userId: mockUser.id,
        deviceInfo,
        ipAddress: '127.0.0.1',
      });
      
      expect(mockPrisma.userSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            deviceInfo,
            ipAddress: '127.0.0.1',
          }),
        })
      );
    });
  });

  describe('verifyRefreshToken', () => {
    const mockPrisma = require('../../src/index').prisma;
    
    it('should verify valid refresh token', async () => {
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        user: { id: mockUser.id, isActive: true },
      };
      
      mockPrisma.userSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.userSession.update.mockResolvedValue({});
      
      const result = await tokenService.verifyRefreshToken('valid-token');
      
      expect(result.userId).toBe(mockUser.id);
      expect(result.sessionId).toBe('session-id');
      expect(mockPrisma.userSession.update).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid refresh token', async () => {
      mockPrisma.userSession.findFirst.mockResolvedValue(null);
      
      await expect(
        tokenService.verifyRefreshToken('invalid-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for inactive user', async () => {
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        user: { id: mockUser.id, isActive: false },
      };
      
      mockPrisma.userSession.findFirst.mockResolvedValue(mockSession);
      
      await expect(
        tokenService.verifyRefreshToken('valid-token')
      ).rejects.toThrow('User account deactivated');
    });
  });

  describe('blacklistToken', () => {
    const mockRedis = require('../../src/index').redis;
    
    it('should add token to Redis blacklist', async () => {
      mockRedis.setEx.mockResolvedValue('OK');
      
      await tokenService.blacklistToken('test-token-id');
      
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'blacklisted_token:test-token-id',
        900, // 15 minutes in seconds
        'true'
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    const mockRedis = require('../../src/index').redis;
    
    it('should return true for blacklisted token', async () => {
      mockRedis.get.mockResolvedValue('true');
      
      const result = await tokenService.isTokenBlacklisted('test-token-id');
      
      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('blacklisted_token:test-token-id');
    });

    it('should return false for non-blacklisted token', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await tokenService.isTokenBlacklisted('test-token-id');
      
      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    const mockPrisma = require('../../src/index').prisma;
    
    it('should delete all user sessions', async () => {
      mockPrisma.userSession.deleteMany.mockResolvedValue({ count: 3 });
      
      const deletedCount = await tokenService.revokeAllUserTokens(mockUser.id);
      
      expect(deletedCount).toBe(3);
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });

  describe('parseExpiry', () => {
    // Test the private parseExpiry method through public methods
    it('should handle seconds format', () => {
      const token = jwt.sign(
        { sub: 'user-id' },
        'test-access-secret',
        { expiresIn: '30s' }
      );
      
      expect(() => tokenService.verifyAccessToken(token)).not.toThrow();
    });

    it('should handle minutes format', () => {
      const token = jwt.sign(
        { sub: 'user-id' },
        'test-access-secret',
        { expiresIn: '15m' }
      );
      
      expect(() => tokenService.verifyAccessToken(token)).not.toThrow();
    });

    it('should handle hours format', () => {
      const token = jwt.sign(
        { sub: 'user-id' },
        'test-access-secret',
        { expiresIn: '2h' }
      );
      
      expect(() => tokenService.verifyAccessToken(token)).not.toThrow();
    });
  });
});