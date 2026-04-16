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

    // At least one analytics tab must be visible
    await expect(
      page.locator('[role="tab"]:has-text("Overview"), [role="tab"]:has-text("Performance"), [role="tab"]:has-text("Goals")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should switch between analytics tabs', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Try clicking on Goals tab if it exists
    const goalsTab = page.locator('button:has-text("Goals"), [role="tab"]:has-text("Goals"), a:has-text("Goals")');
    if (await goalsTab.first().isVisible({ timeout: 5000 })) {
      await goalsTab.first().click();
      // After click, Goals tab content should be active — wait for it
      await expect(
        page.locator('[role="tab"][aria-selected="true"]:has-text("Goals"), [aria-selected="true"]:has-text("Goals")').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
      await takeScreenshot(page, 'analytics-goals.png');
    }

    // Try clicking History tab
    const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History"), a:has-text("History")');
    if (await historyTab.first().isVisible({ timeout: 3000 })) {
      await historyTab.first().click();
      await expect(
        page.locator('[role="tab"][aria-selected="true"]:has-text("History"), text=/history|measurement/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
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

    // Analytics page should load for trainer with a heading
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
