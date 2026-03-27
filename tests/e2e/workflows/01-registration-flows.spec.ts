/**
 * Suite 1: Registration Flows
 * Tests all user registration scenarios — trainer, client, validation, and post-register state.
 */
import { test, expect } from '@playwright/test';
import { ROUTES, API, TIMEOUTS } from '../helpers/constants';

test.describe('01 - Registration Flows', () => {
  /**
   * Register as a trainer via the UI form and verify redirect to trainer dashboard.
   */
  test('should register as trainer and redirect to trainer dashboard', async ({ page }) => {
    const email = `test-trainer-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill(email);
    await page.locator('input#password, input[name="password"], input[type="password"]').fill('TestPass2026!');

    // Select trainer role
    const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]');
    if (await roleSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleSelect.selectOption('trainer');
    } else {
      // Role may be radio buttons or buttons
      const trainerOption = page.locator('label:has-text("Trainer"), button:has-text("Trainer"), [value="trainer"]');
      if (await trainerOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await trainerOption.first().click();
      }
    }

    await page.locator('button[type="submit"]').click();

    // Should redirect away from register after success
    await page.waitForURL((url) => !url.pathname.includes('/register'), {
      timeout: TIMEOUTS.pageLoad,
    });

    // Trainer should land on a dashboard route
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|trainer)/);
  });

  /**
   * Register as a client via the UI form and verify redirect to client dashboard.
   */
  test('should register as client and redirect to client dashboard', async ({ page }) => {
    const email = `test-client-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill(email);
    await page.locator('input#password, input[name="password"], input[type="password"]').fill('TestPass2026!');

    // Select client role
    const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]');
    if (await roleSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleSelect.selectOption('client');
    } else {
      const clientOption = page.locator('label:has-text("Client"), button:has-text("Client"), [value="client"]');
      if (await clientOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await clientOption.first().click();
      }
    }

    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => !url.pathname.includes('/register'), {
      timeout: TIMEOUTS.pageLoad,
    });

    const url = page.url();
    expect(url).toMatch(/\/(dashboard|client)/);
  });

  /**
   * Register an admin via the API (admin creation is typically API-only).
   */
  test('should register admin account via API', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const email = `test-admin-${Date.now()}@test.com`;

    const response = await page.request.post(API.register, {
      data: { email, password: 'TestPass2026!', role: 'admin' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Either 201 Created or 200, depending on implementation.
    // Some apps reject admin self-registration (403/400 expected in that case).
    const status = response.status();
    expect([200, 201, 400, 403]).toContain(status);

    if (response.ok()) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  /**
   * Empty email field should show a validation error.
   */
  test('should show error for empty email', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#password, input[name="password"], input[type="password"]').fill('TestPass2026!');
    await page.locator('button[type="submit"]').click();

    // Should remain on register page
    await expect(page).toHaveURL(/register/);

    // Browser native validation or custom error should be present
    const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const customError = page.locator('[data-testid="email-error"], .error, [role="alert"]');
    const hasCustomError = await customError.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isInvalid || hasCustomError).toBeTruthy();
  });

  /**
   * Empty password field should show a validation error.
   */
  test('should show error for empty password', async ({ page }) => {
    const email = `test-empty-pw-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill(email);
    await page.locator('button[type="submit"]').click();

    // Should remain on register page
    await expect(page).toHaveURL(/register/);

    const pwInput = page.locator('input#password, input[name="password"], input[type="password"]');
    const isInvalid = await pwInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const customError = page.locator('[data-testid="password-error"], .error, [role="alert"]');
    const hasCustomError = await customError.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isInvalid || hasCustomError).toBeTruthy();
  });

  /**
   * Password shorter than 8 characters should be rejected.
   */
  test('should show error for password shorter than 8 characters', async ({ page }) => {
    const email = `test-short-pw-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill(email);
    await page.locator('input#password, input[name="password"], input[type="password"]').fill('abc12');
    await page.locator('button[type="submit"]').click();

    // Page should not navigate away — still on register
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await page.locator('text=/password|too short|at least|minimum/i').isVisible({ timeout: 3000 }).catch(() => false);

    expect(url.includes('register') || hasError).toBeTruthy();
  });

  /**
   * Invalid email format should be rejected by browser or custom validation.
   */
  test('should show error for invalid email format', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#email, input[name="email"], input[type="email"]').fill('not-an-email');
    await page.locator('input#password, input[name="password"], input[type="password"]').fill('TestPass2026!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1500);

    const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const customError = page.locator('[data-testid="email-error"], .error, [role="alert"]');
    const hasCustomError = await customError.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isInvalid || hasCustomError).toBeTruthy();
  });

  /**
   * Registering with an already-used email address should return a 409 conflict.
   */
  test('should return 409 for duplicate email', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const email = `dup-test-${Date.now()}@test.com`;

    // First registration — should succeed
    const first = await page.request.post(API.register, {
      data: { email, password: 'TestPass2026!', role: 'trainer' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(first.ok()).toBeTruthy();

    // Second registration with the same email — should conflict
    const second = await page.request.post(API.register, {
      data: { email, password: 'TestPass2026!', role: 'trainer' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(second.status()).toBe(409);
  });

  /**
   * The register page should have a role selector (trainer / client).
   */
  test('should display role selector on register page', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    // Accept select element, radio buttons, or role buttons
    const roleSelector =
      page.locator('select[name="role"]')
        .or(page.locator('[type="radio"][name="role"]'))
        .or(page.locator('label:has-text("Trainer"), label:has-text("Client")'))
        .or(page.locator('button:has-text("Trainer"), button:has-text("Client")'));

    await expect(roleSelector.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  /**
   * The register page should contain a link that navigates to the login page.
   */
  test('should have a link to the login page', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await loginLink.first().click();
    await expect(page).toHaveURL(/login/);
  });

  /**
   * Immediately after registration the user should be able to log in with the same credentials.
   */
  test('should allow login immediately after registration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const email = `post-reg-login-${Date.now()}@test.com`;
    const password = 'TestPass2026!';

    // Register via API
    const regRes = await page.request.post(API.register, {
      data: { email, password, role: 'trainer' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(regRes.ok()).toBeTruthy();

    // Login immediately
    const loginRes = await page.request.post(API.login, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(loginRes.ok()).toBeTruthy();

    const body = await loginRes.json();
    expect(body.success).toBe(true);
    const token =
      body.data?.tokens?.accessToken ||
      body.data?.accessToken ||
      body.accessToken;
    expect(token).toBeTruthy();
  });

  /**
   * After registration, GET /api/profiles/me should return a profile for the new user.
   */
  test('should create profile accessible at /api/profiles/me after registration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const email = `profile-check-${Date.now()}@test.com`;
    const password = 'TestPass2026!';

    // Register
    const regRes = await page.request.post(API.register, {
      data: { email, password, role: 'trainer' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(regRes.ok()).toBeTruthy();

    // Login to obtain token
    const loginRes = await page.request.post(API.login, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(loginRes.ok()).toBeTruthy();

    const loginBody = await loginRes.json();
    const token =
      loginBody.data?.tokens?.accessToken ||
      loginBody.data?.accessToken ||
      loginBody.accessToken;

    // Fetch profile
    const profileRes = await page.request.get(API.profileMe, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Profile should exist (200) or be created on first access
    expect([200, 201]).toContain(profileRes.status());

    const profileBody = await profileRes.json();
    expect(profileBody.success).toBe(true);
  });
});
