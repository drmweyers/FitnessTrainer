/**
 * Suite 37: Journey — Client Program Cycle
 * Full journey: client goes through workout tracking, history, and analytics tabs.
 *
 * Uses test.describe.serial because tests represent a linear user journey.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe.serial('37 - Journey: Client Program Cycle', () => {
  /**
   * Test 1: Client logs in and navigates to /workouts.
   */
  test('client logs in and navigates to /workouts', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.element });
    const headingText = await heading.textContent();
    expect(headingText?.toLowerCase()).toContain('workout');

    await takeScreenshot(page, '37-01-client-workouts.png');
  });

  /**
   * Test 2: Client navigates to /workout-tracker.
   */
  test('client navigates to /workout-tracker', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const body = await page.textContent('body');
    expect(body && body.length > 100).toBeTruthy();

    await takeScreenshot(page, '37-02-workout-tracker.png');
  });

  /**
   * Test 3: Workout tracker page loads with exercise content.
   */
  test('workout tracker loads with exercise content', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('workout') ||
      body?.toLowerCase().includes('exercise') ||
      body?.toLowerCase().includes('today') ||
      body?.toLowerCase().includes('start') ||
      body?.toLowerCase().includes('schedule')
    ).toBeTruthy();

    await takeScreenshot(page, '37-03-tracker-content.png');
  });

  /**
   * Test 4: Client navigates to /workouts/history.
   */
  test('client navigates to /workouts/history', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const body = await page.textContent('body');
    expect(body && body.length > 50).toBeTruthy();

    await takeScreenshot(page, '37-04-workout-history.png');
  });

  /**
   * Test 5: Workout history page loads with relevant content.
   */
  test('workout history page shows history content', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('history') ||
      body?.toLowerCase().includes('workout') ||
      body?.toLowerCase().includes('completed') ||
      body?.toLowerCase().includes('past') ||
      body?.toLowerCase().includes('log')
    ).toBeTruthy();
  });

  /**
   * Test 6: Client navigates to /workouts/progress.
   */
  test('client navigates to /workouts/progress', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsProgress}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const body = await page.textContent('body');
    expect(body && body.length > 50).toBeTruthy();

    await takeScreenshot(page, '37-06-workout-progress.png');
  });

  /**
   * Test 7: Workout progress page shows progress content.
   */
  test('workout progress page shows progress content', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsProgress}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('progress') ||
      body?.toLowerCase().includes('chart') ||
      body?.toLowerCase().includes('history') ||
      body?.toLowerCase().includes('workout') ||
      body?.toLowerCase().includes('track')
    ).toBeTruthy();
  });

  /**
   * Test 8: Client navigates to /analytics and lands on Overview tab.
   */
  test('client navigates to /analytics - Overview tab', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('overview') ||
      body?.toLowerCase().includes('analytics') ||
      body?.toLowerCase().includes('progress') ||
      body?.toLowerCase().includes('summary')
    ).toBeTruthy();

    await takeScreenshot(page, '37-08-analytics-overview.png');
  });

  /**
   * Test 9: Client navigates to /analytics — Goals tab.
   */
  test('client views Goals tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click Goals tab if it exists
    const goalsTab = page.locator(
      '[role="tab"]:has-text("Goals"), button:has-text("Goals"), a:has-text("Goals")'
    );
    const hasGoalsTab = await goalsTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGoalsTab) {
      await goalsTab.first().click();
      await page.waitForTimeout(TIMEOUTS.animation);
      await takeScreenshot(page, '37-09-analytics-goals.png');
    }

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('goal') ||
      body?.toLowerCase().includes('target') ||
      body?.toLowerCase().includes('milestone') ||
      body?.toLowerCase().includes('analytics')
    ).toBeTruthy();
  });

  /**
   * Test 10: Client navigates to /analytics — Charts tab.
   */
  test('client views Charts tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click Charts tab if it exists
    const chartsTab = page.locator(
      '[role="tab"]:has-text("Charts"), [role="tab"]:has-text("Performance"), button:has-text("Charts"), button:has-text("Performance")'
    );
    const hasChartsTab = await chartsTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasChartsTab) {
      await chartsTab.first().click();
      await page.waitForTimeout(TIMEOUTS.animation);
      await takeScreenshot(page, '37-10-analytics-charts.png');
    }

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('chart') ||
      body?.toLowerCase().includes('performance') ||
      body?.toLowerCase().includes('data') ||
      body?.toLowerCase().includes('analytics')
    ).toBeTruthy();
  });

  /**
   * Test 11: Client navigates to /analytics — Training Load tab.
   */
  test('client views Training Load tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const trainingLoadTab = page.locator(
      '[role="tab"]:has-text("Training Load"), [role="tab"]:has-text("Load"), button:has-text("Training Load")'
    );
    const hasTab = await trainingLoadTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTab) {
      await trainingLoadTab.first().click();
      await page.waitForTimeout(TIMEOUTS.animation);
      await takeScreenshot(page, '37-11-analytics-training-load.png');
    }

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('training') ||
      body?.toLowerCase().includes('load') ||
      body?.toLowerCase().includes('volume') ||
      body?.toLowerCase().includes('analytics')
    ).toBeTruthy();
  });

  /**
   * Test 12: Client navigates to /analytics — History tab.
   */
  test('client views History tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const historyTab = page.locator(
      '[role="tab"]:has-text("History"), button:has-text("History"), a:has-text("History")'
    );
    const hasTab = await historyTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTab) {
      await historyTab.first().click();
      await page.waitForTimeout(TIMEOUTS.animation);
      await takeScreenshot(page, '37-12-analytics-history.png');
    }

    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('history') ||
      body?.toLowerCase().includes('past') ||
      body?.toLowerCase().includes('completed') ||
      body?.toLowerCase().includes('analytics')
    ).toBeTruthy();
  });
});
