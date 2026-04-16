/**
 * Suite 38: Journey — Admin Manages Platform
 * Full journey: admin logs in, manages users, feature flags,
 * activity log, profile, and logs out.
 *
 * Uses test.describe.serial because tests represent a linear admin workflow.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, API, TIMEOUTS, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaUI, loginViaAPI, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe.serial('38 - Journey: Admin Manages Platform', () => {
  /**
   * Test 1: Admin logs in via UI form.
   */
  test('admin logs in via UI form', async ({ page }) => {
    await loginViaUI(page, 'admin');

    await expect(page).not.toHaveURL(/\/auth\/login/);
    const url = page.url();
    expect(url).toMatch(/\/(admin|dashboard)/);

    await takeScreenshot(page, '38-01-admin-login.png');
  });

  /**
   * Test 2: Admin navigates to /admin and verifies dashboard stats.
   */
  test('admin navigates to /admin and verifies dashboard stats', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Admin dashboard heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /admin|dashboard|overview/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Numeric stats must be present
    const statsSection = page.locator(
      '[data-testid*="stats"], [class*="stat"], [class*="metric"], [class*="count"]'
    );
    await expect(statsSection.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-02-admin-dashboard-stats.png');
  });

  /**
   * Test 3: Admin navigates to /admin/users and verifies user list.
   */
  test('admin navigates to /admin/users and verifies user list', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // User list heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /user|manage/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Seeded QA accounts must appear
    await expect(page.locator('text=@evofit.io').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-03-admin-users.png');
  });

  /**
   * Test 4: Admin searches for "qa-trainer" in user list.
   */
  test('admin searches for qa-trainer in user list', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="email" i], input[aria-label*="search" i]'
    );
    await expect(searchInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.first().fill('qa-trainer');

    // qa-trainer account must appear in search results
    await expect(
      page.locator('text=qa-trainer@evofit.io').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-04-user-search-results.png');
  });

  /**
   * Test 5: Admin navigates to /admin/system and verifies system page.
   */
  test('admin navigates to /admin/system and verifies system page', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.adminSystem}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // System page heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /system|health|admin|feature|config/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-05-admin-system.png');
  });

  /**
   * Test 6: Admin verifies feature flags section loads.
   */
  test('admin verifies feature flags section loads', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    // Feature flags API must return 200 for admin
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const flagsResponse = await page.request.get(`${BASE_URL}${API.adminFeatureFlags}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(flagsResponse.status()).toBe(200);

    // Navigate to system page and verify flag UI
    await page.goto(`${BASE_URL}${ROUTES.adminSystem}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Feature flags heading must be visible
    await expect(
      page.locator('h2, h3, [role="heading"]').filter({ hasText: /flag|feature/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-06-feature-flags.png');
  });

  /**
   * Test 7: Admin toggles a feature flag.
   */
  test('admin toggles a feature flag', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.adminSystem}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // A toggle button must be present
    const toggleBtn = page.locator('button[role="switch"]');
    await expect(toggleBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });

    const initialState = await toggleBtn.first().getAttribute('aria-checked');
    await toggleBtn.first().click();

    // State must change after clicking
    await expect(toggleBtn.first()).not.toHaveAttribute('aria-checked', initialState || '', { timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-07-flag-toggled.png');
  });

  /**
   * Test 8: Admin verifies activity log section loads.
   */
  test('admin verifies activity log section loads', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    // Activity API must return 200 for admin
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const activityResponse = await page.request.get(`${BASE_URL}${API.adminActivity}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(activityResponse.status()).toBe(200);

    // Navigate to admin dashboard and verify activity log UI
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Activity log section must be visible
    const activitySection = page.locator(
      'text=/activity log/i, text=/recent activity/i, text=/audit log/i, [data-testid*="activity"]'
    );
    const hasActivity = await activitySection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasActivity) {
      // Check system page instead
      await page.goto(`${BASE_URL}${ROUTES.adminSystem}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);
      await expect(
        page.locator('text=/activity|log|audit/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    } else {
      await expect(activitySection.first()).toBeVisible();
    }

    await takeScreenshot(page, '38-08-activity-log.png');
  });

  /**
   * Test 9: Admin navigates to /profile and verifies profile.
   */
  test('admin navigates to /profile and verifies profile', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Profile heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /profile|admin/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Must show admin's email
    await expect(page.locator(`text=${TEST_ACCOUNTS.admin.email}`).first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-09-admin-profile.png');
  });

  /**
   * Test 10: Admin logs out and verifies redirect to login page.
   */
  test('admin logs out and verifies redirect to login', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Find and click logout button
    const logoutBtn = page.locator(
      'button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Log out"), a:has-text("Sign out"), [data-testid*="logout"], [aria-label*="logout" i]'
    );
    await expect(logoutBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await logoutBtn.first().click();

    // Must redirect to login page after logout
    await expect(page).toHaveURL(/login|auth/, { timeout: TIMEOUTS.element });

    await takeScreenshot(page, '38-10-after-logout.png');
  });
});
