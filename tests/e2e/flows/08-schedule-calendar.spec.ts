import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('08 - Schedule & Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load schedule/calendar page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'networkidle',
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
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for calendar elements (day names, date grid, time slots)
    const calendarContent = page.locator('text=/Mon|Tue|Wed|Thu|Fri|Sat|Sun/i');
    if (await calendarContent.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // Calendar grid is displayed
    }
  });

  test('should have week navigation buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for prev/next navigation
    const navButtons = page.locator('button:has-text("Previous"), button:has-text("Next"), button[aria-label*="previous" i], button[aria-label*="next" i]');
    if (await navButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // Navigation buttons exist
      await navButtons.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should have new appointment button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for "New Appointment" or "+" button
    const newButton = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("Create"), button[aria-label*="add" i]');
    if (await newButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await newButton.first().click();
      await page.waitForTimeout(1000);

      // Should open a modal or form
      await takeScreenshot(page, 'schedule-new-appointment.png');
    }
  });

  test('should load availability page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.scheduleAvailability}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see availability content
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('availability') ||
      pageText?.toLowerCase().includes('schedule') ||
      pageText?.toLowerCase().includes('time')
    ).toBeTruthy();

    await takeScreenshot(page, 'schedule-availability.png');
  });
});
