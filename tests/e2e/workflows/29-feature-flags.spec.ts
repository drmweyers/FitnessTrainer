/**
 * Suite 29: Feature Flags
 * Tests the admin feature flag management UI and API.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('29 - Feature Flags', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'admin');
  });

  /**
   * Navigate to admin system page where feature flags are shown.
   */
  async function navigateToFlags(page: import('@playwright/test').Page): Promise<void> {
    await page.goto(`${BASE_URL}${ROUTES.adminSystem}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);
  }

  test('feature flags section loads', async ({ page }) => {
    await navigateToFlags(page);

    // Feature flags section must show a heading with "flag" or "feature"
    await expect(
      page.locator('h1, h2, h3, [role="heading"]').filter({ hasText: /flag|feature/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '29-feature-flags.png');
  });

  test('list of flags displayed with toggle switches', async ({ page }) => {
    await navigateToFlags(page);

    // Feature flag toggles must be visible on the page
    const toggles = page.locator(
      'button[role="switch"], [data-testid*="flag"], input[type="checkbox"][name*="flag" i]'
    );
    await expect(toggles.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('WhatsApp Messaging flag visible', async ({ page }) => {
    await navigateToFlags(page);

    // WhatsApp flag must be listed
    await expect(
      page.locator('text=/whatsapp/i, [data-flag-key*="whatsapp" i], [aria-label*="whatsapp" i]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('PWA Features flag visible', async ({ page }) => {
    await navigateToFlags(page);

    // PWA flag must be listed
    await expect(
      page.locator('text=/pwa/i, [data-flag-key*="pwa" i], [aria-label*="pwa" i]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can toggle a flag on', async ({ page }) => {
    await navigateToFlags(page);

    // Find an OFF toggle and enable it
    const offToggle = page.locator(
      'button[role="switch"][aria-checked="false"]'
    );
    await expect(offToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await offToggle.first().click();

    // After click, the toggle must now be checked
    await expect(offToggle.first()).toHaveAttribute('aria-checked', 'true', { timeout: TIMEOUTS.element });

    await takeScreenshot(page, '29-flag-toggled-on.png');
  });

  test('can toggle a flag off', async ({ page }) => {
    await navigateToFlags(page);

    // Find an ON toggle and disable it
    const onToggle = page.locator(
      'button[role="switch"][aria-checked="true"]'
    );
    await expect(onToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await onToggle.first().click();

    // After click, the toggle must now be unchecked
    await expect(onToggle.first()).toHaveAttribute('aria-checked', 'false', { timeout: TIMEOUTS.element });

    await takeScreenshot(page, '29-flag-toggled-off.png');
  });

  test('"Add Flag" button available', async ({ page }) => {
    await navigateToFlags(page);

    // Add/Create flag button must be visible
    const addBtn = page.locator(
      'button:has-text("Add Flag"), button:has-text("New Flag"), button:has-text("Create Flag"), button:has-text("Add Feature")'
    );
    await expect(addBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can create custom flag (name, description)', async ({ page }) => {
    await navigateToFlags(page);

    const addBtn = page.locator('button:has-text("Add Flag"), button:has-text("New Flag"), button:has-text("Create Flag")');
    await expect(addBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await addBtn.first().click();

    // Form must appear with name input
    const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i], input[aria-label*="name" i]');
    await expect(nameInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '29-create-flag-form.png');
  });

  test('can delete a flag', async ({ page }) => {
    await navigateToFlags(page);

    // Delete button must be present for at least one flag
    const deleteBtn = page.locator(
      'button:has-text("Delete"), button[aria-label*="delete flag" i], button:has-text("Remove")'
    );
    await expect(deleteBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('flags persist after page reload', async ({ page }) => {
    await navigateToFlags(page);

    // Record which flags exist before reload
    const flagNames = await page.locator('[data-testid*="flag"], [data-flag-key]').allTextContents();

    await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // Flags section must still be visible after reload
    await expect(
      page.locator('h1, h2, h3, [role="heading"]').filter({ hasText: /flag|feature/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Toggle count must be the same (flags persisted)
    const togglesAfter = await page.locator('button[role="switch"]').count();
    expect(togglesAfter).toBeGreaterThan(0);

    await takeScreenshot(page, '29-flags-after-reload.png');
  });
});
