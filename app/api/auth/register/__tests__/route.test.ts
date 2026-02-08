/**
 * Register API Route Tests
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');
jest.mock('bcryptjs');
jest.mock('@/lib/services/tokenService', () => ({
  tokenService: {
    generateAccessToken: jest.fn(() => 'mock-access-token'),
    generateRefreshToken: jest.fn(() => Promise.resolve('mock-refresh-token')),
  }
}));
jest.mock('@/lib/services/activity.service', () => ({
  logClientSignup: jest.fn(),
}));

const mockPrisma = require('@/lib/db/prisma').prisma;
// Ensure userSession mock exists (tokenService may use it internally)
if (!mockPrisma.userSession) {
  mockPrisma.userSession = { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() };
}

// Valid password meeting schema requirements (uppercase, lowercase, number, 8+ chars)
const VALID_PASSWORD = 'Password1';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Map([
        ['user-agent', 'Mozilla/5.0 Chrome/120'],
        ['x-forwarded-for', '127.0.0.1'],
      ]),
    } as unknown as NextRequest;
  };

  it('should register new user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      role: 'trainer',
      isVerified: true,
    });
    mockPrisma.userSession.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const request = createMockRequest({
      email: 'newuser@example.com',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('accessToken');
  });

  it('should return error for invalid email format', async () => {
    const request = createMockRequest({
      email: 'invalid-email',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for short password', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'Ab1',
      role: 'trainer',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for password without uppercase', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password1',
      role: 'trainer',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for existing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
    });

    const request = createMockRequest({
      email: 'existing@example.com',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toContain('already registered');
  });

  it('should convert email to lowercase', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'trainer',
      isVerified: true,
    });
    mockPrisma.userSession.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const request = createMockRequest({
      email: 'Test@Example.COM',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    await POST(request);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: { id: true },
    });
  });

  it('should hash password before storing', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'trainer',
      isVerified: true,
    });
    mockPrisma.userSession.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    await POST(request);

    expect(bcrypt.hash).toHaveBeenCalledWith(VALID_PASSWORD, 10);
  });

  it('should handle database errors during create', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.success).toBe(false);
  });

  it('should handle invalid JSON body', async () => {
    const request = {
      json: async () => {
        throw new Error('Invalid JSON');
      },
      headers: new Map(),
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.success).toBe(false);
  });

  it('should set default values for new user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'trainer',
      isVerified: true,
    });
    mockPrisma.userSession.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      role: 'trainer',
    });

    await POST(request);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'trainer',
      }),
      select: expect.any(Object),
    });
  });

  it('should accept client role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'client@example.com',
      role: 'client',
      isVerified: true,
    });
    mockPrisma.userSession.create.mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const request = createMockRequest({
      email: 'client@example.com',
      password: VALID_PASSWORD,
      role: 'client',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should handle invalid role', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: VALID_PASSWORD,
      role: 'INVALID_ROLE',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
