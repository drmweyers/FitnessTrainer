import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('05 - Program Builder', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load programs list page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see "Training Programs" heading
    await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'programs-list.png');
  });

  test('should display program cards or list items', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for program content — heading must be there, then either cards or empty state
    await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(
      page.locator('[class*="card"], [class*="program"], text=/no programs|create your first/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should navigate to program builder (new program)', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see program creation form heading
    await expect(
      page.locator('text=/Program Information|New Program|Create Program/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'program-builder.png');
  });

  test('should have program type and difficulty options', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for program configuration fields (type, difficulty, duration)
    await expect(
      page.locator('text=/type|difficulty|duration|weeks/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should have Create Program button on programs list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for create/new program button
    const createButton = page.locator(
      'a[href*="programs/new"], button:has-text("Create"), button:has-text("New Program"), a:has-text("Create Program")'
    );

    await expect(createButton.first()).toBeVisible({ timeout: TIMEOUTS.element });

    if (await createButton.first().isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      await page.waitForURL(/programs\/new/, { timeout: TIMEOUTS.pageLoad });
    }
  });
});
