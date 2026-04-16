/**
 * Suite 36: Journey — Trainer Onboards Client
 * Full end-to-end journey: trainer logs in, sets up profile/programs/schedule,
 * then client logs in and navigates key pages.
 *
 * Uses test.describe.serial because tests build on each other's state.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, API, TIMEOUTS, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaUI, loginViaAPI, getAuthToken, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe.serial('36 - Journey: Trainer Onboards Client', () => {
  /**
   * Test 1: Trainer logs in via UI form — validates the login form itself.
   */
  test('trainer logs in via UI form', async ({ page }) => {
    await loginViaUI(page, 'trainer');

    await expect(page).not.toHaveURL(/\/auth\/login/);
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|trainer|clients|programs|schedule)/);

    await takeScreenshot(page, '36-01-trainer-login.png');
  });

  /**
   * Test 2: Trainer navigates to /profile and verifies profile page loads.
   */
  test('trainer navigates to profile and verifies it loads', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Profile heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /profile|trainer/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Profile must show trainer's email
    await expect(page.locator(`text=${TEST_ACCOUNTS.trainer.email}`).first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-02-trainer-profile.png');
  });

  /**
   * Test 3: Trainer navigates to /clients page.
   */
  test('trainer navigates to /clients', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    // Clients heading must be present
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /client/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-03-trainer-clients.png');
  });

  /**
   * Test 4: Trainer clicks "Add Client" and fills the invite form.
   */
  test('trainer clicks Add Client and fills invite form', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Add client button must be visible
    const addBtn = page.locator(
      'button:has-text("Add Client"), button:has-text("Invite Client"), button:has-text("Add"), a:has-text("Add Client"), a:has-text("Invite")'
    );
    await expect(addBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await addBtn.first().click();

    // Email input must appear in the form/modal
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i], input[name*="email" i]'
    );
    await expect(emailInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    const uniqueEmail = `onboard-test-${Date.now()}@example.com`;
    await emailInput.first().fill(uniqueEmail);

    // Input value must be set correctly
    const emailValue = await emailInput.first().inputValue();
    expect(emailValue).toBe(uniqueEmail);

    await takeScreenshot(page, '36-04-invite-form-filled.png');
  });

  /**
   * Test 5: Trainer navigates to /programs and verifies programs list.
   */
  test('trainer navigates to /programs', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Programs heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /program/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-05-programs-list.png');
  });

  /**
   * Test 6: Trainer creates a new program via API.
   */
  test('trainer creates a new program via API', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const token = await getAuthToken(page, 'trainer');

    const programName = `Journey Program ${Date.now()}`;
    const response = await page.request.post(`${BASE_URL}${API.programs}`, {
      data: {
        name: programName,
        description: 'Created during E2E onboarding journey',
        durationWeeks: 4,
        difficulty: 'intermediate',
        isTemplate: false,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // Program creation must succeed
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  /**
   * Test 7: Trainer navigates to /dashboard/exercises and verifies exercise library.
   */
  test('trainer navigates to exercise library', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Exercise library heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /exercise/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-07-exercise-library.png');
  });

  /**
   * Test 8: Trainer navigates to /schedule and verifies calendar loads.
   */
  test('trainer navigates to /schedule', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Schedule heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar|appointment/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-08-trainer-schedule.png');
  });

  /**
   * Test 9: Client logs in via API.
   */
  test('client logs in via API', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client');

    // Token must be returned and stored
    expect(accessToken).toBeTruthy();
    const storedToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(storedToken).toBeTruthy();
  });

  /**
   * Test 10: Client navigates to /dashboard/client and verifies dashboard.
   */
  test('client navigates to client dashboard', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client dashboard heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /dashboard|workout|progress|welcome/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-10-client-dashboard.png');
  });

  /**
   * Test 11: Client navigates to /profile and verifies profile loads.
   */
  test('client navigates to profile', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Profile heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /profile/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Must show the client's email
    await expect(page.locator(`text=${TEST_ACCOUNTS.client.email}`).first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-11-client-profile.png');
  });

  /**
   * Test 12: Client navigates to /workouts and verifies workouts page.
   */
  test('client navigates to /workouts', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Workouts heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /workout/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-12-client-workouts.png');
  });

  /**
   * Test 13: Client navigates to /analytics and verifies analytics page.
   */
  test('client navigates to /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /analytics|progress/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-13-client-analytics.png');
  });

  /**
   * Test 14: Client navigates to /schedule and verifies schedule loads.
   */
  test('client navigates to /schedule', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Schedule heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar|appointment|session/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-14-client-schedule.png');
  });

  /**
   * Test 15: Trainer navigates to /analytics and verifies can view analytics.
   */
  test('trainer navigates to /analytics', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics heading must be visible for trainer
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /analytics|overview|progress/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '36-15-trainer-analytics.png');
  });
});
