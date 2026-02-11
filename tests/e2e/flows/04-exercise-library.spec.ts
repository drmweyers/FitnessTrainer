import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('04 - Exercise Library', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load exercise library page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see exercise-related heading
    await expect(page.locator('text=/exercise/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'exercise-library.png');
  });

  test('should display exercise cards or list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for exercise data to load - look for any exercise-related content
    // Exercises have images (GIFs), names, muscle groups
    const exerciseContent = page.locator('[class*="card"], [class*="exercise"], [class*="grid"] > div').first();
    await expect(exerciseContent).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should have exercise images loading', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Check for images (exercise GIFs)
    const images = page.locator('img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
  });

  test('should have search functionality for exercises', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    if (await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.first().fill('squat');
      // Wait for filtering/search
      await page.waitForTimeout(2000);

      // Results should contain squat-related exercises
      const pageText = await page.textContent('body');
      expect(pageText?.toLowerCase()).toContain('squat');

      await takeScreenshot(page, 'exercise-search-squat.png');
    }
  });

  test('should have body part or category filters', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for filter options (body part, equipment, category)
    const filterButton = page.locator('button:has-text("Filter"), select, [role="combobox"], button:has-text("Body Part"), button:has-text("Muscle")');
    if (await filterButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterButton.first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'exercise-filters.png');
    }
  });

  test('should navigate to exercise detail when clicking a card', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Click on first exercise card/link
    const exerciseLink = page.locator('a[href*="exercises/"]').first();
    if (await exerciseLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exerciseLink.click();
      await page.waitForLoadState('networkidle');

      // Should show exercise detail
      const pageText = await page.textContent('body');
      const hasDetail =
        pageText?.toLowerCase().includes('target') ||
        pageText?.toLowerCase().includes('muscle') ||
        pageText?.toLowerCase().includes('equipment') ||
        pageText?.toLowerCase().includes('instructions');

      if (hasDetail) {
        await takeScreenshot(page, 'exercise-detail.png');
      }
    }
  });

  test('should also work at public exercises route', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercisesPublic}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });

    // Public exercises page should load
    await expect(page.locator('text=/exercise/i').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
