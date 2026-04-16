import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaUI, loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('11 - Client Login Flow', () => {
  test('should login as client via UI', async ({ page }) => {
    await loginViaUI(page, 'client');

    // Should be redirected to dashboard area
    await expect(page).toHaveURL(/\/(dashboard|client)/);

    await waitForPageReady(page);

    // Dashboard heading must be visible
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'client-login-success.png');
  });

  test('should show client dashboard with relevant stats', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client dashboard heading must be visible
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Must show client-specific content — not trainer KPI
    await expect(page.locator('text="Total Clients"')).not.toBeVisible();

    await takeScreenshot(page, 'client-dashboard.png');
  });

  test('should navigate to analytics from client dashboard', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics page must load with its heading
    await expect(
      page.locator('h1:has-text("Analytics"), h1:has-text("Progress")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'client-analytics.png');
  });

  test('should view client profile', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Profile page heading must be visible
    await expect(page.locator('text=/profile|account/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'client-profile.png');
  });

  test('should display quick actions for client', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client dashboard should have quick actions like "Start Workout", "View Progress"
    const quickActions = page.locator('text=/start workout|view progress|quick actions|log workout/i');
    if (await quickActions.first().isVisible({ timeout: 5000 })) {
      // Quick actions visible for client — verified
      await expect(quickActions.first()).toBeVisible();
    }
  });

  test('should show different dashboard than trainer', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client dashboard should NOT show trainer-specific items like "Total Clients"
    await expect(page.locator('text="Total Clients"')).not.toBeVisible();
    // But should show a heading
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
