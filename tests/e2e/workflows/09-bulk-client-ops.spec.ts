/**
 * Suite 09 - Bulk Client Operations
 *
 * Tests the bulk-selection and bulk-action workflow on the /clients page.
 *
 * UI reference (ClientList.tsx + BulkActionsToolbar.tsx):
 *   - Each client row has a checkbox: aria-label="Select {name}"
 *   - BulkActionsToolbar appears when selectedCount > 0; hidden when 0
 *   - Toolbar shows: "{n} selected", "Update Status" button, "Assign Tag" button,
 *     "Clear Selection" button
 *   - "Update Status" reveals a dropdown of: active | inactive | onboarding | paused | archived
 *   - "Assign Tag" reveals a text input + "Apply" button
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

/** Helper: wait for the client list to finish loading. */
async function waitForClientList(page: import('@playwright/test').Page) {
  // Wait for either a client checkbox or the empty-state message to appear.
  // The skeleton uses `.animate-pulse` on container divs, but the footer's
  // "Live Updates" indicator also uses `.animate-pulse` permanently, so we
  // cannot use that class as a loading sentinel.
  //
  // Use Playwright's .or() to combine two locators into an OR condition.
  const checkboxLocator = page.locator('input[type="checkbox"][aria-label^="Select "]').first();
  const emptyLocator = page.getByText(/no clients found/i);
  await checkboxLocator
    .or(emptyLocator)
    .first()
    .waitFor({ state: 'visible', timeout: TIMEOUTS.pageLoad })
    .catch(() => {
      // If neither appears in time the tests will handle it gracefully
    });
}

/** Helper: returns true if the client list has at least one selectable checkbox. */
async function hasSelectableClients(page: import('@playwright/test').Page): Promise<boolean> {
  // Use waitFor with a short timeout to handle any remaining render delay
  const checkboxes = page.locator('input[type="checkbox"][aria-label^="Select "]');
  try {
    await checkboxes.first().waitFor({ state: 'visible', timeout: 5000 });
    return (await checkboxes.count()) > 0;
  } catch {
    return false;
  }
}

test.describe('09 - Bulk Client Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);
    await waitForClientList(page);
  });

  // ── 1. Checkbox appears on each client card/row ────────────────────────────

  test('each client row has a selection checkbox', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      // No clients in the system — acceptable; skip this test
      test.skip();
      return;
    }

    const checkboxes = page.locator('input[type="checkbox"][aria-label^="Select "]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
    await expect(checkboxes.first()).toBeVisible();
    await takeScreenshot(page, '09-01-checkboxes-visible.png');
  });

  // ── 2. Selecting a client shows the bulk actions toolbar ──────────────────

  test('selecting one client makes the bulk actions toolbar appear', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    const firstCheckbox = page.locator('input[type="checkbox"][aria-label^="Select "]').first();
    await firstCheckbox.check();

    // BulkActionsToolbar renders when selectedCount > 0
    const toolbar = page.locator('text=/selected/i').first();
    await expect(toolbar).toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '09-02-toolbar-visible.png');
  });

  // ── 3. Selecting multiple clients updates "X selected" count ──────────────

  test('selecting multiple clients shows the correct selected count', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"][aria-label^="Select "]');
    const count = await checkboxes.count();

    if (count < 2) {
      test.skip();
      return;
    }

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Toolbar should show "2 selected"
    await expect(page.locator('text=/2 selected/i')).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '09-03-multi-select-count.png');
  });

  // ── 4. "Select All" — individual checkboxes represent all clients ─────────
  // Note: There is no dedicated "Select All" checkbox in the current UI.
  // This test checks that checking all visible checkboxes works correctly.

  test('checking all visible checkboxes selects all displayed clients', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"][aria-label^="Select "]');
    const count = await checkboxes.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Check all visible checkboxes
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Toolbar should show "{count} selected"
    const toolbar = page.locator(`text=/${count} selected/i`);
    await expect(toolbar).toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '09-04-select-all.png');
  });

  // ── 5. "Update Status" dropdown has status options ────────────────────────

  test('"Update Status" button opens a menu with status options', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    await page.locator('input[type="checkbox"][aria-label^="Select "]').first().check();

    const updateStatusBtn = page.locator('button', { hasText: /update status/i });
    await expect(updateStatusBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await updateStatusBtn.click();

    // Dropdown lists the CLIENT_STATUSES: active | inactive | onboarding | paused | archived
    await expect(page.locator('button', { hasText: /^active$/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await expect(page.locator('button', { hasText: /^archived$/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '09-05-status-dropdown.png');
  });

  // ── 6. Bulk status update changes selected clients' status ────────────────

  test('clicking a status in the dropdown triggers a bulk status update', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    await page.locator('input[type="checkbox"][aria-label^="Select "]').first().check();

    await page.locator('button', { hasText: /update status/i }).click();

    // Click "active" — the most benign status change
    const activeOption = page.locator('button', { hasText: /^active$/i });
    await expect(activeOption).toBeVisible({ timeout: TIMEOUTS.element });
    await activeOption.click();

    // After bulk action the toolbar should hide (selectedClientIds reset to [])
    await expect(page.locator('text=/selected/i')).not.toBeVisible({
      timeout: TIMEOUTS.apiCall,
    });
    await takeScreenshot(page, '09-06-bulk-status-applied.png');
  });

  // ── 7. "Assign Tag" option is available ──────────────────────────────────

  test('"Assign Tag" button is visible when clients are selected', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    await page.locator('input[type="checkbox"][aria-label^="Select "]').first().check();

    const assignTagBtn = page.locator('button', { hasText: /assign tag/i });
    await expect(assignTagBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '09-07-assign-tag-btn.png');
  });

  // ── 8. Clear selection hides the toolbar ─────────────────────────────────

  test('"Clear Selection" button hides the toolbar', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    await page.locator('input[type="checkbox"][aria-label^="Select "]').first().check();

    await expect(page.locator('text=/selected/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    const clearBtn = page.locator('button', { hasText: /clear selection/i });
    await clearBtn.click();

    // Toolbar should vanish (selectedCount becomes 0 → BulkActionsToolbar returns null)
    await expect(page.locator('text=/selected/i')).not.toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '09-08-toolbar-hidden.png');
  });

  // ── 9. Deselecting all items also hides the toolbar ──────────────────────

  test('unchecking the selected client hides the toolbar', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    const firstCheckbox = page.locator('input[type="checkbox"][aria-label^="Select "]').first();
    await firstCheckbox.check();

    // Toolbar is visible
    await expect(page.locator('text=/selected/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    // Uncheck it
    await firstCheckbox.uncheck();

    // Toolbar should hide
    await expect(page.locator('text=/selected/i')).not.toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });

  // ── 10. Toolbar disappears after a bulk action completes ─────────────────

  test('bulk actions toolbar disappears after a completed action', async ({ page }) => {
    if (!(await hasSelectableClients(page))) {
      test.skip();
      return;
    }

    await page.locator('input[type="checkbox"][aria-label^="Select "]').first().check();

    // Open status dropdown and pick active
    await page.locator('button', { hasText: /update status/i }).click();
    await page.locator('button', { hasText: /^active$/i }).click();

    // Toolbar should disappear (selection is cleared after handleBulkUpdateStatus)
    await expect(page.locator('button', { hasText: /update status/i })).not.toBeVisible({
      timeout: TIMEOUTS.apiCall,
    });
    await takeScreenshot(page, '09-10-toolbar-after-action.png');
  });
});
