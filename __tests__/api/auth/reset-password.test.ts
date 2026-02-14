/**
 * Tests for app/api/auth/reset-password/route.ts
 * POST /api/auth/reset-password
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/reset-password/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db/prisma');
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const mockedPrisma = prisma as any;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when token is missing', async () => {
    const request = makeRequest({ password: 'NewPassword123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when password is missing', async () => {
    const request = makeRequest({ token: 'test-token' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when password is too short', async () => {
    const request = makeRequest({ token: 'test-token', password: 'Short1' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('at least 8 characters');
  });

  it('returns 400 when password missing uppercase', async () => {
    const request = makeRequest({ token: 'test-token', password: 'lowercase123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('uppercase letter');
  });

  it('returns 400 when password missing lowercase', async () => {
    const request = makeRequest({ token: 'test-token', password: 'UPPERCASE123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('lowercase letter');
  });

  it('returns 400 when password missing number', async () => {
    const request = makeRequest({ token: 'test-token', password: 'NoNumbersHere' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('number');
  });

  it('returns 400 when token not found', async () => {
    mockedPrisma.passwordReset.findUnique.mockResolvedValue(null);

    const request = makeRequest({ token: 'invalid-token', password: 'ValidPass123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or expired reset link');
  });

  it('returns 400 when token already used', async () => {
    mockedPrisma.passwordReset.findUnique.mockResolvedValue({
      id: 'reset-1',
      token: 'test-token',
      userId: 'user-1',
      usedAt: new Date('2024-01-01'),
      expiresAt: new Date('2024-12-31'),
      user: { id: 'user-1', email: 'test@example.com' },
    });

    const request = makeRequest({ token: 'test-token', password: 'ValidPass123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('This reset link has already been used');
  });

  it('returns 400 when token expired', async () => {
    mockedPrisma.passwordReset.findUnique.mockResolvedValue({
      id: 'reset-1',
      token: 'test-token',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date('2020-01-01'), // Expired
      user: { id: 'user-1', email: 'test@example.com' },
    });

    const request = makeRequest({ token: 'test-token', password: 'ValidPass123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('expired');
  });

  it('successfully resets password with valid token', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    mockedPrisma.passwordReset.findUnique.mockResolvedValue({
      id: 'reset-1',
      token: 'valid-token',
      userId: 'user-1',
      usedAt: null,
      expiresAt: futureDate,
      user: { id: 'user-1', email: 'test@example.com' },
    });

    mockedBcrypt.hash.mockResolvedValue('hashed-password' as any);
    mockedPrisma.$transaction.mockResolvedValue([{}, {}]);

    const request = makeRequest({ token: 'valid-token', password: 'ValidPass123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('reset successfully');
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('ValidPass123', 12);
    expect(mockedPrisma.$transaction).toHaveBeenCalled();
  });

  it('updates user password in transaction', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    mockedPrisma.passwordReset.findUnique.mockResolvedValue({
      id: 'reset-1',
      token: 'valid-token',
      userId: 'user-123',
      usedAt: null,
      expiresAt: futureDate,
      user: { id: 'user-123', email: 'test@example.com' },
    });

    mockedBcrypt.hash.mockResolvedValue('new-hash' as any);
    mockedPrisma.$transaction.mockResolvedValue([{}, {}]);

    const request = makeRequest({ token: 'valid-token', password: 'NewPass456' });
    await POST(request);

    const transactionCalls = mockedPrisma.$transaction.mock.calls[0][0];
    expect(transactionCalls).toHaveLength(2);
  });

  it('marks reset token as used', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    mockedPrisma.passwordReset.findUnique.mockResolvedValue({
      id: 'reset-1',
      token: 'valid-token',
      userId: 'user-1',
      usedAt: null,
      expiresAt: futureDate,
      user: { id: 'user-1', email: 'test@example.com' },
    });

    mockedBcrypt.hash.mockResolvedValue('hashed' as any);
    mockedPrisma.$transaction.mockResolvedValue([{}, {}]);

    const request = makeRequest({ token: 'valid-token', password: 'NewPass789' });
    await POST(request);

    expect(mockedPrisma.$transaction).toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    mockedPrisma.passwordReset.findUnique.mockRejectedValue(new Error('DB connection lost'));

    const request = makeRequest({ token: 'test-token', password: 'ValidPass123' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    (console.error as jest.Mock).mockRestore();
  });
});
