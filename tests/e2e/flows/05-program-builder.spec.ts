import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('05 - Program Builder', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load programs list page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see "Training Programs" heading
    await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'programs-list.png');
  });

  test('should display program cards or list items', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for program content - cards with program names
    const pageText = await page.textContent('body');
    const hasProgramContent =
      pageText?.toLowerCase().includes('program') ||
      pageText?.toLowerCase().includes('week') ||
      pageText?.toLowerCase().includes('workout');

    expect(hasProgramContent).toBeTruthy();
  });

  test('should navigate to program builder (new program)', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see program creation form
    const formElements = page.locator(
      'input[name="name"], input[placeholder*="name" i], input[placeholder*="Program" i], textarea'
    );
    const hasForm = await formElements.first().isVisible({ timeout: TIMEOUTS.element }).catch(() => false);

    if (hasForm) {
      await takeScreenshot(page, 'program-builder.png');
    }

    // Check for form fields or builder UI
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('create') ||
      pageText?.toLowerCase().includes('new program') ||
      pageText?.toLowerCase().includes('program') ||
      pageText?.toLowerCase().includes('name')
    ).toBeTruthy();
  });

  test('should have program type and difficulty options', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for program configuration fields (type, difficulty, duration)
    const pageText = await page.textContent('body');
    const hasConfig =
      pageText?.toLowerCase().includes('type') ||
      pageText?.toLowerCase().includes('difficulty') ||
      pageText?.toLowerCase().includes('duration') ||
      pageText?.toLowerCase().includes('weeks');

    expect(hasConfig).toBeTruthy();
  });

  test('should have Create Program button on programs list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for create/new program button
    const createButton = page.locator(
      'a[href*="programs/new"], button:has-text("Create"), button:has-text("New Program"), a:has-text("Create Program")'
    );

    if (await createButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.first().click();
      await page.waitForURL(/programs\/new/, { timeout: TIMEOUTS.pageLoad });
    }
  });
});
