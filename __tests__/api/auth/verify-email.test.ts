/**
 * Tests for app/api/auth/verify-email/route.ts
 * GET /api/auth/verify-email?token=<token>
 */

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/auth/email-verification', () => ({
  createVerificationToken: jest.fn(),
  consumeVerificationToken: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/verify-email/route';
import { prisma } from '@/lib/db/prisma';
import { consumeVerificationToken } from '@/lib/auth/email-verification';

const mockedPrisma = prisma as any;
const mockedConsumeToken = consumeVerificationToken as jest.MockedFunction<typeof consumeVerificationToken>;

function makeRequest(token?: string): NextRequest {
  const url = token
    ? `http://localhost:3000/api/auth/verify-email?token=${token}`
    : 'http://localhost:3000/api/auth/verify-email';
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /auth/login?error=missing-token when token is absent', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('error=missing-token');
  });

  it('redirects to /auth/login?error=invalid-token when token is not in Redis', async () => {
    mockedConsumeToken.mockResolvedValue(null);

    const response = await GET(makeRequest('bad-token'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('error=invalid-token');
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it('marks the user as verified and redirects to /auth/login?verified=true', async () => {
    mockedConsumeToken.mockResolvedValue('user-uuid-1');
    mockedPrisma.user.update.mockResolvedValue({ id: 'user-uuid-1', isVerified: true });

    const response = await GET(makeRequest('valid-token-abc'));

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-uuid-1' },
        data: { isVerified: true },
      })
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('verified=true');
  });

  it('redirects to /auth/login?error=server-error when an exception is thrown', async () => {
    mockedConsumeToken.mockRejectedValue(new Error('Redis connection lost'));

    const response = await GET(makeRequest('any-token'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('error=server-error');
  });
});
