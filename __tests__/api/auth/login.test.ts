/**
 * Tests for app/api/auth/login/route.ts
 * POST /api/auth/login
 */

import { NextRequest } from 'next/server';

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
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock('@/lib/services/tokenService', () => ({
  tokenService: {
    generateAccessToken: jest.fn(() => 'mock-access-token'),
    generateRefreshToken: jest.fn(async () => 'mock-refresh-token'),
    verifyAccessToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
  },
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { tokenService } from '@/lib/services/tokenService';

const mockedPrisma = prisma as any;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;

function makeLoginRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 on invalid email', async () => {
    const request = makeLoginRequest({ email: 'not-an-email', password: 'password123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 on missing password', async () => {
    const request = makeLoginRequest({ email: 'test@test.com' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 on short password', async () => {
    const request = makeLoginRequest({ email: 'test@test.com', password: 'short' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 401 when user not found', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = makeLoginRequest({
      email: 'notfound@test.com',
      password: 'password123',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 when user is soft-deleted', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'deleted@test.com',
      passwordHash: 'hash',
      role: 'client',
      isActive: true,
      isVerified: true,
      deletedAt: new Date(),
    });

    const request = makeLoginRequest({
      email: 'deleted@test.com',
      password: 'password123',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 403 when account is deactivated', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'inactive@test.com',
      passwordHash: 'hash',
      role: 'client',
      isActive: false,
      isVerified: true,
      deletedAt: null,
    });

    const request = makeLoginRequest({
      email: 'inactive@test.com',
      password: 'password123',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('returns 401 when user has no passwordHash', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'nohash@test.com',
      passwordHash: null,
      role: 'client',
      isActive: true,
      isVerified: true,
      deletedAt: null,
    });

    const request = makeLoginRequest({
      email: 'nohash@test.com',
      password: 'password123',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 when password is incorrect', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'client',
      isActive: true,
      isVerified: true,
      deletedAt: null,
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

    const request = makeLoginRequest({
      email: 'user@test.com',
      password: 'wrongpassword',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 200 with tokens on successful login', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'trainer',
      isActive: true,
      isVerified: true,
      deletedAt: null,
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockedTokenService.generateAccessToken.mockReturnValue('access-jwt');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

    const request = makeLoginRequest({
      email: 'user@test.com',
      password: 'password123',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBe('access-jwt');
    expect(body.data.tokens.refreshToken).toBe('refresh-token');
    expect(body.data.user.id).toBe('user-1');
    expect(body.data.user.email).toBe('user@test.com');
    expect(body.data.user.role).toBe('trainer');
  });

  it('lowercases email before lookup', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = makeLoginRequest({
      email: 'Test@EXAMPLE.com',
      password: 'password123',
    });
    await POST(request);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@example.com' },
      })
    );
  });

  it('sets Cache-Control header based on rememberMe', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: '$2a$10$hash',
      role: 'client',
      isActive: true,
      isVerified: true,
      deletedAt: null,
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockedTokenService.generateAccessToken.mockReturnValue('token');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh');

    // rememberMe = true
    const request1 = makeLoginRequest({
      email: 'user@test.com',
      password: 'password123',
      rememberMe: true,
    });
    const response1 = await POST(request1);
    expect(response1.headers.get('Cache-Control')).toBe('private, max-age=604800');

    // rememberMe = false
    const request2 = makeLoginRequest({
      email: 'user@test.com',
      password: 'password123',
      rememberMe: false,
    });
    const response2 = await POST(request2);
    expect(response2.headers.get('Cache-Control')).toBe('private, max-age=3600');
  });

  it('handles server errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB down'));

    const request = makeLoginRequest({
      email: 'user@test.com',
      password: 'password123',
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
