/**
 * Tests for app/api/auth/forgot-password/route.ts
 * POST /api/auth/forgot-password
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db/prisma');

import { POST } from '@/app/api/auth/forgot-password/route';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;

function makeRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success even when user exists (prevents email enumeration)', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
    });

    const request = makeRequest({ email: 'user@test.com' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('If an account');
    consoleSpy.mockRestore();
  });

  it('returns success even when user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = makeRequest({ email: 'nonexistent@test.com' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 400 on invalid email', async () => {
    const request = makeRequest({ email: 'not-an-email' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 on missing email', async () => {
    const request = makeRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('lowercases email before lookup', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = makeRequest({ email: 'TEST@EXAMPLE.COM' });
    await POST(request);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@example.com' },
      })
    );
  });

  it('returns 500 on server error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB down'));

    const request = makeRequest({ email: 'user@test.com' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    consoleSpy.mockRestore();
  });
});
