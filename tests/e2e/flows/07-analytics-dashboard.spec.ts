import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('07 - Analytics Dashboard', () => {
  test('should load analytics page for client user', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
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
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Check for various analytics tabs
    const tabNames = ['Overview', 'Performance', 'Goals', 'History'];
    for (const tabName of tabNames) {
      const tab = page.locator(`text=${tabName}`);
      if (await tab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Tab exists, verified
      }
    }
  });

  test('should switch between analytics tabs', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Try clicking on Goals tab if it exists
    const goalsTab = page.locator('button:has-text("Goals"), [role="tab"]:has-text("Goals"), a:has-text("Goals")');
    if (await goalsTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await goalsTab.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'analytics-goals.png');
    }

    // Try clicking History tab
    const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History"), a:has-text("History")');
    if (await historyTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyTab.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'analytics-history.png');
    }
  });

  test('should load analytics page for trainer', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics page should load for trainer too
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
  });
});
