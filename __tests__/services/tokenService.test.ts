/**
 * Tests for lib/services/tokenService.ts
 * TokenService class methods
 */

// Set env vars BEFORE anything else (jest.mock is hoisted, but process.env is not)
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/db/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
  },
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

// Import tokenService AFTER env vars are set and mocks are in place
// Use require to ensure it runs after env vars
const { tokenService } = require('@/lib/services/tokenService');

const mockedPrisma = prisma as any;
const mockedRedis = redis as jest.Mocked<typeof redis>;

describe('TokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('returns a JWT string', () => {
      const user = { id: 'user-1', email: 'test@test.com', role: 'trainer' as const };
      const token = tokenService.generateAccessToken(user);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('embeds correct payload', () => {
      const user = { id: 'user-1', email: 'test@test.com', role: 'client' as const };
      const token = tokenService.generateAccessToken(user);
      const decoded = jwt.verify(token, 'test-access-secret') as any;

      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('test@test.com');
      expect(decoded.role).toBe('client');
      expect(decoded.jti).toBe('mock-uuid-1234');
    });
  });

  describe('verifyAccessToken', () => {
    it('returns payload for valid token', () => {
      const user = { id: 'user-1', email: 'test@test.com', role: 'admin' as const };
      const token = tokenService.generateAccessToken(user);

      const payload = tokenService.verifyAccessToken(token);

      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('test@test.com');
      expect(payload.role).toBe('admin');
    });

    it('throws "Access token expired" for expired token', () => {
      const token = jwt.sign(
        { sub: 'user-1', email: 'test@test.com', role: 'client', jti: 'jti-1' },
        'test-access-secret',
        { expiresIn: '-1s' }
      );

      expect(() => tokenService.verifyAccessToken(token)).toThrow('Access token expired');
    });

    it('throws "Invalid access token" for bad signature', () => {
      const token = jwt.sign({ sub: 'user-1' }, 'wrong-secret');

      expect(() => tokenService.verifyAccessToken(token)).toThrow('Invalid access token');
    });

    it('throws "Invalid access token" for malformed token', () => {
      expect(() => tokenService.verifyAccessToken('not-a-jwt')).toThrow('Invalid access token');
    });
  });

  describe('generateRefreshToken', () => {
    it('creates a session in the database', async () => {
      mockedPrisma.userSession = {
        create: jest.fn().mockResolvedValue({ id: 'session-1', userId: 'user-1' }),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      };

      const token = await tokenService.generateRefreshToken({
        userId: 'user-1',
        deviceInfo: { type: 'desktop' },
        ipAddress: '127.0.0.1',
      });

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(mockedPrisma.userSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            deviceInfo: { type: 'desktop' },
            ipAddress: '127.0.0.1',
          }),
        })
      );
    });

    it('throws on database failure', async () => {
      mockedPrisma.userSession = {
        create: jest.fn().mockRejectedValue(new Error('DB error')),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      };

      await expect(
        tokenService.generateRefreshToken({ userId: 'user-1' })
      ).rejects.toThrow('Failed to create session');
    });
  });

  describe('verifyRefreshToken', () => {
    beforeEach(() => {
      mockedPrisma.userSession = {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      };
    });

    it('returns userId and sessionId for valid token', async () => {
      mockedPrisma.userSession.findFirst.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        user: { id: 'user-1', isActive: true },
      });
      mockedPrisma.userSession.update.mockResolvedValue({});

      const result = await tokenService.verifyRefreshToken('some-refresh-token');

      expect(result.userId).toBe('user-1');
      expect(result.sessionId).toBe('session-1');
      expect(mockedPrisma.userSession.update).toHaveBeenCalled();
    });

    it('throws when session not found', async () => {
      mockedPrisma.userSession.findFirst.mockResolvedValue(null);

      await expect(tokenService.verifyRefreshToken('bad-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('throws when user is deactivated', async () => {
      mockedPrisma.userSession.findFirst.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        user: { id: 'user-1', isActive: false },
      });

      await expect(tokenService.verifyRefreshToken('valid-token')).rejects.toThrow(
        'User account deactivated'
      );
    });
  });

  describe('rotateRefreshToken', () => {
    beforeEach(() => {
      mockedPrisma.userSession = {
        create: jest.fn().mockResolvedValue({ id: 'new-session' }),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      };
    });

    it('deletes old session and creates new one', async () => {
      mockedPrisma.userSession.findFirst.mockResolvedValue({ id: 'old-session' });

      const newToken = await tokenService.rotateRefreshToken('old-token', {
        userId: 'user-1',
      });

      expect(typeof newToken).toBe('string');
      expect(mockedPrisma.userSession.delete).toHaveBeenCalledWith({
        where: { id: 'old-session' },
      });
      expect(mockedPrisma.userSession.create).toHaveBeenCalled();
    });

    it('throws when old session not found', async () => {
      mockedPrisma.userSession.findFirst.mockResolvedValue(null);

      await expect(
        tokenService.rotateRefreshToken('bad-token', { userId: 'user-1' })
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('revokeRefreshToken', () => {
    it('deletes sessions matching token hash', async () => {
      mockedPrisma.userSession = {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      };

      await tokenService.revokeRefreshToken('some-token');

      expect(mockedPrisma.userSession.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tokenHash: expect.any(String) }),
        })
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('deletes all sessions for the user', async () => {
      mockedPrisma.userSession = {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        update: jest.fn(),
      };

      const count = await tokenService.revokeAllUserTokens('user-1');

      expect(count).toBe(3);
      expect(mockedPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('getUserSessions', () => {
    it('returns active sessions for the user', async () => {
      const sessions = [
        { id: 's1', deviceInfo: null, ipAddress: '1.2.3.4', lastActivityAt: new Date() },
      ];
      mockedPrisma.userSession = {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue(sessions),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
      };

      const result = await tokenService.getUserSessions('user-1');

      expect(result).toEqual(sessions);
    });
  });

  describe('blacklistToken', () => {
    it('stores token ID in Redis with TTL', async () => {
      await tokenService.blacklistToken('jti-123');

      expect(mockedRedis.set).toHaveBeenCalledWith(
        'blacklisted_token:jti-123',
        'true',
        900 // 15m = 900s
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('returns true when token is blacklisted', async () => {
      mockedRedis.get.mockResolvedValue('true');

      const result = await tokenService.isTokenBlacklisted('jti-123');
      expect(result).toBe(true);
    });

    it('returns false when token is not blacklisted', async () => {
      mockedRedis.get.mockResolvedValue(null);

      const result = await tokenService.isTokenBlacklisted('jti-123');
      expect(result).toBe(false);
    });
  });

  describe('cleanExpiredTokens', () => {
    it('deletes expired sessions', async () => {
      mockedPrisma.userSession = {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
        update: jest.fn(),
      };

      const count = await tokenService.cleanExpiredTokens();
      expect(count).toBe(5);
    });
  });
});
