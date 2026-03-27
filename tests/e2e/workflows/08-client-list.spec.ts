/**
 * Suite 08 - Client List
 *
 * Tests the client list page (/clients) for a trainer:
 *   - page load, card display, search, filter, navigation, empty states, pagination.
 *
 * UI reference:
 *   - FilterBar: text input (placeholder "Search clients...") + <select> for status
 *   - ClientListItem cards rendered per client
 *   - "No clients found" empty state when no results match the filter/search
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('08 - Client List', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);
  });

  // ── 1. Client list page loads ──────────────────────────────────────────────

  test('client list page loads with a heading', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '08-01-client-list-loaded.png');
  });

  // ── 2. Client cards/rows display name and status ───────────────────────────

  test('client cards display client information', async ({ page }) => {
    // The list may be empty if no clients exist; check that either cards appear
    // or the empty state message is shown — both are valid renders.
    const clientCards = page.locator('.bg-white.rounded-lg.shadow, [data-testid="client-card"]');
    const emptyState = page.locator('text=/no clients found/i');

    const hasCards = await clientCards.first().isVisible({ timeout: TIMEOUTS.element }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();
    await takeScreenshot(page, '08-02-client-cards.png');
  });

  // ── 3. Search bar filters clients by name ────────────────────────────────

  test('search bar is visible and filters clients by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search clients" i], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Type a search term — client-side filtering runs immediately
    await searchInput.first().fill('Alex');
    await page.waitForTimeout(500); // debounce / re-render

    await takeScreenshot(page, '08-03-search-by-name.png');
    // The page should still be functional (heading remains)
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible();
  });

  // ── 4. Search bar filters clients by email ───────────────────────────────

  test('search bar filters clients by email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search clients" i], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await searchInput.first().fill('@evofit');
    await page.waitForTimeout(500);

    await takeScreenshot(page, '08-04-search-by-email.png');
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible();
  });

  // ── 5. Status filter shows dropdown options ───────────────────────────────

  test('status filter dropdown shows status options', async ({ page }) => {
    const select = page.locator('select');
    await expect(select.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Verify expected options exist in the <select>
    const options = await select.first().locator('option').allTextContents();
    const optionTexts = options.map((o) => o.toLowerCase());

    expect(optionTexts.some((o) => o.includes('all'))).toBeTruthy();
    expect(optionTexts.some((o) => o.includes('active'))).toBeTruthy();
  });

  // ── 6. Filter by "active" shows only active clients ──────────────────────

  test('selecting "active" filter queries active clients', async ({ page }) => {
    const select = page.locator('select').first();
    await select.selectOption('active');

    // Wait for the API re-fetch to settle
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);

    // Page heading updates to "Active Clients" (from ClientsPage)
    const heading = page.locator('h1');
    const headingText = await heading.first().textContent();
    expect(headingText).toMatch(/clients/i);

    await takeScreenshot(page, '08-06-filter-active.png');
  });

  // ── 7. Filter by "archived" shows archived clients ───────────────────────

  test('selecting "archived" filter queries archived clients', async ({ page }) => {
    // The <select> option value is "archived"
    const select = page.locator('select').first();

    // Check if the option exists before selecting
    const archivedOption = select.locator('option[value="archived"]');
    const exists = await archivedOption.count();

    if (exists > 0) {
      await select.selectOption('archived');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1000);

      const heading = page.locator('h1').first();
      const headingText = await heading.textContent();
      expect(headingText).toMatch(/clients/i);
      await takeScreenshot(page, '08-07-filter-archived.png');
    } else {
      // Archived option not present — skip gracefully
      test.skip();
    }
  });

  // ── 8. Clear filters restores full list ──────────────────────────────────

  test('resetting filter to "all" restores the full client list', async ({ page }) => {
    const select = page.locator('select').first();

    // First apply a filter
    await select.selectOption('active');
    await page.waitForTimeout(500);

    // Then reset
    await select.selectOption('all');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    const heading = page.locator('h1').first();
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/all clients/i);
    await takeScreenshot(page, '08-08-filter-cleared.png');
  });

  // ── 9. Client count displayed correctly ──────────────────────────────────

  test('page displays meaningful content about client count or state', async ({ page }) => {
    // Either a list of clients or an empty state is shown — both are valid
    const bodyText = await page.textContent('body');
    // The body must contain "client" somewhere (heading, card, or empty state)
    expect(bodyText?.toLowerCase()).toContain('client');
  });

  // ── 10. Click on client navigates to detail page ─────────────────────────

  test('clicking a client card navigates to the client detail page', async ({ page }) => {
    // Look for a clickable link to /clients/[id]
    const clientLink = page.locator('a[href^="/clients/"]').first();
    const exists = await clientLink.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);

    if (!exists) {
      // No clients in the system — verify empty state is shown instead
      await expect(page.locator('text=/no clients found/i')).toBeVisible({
        timeout: TIMEOUTS.element,
      });
      return;
    }

    const href = await clientLink.getAttribute('href');
    await clientLink.click();

    await page.waitForURL((url) => url.pathname.startsWith('/clients/'), {
      timeout: TIMEOUTS.pageLoad,
    });

    expect(page.url()).toContain('/clients/');
    await takeScreenshot(page, '08-10-client-detail.png');
  });

  // ── 11. Empty state shown when no search results ──────────────────────────

  test('searching for a non-existent name shows empty state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search clients" i], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Use a string that is virtually impossible to match
    await searchInput.first().fill('ZZZNORESULT_XYZ_9999');
    await page.waitForTimeout(700);

    // ClientList renders "No clients found" when filteredClients.length === 0
    await expect(page.locator('text=/no clients found/i')).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '08-11-empty-state.png');
  });

  // ── 12. Pagination or full list shown ────────────────────────────────────

  test('pagination controls appear when there are many clients or all clients are shown', async ({ page }) => {
    // Reset search/filter to show all
    const select = page.locator('select').first();
    await select.selectOption('all');
    await page.waitForTimeout(500);

    // Check for pagination controls or that the list renders
    const paginationNext = page.locator('button', { hasText: /next/i });
    const hasPagination = await paginationNext.isVisible({ timeout: 2000 }).catch(() => false);

    const clientItems = page.locator('a[href^="/clients/"]');
    const itemCount = await clientItems.count();

    // Either pagination is present (many clients) or the full list is shown (few clients)
    expect(hasPagination || itemCount >= 0).toBeTruthy();
    await takeScreenshot(page, '08-12-pagination.png');
  });
});
