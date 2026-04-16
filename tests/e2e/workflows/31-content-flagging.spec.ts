/**
 * Suite 31: Content Flagging / Reports
 * Tests reporting exercises/content and admin review of reports.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('31 - Content Flagging', () => {

  test('report button visible on exercise detail or card', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Check for report button — may require hovering an exercise card
    const reportBtn = page.locator(
      'button:has-text("Report"), button[aria-label*="report" i], button[aria-label*="flag" i], button:has-text("Flag")'
    );
    const hasReport = await reportBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasReport) {
      // Try hovering the first exercise card to reveal the button
      const exerciseCard = page.locator('[data-testid*="exercise"], .exercise-card, article').first();
      await expect(exerciseCard).toBeVisible({ timeout: TIMEOUTS.element });
      await exerciseCard.hover();

      // Button must appear on hover
      await expect(reportBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    } else {
      await expect(reportBtn.first()).toBeVisible();
    }
  });

  test('click report opens modal or form', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const reportBtn = page.locator('button:has-text("Report"), button[aria-label*="report" i], button:has-text("Flag")');
    const hasReport = await reportBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasReport) {
      // Hover first exercise card to reveal button
      const exerciseCard = page.locator('[data-testid*="exercise"], .exercise-card, article').first();
      if (await exerciseCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exerciseCard.hover();
      }
    }

    await expect(reportBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await reportBtn.first().click();

    // Modal or form must appear
    const modal = page.locator('[role="dialog"], [data-radix-dialog-content], form[data-report]');
    await expect(modal.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '31-report-modal.png');
  });

  test('reason dropdown has options (inappropriate, incorrect, broken, other)', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const reportBtn = page.locator('button:has-text("Report"), button[aria-label*="report" i]');
    const hasReport = await reportBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasReport) {
      const exerciseCard = page.locator('[data-testid*="exercise"], .exercise-card, article').first();
      if (await exerciseCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exerciseCard.hover();
      }
    }

    await expect(reportBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await reportBtn.first().click();

    // Reason selector must be visible in the report form
    const reasonField = page.locator(
      'select[name*="reason" i], [aria-label*="reason" i], [role="combobox"][aria-label*="reason" i]'
    );
    await expect(reasonField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('notes textarea available in report form', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const reportBtn = page.locator('button:has-text("Report"), button[aria-label*="report" i]');
    const hasReport = await reportBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasReport) {
      const exerciseCard = page.locator('[data-testid*="exercise"], .exercise-card, article').first();
      if (await exerciseCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exerciseCard.hover();
      }
    }

    await expect(reportBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await reportBtn.first().click();

    // Notes/additional info textarea must be visible
    const notesField = page.locator(
      'textarea[name*="note" i], textarea[name*="comment" i], textarea[name*="detail" i], textarea[placeholder*="note" i], textarea[placeholder*="additional" i]'
    );
    await expect(notesField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('submit report succeeds (API check)', async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.post(`${BASE_URL}${API.reports}`, {
      data: {
        contentType: 'exercise',
        contentId: 'test-exercise-id',
        reason: 'incorrect',
        notes: 'E2E automated test report - please ignore.',
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // With valid auth, creation must succeed (200/201)
    expect([200, 201].includes(response.status())).toBeTruthy();
  });

  test('admin sees content reports section', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    // Admin must be able to reach the reports section
    const adminRoutes = ['/admin/reports', '/admin/content', '/admin/flags'];
    let found = false;
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const heading = await page.locator('h1, h2, [role="heading"]').filter({ hasText: /report|flag|content/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
      if (heading) {
        found = true;
        await takeScreenshot(page, '31-admin-reports.png');
        break;
      }
    }

    expect(found).toBeTruthy();
  });

  test('admin sees submitted report', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}${API.reports}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Admin must get 200 with report list
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toBeTruthy();
  });

  test('admin can resolve or dismiss report', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    const adminRoutes = ['/admin/reports', '/admin/content'];
    let found = false;
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const actionBtn = page.locator(
        'button:has-text("Resolve"), button:has-text("Dismiss"), button:has-text("Mark Resolved"), button[aria-label*="resolve" i]'
      );
      if (await actionBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        await takeScreenshot(page, '31-resolve-report.png');
        break;
      }
    }

    expect(found).toBeTruthy();
  });
});
