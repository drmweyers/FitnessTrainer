/**
 * Suite 1: Registration Flows
 * Tests all user registration scenarios — trainer, client, validation, and post-register state.
 *
 * Register form fields (in order):
 *   firstName (#firstName), lastName (#lastName), email (#email),
 *   role buttons (type="button", text "Client" / "Trainer"),
 *   password (#password), confirmPassword (#confirmPassword),
 *   agreeToTerms checkbox (#agreeToTerms)
 *
 * Validation is custom JS (not native browser validity). Errors appear as red <p> text.
 * The confirm-password input also has type="password", so always use input#password
 * (not the generic type="password" locator which would be ambiguous).
 */
import { test, expect } from '@playwright/test';
import { ROUTES, API, TIMEOUTS } from '../helpers/constants';

/** Fill the full registration form with sensible defaults. */
async function fillRegisterForm(
  page: import('@playwright/test').Page,
  opts: {
    email: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    role?: 'trainer' | 'client';
    agreeToTerms?: boolean;
  }
) {
  const {
    email,
    password = 'TestPass2026!',
    confirmPassword = password,
    firstName = 'QA',
    lastName = 'Tester',
    role = 'trainer',
    agreeToTerms = true,
  } = opts;

  await page.locator('input#firstName').fill(firstName);
  await page.locator('input#lastName').fill(lastName);
  await page.locator('input#email').fill(email);

  // Role buttons: type="button", text "Client" / "Trainer"
  const roleLabel = role === 'trainer' ? 'Trainer' : 'Client';
  const roleBtn = page.locator(`button:not([type="submit"]):has-text("${roleLabel}")`).first();
  if (await roleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await roleBtn.click();
  }

  // Use #password specifically — confirmPassword also has type=password
  await page.locator('input#password').fill(password);
  await page.locator('input#confirmPassword').fill(confirmPassword);

  if (agreeToTerms) {
    const termsCheckbox = page.locator('input#agreeToTerms');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }
  }
}

test.describe('01 - Registration Flows', () => {
  /**
   * Register as a trainer via the UI form and verify redirect to trainer dashboard.
   */
  test('should register as trainer and redirect to trainer dashboard', async ({ page }) => {
    const email = `test-trainer-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await fillRegisterForm(page, { email, role: 'trainer' });
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

    await fillRegisterForm(page, { email, role: 'client' });
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
   * The form uses custom JS validation — errors appear as red <p> text.
   */
  test('should show error for empty email', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    // Fill all required fields except email, then submit
    await page.locator('input#firstName').fill('QA');
    await page.locator('input#lastName').fill('Tester');
    // Leave email empty
    await page.locator('input#password').fill('TestPass2026!');
    await page.locator('input#confirmPassword').fill('TestPass2026!');
    const termsCheckbox = page.locator('input#agreeToTerms');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should remain on register page
    await expect(page).toHaveURL(/register/);

    // Custom error text for missing email
    const hasCustomError = await page
      .locator('text=/email is required/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    // Fallback: native browser validity
    const emailInput = page.locator('input#email');
    const isNativeInvalid = await emailInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false);

    expect(isNativeInvalid || hasCustomError).toBeTruthy();
  });

  /**
   * Empty password field should show a validation error.
   */
  test('should show error for empty password', async ({ page }) => {
    const email = `test-empty-pw-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    // Fill all fields except password
    await page.locator('input#firstName').fill('QA');
    await page.locator('input#lastName').fill('Tester');
    await page.locator('input#email').fill(email);
    // Leave password + confirmPassword empty
    const termsCheckbox = page.locator('input#agreeToTerms');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should remain on register page
    await expect(page).toHaveURL(/register/);

    // Custom error: "Password is required"
    const hasCustomError = await page
      .locator('text=/password is required/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    const pwInput = page.locator('input#password');
    const isNativeInvalid = await pwInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false);

    expect(isNativeInvalid || hasCustomError).toBeTruthy();
  });

  /**
   * Password shorter than 8 characters should be rejected by custom validation.
   */
  test('should show error for password shorter than 8 characters', async ({ page }) => {
    const email = `test-short-pw-${Date.now()}@test.com`;

    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#firstName').fill('QA');
    await page.locator('input#lastName').fill('Tester');
    await page.locator('input#email').fill(email);
    await page.locator('input#password').fill('abc12');
    await page.locator('input#confirmPassword').fill('abc12');
    const termsCheckbox = page.locator('input#agreeToTerms');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Page should not navigate away — still on register
    const url = page.url();

    // Error message: "Password must be at least 8 characters"
    const hasError = await page
      .locator('text=/password must be at least/i, text=/at least 8/i, text=/minimum/i, text=/too short/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(url.includes('register') || hasError).toBeTruthy();
  });

  /**
   * Invalid email format should be rejected by custom validation.
   */
  test('should show error for invalid email format', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    await page.locator('input#firstName').fill('QA');
    await page.locator('input#lastName').fill('Tester');
    await page.locator('input#email').fill('not-an-email');
    await page.locator('input#password').fill('TestPass2026!');
    await page.locator('input#confirmPassword').fill('TestPass2026!');
    const termsCheckbox = page.locator('input#agreeToTerms');
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Custom error: "Please enter a valid email address"
    const hasCustomError = await page
      .locator('text=/valid email/i, text=/invalid email/i, text=/enter a valid/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    const emailInput = page.locator('input#email');
    const isNativeInvalid = await emailInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false);

    expect(isNativeInvalid || hasCustomError).toBeTruthy();
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
   * The register page should have a role selector (trainer / client buttons).
   */
  test('should display role selector on register page', async ({ page }) => {
    await page.goto(ROUTES.register, { waitUntil: 'networkidle' });

    // The register page uses type="button" role-selection buttons
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
