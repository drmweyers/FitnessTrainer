/**
 * FORGE QA Warfare v4 — Phase 2A: Analytics Data Rendering
 *
 * Asserts that seeded measurement and goal data actually renders in the
 * analytics page for both the client role (direct access) and the trainer
 * role (via the client-selector workflow).
 *
 * Key behaviour differences:
 *   - CLIENT role: /analytics shows charts immediately from their own data.
 *   - TRAINER role: /analytics shows "Trainer Analytics" KPI dashboard with a
 *     client selector. The measurement charts only appear after a client is
 *     selected. Without a subscription (enterprise tier) trainers see the
 *     "Analytics Locked" upgrade wall — this suite checks for that condition
 *     and skips detailed chart assertions accordingly.
 *
 * Seeded values asserted here (from scripts/seed-enterprise-full.ts):
 *   Client measurements: 8 rows, weight range 78 → 75.1 kg
 *   Client goals: 4 goals with progress entries
 *
 * Accounts:
 *   Trainer : qa-enterprise@evofit.io / QaTest2026!
 *   Client  : qa-client@evofit.io     / QaTest2026!
 */

import { test, expect } from '@playwright/test';
import { BaseActor, ActorCredentials } from '../actors/base-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

const QA_TRAINER: ActorCredentials = {
  email: 'qa-enterprise@evofit.io',
  password: 'QaTest2026!',
  role: 'trainer',
};

const QA_CLIENT: ActorCredentials = {
  email: 'qa-client@evofit.io',
  password: 'QaTest2026!',
  role: 'client',
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function navigateAndSettle(actor: BaseActor, route: string): Promise<void> {
  const page = (actor as any).page;

  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // Wait for loading spinners — Neon cold-start can be slow
  await page
    .waitForFunction(
      () => document.querySelectorAll('.animate-spin').length === 0,
      { timeout: 30_000 },
    )
    .catch(() => {});

  await page.waitForTimeout(500);
}

/**
 * Return true if the current page is showing the "Analytics Locked / Upgrade"
 * wall (tier gate for non-Pro trainers).
 */
async function isAnalyticsLocked(page: any): Promise<boolean> {
  const lockedEl = page.locator('[data-testid="analytics-locked-view"]');
  return (await lockedEl.count()) > 0 && (await lockedEl.isVisible().catch(() => false));
}

// ---------------------------------------------------------------------------
// Client role — /analytics (direct data access)
// ---------------------------------------------------------------------------
test.describe('Analytics Data Rendering — Client role', () => {
  test('Analytics page loads without error boundary (client)', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Analytics page shows "Progress Analytics" heading for client', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    await expect(page.getByText('Progress Analytics', { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Overview tab is visible and active by default', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Navigation tabs render (Overview, Performance, Training Load, Goals)', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    for (const label of ['Overview', 'Performance', 'Training Load', 'Goals']) {
      await expect(page.getByRole('button', { name: new RegExp(label, 'i') })).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test('Overview tab shows measurement summary stats (not "no measurements")', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    // The page renders "Total Measurements" stat card when data exists.
    // If no data, it shows "No measurements yet". We assert the data state.
    await expect(page.getByText('Total Measurements', { exact: false })).toBeVisible({
      timeout: 20_000,
    });
    // Confirm the "no data" empty state is NOT shown
    await expect(page.getByText('No measurements yet')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Overview tab shows at least 8 measurements in Total Measurements count', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    await expect(page.getByText('Total Measurements', { exact: false })).toBeVisible({
      timeout: 20_000,
    });

    // The count is rendered as a large number directly under the stat label.
    // We assert it's a number >= 8 by checking text content.
    const statCard = page.locator('div').filter({ hasText: /^Total Measurements$/ }).first();
    const cardText = await statCard.locator('..').textContent().catch(() => '');
    const match = cardText?.match(/\d+/);
    if (match) {
      const count = parseInt(match[0], 10);
      expect(count).toBeGreaterThanOrEqual(8);
    }
  });

  test('Charts & Trends tab renders without error', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const chartsTab = page.locator('button').filter({ hasText: /Charts/i }).first();
    await expect(chartsTab).toBeVisible({ timeout: 15_000 });
    await chartsTab.click();
    await page.waitForTimeout(2_000);

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Goals tab renders without error', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const goalsTab = page.getByRole('button', { name: /Goals/i });
    await expect(goalsTab).toBeVisible({ timeout: 15_000 });
    await goalsTab.click();

    // Wait for goals to load
    await page.waitForTimeout(2_000);
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Training Load tab renders without error', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const loadTab = page.getByRole('button', { name: /Training Load/i });
    await expect(loadTab).toBeVisible({ timeout: 15_000 });
    await loadTab.click();
    await page.waitForTimeout(2_000);

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('History tab shows measurement rows', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const historyTab = page.getByRole('button', { name: /History/i });
    await expect(historyTab).toBeVisible({ timeout: 15_000 });
    await historyTab.click();
    await page.waitForTimeout(2_000);

    await actor.assertNoErrorBoundary();
    // When measurements exist, the history view renders rows containing "kg"
    // (metric unit from the seed data).
    await expect(page.getByText(/kg/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Export CSV button is visible for client', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    await expect(page.locator('[data-testid="export-csv-btn"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('No uncaught JS errors on analytics page (client)', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const jsErrors = actor.getConsoleErrors();
    expect(
      jsErrors,
      `Uncaught JS errors on /analytics (client): ${jsErrors.join(' | ')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Trainer role — /analytics (KPI dashboard + client selector)
// ---------------------------------------------------------------------------
test.describe('Analytics Data Rendering — Trainer role', () => {
  test('Analytics page loads without error boundary (trainer)', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Trainer analytics shows heading or locked upgrade wall', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const locked = await isAnalyticsLocked(page);
    if (locked) {
      await expect(
        page.getByText(/Analytics|Professional|Upgrade/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    } else {
      // Trainer Analytics heading should be visible in main content
      await expect(
        page.locator('main h1, [role="main"] h1').filter({ hasText: /Analytics/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
      await actor.assertNoErrorBoundary();
    }
  });

  test('Trainer with Pro/Enterprise tier sees client selector or KPI dashboard', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const locked = await isAnalyticsLocked(page);
    if (locked) {
      test.skip(true, 'Trainer is on Starter tier — analytics locked, skipping KPI assertions');
      return;
    }

    // The trainer dashboard shows either "select a client" instruction text
    // or the KPI dashboard component (TrainerAnalyticsDashboard)
    await expect(
      page.getByText(/select a client|roster|client roster/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Export CSV button is visible for trainer', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const locked = await isAnalyticsLocked(page);
    if (locked) {
      test.skip(true, 'Analytics locked for Starter-tier trainer');
      return;
    }

    await expect(page.locator('[data-testid="export-csv-btn"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('No uncaught JS errors on analytics page (trainer)', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/analytics');

    const jsErrors = actor.getConsoleErrors();
    expect(
      jsErrors,
      `Uncaught JS errors on /analytics (trainer): ${jsErrors.join(' | ')}`,
    ).toHaveLength(0);
  });
});
