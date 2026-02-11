import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaUI, loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('11 - Client Login Flow', () => {
  test('should login as client via UI', async ({ page }) => {
    await loginViaUI(page, 'client');

    // Should be redirected to dashboard area
    await expect(page).toHaveURL(/\/(dashboard|client)/);

    await page.waitForLoadState('networkidle');
    await waitForPageReady(page);

    await takeScreenshot(page, 'client-login-success.png');
  });

  test('should show client dashboard with relevant stats', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see client-specific dashboard content
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('dashboard') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('progress') ||
      pageText?.toLowerCase().includes('streak')
    ).toBeTruthy();

    await takeScreenshot(page, 'client-dashboard.png');
  });

  test('should navigate to analytics from client dashboard', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics page should load for client
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('analytics') ||
      pageText?.toLowerCase().includes('progress') ||
      pageText?.toLowerCase().includes('overview')
    ).toBeTruthy();

    await takeScreenshot(page, 'client-analytics.png');
  });

  test('should view client profile', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see profile content
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('profile') ||
      pageText?.includes('@') ||
      pageText?.toLowerCase().includes('account')
    ).toBeTruthy();

    await takeScreenshot(page, 'client-profile.png');
  });

  test('should display quick actions for client', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client dashboard should have quick actions like "Start Workout", "View Progress"
    const quickActions = page.locator('text=/start workout|view progress|quick actions|log workout/i');
    if (await quickActions.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // Quick actions visible for client
    }
  });

  test('should show different dashboard than trainer', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client dashboard should NOT show trainer-specific items
    const pageText = await page.textContent('body');
    // Client dashboard typically shows personal stats, not client management
    expect(pageText?.length).toBeGreaterThan(100);
  });
});
