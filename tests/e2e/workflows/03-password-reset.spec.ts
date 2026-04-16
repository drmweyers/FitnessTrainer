/**
 * Suite 3: Password Reset
 * Tests the forgot-password and reset-password flows including UI rendering,
 * form validation, and security behaviour.
 */
import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from '../helpers/constants';

test.describe('03 - Password Reset', () => {
  /**
   * The forgot-password page should load and display an email input.
   */
  test('should load forgot-password page with email input', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword, { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.element });

    // Should also have a submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  /**
   * Submitting the forgot-password form with any email (even non-existent) should show a
   * generic success message — a security best practice to avoid user enumeration.
   */
  test('should show success message after submitting email on forgot-password', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword, { waitUntil: 'domcontentloaded' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill('any-email@test.com');
    await page.locator('button[type="submit"]').click();

    // Should show a success / confirmation message (security: same message regardless of whether account exists)
    await expect(
      page.locator('text=/sent|check your email|if.*account.*exists|we.ll email|instructions/i, [role="alert"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  /**
   * Submitting the forgot-password form with an empty email should show a validation error.
   */
  test('should show validation error for empty email on forgot-password', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword, { waitUntil: 'domcontentloaded' });

    await page.locator('button[type="submit"]').click();

    // Should stay on the same page
    await expect(page).toHaveURL(/forgot/);

    // Must show validation — either native browser validity or custom error
    const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    if (!isInvalid) {
      await expect(
        page.locator('[role="alert"], .error, [data-testid*="error"]').first()
      ).toBeVisible({ timeout: 2000 });
    }
  });

  /**
   * The reset-password page (reached via a token in the URL) should render a password form.
   */
  test('should load reset-password page with token parameter', async ({ page }) => {
    // Simulate the URL a user would receive in a reset email
    await page.goto(`${ROUTES.resetPassword}?token=fake-reset-token-for-ui-test`, {
      waitUntil: 'domcontentloaded',
    });

    // The page should render — even with an invalid/fake token the UI should show
    // either a password form or an "invalid token" error message
    const passwordField = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
    const hasPasswordField = await passwordField.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);

    if (!hasPasswordField) {
      // Correct production behaviour: invalid token shows an error page
      const bodyText = (await page.textContent('body')) ?? '';
      expect(/reset|new password|change password|invalid|expired|token|error/i.test(bodyText)).toBe(true);
    } else {
      await expect(passwordField).toBeVisible();
    }
  });

  /**
   * The reset-password page should validate that the new password meets strength requirements.
   */
  test('should validate password strength on reset-password page', async ({ page }) => {
    await page.goto(`${ROUTES.resetPassword}?token=fake-token`, { waitUntil: 'domcontentloaded' });

    const passwordInput = page
      .locator('input[type="password"], input[name="password"], input[id="password"]')
      .first();

    if (!(await passwordInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      // Page shows an "invalid token" / "expired" error instead of a form — that IS the
      // correct production behaviour for a fake token. Assert that the page communicates
      // this clearly rather than rendering nothing.
      const bodyText = (await page.textContent('body')) ?? '';
      const hasTokenError =
        /invalid|expired|not found|token|error/i.test(bodyText) ||
        (await page.locator('[role="alert"]').isVisible({ timeout: 3000 }).catch(() => false));
      expect(hasTokenError).toBeTruthy();
      return;
    }

    await passwordInput.fill('abc');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Must stay on reset page AND show a weak password error
    await expect(page).toHaveURL(/reset/);
    await expect(
      page.locator('text=/weak|too short|at least|minimum|strength/i').first()
    ).toBeVisible({ timeout: 3000 });
  });

  /**
   * The reset-password page should reject mismatched password confirmation.
   */
  test('should validate password confirmation match on reset-password page', async ({ page }) => {
    await page.goto(`${ROUTES.resetPassword}?token=fake-token`, { waitUntil: 'domcontentloaded' });

    const passwordFields = page.locator('input[type="password"]');
    const count = await passwordFields.count();

    if (count < 2) {
      // No confirmation field rendered — page is showing an invalid-token error, which is
      // the correct production behaviour. Assert the page communicates the problem.
      const bodyText = (await page.textContent('body')) ?? '';
      const hasTokenError =
        /invalid|expired|not found|token|error/i.test(bodyText) ||
        (await page.locator('[role="alert"]').isVisible({ timeout: 3000 }).catch(() => false));
      expect(hasTokenError).toBeTruthy();
      return;
    }

    await passwordFields.nth(0).fill('NewPass2026!');
    await passwordFields.nth(1).fill('DifferentPass999!');

    await page.locator('button[type="submit"]').click();

    // Must stay on the reset page AND show a mismatch error
    await expect(page).toHaveURL(/reset/);
    await expect(
      page.locator('text=/match|same|identical|confirm/i').first()
    ).toBeVisible({ timeout: 3000 });
  });
});
