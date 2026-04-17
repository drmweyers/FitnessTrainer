/**
 * FORGE QA Warfare v4 — Phase 2B: Schedule Data Rendering Assertions
 *
 * Asserts that the Schedule page and Availability Settings page render
 * correctly for the trainer, and that seeded availability / appointment data
 * surfaces in the UI.
 *
 * Seeded data (scripts/seed-enterprise-full.ts):
 *   - Trainer       : qa-enterprise@evofit.io / QaTest2026!
 *   - Availability  : Mon–Fri 06:00–20:00 (dayOfWeek 1–5, startTime "06:00")
 *   - Appointments  : 11–12 appointments seeded (dates spread across a month)
 *
 * The /schedule page defaults to the "Calendar" section tab.
 * The /schedule/availability page shows a quick-toggle bar with Mon–Sat day
 * buttons and a per-day slot editor.
 */

import { test, expect, Page } from '@playwright/test';
import { BaseActor, ActorCredentials } from '../actors/base-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------
const QA_TRAINER: ActorCredentials = {
  email: 'qa-enterprise@evofit.io',
  password: 'QaTest2026!',
  role: 'trainer',
};

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------
/**
 * Navigate to a route, wait for domcontentloaded, then wait up to 30 s for
 * any visible loading spinners to disappear.
 */
async function navigateAndSettle(page: Page, route: string): Promise<void> {
  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  await page
    .waitForFunction(
      () => document.querySelectorAll('.animate-spin').length === 0,
      { timeout: 30_000 },
    )
    .catch(() => {});

  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Trainer — /schedule page
// ---------------------------------------------------------------------------
test.describe('Schedule Data Rendering — Trainer (/schedule)', () => {

  test('calendar renders without error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule');

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('"Schedule" heading is visible', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule');

    await expect(page.getByRole('heading', { name: /Schedule/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('section tabs (Calendar / Timed Grid) are rendered', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule');

    // The SchedulePage renders data-testid="schedule-section-tabs"
    const tabs = page.locator('[data-testid="schedule-section-tabs"]');
    await expect(tabs).toBeVisible({ timeout: 15_000 });

    // Calendar tab
    await expect(page.locator('[data-testid="tab-calendar"]')).toBeVisible({ timeout: 10_000 });
    // Timed Grid tab
    await expect(page.locator('[data-testid="tab-timed-grid"]')).toBeVisible({ timeout: 10_000 });
  });

  test('"New Appointment" button is present for trainer', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule');

    await expect(page.getByRole('button', { name: /New Appointment/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('"Availability Settings" link is present for trainer', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule');

    // The schedule page renders an anchor tag linking to /schedule/availability
    await expect(page.getByText(/Availability Settings/i)).toBeVisible({ timeout: 10_000 });
  });

  test('no uncaught JS errors on /schedule (trainer)', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule');

    const jsErrors = actor.getConsoleErrors();
    expect(
      jsErrors,
      `Uncaught JS errors on /schedule (trainer): ${jsErrors.join(' | ')}`,
    ).toHaveLength(0);
  });

});

// ---------------------------------------------------------------------------
// Trainer — /schedule/availability page
// ---------------------------------------------------------------------------
test.describe('Schedule Data Rendering — Availability Settings (/schedule/availability)', () => {

  test('"Availability Settings" heading is visible', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule/availability');

    await expect(page.getByRole('heading', { name: /Availability Settings/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('day quick-toggle buttons are rendered (Mon–Fri visible)', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule/availability');

    // Wait for availability data to load (spinner clears)
    await page
      .waitForFunction(
        () => document.querySelectorAll('.animate-spin').length === 0,
        { timeout: 30_000 },
      )
      .catch(() => {});
    await page.waitForTimeout(200);

    // The quick-toggle bar shows DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    // Assert Mon–Fri are visible (seeded availability is Mon–Fri)
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
      await expect(
        page.getByRole('button', { name: day, exact: true }),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('Mon–Fri quick-toggle buttons are highlighted (seeded as available)', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule/availability');

    await page
      .waitForFunction(
        () => document.querySelectorAll('.animate-spin').length === 0,
        { timeout: 30_000 },
      )
      .catch(() => {});
    await page.waitForTimeout(300);

    // Seeded slots exist for Mon(1)–Fri(5), so those buttons should carry
    // the "active/selected" bg-blue-600 class.
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) {
      const btn = page.getByRole('button', { name: day, exact: true });
      await expect(btn).toBeVisible({ timeout: 10_000 });

      // Active days have bg-blue-600 class applied
      const classList = await btn.getAttribute('class');
      expect(
        classList,
        `Day button "${day}" should have bg-blue-600 class (seeded as available)`,
      ).toContain('bg-blue-600');
    }
  });

  test('"Save Changes" button is present', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule/availability');

    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('availability page renders without error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/schedule/availability');

    // Skip assertNoErrorBoundary() here — the availability page legitimately
    // renders "Unavailable" as a day-status label for unset days, which the
    // generic error-boundary checker would flag as a false positive.
    const bodyText = await page.locator('body').innerText().catch(() => '');
    for (const signal of ['Something went wrong', 'Error loading', 'Failed to fetch', 'Unexpected error', 'Try again later']) {
      expect(bodyText, `Error signal "${signal}" found on availability page`).not.toContain(signal);
    }
    await actor.assertNoRenderBugs();
  });

});
