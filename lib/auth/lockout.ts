/**
 * Account Lockout Helpers
 *
 * Enforces brute-force protection by tracking failed login attempts
 * in the AccountLockout table. After 5 consecutive failures the account
 * is locked for 15 minutes.
 */

import { prisma } from '@/lib/db/prisma';

/** Number of failed attempts before an account is locked */
const MAX_FAILED_ATTEMPTS = 5;

/** Lockout duration in milliseconds (15 minutes) */
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export interface LockoutStatus {
  locked: boolean;
  minutesRemaining?: number;
}

/**
 * Check whether an account is currently locked out.
 *
 * @param email - The email address being authenticated.
 * @returns `{ locked: false }` when the account is usable, or
 *          `{ locked: true, minutesRemaining }` when a lockout is active.
 */
export async function checkAccountLockout(email: string): Promise<LockoutStatus> {
  // Look up the user first so we can query by userId
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  // Unknown user — let the login route handle the 401 normally
  if (!user) {
    return { locked: false };
  }

  const lockout = await prisma.accountLockout.findFirst({
    where: { userId: user.id },
  });

  if (!lockout || !lockout.lockedUntil) {
    return { locked: false };
  }

  const now = new Date();
  if (lockout.lockedUntil <= now) {
    // Lock has expired; leave the DB record for the next attempt to clean up
    return { locked: false };
  }

  const msRemaining = lockout.lockedUntil.getTime() - now.getTime();
  const minutesRemaining = Math.ceil(msRemaining / 60_000);

  return { locked: true, minutesRemaining };
}

/**
 * Record a failed login attempt for the given email.
 * Increments the counter and applies a 15-minute lockout when the
 * threshold is reached.
 *
 * @param email - The email address that failed authentication.
 */
export async function recordFailedAttempt(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  // No user means nothing to track — avoid creating orphan records
  if (!user) return;

  const existing = await prisma.accountLockout.findFirst({
    where: { userId: user.id },
  });

  const now = new Date();

  if (!existing) {
    // First failed attempt — create the record
    await prisma.accountLockout.create({
      data: {
        userId: user.id,
        failedAttempts: 1,
        lastAttemptAt: now,
      },
    });
    return;
  }

  const newCount = existing.failedAttempts + 1;
  const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;

  await prisma.accountLockout.update({
    where: { id: existing.id },
    data: {
      failedAttempts: newCount,
      lastAttemptAt: now,
      lockedUntil: shouldLock
        ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
        : existing.lockedUntil,
      // Clear a previous (expired) lock when re-accumulating attempts
      unlockedAt: existing.lockedUntil && existing.lockedUntil <= now ? now : existing.unlockedAt,
    },
  });
}

/**
 * Clear the lockout record for an account after a successful login.
 *
 * @param email - The email address that authenticated successfully.
 */
export async function clearLockout(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) return;

  await prisma.accountLockout.deleteMany({
    where: { userId: user.id },
  });
}
