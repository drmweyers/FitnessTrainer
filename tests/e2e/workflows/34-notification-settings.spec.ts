/**
 * Suite 34: Notification Settings
 * Tests push notification toggles, category settings, quiet hours, and persistence.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('34 - Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  /**
   * Navigate to the notification settings page.
   * Returns the route that was found, or throws if none found.
   */
  async function navigateToNotifications(page: import('@playwright/test').Page): Promise<string> {
    const notifRoutes = [
      '/settings/notifications',
      '/settings',
      '/profile/settings',
      ROUTES.profile,
      ROUTES.profileEdit,
    ];

    for (const route of notifRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const pageText = await page.textContent('body');
      const is404 = pageText?.toLowerCase().includes('page not found') || pageText?.toLowerCase().includes('404');
      if (
        !is404 &&
        (pageText?.toLowerCase().includes('notification') || pageText?.toLowerCase().includes('push notification'))
      ) {
        return route;
      }
    }
    throw new Error('Notification settings page not found at any known route');
  }

  test('settings/notification page or section loads', async ({ page }) => {
    const route = await navigateToNotifications(page);

    // Notification settings heading must be visible
    await expect(
      page.locator('h1, h2, h3, [role="heading"]').filter({ hasText: /notification|setting|preference/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '34-notification-settings.png');
  });

  test('push notification toggle visible', async ({ page }) => {
    await navigateToNotifications(page);

    // Push notification toggle must be present
    const pushToggle = page.locator(
      'input[type="checkbox"][name*="push" i], button[role="switch"][aria-label*="push" i], [data-testid*="push-notification"], label:has-text("Push Notification")'
    );
    await expect(pushToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('category checkboxes visible (workouts, messages, PRs, scheduling)', async ({ page }) => {
    await navigateToNotifications(page);

    // Notification category checkboxes must be present
    const categoryCheckboxes = page.locator(
      'input[type="checkbox"][name*="workout" i], input[type="checkbox"][name*="message" i], input[type="checkbox"][name*="schedule" i]'
    );
    await expect(categoryCheckboxes.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('quiet hours configuration available', async ({ page }) => {
    await navigateToNotifications(page);

    // Quiet hours section must be present
    const quietHours = page.locator(
      '[data-testid*="quiet-hours"], text=/quiet hours/i, text=/do not disturb/i, [aria-label*="quiet" i]'
    );
    await expect(quietHours.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('start/end time pickers for quiet hours', async ({ page }) => {
    await navigateToNotifications(page);

    // Time pickers for quiet hours start/end must be present
    const timePicker = page.locator(
      'input[type="time"][name*="start" i], input[type="time"][name*="end" i], [aria-label*="start time" i], [aria-label*="end time" i]'
    );
    await expect(timePicker.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('"Test Notification" button visible', async ({ page }) => {
    await navigateToNotifications(page);

    // Test notification button must be visible on the settings page
    const testBtn = page.locator(
      'button:has-text("Test Notification"), button:has-text("Test"), button[aria-label*="test notification" i]'
    );
    await expect(testBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('toggle state persists after page reload', async ({ page }) => {
    const route = await navigateToNotifications(page);

    // Find a toggle and record its initial state
    const toggle = page.locator('input[type="checkbox"], button[role="switch"]').first();
    await expect(toggle).toBeVisible({ timeout: TIMEOUTS.element });
    const initialChecked = await toggle.isChecked().catch(() => false);

    // Toggle it
    await toggle.click();
    await expect(page.locator('[data-testid*="save-success"], text=/saved|updated/i').first()).toBeVisible({ timeout: TIMEOUTS.element }).catch(() => {});

    // Reload the page
    await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Toggle state must differ from the original (change persisted)
    const reloadedToggle = page.locator('input[type="checkbox"], button[role="switch"]').first();
    await expect(reloadedToggle).toBeVisible({ timeout: TIMEOUTS.element });
    const afterChecked = await reloadedToggle.isChecked();
    expect(afterChecked).toBe(!initialChecked);

    await takeScreenshot(page, '34-toggle-persisted.png');
  });

  test('can disable all notifications', async ({ page }) => {
    await navigateToNotifications(page);

    // Master disable toggle must be present
    const masterToggle = page.locator(
      'input[type="checkbox"][name*="all" i], button[role="switch"][aria-label*="all notification" i], label:has-text("Disable All"), label:has-text("All Notifications")'
    );
    await expect(masterToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
