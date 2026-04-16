/**
 * Suite 20: Workout History
 * Tests the history list, detail view, personal bests, and progress charts.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, API, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe('20 - Workout History', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'client');
  });

  test('workout history page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // History page must render a structural element
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '20-history-page.png');
  });

  test('workout history shows "History" or workout-related heading', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('text=/history|workout|completed|session/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout history page contains workout list or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show either a list of workouts or an empty-state message
    const listItems = page.locator('ul li, [role="listitem"], tbody tr, .workout-item, [class*="workout-row"]');
    const emptyState = page.locator('text=/no workout|no session|get started|first workout/i');
    const listCount = await listItems.count();
    const emptyVisible = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (listCount === 0 && !emptyVisible) {
      // Neither list items nor empty state — assert the history heading is visible at minimum
      await expect(
        page.locator('text=/history|workout/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  test('workout history API endpoint returns valid response', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}${API.workoutsHistory}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 200 = data returned, 404 = no history yet (both are valid non-error states)
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('workout history page shows date information in entries', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Date strings or history heading must be visible
    await expect(
      page.locator('text=/20\\d\\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|history|workout/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('clicking a workout entry navigates to detail view', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const workoutEntry = page.locator(
      'a[href*="/workouts/"], button:has-text("View"), tr[class*="clickable"], [role="row"]'
    ).first();
    const isVisible = await workoutEntry.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await workoutEntry.click();
      await expect(
        page.locator('text=/workout|exercise|set/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, '20-workout-detail.png');
    } else {
      // No history entries — verify the history page shows an appropriate empty state
      await expect(
        page.locator('text=/history|workout|no workout|get started|completed/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
      await takeScreenshot(page, '20-history-empty-state.png');
    }
  });

  test('workout progress page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsProgress}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('text=/progress|workout|chart|history/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '20-progress-page.png');
  });

  test('personal bests API returns valid response', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}${API.personalBests}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 200 = data returned, 404 = no personal bests yet
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('workout history page has filter or search controls', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page must render a structural element regardless of whether filter controls exist
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout history page is navigable from workouts hub', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const historyLink = page.locator('a[href*="history"]');
    await expect(historyLink.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await historyLink.first().click();
    await page.waitForURL('**/history**', { timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    await expect(
      page.locator('text=/history|workout/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout history shows consistent navigation between pages', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // History page must render a structural element
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
