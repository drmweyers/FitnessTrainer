/**
 * Login API Route Tests
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');
jest.mock('bcryptjs');

const mockPrisma = require('@/lib/db/prisma').prisma;

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: 'TRAINER',
    isActive: true,
    isVerified: true,
    deletedAt: null,
  };

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  it('should login successfully with valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(validUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('accessToken');
  });

  it('should return error for invalid email format', async () => {
    const request = createMockRequest({
      email: 'invalid-email',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for short password', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'short',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = createMockRequest({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email or password');
  });

  it('should return error for deleted user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...validUser,
      deletedAt: new Date(),
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return error for inactive user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...validUser,
      isActive: false,
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Account is deactivated');
  });

  it('should return error for user without password hash', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...validUser,
      passwordHash: null,
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should return error for incorrect password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(validUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email or password');
  });

  it('should handle rememberMe option', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(validUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should convert email to lowercase', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(validUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const request = createMockRequest({
      email: 'Test@Example.COM',
      password: 'password123',
    });

    await POST(request);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: expect.any(Object),
    });
  });

  it('should handle database errors', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
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
    } as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.success).toBe(false);
  });

  it('should select correct user fields', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(validUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
    });

    await POST(request);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        isVerified: true,
        deletedAt: true,
      },
    });
  });
});
