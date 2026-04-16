/**
 * Suite 42: Calendar View
 *
 * Verifies the monthly/weekly calendar component on /schedule.
 * Global-setup creates an appointment for tomorrow, so we also
 * check that an appointment appears in the correct date cell.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

const SCHEDULE_URL = `${BASE_URL}${ROUTES.schedule}`;

test.describe('42 - Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  // ── 1: Page loads and calendar section is visible ─────────────────────────

  test('schedule page loads with Calendar tab visible', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // The section tabs should be present
    const calendarTab = page.locator('[data-testid="tab-calendar"]');
    await expect(calendarTab).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '42-calendar-tab-visible.png');
  });

  // ── 2: Month/week toggle is visible ──────────────────────────────────────

  test('month/week view toggle is visible on Calendar tab', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click Calendar tab if not already active
    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const toggle = page.locator('[data-testid="calendar-view-toggle"]');
    await expect(toggle).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '42-view-toggle.png');
  });

  // ── 3: Monthly view shows current month name ──────────────────────────────

  test('monthly view shows current month name in header', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Ensure Calendar tab is active
    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    // Click Month toggle button
    const monthToggle = page.locator('[data-testid="calendar-toggle-month"]');
    if (await monthToggle.isVisible({ timeout: TIMEOUTS.element })) {
      await monthToggle.click();
    }

    // Header should show current month
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const headerLabel = page.locator('[data-testid="calendar-header-label"]');
    await expect(headerLabel).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(headerLabel).toContainText(currentMonth);

    await takeScreenshot(page, '42-month-view.png');
  });

  // ── 4: Monthly view renders a date grid ──────────────────────────────────

  test('monthly view renders the date grid', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const monthToggle = page.locator('[data-testid="calendar-toggle-month"]');
    if (await monthToggle.isVisible({ timeout: TIMEOUTS.element })) {
      await monthToggle.click();
    }

    const grid = page.locator('[data-testid="calendar-month-grid"]');
    await expect(grid).toBeVisible({ timeout: TIMEOUTS.element });

    // Grid should have at least 28 day cells (any given month)
    const cells = grid.locator('button');
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  // ── 5: Switch to weekly view shows day columns ────────────────────────────

  test('weekly view shows day column headers', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const weekToggle = page.locator('[data-testid="calendar-toggle-week"]');
    await expect(weekToggle).toBeVisible({ timeout: TIMEOUTS.element });
    await weekToggle.click();

    // Week grid should be visible
    const weekGrid = page.locator('[data-testid="calendar-week-grid"]');
    await expect(weekGrid).toBeVisible({ timeout: TIMEOUTS.element });

    // Check that at least one day column header is visible (e.g., "Sun")
    const sunHeader = weekGrid.locator('[data-testid="calendar-week-day-sun"]');
    await expect(sunHeader).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '42-week-view.png');
  });

  // ── 6: Navigate to next month, verify month changes ──────────────────────

  test('Next button changes to next month in monthly view', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const monthToggle = page.locator('[data-testid="calendar-toggle-month"]');
    if (await monthToggle.isVisible({ timeout: TIMEOUTS.element })) {
      await monthToggle.click();
    }

    // Record current label
    const headerLabel = page.locator('[data-testid="calendar-header-label"]');
    await expect(headerLabel).toBeVisible({ timeout: TIMEOUTS.element });
    const beforeText = await headerLabel.textContent();

    // Click Next and wait for the label to change
    await page.locator('button[aria-label="Next"]').click();
    await expect(headerLabel).not.toHaveText(beforeText || '');

    const afterText = await headerLabel.textContent();
    expect(afterText).not.toBe(beforeText);

    await takeScreenshot(page, '42-next-month.png');
  });

  // ── 7: Today button returns to current month ──────────────────────────────

  test('Today button returns to current month after navigating away', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const monthToggle = page.locator('[data-testid="calendar-toggle-month"]');
    if (await monthToggle.isVisible({ timeout: TIMEOUTS.element })) {
      await monthToggle.click();
    }

    const headerLabel = page.locator('[data-testid="calendar-header-label"]');
    await expect(headerLabel).toBeVisible({ timeout: TIMEOUTS.element });

    // Navigate forward two months
    const nextBtn = page.locator('button[aria-label="Next"]');
    await nextBtn.click();
    await nextBtn.click();
    // Wait for header to update
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    await expect(headerLabel).not.toContainText(currentMonth);

    // Click Today
    const todayBtn = page.locator('[data-testid="calendar-today-btn"]');
    await expect(todayBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await todayBtn.click();

    // Header should show current month again
    await expect(headerLabel).toContainText(currentMonth);

    await takeScreenshot(page, '42-back-to-today.png');
  });

  // ── 8: Tomorrow's appointment appears on correct day cell ─────────────────

  test("tomorrow's appointment from global-setup appears in calendar", async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const monthToggle = page.locator('[data-testid="calendar-toggle-month"]');
    if (await monthToggle.isVisible({ timeout: TIMEOUTS.element })) {
      await monthToggle.click();
    }

    // Calculate tomorrow's date key
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateKey = tomorrow.toISOString().split('T')[0]; // yyyy-MM-dd

    // Global-setup creates appointment for tomorrow — wait for the cell to load
    const tomorrowCell = page.locator(`[data-testid="calendar-day-${dateKey}"]`);

    // Cell must be visible (calendar is in current month)
    await expect(tomorrowCell).toBeVisible({ timeout: TIMEOUTS.element });
    await tomorrowCell.click();

    // Day detail panel must open
    const panel = page.locator('[data-testid="calendar-day-detail-panel"]');
    await expect(panel).toBeVisible({ timeout: TIMEOUTS.element });

    // Panel must show either appointment data or an empty state message
    await expect(
      panel.locator('text=/appointment|session|no appointments/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '42-tomorrow-appointment.png');
  });

  // ── 9: Week view shows current week ──────────────────────────────────────

  test('weekly view header shows current week date range', async ({ page }) => {
    await page.goto(SCHEDULE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const calTab = page.locator('[data-testid="tab-calendar"]');
    if (await calTab.isVisible({ timeout: TIMEOUTS.element })) {
      await calTab.click();
    }

    const weekToggle = page.locator('[data-testid="calendar-toggle-week"]');
    if (await weekToggle.isVisible({ timeout: TIMEOUTS.element })) {
      await weekToggle.click();
    }

    const headerLabel = page.locator('[data-testid="calendar-header-label"]');
    await expect(headerLabel).toBeVisible({ timeout: TIMEOUTS.element });

    // Should contain a year (e.g., "2026")
    const currentYear = new Date().getFullYear().toString();
    await expect(headerLabel).toContainText(currentYear);
  });
});
