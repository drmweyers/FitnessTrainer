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
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Workouts h1 must be visible and contain "workout"
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
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page heading must be visible (not just body)
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-02-workout-tracker.png');
  });

  /**
   * Test 3: Workout tracker page loads with exercise content.
   */
  test('workout tracker loads with exercise content', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Must show workout-related content (heading or actionable elements)
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /workout|exercise|today|start|schedule/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-03-tracker-content.png');
  });

  /**
   * Test 4: Client navigates to /workouts/history.
   */
  test('client navigates to /workouts/history', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // History heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-04-workout-history.png');
  });

  /**
   * Test 5: Workout history page loads with relevant content.
   */
  test('workout history page shows history content', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Must show history-related heading
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /history|workout|completed|past|log/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  /**
   * Test 6: Client navigates to /workouts/progress.
   */
  test('client navigates to /workouts/progress', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsProgress}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Progress heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-06-workout-progress.png');
  });

  /**
   * Test 7: Workout progress page shows progress content.
   */
  test('workout progress page shows progress content', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsProgress}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Must show progress-related heading
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /progress|chart|history|workout|track/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  /**
   * Test 8: Client navigates to /analytics and lands on Overview tab.
   */
  test('client navigates to /analytics - Overview tab', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /analytics|overview|progress/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-08-analytics-overview.png');
  });

  /**
   * Test 9: Client navigates to /analytics — Goals tab.
   */
  test('client views Goals tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Goals tab must exist and be clickable
    const goalsTab = page.locator(
      '[role="tab"]:has-text("Goals"), button:has-text("Goals"), a:has-text("Goals")'
    );
    await expect(goalsTab.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await goalsTab.first().click();

    // After clicking Goals tab, goals content must appear
    await expect(
      page.locator('h2, h3, [role="heading"]').filter({ hasText: /goal|target|milestone/i }).first()
        .or(page.locator('[data-testid*="goals"], [class*="goals"]').first())
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-09-analytics-goals.png');
  });

  /**
   * Test 10: Client navigates to /analytics — Charts tab.
   */
  test('client views Charts tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Charts/Performance tab must exist
    const chartsTab = page.locator(
      '[role="tab"]:has-text("Charts"), [role="tab"]:has-text("Performance"), button:has-text("Charts"), button:has-text("Performance")'
    );
    await expect(chartsTab.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await chartsTab.first().click();

    // Chart content must appear after tab click
    await expect(
      page.locator('[data-testid*="chart"], canvas, [class*="chart"]').first()
        .or(page.locator('h2, h3, [role="heading"]').filter({ hasText: /chart|performance|data/i }).first())
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-10-analytics-charts.png');
  });

  /**
   * Test 11: Client navigates to /analytics — Training Load tab.
   */
  test('client views Training Load tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Training Load tab must exist
    const trainingLoadTab = page.locator(
      '[role="tab"]:has-text("Training Load"), [role="tab"]:has-text("Load"), button:has-text("Training Load")'
    );
    await expect(trainingLoadTab.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await trainingLoadTab.first().click();

    // Training load content must appear after tab click
    await expect(
      page.locator('h2, h3, [role="heading"]').filter({ hasText: /training|load|volume/i }).first()
        .or(page.locator('[data-testid*="training-load"], [class*="training-load"]').first())
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-11-analytics-training-load.png');
  });

  /**
   * Test 12: Client navigates to /analytics — History tab.
   */
  test('client views History tab on /analytics', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // History tab must exist
    const historyTab = page.locator(
      '[role="tab"]:has-text("History"), button:has-text("History"), a:has-text("History")'
    );
    await expect(historyTab.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await historyTab.first().click();

    // History content must appear after tab click
    await expect(
      page.locator('h2, h3, [role="heading"]').filter({ hasText: /history|past|completed/i }).first()
        .or(page.locator('[data-testid*="history"], [class*="history"]').first())
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '37-12-analytics-history.png');
  });
});
