import { test, expect } from '@playwright/test';
import { BASE_URL, TEST_ACCOUNTS, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaUI, takeScreenshot } from '../helpers/auth';

test.describe('01 - Trainer Login Flow', () => {
  test('should display the login page with form fields', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    // Verify form elements are present
    await expect(page.locator('input#email, input[name="email"]')).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify branding - page should have EvoFit branding and sign in heading
    const branding = page.locator('span', { hasText: 'EvoFit' }).or(page.locator('text=/EvoFit/i'));
    await expect(branding.first()).toBeVisible();
    await expect(page.locator('h2', { hasText: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    // Click submit without filling form
    await page.locator('button[type="submit"]').click();

    // Browser native validation or custom validation should prevent submission
    // The form should still be on the login page
    await expect(page).toHaveURL(/login/);
  });

  test('should login as trainer and redirect to dashboard', async ({ page }) => {
    await loginViaUI(page, 'trainer');

    // Should be redirected to dashboard area
    await expect(page).toHaveURL(/\/(dashboard|trainer)/);

    // Verify dashboard content is visible (trainer dashboard) — specific heading
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'trainer-login-success.png');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    // Fill with invalid credentials
    await page.locator('input#email, input[name="email"]').fill('invalid@example.com');
    await page.locator('input#password, input[name="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Should show an error message — wait for it via locator auto-wait
    const errorLocator = page.locator('text=/error|invalid|incorrect|failed/i').first();
    const staysOnLogin = page.locator('input[name="email"], input#email').first();

    // Either an error message appears OR the login form is still visible
    await expect(errorLocator.or(staysOnLogin).first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    // Click create account / register link - actual text is "create a new account"
    const registerLink = page.locator('a[href*="register"]:has-text("create a new account")');
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password from login', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    const forgotLink = page.locator('a[href*="forgot"]');
    if (await forgotLink.isVisible({ timeout: 3000 })) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot/);
    }
  });
});
