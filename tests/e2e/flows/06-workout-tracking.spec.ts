import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('06 - Workout Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load workouts hub page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see workout-related content
    await expect(page.locator('text=/workout/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'workouts-hub.png');
  });

  test('should navigate to workout history', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show history page
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('history') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('completed')
    ).toBeTruthy();

    await takeScreenshot(page, 'workout-history.png');
  });

  test('should navigate to workout builder', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsBuilder}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show builder page
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('builder') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('create') ||
      pageText?.toLowerCase().includes('exercise')
    ).toBeTruthy();

    await takeScreenshot(page, 'workout-builder.png');
  });

  test('should navigate to workout tracker', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show tracker interface
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('track') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('start') ||
      pageText?.toLowerCase().includes('log')
    ).toBeTruthy();

    await takeScreenshot(page, 'workout-tracker.png');
  });

  test('should have navigation links between workout pages', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should have links to history, builder, or tracker
    const navLinks = page.locator('a[href*="workout"]');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
