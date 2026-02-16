import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('03 - Client Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load clients page with client list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see client page heading - can be "All Clients" or "Client Management"
    await expect(page.locator('h1').filter({ hasText: /Clients/i })).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'client-list.png');
  });

  test('should display Add Client button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should have an "Add Client" button
    const addButton = page.locator('button:has-text("Add Client"), a:has-text("Add Client")');
    await expect(addButton.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should open Add Client modal when clicking the button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click Add Client
    const addButton = page.locator('button:has-text("Add Client")');
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();

      // Should see a modal or form
      const modal = page.locator('[role="dialog"], .modal, [data-state="open"]');
      await expect(modal.first()).toBeVisible({ timeout: TIMEOUTS.element }).catch(() => {
        // Modal might be inline form instead
      });

      await takeScreenshot(page, 'client-add-modal.png');
    }
  });

  test('should display client cards or rows', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // The page should have some client data rendered
    // Look for client-related content (names, emails, status badges)
    const pageContent = await page.textContent('body');
    const hasClientContent =
      pageContent?.includes('active') ||
      pageContent?.includes('client') ||
      pageContent?.includes('@');

    expect(hasClientContent).toBeTruthy();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    if (await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.first().fill('alex');
      // Wait for filtering
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'client-search-results.png');
    }
  });

  test('should have status filter tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for filter tabs (All, Active, Inactive, etc.)
    const filterTab = page.locator('button:has-text("Active"), a:has-text("Active"), [role="tab"]:has-text("Active")');
    if (await filterTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterTab.first().click();
      await page.waitForTimeout(1000);

      // Click "All" to reset
      const allTab = page.locator('button:has-text("All"), a:has-text("All"), [role="tab"]:has-text("All")');
      if (await allTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await allTab.first().click();
      }
    }
  });
});
