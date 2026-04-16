import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('06 - Workout Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load workouts hub page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see "Workouts" heading
    await expect(page.locator('h1:has-text("Workouts")')).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'workouts-hub.png');
  });

  test('should navigate to workout history', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show history page heading
    await expect(
      page.locator('h1:has-text("History"), h1:has-text("Workout History"), h2:has-text("History")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'workout-history.png');
  });

  test('should navigate to workout builder', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsBuilder}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show builder page heading
    await expect(
      page.locator('h1:has-text("Builder"), h1:has-text("Workout"), h2:has-text("Builder")').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'workout-builder.png');
  });

  test('should navigate to workout tracker', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Workout tracker renders DailyWorkoutView with an h1 heading like "Today Workouts"
    // or the execution screen — either way an h1 or h2 is present
    await expect(page.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'workout-tracker.png');
  });

  test('should have navigation links between workout pages', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should have links to history, builder, or tracker
    const navLinks = page.locator('a[href*="workout"]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
