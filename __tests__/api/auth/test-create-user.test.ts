/**
 * Tests for app/api/auth/test/route.ts
 * POST /api/auth/test - Creates a hardcoded test user (development utility)
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db/prisma');
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { POST } from '@/app/api/auth/test/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  it('creates a test user and returns 200', async () => {
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      email: 'testuser@test.com',
      role: 'client',
    });

    const req = makeRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('testuser@test.com');
    expect(body.data.user.role).toBe('client');

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('Test12345!', 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'testuser@test.com',
        passwordHash: 'hashed-password',
        role: 'client',
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  });

  it('returns 500 when user already exists (unique constraint)', async () => {
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    const error = new Error('Unique constraint failed on the fields: (`email`)');
    error.name = 'PrismaClientKnownRequestError';
    (mockPrisma.user.create as jest.Mock).mockRejectedValue(error);

    const req = makeRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toContain('Unique constraint');
  });

  it('returns 500 on hashing error', async () => {
    (mockedBcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

    const req = makeRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Hashing failed');
  });
});
