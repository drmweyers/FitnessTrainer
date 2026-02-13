/**
 * Tests for app/api/auth/register/route.ts
 * POST /api/auth/register
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
  hash: jest.fn(() => Promise.resolve('hashed-password')),
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
jest.mock('@/lib/services/activity.service', () => ({
  logClientSignup: jest.fn(),
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { tokenService } from '@/lib/services/tokenService';
import { logClientSignup } from '@/lib/services/activity.service';

const mockedPrisma = prisma as any;
const mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;

function makeRegisterRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validRegisterData = {
  email: 'new@test.com',
  password: 'Password1',
  role: 'client',
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 on invalid email', async () => {
    const request = makeRegisterRequest({ ...validRegisterData, email: 'bad-email' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 on short password', async () => {
    const request = makeRegisterRequest({ ...validRegisterData, password: 'Sh1' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 on password without uppercase', async () => {
    const request = makeRegisterRequest({ ...validRegisterData, password: 'password1' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 on password without lowercase', async () => {
    const request = makeRegisterRequest({ ...validRegisterData, password: 'PASSWORD1' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 on password without number', async () => {
    const request = makeRegisterRequest({ ...validRegisterData, password: 'Passworddd' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const request = makeRegisterRequest(validRegisterData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe('EMAIL_EXISTS');
  });

  it('returns 201 with tokens on successful registration', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'new-user-1',
      email: 'new@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    mockedTokenService.generateAccessToken.mockReturnValue('access-jwt');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

    const request = makeRegisterRequest(validRegisterData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.tokens.accessToken).toBe('access-jwt');
    expect(body.data.tokens.refreshToken).toBe('refresh-token');
    expect(body.data.user.id).toBe('new-user-1');
    expect(body.data.user.email).toBe('new@test.com');
    expect(body.data.user.role).toBe('client');
  });

  it('lowercases email before storing', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'test@example.com',
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    mockedTokenService.generateAccessToken.mockReturnValue('token');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh');

    const request = makeRegisterRequest({
      ...validRegisterData,
      email: 'TEST@EXAMPLE.COM',
    });
    await POST(request);

    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
        }),
      })
    );
  });

  it('hashes password before storing', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'new@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    mockedTokenService.generateAccessToken.mockReturnValue('token');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh');

    const request = makeRegisterRequest(validRegisterData);
    await POST(request);

    expect(bcrypt.hash).toHaveBeenCalledWith('Password1', 10);
    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'hashed-password',
        }),
      })
    );
  });

  it('defaults role to client when not provided', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'new@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    mockedTokenService.generateAccessToken.mockReturnValue('token');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh');

    const request = makeRegisterRequest({
      email: 'new@test.com',
      password: 'Password1',
    });
    await POST(request);

    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'client',
        }),
      })
    );
  });

  it('calls logClientSignup after registration', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'new@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    mockedTokenService.generateAccessToken.mockReturnValue('token');
    mockedTokenService.generateRefreshToken.mockResolvedValue('refresh');

    const request = makeRegisterRequest(validRegisterData);
    await POST(request);

    expect(logClientSignup).toHaveBeenCalledWith('new-user', 'new@test.com');
  });

  it('handles server errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB down'));

    const request = makeRegisterRequest(validRegisterData);
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
