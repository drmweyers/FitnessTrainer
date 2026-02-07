/**
 * Tests for lib/middleware/auth.ts
 * authenticate(), optionalAuth(), requireVerified()
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, optionalAuth, requireVerified, AuthenticatedRequest } from '@/lib/middleware/auth';
import { tokenService } from '@/lib/services/tokenService';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/services/tokenService', () => ({
  tokenService: {
    verifyAccessToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
  },
}));

const mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;
const mockedPrisma = prisma as any;

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

describe('authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no Authorization header', async () => {
    const request = makeRequest();
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('MISSING_TOKEN');
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const request = makeRequest({ Authorization: 'Basic abc123' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('MISSING_TOKEN');
  });

  it('returns 401 when token is expired', async () => {
    mockedTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Access token expired');
    });

    const request = makeRequest({ Authorization: 'Bearer expired-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 401 when token is invalid', async () => {
    mockedTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid access token');
    });

    const request = makeRequest({ Authorization: 'Bearer bad-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 500 on unexpected error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Something unexpected');
    });

    const request = makeRequest({ Authorization: 'Bearer some-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('AUTH_FAILED');
    consoleSpy.mockRestore();
  });

  it('returns 401 when token is blacklisted', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(true);

    const request = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('TOKEN_REVOKED');
  });

  it('returns 401 when user not found', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns 401 when user is soft-deleted', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
      deletedAt: new Date(),
    });

    const request = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns 401 when user is not active', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: false,
      isVerified: true,
      deletedAt: null,
    });

    const request = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await authenticate(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('returns authenticated request on success', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'trainer',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'trainer',
      isActive: true,
      isVerified: true,
      deletedAt: null,
    });

    const request = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await authenticate(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    const authReq = result as AuthenticatedRequest;
    expect(authReq.user).toEqual({
      id: 'user-1',
      email: 'user@test.com',
      role: 'trainer',
      isActive: true,
      isVerified: true,
    });
    expect(authReq.tokenId).toBe('token-id-1');
  });
});

describe('optionalAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns request without user when no auth header', async () => {
    const request = makeRequest();
    const result = await optionalAuth(request);

    expect(result).toBeDefined();
    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });

  it('returns request without user when auth header is not Bearer', async () => {
    const request = makeRequest({ Authorization: 'Basic abc' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });

  it('returns request without user when token is blacklisted', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(true);

    const request = makeRequest({ Authorization: 'Bearer some-token' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });

  it('returns request without user when user not found', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = makeRequest({ Authorization: 'Bearer some-token' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });

  it('returns request without user when user is deleted', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
      deletedAt: new Date(),
    });

    const request = makeRequest({ Authorization: 'Bearer some-token' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });

  it('returns request without user when user is inactive', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'client',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: false,
      isVerified: true,
      deletedAt: null,
    });

    const request = makeRequest({ Authorization: 'Bearer some-token' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });

  it('attaches user on valid token', async () => {
    mockedTokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      jti: 'token-id-1',
      email: 'user@test.com',
      role: 'admin',
      iat: 0,
      exp: 9999999999,
    });
    mockedTokenService.isTokenBlacklisted.mockResolvedValue(false);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      isActive: true,
      isVerified: true,
      deletedAt: null,
    });

    const request = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toEqual({
      id: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      isActive: true,
      isVerified: true,
    });
    expect((result as AuthenticatedRequest).tokenId).toBe('token-id-1');
  });

  it('silently fails on token verification error', async () => {
    mockedTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const request = makeRequest({ Authorization: 'Bearer bad-token' });
    const result = await optionalAuth(request);

    expect((result as AuthenticatedRequest).user).toBeUndefined();
  });
});

describe('requireVerified', () => {
  it('returns 401 when no user on request', () => {
    const request = {} as AuthenticatedRequest;
    const result = requireVerified(request);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it('returns 403 when user is not verified', async () => {
    const request = {
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'client' as const,
        isActive: true,
        isVerified: false,
      },
    } as AuthenticatedRequest;

    const result = requireVerified(request);

    expect(result).toBeInstanceOf(NextResponse);
    const body = await result!.json();
    expect(body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('returns null when user is verified', () => {
    const request = {
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'client' as const,
        isActive: true,
        isVerified: true,
      },
    } as AuthenticatedRequest;

    const result = requireVerified(request);
    expect(result).toBeNull();
  });
});
