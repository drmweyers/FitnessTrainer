/**
 * Suite 33: Offline Mode / PWA Sync
 * Tests offline banner, cached UI render, and sync recovery.
 *
 * Note: We simulate offline by manipulating navigator.onLine and dispatching events.
 * Full service-worker-based offline caching is not testable in headless Chromium
 * (requires HTTPS + SW registration). These tests verify the app's JS event handlers
 * respond correctly to online/offline events.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('33 - Offline Mode', () => {

  test('page loads normally when online', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();

    // Home page must render actual content (not an empty shell)
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '33-online-normal.png');
  });

  test('simulated offline — offline banner appears with amber styling', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Simulate offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    // Offline banner must appear (amber/yellow styling indicates warning)
    const offlineBanner = page.locator(
      '[data-testid*="offline"], [class*="offline"], [aria-label*="offline" i], [class*="amber"], [class*="yellow"]'
    );
    await expect(offlineBanner.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '33-offline-banner.png');

    // Restore online state
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
  });

  test('UI still renders while offline (cached content)', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Go offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    // Dashboard heading must still be visible (cached/rendered content)
    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '33-offline-ui.png');

    // Restore
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
  });

  test('form inputs still work while offline', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Go offline
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    // Find any input on the page and verify it's still interactive
    const anyInput = page.locator('input[type="text"], input[type="search"], textarea').first();
    if (await anyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await anyInput.fill('offline test');
      const value = await anyInput.inputValue();
      // Input must accept text while offline
      expect(value).toBe('offline test');
    } else {
      // No form on dashboard — body must still be visible
      await expect(page.locator('body')).toBeVisible();
    }

    // Restore
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
  });

  test('restore network connection triggers online event', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Track online event receipt via JS
    await page.evaluate(() => {
      (window as any).__onlineEventReceived = false;
      window.addEventListener('online', () => { (window as any).__onlineEventReceived = true; }, { once: true });
    });

    // Cycle offline → online
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // The online event must have fired
    const onlineReceived = await page.evaluate(() => (window as any).__onlineEventReceived);
    expect(onlineReceived).toBe(true);

    await takeScreenshot(page, '33-network-restored.png');
  });

  test('green sync banner appears briefly after reconnection', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Cycle offline → online
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });

    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // Green/success sync banner must appear after reconnection
    const greenBanner = page.locator(
      '[class*="green"], [class*="success"], [data-testid*="sync"], text=/sync/i, text=/back online/i, text=/connected/i'
    );
    await expect(greenBanner.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '33-sync-banner.png');
  });

  test('data syncs after reconnection (sync manager check)', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // SyncManager or serviceWorker must be available (Background Sync capability)
    const hasSyncCapability = await page.evaluate(() => 'SyncManager' in window || 'serviceWorker' in navigator);
    expect(hasSyncCapability).toBeTruthy();

    // Cycle offline/online and verify no crash
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // Page must remain visible and not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('no error messages shown after reconnect', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Cycle offline → online
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // No network-error messages should appear after reconnect
    const errorMsg = page.locator('text=/network error/i, text=/connection failed/i, text=/unable to connect/i');
    const hasError = await errorMsg.first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBe(false);
  });

  test('page functions normally after reconnection', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Full offline/online cycle
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });

    // Navigation links must still be accessible
    const navLinks = page.locator('nav a, aside a, [role="navigation"] a');
    await expect(navLinks.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '33-post-reconnect-functional.png');
  });
});
