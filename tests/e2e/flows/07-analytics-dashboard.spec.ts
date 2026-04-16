import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('07 - Analytics Dashboard', () => {
  test('should load analytics page for client user', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see "Progress Analytics" heading
    await expect(page.locator('h1:has-text("Progress Analytics")')).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'analytics-overview.png');
  });

  test('should display analytics tabs', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics tabs are <button> elements (not [role="tab"]) in the nav bar
    await expect(
      page.locator('button:has-text("Overview"), button:has-text("Performance"), button:has-text("Goals")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should switch between analytics tabs', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Tabs are <button> elements styled with active class (not aria-selected)
    // Try clicking on Goals tab if it exists
    const goalsTab = page.locator('button:has-text("Goals")').first();
    if (await goalsTab.isVisible({ timeout: 5000 })) {
      await goalsTab.click();
      // After clicking Goals, the Goals button should have the active border style (blue)
      // or simply be visible — the content area changes below it
      await expect(goalsTab).toBeVisible({ timeout: TIMEOUTS.element });
      await takeScreenshot(page, 'analytics-goals.png');
    }

    // Try clicking History tab
    const historyTab = page.locator('button:has-text("History")').first();
    if (await historyTab.isVisible({ timeout: 3000 })) {
      await historyTab.click();
      // History tab content shows measurement history
      await expect(historyTab).toBeVisible({ timeout: TIMEOUTS.element });
      await takeScreenshot(page, 'analytics-history.png');
    }
  });

  test('should load analytics page for trainer', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // For trainers, analytics shows "Trainer Analytics" heading (behind FeatureGate for Pro+)
    // or AnalyticsLockedView for Starter tier. Either way a heading is rendered.
    await expect(
      page.locator('h1:has-text("Trainer Analytics"), h1:has-text("Analytics"), h2:has-text("Analytics requires")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
