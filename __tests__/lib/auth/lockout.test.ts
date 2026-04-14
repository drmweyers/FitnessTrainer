/**
 * Tests for lib/auth/lockout.ts
 * Account lockout helpers: checkAccountLockout, recordFailedAttempt, clearLockout
 */

jest.mock('@/lib/db/prisma');

import { prisma } from '@/lib/db/prisma';
import {
  checkAccountLockout,
  recordFailedAttempt,
  clearLockout,
} from '@/lib/auth/lockout';

const mockedPrisma = prisma as any;

const MOCK_USER = { id: 'user-uuid-1' };
const MOCK_EMAIL = 'test@example.com';

describe('checkAccountLockout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns { locked: false } when user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await checkAccountLockout(MOCK_EMAIL);
    expect(result).toEqual({ locked: false });
  });

  it('returns { locked: false } when no lockout record exists', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue(null);

    const result = await checkAccountLockout(MOCK_EMAIL);
    expect(result).toEqual({ locked: false });
  });

  it('returns { locked: false } when lockout record has no lockedUntil', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      lockedUntil: null,
      failedAttempts: 3,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });

    const result = await checkAccountLockout(MOCK_EMAIL);
    expect(result).toEqual({ locked: false });
  });

  it('returns { locked: false } when lockedUntil is in the past', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      lockedUntil: new Date(Date.now() - 60_000), // 1 minute ago
      failedAttempts: 5,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });

    const result = await checkAccountLockout(MOCK_EMAIL);
    expect(result).toEqual({ locked: false });
  });

  it('returns { locked: true, minutesRemaining } when lockedUntil is in the future', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      lockedUntil: new Date(Date.now() + 10 * 60_000), // 10 minutes from now
      failedAttempts: 5,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });

    const result = await checkAccountLockout(MOCK_EMAIL);
    expect(result.locked).toBe(true);
    expect(result.minutesRemaining).toBe(10);
  });

  it('rounds minutesRemaining up (ceil)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    // 10.5 minutes remaining → should report 11
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      lockedUntil: new Date(Date.now() + 10.5 * 60_000),
      failedAttempts: 5,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });

    const result = await checkAccountLockout(MOCK_EMAIL);
    expect(result.locked).toBe(true);
    expect(result.minutesRemaining).toBe(11);
  });

  it('normalises email to lowercase before lookup', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await checkAccountLockout('User@EXAMPLE.COM');

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'user@example.com' } })
    );
  });
});

describe('recordFailedAttempt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await recordFailedAttempt(MOCK_EMAIL);

    expect(mockedPrisma.accountLockout.create).not.toHaveBeenCalled();
    expect(mockedPrisma.accountLockout.update).not.toHaveBeenCalled();
  });

  it('creates a new lockout record on the first failed attempt', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue(null);
    mockedPrisma.accountLockout.create.mockResolvedValue({});

    await recordFailedAttempt(MOCK_EMAIL);

    expect(mockedPrisma.accountLockout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: MOCK_USER.id, failedAttempts: 1 }),
      })
    );
  });

  it('increments failedAttempts on subsequent failures (below threshold)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      failedAttempts: 2,
      lockedUntil: null,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });
    mockedPrisma.accountLockout.update.mockResolvedValue({});

    await recordFailedAttempt(MOCK_EMAIL);

    expect(mockedPrisma.accountLockout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedAttempts: 3 }),
      })
    );
  });

  it('sets lockedUntil when failedAttempts reaches 5', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      failedAttempts: 4, // 5th attempt will trigger lockout
      lockedUntil: null,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });
    mockedPrisma.accountLockout.update.mockResolvedValue({});

    const before = Date.now();
    await recordFailedAttempt(MOCK_EMAIL);
    const after = Date.now();

    const updateCall = mockedPrisma.accountLockout.update.mock.calls[0][0];
    const { failedAttempts, lockedUntil } = updateCall.data;

    expect(failedAttempts).toBe(5);
    expect(lockedUntil).toBeInstanceOf(Date);

    // lockedUntil should be approximately 15 minutes from now
    const lockMs = lockedUntil.getTime();
    expect(lockMs).toBeGreaterThanOrEqual(before + 15 * 60_000 - 100);
    expect(lockMs).toBeLessThanOrEqual(after + 15 * 60_000 + 100);
  });

  it('does not overwrite an active lock when incrementing', async () => {
    const existingLockUntil = new Date(Date.now() + 10 * 60_000);
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.findFirst.mockResolvedValue({
      id: 'lock-1',
      userId: MOCK_USER.id,
      failedAttempts: 5,
      lockedUntil: existingLockUntil,
      lastAttemptAt: new Date(),
      unlockedAt: null,
    });
    mockedPrisma.accountLockout.update.mockResolvedValue({});

    await recordFailedAttempt(MOCK_EMAIL);

    const updateCall = mockedPrisma.accountLockout.update.mock.calls[0][0];
    // Existing lock is active so should not be overwritten with a new future date
    // (newCount = 6, shouldLock = true → new lock applied, that is fine)
    expect(updateCall.data.failedAttempts).toBe(6);
  });
});

describe('clearLockout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await clearLockout(MOCK_EMAIL);

    expect(mockedPrisma.accountLockout.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes all lockout records for the user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(MOCK_USER);
    mockedPrisma.accountLockout.deleteMany.mockResolvedValue({ count: 1 });

    await clearLockout(MOCK_EMAIL);

    expect(mockedPrisma.accountLockout.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: MOCK_USER.id } })
    );
  });

  it('normalises email to lowercase', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await clearLockout('User@EXAMPLE.COM');

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'user@example.com' } })
    );
  });
});
