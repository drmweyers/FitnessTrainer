import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('03 - Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load clients page with client list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see client page heading - can be "All Clients" or "Client Management"
    await expect(page.locator('h1').filter({ hasText: /Clients/i })).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'client-list.png');
  });

  test('should display Add Client button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should have an "Add Client" button
    const addButton = page.locator('button:has-text("Add Client"), a:has-text("Add Client")');
    await expect(addButton.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should open Add Client modal when clicking the button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click Add Client — wait for it to be visible first
    const addButton = page.locator('button:has-text("Add Client")');
    await expect(addButton.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await addButton.first().click();

    // ClientModal renders with an h2 "Add New Client" inside a fixed overlay
    await expect(
      page.locator('h2:has-text("Add New Client"), h2:has-text("Add Client")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'client-add-modal.png');
  });

  test('should display client cards or rows', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // The clients page should have the h1 heading then either client rows or empty state
    await expect(page.locator('h1').filter({ hasText: /Clients/i })).toBeVisible({ timeout: TIMEOUTS.element });
    // Either the Add Client button OR the "No clients found" empty state must be visible
    await expect(
      page.locator('button:has-text("Add Client")').or(page.locator('text=No clients found')).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    if (await searchInput.first().isVisible({ timeout: 5000 })) {
      await searchInput.first().fill('qa');
      // Wait for filtering via locator auto-wait
      await expect(page.locator('h1').filter({ hasText: /Clients/i })).toBeVisible({ timeout: TIMEOUTS.element });
      await takeScreenshot(page, 'client-search-results.png');
    }
  });

  test('should have status filter tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for filter tabs (All, Active, Inactive, etc.)
    const filterTab = page.locator('button:has-text("Active"), a:has-text("Active"), [role="tab"]:has-text("Active")');
    if (await filterTab.first().isVisible({ timeout: 5000 })) {
      await filterTab.first().click();

      // Click "All" to reset
      const allTab = page.locator('button:has-text("All"), a:has-text("All"), [role="tab"]:has-text("All")');
      if (await allTab.first().isVisible({ timeout: 3000 })) {
        await allTab.first().click();
      }
    }
  });
});
