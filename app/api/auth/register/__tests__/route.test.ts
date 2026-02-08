/**
 * Register API Route Tests
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');
jest.mock('bcryptjs');

const mockPrisma = require('@/lib/db/prisma').prisma;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  it('should register new user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'newuser@example.com',
      role: 'TRAINER',
    });

    const request = createMockRequest({
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
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
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
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
      confirmPassword: 'short',
      role: 'TRAINER',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for password mismatch', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different123',
      role: 'TRAINER',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return error for existing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'existing@example.com',
    });

    const request = createMockRequest({
      email: 'existing@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.message).toContain('already exists');
  });

  it('should convert email to lowercase', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'TRAINER',
    });

    const request = createMockRequest({
      email: 'Test@Example.COM',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
    });

    await POST(request);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('should hash password before storing', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'TRAINER',
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
    });

    await POST(request);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });

  it('should handle database errors during create', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
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

  it('should set default values for new user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      role: 'TRAINER',
    });

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'TRAINER',
    });

    await POST(request);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'TRAINER',
      }),
    });
  });

  it('should accept CLIENT role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-123',
      email: 'client@example.com',
      role: 'CLIENT',
    });

    const request = createMockRequest({
      email: 'client@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'CLIENT',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should handle invalid role', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'INVALID_ROLE',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
