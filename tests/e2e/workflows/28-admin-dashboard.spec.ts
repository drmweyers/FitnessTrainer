/**
 * Suite 28: Admin Dashboard
 * Tests admin panel: stats, user management, roles, activity log.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('28 - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'admin');
  });

  test('admin dashboard loads', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Admin dashboard heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /admin|dashboard|overview/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '28-admin-dashboard.png');
  });

  test('system stats displayed (users count)', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Stats section must display numeric data about users/trainers/clients
    const statsSection = page.locator(
      '[data-testid*="stats"], [class*="stat"], [class*="metric"], [class*="count"], [class*="overview"]'
    );
    await expect(statsSection.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can navigate to /admin/users', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // User management heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /user|manage|admin/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '28-admin-users.png');
  });

  test('user list shows with search', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // User list/table must be present (seeded accounts exist)
    const userList = page.locator('table, [role="table"], [data-testid*="user-list"], ul li');
    await expect(userList.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Must show email addresses (seeded QA accounts have @evofit.io)
    await expect(page.locator('text=@evofit.io').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can search users by email', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="email" i], input[aria-label*="search" i]'
    );
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
    await searchInput.first().fill('qa-trainer@evofit.io');

    // After searching, the qa-trainer account must appear in results
    await expect(
      page.locator('text=qa-trainer@evofit.io').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '28-admin-user-search.png');
  });

  test('can filter users by role', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Role filter control must be visible
    const roleFilter = page.locator(
      'select[name*="role" i], [aria-label*="filter by role" i], select[aria-label*="role" i]'
    );
    await expect(roleFilter.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('click user navigates to detail or shows detail', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const userRow = page.locator(
      'tr[data-user-id], [data-testid*="user-row"], table tbody tr, a[href*="/admin/users/"]'
    );
    await expect(userRow.first()).toBeVisible({ timeout: TIMEOUTS.element });

    const initialUrl = page.url();
    await userRow.first().click();
    await waitForPageReady(page);

    // Must have navigated to user detail or opened detail panel (URL changed OR email visible)
    const newUrl = page.url();
    const hasNavigated = newUrl !== initialUrl;
    const emailVisible = await page.locator('text=@').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasNavigated || emailVisible).toBeTruthy();

    await takeScreenshot(page, '28-user-detail.png');
  });

  test('user detail shows role, status, email', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const userLink = page.locator('a[href*="/admin/users/"]');
    await expect(userLink.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await userLink.first().click();
    await waitForPageReady(page);

    // Detail page must show email AND role information
    await expect(page.locator('text=@').first()).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(
      page.locator('text=/trainer|client|admin/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can change user role', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Role change control must be visible on users page
    const roleControl = page.locator(
      'select[name*="role" i], button:has-text("Change Role"), [aria-label*="role" i]'
    );
    await expect(roleControl.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can activate/deactivate user', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Status control must be visible
    const statusControl = page.locator(
      'button:has-text("Activate"), button:has-text("Deactivate"), button:has-text("Suspend"), button:has-text("Enable"), button:has-text("Disable"), [aria-label*="status" i]'
    );
    await expect(statusControl.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('bulk user operations available', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Select-all checkbox or bulk action button must be present
    const bulkControl = page.locator(
      'input[type="checkbox"][aria-label*="select all" i], input[type="checkbox"][name*="select-all" i], button:has-text("Bulk"), button:has-text("Select All"), [data-testid*="bulk"]'
    );
    await expect(bulkControl.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('activity log is visible', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Activity log section must be on dashboard or system page
    const activitySection = page.locator(
      'text=/activity log/i, text=/recent activity/i, text=/audit log/i, [data-testid*="activity"]'
    );
    const hasActivity = await activitySection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasActivity) {
      // Check system page
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

    await takeScreenshot(page, '28-activity-log.png');
  });
});
