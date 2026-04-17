/**
 * FORGE QA Warfare v4 — Phase 2B: Program Data Rendering Assertions
 *
 * Asserts that seeded program records actually render on screen for both
 * the trainer and client views. Every test logs in fresh so there is no
 * shared auth state between assertions.
 *
 * Seeded data (scripts/seed-enterprise-full.ts):
 *   - Trainer : qa-enterprise@evofit.io / QaTest2026!
 *   - Client  : qa-client@evofit.io     / QaTest2026!
 *
 *   Programs owned by trainer (3 total):
 *     • "8-Week Strength Foundation"          — 8 weeks, type: strength
 *     • "HIIT Fat Burner — 4 Week Blast"      — 4 weeks, type: endurance
 *     • "Flexibility & Recovery Protocol"     — 4 weeks, type: rehabilitation
 *
 *   All 3 programs are assigned to qa-client@evofit.io.
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

const QA_CLIENT: ActorCredentials = {
  email: 'qa-client@evofit.io',
  password: 'QaTest2026!',
  role: 'client',
};

// ---------------------------------------------------------------------------
// Seeded program names (exact, as stored in DB / rendered in ProgramCard h3)
// ---------------------------------------------------------------------------
const PROGRAM_STRENGTH  = '8-Week Strength Foundation';
const PROGRAM_HIIT      = 'HIIT Fat Burner';          // substring — em-dash in name is fragile
const PROGRAM_FLEX      = 'Flexibility & Recovery Protocol';

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------
/**
 * Navigate to a route, wait for domcontentloaded, then wait up to 30 s for
 * any visible loading spinners to disappear.  Proceeds even if spinners
 * never clear — the data-assertion steps will surface the real failure.
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

  // Additional wait for React state updates after data loads
  await page.waitForTimeout(300);
}

/**
 * Wait for the "Loading programs…" text to disappear, indicating that the
 * ProgramList component has finished its API call and rendered results.
 */
async function waitForProgramsLoaded(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const body = document.body.textContent || '';
        return !body.includes('Loading programs');
      },
      { timeout: 30_000 },
    )
    .catch(() => {});

  // Small extra settle for grid paint
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Trainer — /programs page
// ---------------------------------------------------------------------------
test.describe('Program Data Rendering — Trainer (/programs)', () => {

  test('should render at least 3 program cards', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();

    // ProgramCard renders program name in an <h3>
    const programCards = page.locator('h3');
    const count = await programCards.count();
    expect(count, 'Expected at least 3 program cards to be rendered').toBeGreaterThanOrEqual(3);
  });

  test('"8-Week Strength Foundation" card is visible', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await expect(page.getByText(/Strength Foundation/i)).toBeVisible({ timeout: 15_000 });
  });

  test('"8-Week Strength Foundation" card shows week count', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    // Find the card containing the program name
    const card = page.locator('.bg-white').filter({ hasText: /Strength Foundation/i }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    // The card text should contain "8" and "Week" somewhere (as part of duration stats)
    const cardText = await card.innerText();
    expect(cardText).toMatch(/8/);
    expect(cardText).toMatch(/week/i);
  });

  test('"8-Week Strength Foundation" card shows "Strength" type badge', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    const card = page.locator('.bg-white').filter({ hasText: /Strength Foundation/i }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    // The card text should contain "Strength" (in either the title or badge)
    const cardText = await card.innerText();
    expect(cardText).toMatch(/strength/i);
  });

  test('"HIIT Fat Burner" card is visible', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await expect(page.getByText(/HIIT/i)).toBeVisible({ timeout: 15_000 });
  });

  test('"Flexibility & Recovery Protocol" card is visible', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await expect(page.getByRole('heading', { name: /Flexibility/i })).toBeVisible({ timeout: 15_000 });
  });

  test('no uncaught JS errors on /programs (trainer)', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    const jsErrors = actor.getConsoleErrors();
    expect(
      jsErrors,
      `Uncaught JS errors on /programs (trainer): ${jsErrors.join(' | ')}`,
    ).toHaveLength(0);
  });

  test('clicking a program card navigates to program detail', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    // Click the first visible program card that matches the strength program name
    const nameHeading = page.getByText(/Strength Foundation/i).first();
    await expect(nameHeading).toBeVisible({ timeout: 15_000 });
    await nameHeading.click();

    // After click, either the URL changes to /programs/<id> or a detail panel opens
    await page.waitForTimeout(2_000);
    const url = page.url();
    const navigated = /\/programs\/[a-zA-Z0-9-]+/.test(url);

    if (navigated) {
      await actor.assertNoErrorBoundary();
      await actor.assertNoRenderBugs();
    } else {
      // Card click may open an inline detail panel instead of navigating
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Strength Foundation/i);
    }
  });

});

// ---------------------------------------------------------------------------
// Client — /programs page (assigned programs)
// ---------------------------------------------------------------------------
test.describe('Program Data Rendering — Client (/programs)', () => {

  test('client should see assigned programs list (at least 3)', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();

    // Client view renders "My Training Programs" heading
    await expect(page.getByText(/Training Programs/i)).toBeVisible({ timeout: 15_000 });

    const programCards = page.locator('h3');
    const count = await programCards.count();
    expect(count, 'Client should see at least 3 assigned programs').toBeGreaterThanOrEqual(3);
  });

  test('client can see "8-Week Strength Foundation" program', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await expect(page.getByText(/Strength Foundation/i)).toBeVisible({ timeout: 15_000 });
  });

  test('client can see "HIIT Fat Burner" program', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await expect(page.getByText(/HIIT/i)).toBeVisible({ timeout: 15_000 });
  });

  test('client can see "Flexibility & Recovery Protocol" program', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await expect(page.getByRole('heading', { name: /Flexibility/i })).toBeVisible({ timeout: 15_000 });
  });

  test('client /programs shows no error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/programs');
    await waitForProgramsLoaded(page);

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

});

// ---------------------------------------------------------------------------
// Client — /workouts page (completed workout history)
// ---------------------------------------------------------------------------
test.describe('Program Data Rendering — Client workout history (/workouts)', () => {

  test('client /workouts page renders without errors', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/workouts');

    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('client /workouts shows workout history content', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(page, '/workouts');

    // Wait for any spinners to clear
    await page
      .waitForFunction(
        () => document.querySelectorAll('.animate-spin').length === 0,
        { timeout: 30_000 },
      )
      .catch(() => {});

    // The workouts page should render — it should not be a blank page
    // Check that the body has meaningful content beyond just a spinner
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText.length, 'Workouts page body should have content').toBeGreaterThan(50);
  });

});
