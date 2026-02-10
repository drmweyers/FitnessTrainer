/**
 * Token Service (Platform-Agnostic)
 *
 * Works with:
 * - Vercel (serverless functions)
 * - Digital Ocean (Express.js server)
 * - Any Node.js environment
 *
 * Handles:
 * - JWT access token generation/verification
 * - Refresh token generation/storage
 * - Token blacklisting (immediate logout)
 * - Session management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

interface TokenPayload {
  sub: string; // user_id
  email: string;
  role: 'trainer' | 'client' | 'admin';
  iat: number;
  exp: number;
  jti: string; // unique token id
}

interface RefreshTokenData {
  userId: string;
  deviceInfo?: any;
  ipAddress?: string;
}

class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  private validated = false;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRE || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';
  }

  /** Validate secrets on first use (not at import/build time) */
  private ensureSecrets(): void {
    if (this.validated) return;
    this.validated = true;
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error('JWT_ACCESS_SECRET not configured for production');
      }
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET not configured for production');
      }
    }
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(user: {
    id: string;
    email: string;
    role: 'trainer' | 'client' | 'admin';
  }): string {
    this.ensureSecrets();
    const tokenId = uuidv4();

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.accessTokenExpiry),
      jti: tokenId,
    };

    return jwt.sign(payload, this.accessTokenSecret);
  }

  /**
   * Generate refresh token and store in database
   */
  async generateRefreshToken(data: RefreshTokenData): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + this.parseExpiry(this.refreshTokenExpiry) * 1000
    );

    // Store refresh token in database
    try {
      const session = await prisma.userSession.create({
        data: {
          userId: data.userId,
          tokenHash,
          deviceInfo: data.deviceInfo || null,
          ipAddress: data.ipAddress || null,
          expiresAt,
          lastActivityAt: new Date(),
        },
      });

      return token;
    } catch (error: any) {
      throw new Error('Failed to create session');
    }
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token: string): TokenPayload {
    this.ensureSecrets();
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload;
      return payload;
    } catch (error: any) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<{
    userId: string;
    sessionId: string;
  }> {
    const tokenHash = this.hashToken(token);

    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(), // Token not expired
        },
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    if (!session.user.isActive) {
      throw new Error('User account deactivated');
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return {
      userId: session.userId,
      sessionId: session.id,
    };
  }

  /**
   * Rotate refresh token (invalidate old, generate new)
   */
  async rotateRefreshToken(
    oldToken: string,
    data: RefreshTokenData
  ): Promise<string> {
    const tokenHash = this.hashToken(oldToken);

    // Find and invalidate old token
    const oldSession = await prisma.userSession.findFirst({
      where: { tokenHash },
    });

    if (!oldSession) {
      throw new Error('Invalid refresh token');
    }

    // Delete old session
    await prisma.userSession.delete({
      where: { id: oldSession.id },
    });

    // Generate new refresh token
    const newToken = await this.generateRefreshToken({
      userId: data.userId,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
    });

    return newToken;
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await prisma.userSession.deleteMany({
      where: { tokenHash },
    });
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const deleted = await prisma.userSession.deleteMany({
      where: { userId },
    });

    return deleted.count;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<any[]> {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActivityAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    return sessions;
  }

  /**
   * Add token to Redis blacklist (for immediate logout)
   */
  async blacklistToken(tokenId: string): Promise<void> {
    const key = `blacklisted_token:${tokenId}`;
    const expiry = this.parseExpiry(this.accessTokenExpiry);

    await redis.set(key, 'true', expiry);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const key = `blacklisted_token:${tokenId}`;
    const result = await redis.get(key);

    return result === 'true';
  }

  /**
   * Clean expired refresh tokens
   */
  async cleanExpiredTokens(): Promise<number> {
    const deleted = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return deleted.count;
  }

  /**
   * Hash token for database storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    // Trim whitespace and newlines that might be in env vars
    const cleaned = expiry.trim();
    const unit = cleaned.slice(-1);
    const value = parseInt(cleaned.slice(0, -1));

    if (isNaN(value)) {
      throw new Error(`Invalid expiry value in: ${expiry}`);
    }

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        throw new Error(`Invalid expiry format: ${expiry} (unit must be s, m, h, or d)`);
    }
  }
}

// Lazy singleton - avoids throwing during Next.js build/page-data collection
let _tokenService: TokenService | null = null;

function getTokenService(): TokenService {
  if (!_tokenService) {
    _tokenService = new TokenService();
  }
  return _tokenService;
}

// Export lazy accessor as a proxy object so callers don't need to change
export const tokenService = new Proxy({} as TokenService, {
  get(_target, prop: string) {
    return (getTokenService() as any)[prop];
  },
});
export default tokenService;
