/**
 * Suite 45: Account Security
 *
 * Validates account lockout and email-verification enforcement:
 * 1. 5 wrong-password attempts lock the account and show a "locked" message.
 * 2. The lock message includes the time remaining.
 * 3. Pre-verified QA accounts can still log in normally.
 *
 * Uses a throwaway account (throwaway-lockout-*@evofit.io) so QA accounts
 * are never locked out.
 */

import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaUI } from '../helpers/auth';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Generate a unique throwaway email for this test run */
function throwawayEmail(): string {
  return `throwaway-lockout-${Date.now()}@evofit.io`;
}

/**
 * Register a throwaway account and force-verify it so we can test lockout
 * independently of the email verification gate.
 */
async function registerAndVerify(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string
): Promise<void> {
  await request.post(`${BASE}/api/auth/register`, {
    data: { email, password, role: 'client' },
    headers: { 'Content-Type': 'application/json' },
  });

  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    await request.post(`${BASE}/api/internal/force-verify`, {
      data: { email },
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
    });
  }
}

/**
 * Attempt login via API; returns the HTTP status code.
 */
async function attemptLogin(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string
): Promise<{ status: number; body: any }> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body };
}

test.describe('45 - Account Security', () => {
  /**
   * After 5 failed login attempts the API returns 429.
   */
  test('locks account after 5 consecutive wrong-password attempts', async ({ request }) => {
    const email = throwawayEmail();
    const correctPassword = 'CorrectPass1!';
    const wrongPassword = 'WrongPass1!';

    await registerAndVerify(request, email, correctPassword);

    // Make 4 failed attempts — should still return 401
    for (let i = 0; i < 4; i++) {
      const { status } = await attemptLogin(request, email, wrongPassword);
      expect(status).toBe(401);
    }

    // 5th attempt triggers lockout
    const { status: fifthStatus } = await attemptLogin(request, email, wrongPassword);
    expect(fifthStatus).toBe(429);
  });

  /**
   * The 429 response error message mentions "locked".
   */
  test('lockout error message indicates account is locked', async ({ request }) => {
    const email = throwawayEmail();
    const correctPassword = 'CorrectPass1!';
    const wrongPassword = 'WrongPass1!';

    await registerAndVerify(request, email, correctPassword);

    // Exhaust all 5 attempts
    for (let i = 0; i < 5; i++) {
      await attemptLogin(request, email, wrongPassword);
    }

    // Next attempt should show locked message
    const { body } = await attemptLogin(request, email, wrongPassword);

    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
    expect(body.error.toLowerCase()).toMatch(/lock/);
  });

  /**
   * The lockout error message includes the number of minutes remaining.
   */
  test('lockout error message includes estimated wait time in minutes', async ({ request }) => {
    const email = throwawayEmail();
    const correctPassword = 'CorrectPass1!';
    const wrongPassword = 'WrongPass1!';

    await registerAndVerify(request, email, correctPassword);

    for (let i = 0; i < 5; i++) {
      await attemptLogin(request, email, wrongPassword);
    }

    const { body } = await attemptLogin(request, email, wrongPassword);

    // Message should mention "minute" (singular or plural)
    expect(body.error).toMatch(/minute/i);
    // Should contain a number
    expect(body.error).toMatch(/\d+/);
  });

  /**
   * QA trainer account is pre-verified and can log in without issues.
   */
  test('verified QA trainer account can still log in normally', async ({ page }) => {
    await loginViaUI(page, 'trainer');

    // Should navigate away from the login page on success
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  /**
   * Correct credentials on an unlocked account succeed immediately.
   */
  test('correct password on unlocked account returns 200', async ({ request }) => {
    const email = throwawayEmail();
    const password = 'CorrectPass1!';

    await registerAndVerify(request, email, password);

    const { status } = await attemptLogin(request, email, password);
    expect(status).toBe(200);
  });

  /**
   * After lockout, correct password still returns 429 (lock not lifted by correct pw).
   */
  test('correct password during lockout period still returns 429', async ({ request }) => {
    const email = throwawayEmail();
    const correctPassword = 'CorrectPass1!';
    const wrongPassword = 'WrongPass1!';

    await registerAndVerify(request, email, correctPassword);

    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      await attemptLogin(request, email, wrongPassword);
    }

    // Correct password during lockout should still be rejected
    const { status } = await attemptLogin(request, email, correctPassword);
    expect(status).toBe(429);
  });
});
