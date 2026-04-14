/**
 * Tests for lockout + email-verification enforcement in POST /api/auth/login
 */

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
jest.mock('@/lib/auth/lockout', () => ({
  checkAccountLockout: jest.fn(),
  recordFailedAttempt: jest.fn(),
  clearLockout: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import {
  checkAccountLockout,
  recordFailedAttempt,
  clearLockout,
} from '@/lib/auth/lockout';

const mockedPrisma = prisma as any;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedCheckLockout = checkAccountLockout as jest.MockedFunction<typeof checkAccountLockout>;
const mockedRecordFailed = recordFailedAttempt as jest.MockedFunction<typeof recordFailedAttempt>;
const mockedClearLockout = clearLockout as jest.MockedFunction<typeof clearLockout>;

const VALID_USER = {
  id: 'user-1',
  email: 'user@test.com',
  passwordHash: '$2a$10$hashedpassword',
  role: 'trainer',
  isActive: true,
  isVerified: true,
  deletedAt: null,
};

function makeLoginRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login — lockout enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: not locked
    mockedCheckLockout.mockResolvedValue({ locked: false });
    mockedRecordFailed.mockResolvedValue(undefined);
    mockedClearLockout.mockResolvedValue(undefined);
  });

  it('returns 429 with time-remaining message when account is locked', async () => {
    mockedCheckLockout.mockResolvedValue({ locked: true, minutesRemaining: 12 });

    const response = await POST(
      makeLoginRequest({ email: 'user@test.com', password: 'Password1' })
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/12 minutes/);
  });

  it('uses singular "minute" when minutesRemaining is 1', async () => {
    mockedCheckLockout.mockResolvedValue({ locked: true, minutesRemaining: 1 });

    const response = await POST(
      makeLoginRequest({ email: 'user@test.com', password: 'Password1' })
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toMatch(/1 minute[^s]/);
  });

  it('does not query the user table when the account is locked', async () => {
    mockedCheckLockout.mockResolvedValue({ locked: true, minutesRemaining: 5 });

    await POST(makeLoginRequest({ email: 'user@test.com', password: 'Password1' }));

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('calls recordFailedAttempt on a wrong password', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(VALID_USER);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await POST(makeLoginRequest({ email: 'user@test.com', password: 'WrongPass1' }));

    expect(mockedRecordFailed).toHaveBeenCalledWith('user@test.com');
  });

  it('does NOT call recordFailedAttempt on a correct password', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(VALID_USER);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    await POST(makeLoginRequest({ email: 'user@test.com', password: 'CorrectPass1' }));

    expect(mockedRecordFailed).not.toHaveBeenCalled();
  });

  it('calls clearLockout on successful login', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(VALID_USER);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    await POST(makeLoginRequest({ email: 'user@test.com', password: 'CorrectPass1' }));

    expect(mockedClearLockout).toHaveBeenCalledWith('user@test.com');
  });

  it('does NOT call clearLockout on a failed login', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(VALID_USER);
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await POST(makeLoginRequest({ email: 'user@test.com', password: 'WrongPass1' }));

    expect(mockedClearLockout).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/login — email verification gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCheckLockout.mockResolvedValue({ locked: false });
    mockedRecordFailed.mockResolvedValue(undefined);
    mockedClearLockout.mockResolvedValue(undefined);
  });

  it('returns 403 with email-not-verified message when isVerified is false', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...VALID_USER,
      isVerified: false,
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    const response = await POST(
      makeLoginRequest({ email: 'user@test.com', password: 'Password1' })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/verify your email/i);
  });

  it('returns 200 when isVerified is true and password is correct', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(VALID_USER); // isVerified: true
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    const response = await POST(
      makeLoginRequest({ email: 'user@test.com', password: 'Password1' })
    );

    expect(response.status).toBe(200);
  });

  it('does NOT call clearLockout when user is unverified (login fails at verification gate)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...VALID_USER,
      isVerified: false,
    });
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

    await POST(makeLoginRequest({ email: 'user@test.com', password: 'Password1' }));

    expect(mockedClearLockout).not.toHaveBeenCalled();
  });
});
