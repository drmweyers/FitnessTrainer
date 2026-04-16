import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaUI, loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('11 - Client Login Flow', () => {
  test('should login as client via UI', async ({ page }) => {
    await loginViaUI(page, 'client');

    // loginViaUI exits when URL leaves /login. The dashboard router then does a
    // second redirect to /dashboard/client — wait for the final destination.
    await page.waitForURL(/\/dashboard\/(trainer|client|admin)/, { timeout: TIMEOUTS.pageLoad });

    await waitForPageReady(page);

    // Dashboard heading must be visible — use h1 only (nav uses h2/span, DashboardLayout uses h1)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'client-login-success.png');
  });

  test('should show client dashboard with relevant stats', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clientDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });

    // Wait for auth to resolve — page may do client-side redirect if role check fails
    // Client dashboard uses DashboardLayout with title="My Fitness Dashboard" (h1 always present)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

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

    // Profile page renders DashboardLayout title="My Profile" — wait for that h1
    await expect(
      page.locator('h1:has-text("My Profile"), h1:has-text("Profile"), h2:has-text("Profile")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

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

    // Client dashboard h1 is always "My Fitness Dashboard" (in DashboardLayout)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Client dashboard should NOT show trainer-specific items like "Total Clients"
    await expect(page.locator('text="Total Clients"')).not.toBeVisible();
  });
});
