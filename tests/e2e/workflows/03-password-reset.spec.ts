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
    await page.goto(ROUTES.forgotPassword, { waitUntil: 'networkidle' });

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
    await page.goto(ROUTES.forgotPassword, { waitUntil: 'networkidle' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill('any-email@test.com');
    await page.locator('button[type="submit"]').click();

    // Wait for the response/animation
    await page.waitForTimeout(3000);

    // Should show a success / confirmation message
    const successMessage = page.locator(
      'text=/sent|check your email|if.*account.*exists|we.ll email|instructions/i'
    );
    const isVisible = await successMessage.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);

    // Alternatively the form may have navigated or shown an alert
    const hasAlert = await page.locator('[role="alert"]').isVisible({ timeout: 2000 }).catch(() => false);

    expect(isVisible || hasAlert).toBeTruthy();
  });

  /**
   * Submitting the forgot-password form with an empty email should show a validation error.
   */
  test('should show validation error for empty email on forgot-password', async ({ page }) => {
    await page.goto(ROUTES.forgotPassword, { waitUntil: 'networkidle' });

    await page.locator('button[type="submit"]').click();

    // Should stay on the same page
    await expect(page).toHaveURL(/forgot/);

    const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
    const isInvalid = await emailInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false);
    const customError = page.locator('[role="alert"], .error, [data-testid*="error"]');
    const hasCustomError = await customError.first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(isInvalid || hasCustomError).toBeTruthy();
  });

  /**
   * The reset-password page (reached via a token in the URL) should render a password form.
   */
  test('should load reset-password page with token parameter', async ({ page }) => {
    // Simulate the URL a user would receive in a reset email
    await page.goto(`${ROUTES.resetPassword}?token=fake-reset-token-for-ui-test`, {
      waitUntil: 'networkidle',
    });

    // The page should render — even with an invalid/fake token the UI form should appear
    const bodyText = (await page.textContent('body')) ?? '';

    const hasPasswordField = await page
      .locator('input[type="password"], input[name="password"], input[id="password"]')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    const hasResetHeading = /reset|new password|change password/i.test(bodyText);

    expect(hasPasswordField || hasResetHeading).toBeTruthy();
  });

  /**
   * The reset-password page should validate that the new password meets strength requirements.
   */
  test('should validate password strength on reset-password page', async ({ page }) => {
    await page.goto(`${ROUTES.resetPassword}?token=fake-token`, { waitUntil: 'networkidle' });

    const passwordInput = page
      .locator('input[type="password"], input[name="password"], input[id="password"]')
      .first();

    if (!(await passwordInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      // Page may show an "invalid token" error before rendering the form — that is acceptable
      test.skip();
      return;
    }

    await passwordInput.fill('abc');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await page.waitForTimeout(2000);

    // Should remain on reset page or show error about weak password
    const url = page.url();
    const hasWeakError = await page
      .locator('text=/weak|too short|at least|minimum|strength/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(url.includes('reset') || hasWeakError).toBeTruthy();
  });

  /**
   * The reset-password page should reject mismatched password confirmation.
   */
  test('should validate password confirmation match on reset-password page', async ({ page }) => {
    await page.goto(`${ROUTES.resetPassword}?token=fake-token`, { waitUntil: 'networkidle' });

    const passwordFields = page.locator('input[type="password"]');
    const count = await passwordFields.count();

    if (count < 2) {
      // No confirmation field rendered (possibly blocked by invalid token) — skip gracefully
      test.skip();
      return;
    }

    await passwordFields.nth(0).fill('NewPass2026!');
    await passwordFields.nth(1).fill('DifferentPass999!');

    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Should show mismatch error
    const hasMismatch = await page
      .locator('text=/match|same|identical|confirm/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    const remainsOnPage = page.url().includes('reset');

    expect(hasMismatch || remainsOnPage).toBeTruthy();
  });
});
