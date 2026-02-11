import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginAndNavigate, loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('02 - Trainer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load trainer dashboard with stats cards', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see dashboard title
    await expect(page.locator('text=/trainer dashboard/i')).toBeVisible({ timeout: TIMEOUTS.element });

    // Should see stat cards
    const statCards = page.locator('text=/total clients|active clients|new this month|inactive/i');
    await expect(statCards.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'trainer-dashboard.png');
  });

  test('should display client list section', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see "Your Clients" section or similar
    const clientSection = page.locator('text=/your clients|client list|clients/i');
    await expect(clientSection.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should display quick actions section', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see quick actions
    const quickActions = page.locator('text=/quick actions|create program|add client|view calendar/i');
    await expect(quickActions.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should navigate to programs from quick action', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click "Create Program" or "New Program" button/link
    const createProgramLink = page.locator('a[href*="programs/new"], button:has-text("New Program"), a:has-text("Create Program")');
    if (await createProgramLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await createProgramLink.first().click();
      await page.waitForURL(/programs/, { timeout: TIMEOUTS.pageLoad });
      await expect(page).toHaveURL(/programs/);
    }
  });

  test('should show activity feed or placeholder', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see activity feed section
    const activitySection = page.locator('text=/recent activity|activity feed|activity/i');
    await expect(activitySection.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
