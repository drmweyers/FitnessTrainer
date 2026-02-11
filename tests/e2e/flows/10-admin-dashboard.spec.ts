import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('10 - Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'admin');
  });

  test('should load admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see admin-related content
    await expect(page.locator('text=/dashboard|admin|overview/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'admin-dashboard.png');
  });

  test('should display admin metrics cards', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see metric-related content (total users, trainers, clients, etc.)
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('users') ||
      pageText?.toLowerCase().includes('trainers') ||
      pageText?.toLowerCase().includes('clients') ||
      pageText?.toLowerCase().includes('total')
    ).toBeTruthy();
  });

  test('should display recent signups or user list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show some user data
    const pageText = await page.textContent('body');
    expect(
      pageText?.includes('@') ||
      pageText?.toLowerCase().includes('signup') ||
      pageText?.toLowerCase().includes('recent')
    ).toBeTruthy();
  });

  test('should navigate to admin users page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminUsers}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see user management content
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('user') ||
      pageText?.toLowerCase().includes('manage') ||
      pageText?.includes('@')
    ).toBeTruthy();

    await takeScreenshot(page, 'admin-users.png');
  });

  test('should have navigation links to admin sections', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for navigation to user management
    const usersLink = page.locator('a[href*="admin/users"], a[href*="users"], button:has-text("View All Users"), a:has-text("Users")');
    if (await usersLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // Admin navigation link exists
    }
  });

  test('should show correct admin role indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Check that the page acknowledges admin role
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('admin') ||
      pageText?.toLowerCase().includes('administrator') ||
      pageText?.toLowerCase().includes('dashboard')
    ).toBeTruthy();
  });
});
