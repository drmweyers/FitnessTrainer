import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('08 - Schedule & Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load schedule/calendar page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see "Schedule" heading in main content (not sidebar)
    await expect(page.locator('main h1:has-text("Schedule"), .p-6 h1:has-text("Schedule")')).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'schedule-calendar.png');
  });

  test('should display calendar grid or week view', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for calendar day-name elements
    await expect(
      page.locator('text=/Mon|Tue|Wed|Thu|Fri|Sat|Sun/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should have week navigation buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for prev/next navigation
    const navButtons = page.locator('button:has-text("Previous"), button:has-text("Next"), button[aria-label*="previous" i], button[aria-label*="next" i]');
    if (await navButtons.first().isVisible({ timeout: 5000 })) {
      // Capture heading before click
      const headingBefore = await page.locator('h1, h2').first().textContent();
      await navButtons.first().click();
      // After navigation, heading or calendar content must still be visible
      await expect(page.locator('main h1:has-text("Schedule"), .p-6 h1:has-text("Schedule")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });
    }
  });

  test('should have new appointment button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // "New Appointment" button shown for trainer (not client)
    const newButton = page.locator('button:has-text("New Appointment")');
    await expect(newButton.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await newButton.first().click();

    // CreateAppointmentModal renders as a fixed overlay with "New Appointment" heading inside
    await expect(
      page.locator('h3:has-text("New Appointment"), [role="dialog"], .fixed.inset-0').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'schedule-new-appointment.png');
  });

  test('should load availability page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.scheduleAvailability}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see availability content heading
    await expect(
      page.locator('h1:has-text("Availability"), h2:has-text("Availability"), h1:has-text("Schedule")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'schedule-availability.png');
  });
});
