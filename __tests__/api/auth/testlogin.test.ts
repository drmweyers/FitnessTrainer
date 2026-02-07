/**
 * Tests for app/api/auth/testlogin/route.ts
 * POST /api/auth/testlogin - Test login endpoint (no JWT, direct DB check)
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db/prisma');
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { POST } from '@/app/api/auth/testlogin/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/testlogin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/testlogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when user is not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = makeRequest({ email: 'nobody@test.com', password: 'Test12345!' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('User not found');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'nobody@test.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });
  });

  it('returns 401 when user has no password hash', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: null,
      role: 'client',
      isActive: true,
    });

    const req = makeRequest({ email: 'user@test.com', password: 'Test12345!' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('No password hash found');
  });

  it('returns 401 when password is invalid', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'client',
      isActive: true,
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = makeRequest({ email: 'user@test.com', password: 'WrongPassword!' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid password');
    expect(mockedBcrypt.compare).toHaveBeenCalledWith('WrongPassword!', '$2a$10$hashedpassword');
  });

  it('returns 200 with user data on successful login', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'client',
      isActive: true,
    };
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = makeRequest({ email: 'User@Test.com', password: 'Test12345!' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Login successful');
    expect(body.data.user).toEqual({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
    });
    // Verifies email is lowercased for lookup
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'user@test.com' },
      })
    );
  });

  it('returns 500 on unexpected errors', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

    const req = makeRequest({ email: 'user@test.com', password: 'Test12345!' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('DB connection failed');
    expect(body.error.name).toBe('Error');
  });
});
