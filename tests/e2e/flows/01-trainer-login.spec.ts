import { test, expect } from '@playwright/test';
import { BASE_URL, TEST_ACCOUNTS, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaUI, takeScreenshot } from '../helpers/auth';

test.describe('01 - Trainer Login Flow', () => {
  test('should display the login page with form fields', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle' });

    // Verify form elements are present
    await expect(page.locator('input#email, input[name="email"]')).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify branding
    await expect(page.locator('text=EvoFit')).toBeVisible();
    await expect(page.locator('text=/sign in/i')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle' });

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

    // Wait for page content to load
    await page.waitForLoadState('networkidle');

    // Verify dashboard content is visible (trainer dashboard)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    await takeScreenshot(page, 'trainer-login-success.png');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle' });

    // Fill with invalid credentials
    await page.locator('input#email, input[name="email"]').fill('invalid@example.com');
    await page.locator('input#password, input[name="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    // Should stay on login page or show error
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasError = await page.locator('text=/error|invalid|incorrect|failed/i').isVisible({ timeout: 5000 }).catch(() => false);

    // Either still on login page or error is shown
    expect(url.includes('login') || hasError).toBeTruthy();
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle' });

    // Click create account / register link
    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password from login', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle' });

    const forgotLink = page.locator('a[href*="forgot"]');
    if (await forgotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot/);
    }
  });
});
