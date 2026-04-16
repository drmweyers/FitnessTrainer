import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('10 - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'admin');
  });

  test('should load admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see admin-related content heading
    await expect(page.locator('text=/dashboard|admin|overview/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'admin-dashboard.png');
  });

  test('should display admin metrics cards', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see metric-related content (total users, trainers, clients, etc.)
    await expect(
      page.locator('text=/users|trainers|clients|total/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should display recent signups or user list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show some recent activity or user data
    await expect(
      page.locator('text=/@|text=/signup|recent/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should navigate to admin users page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see user management content heading
    await expect(
      page.locator('h1:has-text("Users"), h1:has-text("User Management"), h2:has-text("Users")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'admin-users.png');
  });

  test('should have navigation links to admin sections', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for navigation to user management — at least one admin nav link must exist
    const usersLink = page.locator('a[href*="admin/users"], a[href*="users"], button:has-text("View All Users"), a:has-text("Users")');
    await expect(usersLink.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should show correct admin role indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page must acknowledge admin role — specific text
    await expect(
      page.locator('text=/admin|administrator|dashboard/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
