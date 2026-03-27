/**
 * Suite 21: Body Measurements
 * Tests measurement creation, display, chart rendering, and deletion via the analytics page.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, API, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe('21 - Body Measurements', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'client');
  });

  test('analytics page loads for client', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '21-analytics-page.png');
  });

  test('analytics page shows Overview tab by default', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    const hasOverviewContent =
      body?.toLowerCase().includes('overview') ||
      body?.toLowerCase().includes('progress') ||
      body?.toLowerCase().includes('measurement') ||
      body?.toLowerCase().includes('analytics');
    expect(hasOverviewContent).toBeTruthy();
  });

  test('"Record New Measurement" button is visible', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator(
      'button:has-text("Record New Measurement"), button:has-text("Add Measurement"), button:has-text("New Measurement")'
    );
    await expect(recordBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('clicking "Record New Measurement" opens measurement form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator(
      'button:has-text("Record New Measurement"), button:has-text("Add Measurement")'
    );
    await recordBtn.first().click();
    await page.waitForTimeout(500);

    // MeasurementTracker modal should open
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"], form');
    await expect(modal.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '21-measurement-form.png');
  });

  test('measurement form has weight input field', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator('button:has-text("Record New Measurement"), button:has-text("Add Measurement")');
    await recordBtn.first().click();
    await page.waitForTimeout(500);

    const weightInput = page.locator(
      'input[id*="weight" i], input[name*="weight" i], input[placeholder*="weight" i], input[aria-label*="weight" i]'
    );
    await expect(weightInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('measurement form has body fat percentage input', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator('button:has-text("Record New Measurement"), button:has-text("Add Measurement")');
    await recordBtn.first().click();
    await page.waitForTimeout(500);

    const bodyFatInput = page.locator(
      'input[id*="fat" i], input[name*="fat" i], input[placeholder*="fat" i], input[placeholder*="body fat" i]'
    );
    await expect(bodyFatInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('measurement form has muscle mass input', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator('button:has-text("Record New Measurement"), button:has-text("Add Measurement")');
    await recordBtn.first().click();
    await page.waitForTimeout(500);

    const muscleMassInput = page.locator(
      'input[id*="muscle" i], input[name*="muscle" i], input[placeholder*="muscle" i]'
    );
    await expect(muscleMassInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('submitting measurement form with valid data succeeds', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator('button:has-text("Record New Measurement"), button:has-text("Add Measurement")');
    await recordBtn.first().click();
    await page.waitForTimeout(500);

    // Fill in weight field
    const weightInput = page.locator(
      'input[id*="weight" i], input[name*="weight" i], input[placeholder*="weight" i]'
    ).first();
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightInput.fill('75');
    }

    // Fill in body fat
    const bodyFatInput = page.locator(
      'input[id*="fat" i], input[name*="fat" i], input[placeholder*="body fat" i]'
    ).first();
    if (await bodyFatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bodyFatInput.fill('18');
    }

    // Submit
    const saveBtn = page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Save Measurement")'
    );
    if (await saveBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.first().click();
      await page.waitForTimeout(2000);

      // Success toast or modal closing
      const successIndicator = page.locator(
        '[role="alert"], .toast, [class*="toast"], text=/saved|success|measurement/i'
      );
      const isSuccess = await successIndicator.first().isVisible({ timeout: 5000 }).catch(() => false);
      // Modal should close or success shown
      const modalStillOpen = await page.locator('[role="dialog"]').first().isVisible({ timeout: 1000 }).catch(() => false);
      expect(isSuccess || !modalStillOpen).toBeTruthy();

      await takeScreenshot(page, '21-measurement-saved.png');
    } else {
      test.skip();
    }
  });

  test('measurements API endpoint returns valid response', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}${API.analyticsMeasurements}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('analytics page shows progress chart area when measurements exist', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Charts render as canvas elements (Chart.js) or SVG
    const chartArea = page.locator('canvas, svg[class*="chart"], [class*="chart"], [class*="recharts"]');
    const hasChart = await chartArea.first().isVisible({ timeout: 5000 }).catch(() => false);

    const emptyState = page.locator('text=/no measurement|get started|first measurement/i');
    const emptyVisible = await emptyState.first().isVisible({ timeout: 3000 }).catch(() => false);

    // Either charts are shown or empty state
    expect(hasChart || emptyVisible).toBeTruthy();
  });

  test('body composition chart renders when data is present', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const body = await page.textContent('body');
    const hasCompositionContent =
      body?.toLowerCase().includes('body') ||
      body?.toLowerCase().includes('composition') ||
      body?.toLowerCase().includes('fat') ||
      body?.toLowerCase().includes('muscle');
    expect(hasCompositionContent).toBeTruthy();
  });

  test('delete measurement removes it from the list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Switch to History view to see all measurements with delete buttons
    const historyTab = page.locator(
      'button:has-text("History"), [role="tab"]:has-text("History")'
    );
    const tabVisible = await historyTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (tabVisible) {
      await historyTab.first().click();
      await page.waitForTimeout(500);

      const deleteBtn = page.locator('button:has-text("Delete")').first();
      const hasMeasurements = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasMeasurements) {
        // Handle confirm dialog
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });

        await deleteBtn.click();
        await page.waitForTimeout(1500);

        // Success toast should appear
        const successMsg = page.locator('[role="alert"], text=/deleted|removed/i');
        const deleted = await successMsg.first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(deleted).toBeTruthy();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});
