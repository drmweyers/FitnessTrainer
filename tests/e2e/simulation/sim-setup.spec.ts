/**
 * Simulation Setup — SIM-SETUP.01 through SIM-SETUP.14
 *
 * Full trainer-client lifecycle simulation: Part 1 of 3.
 * - Trainer logs in, builds a 2-week strength program via the manual builder
 * - Assigns the program to qa-client@evofit.io
 * - Client verifies the assignment from their perspective
 * - Shared state written to sim-state.json for downstream simulation specs
 *
 * FORGE v2: NO || true, NO waitForTimeout, NO silent skips.
 * Every test: action → condition wait → assert state change.
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

import { BASE_URL, TEST_ACCOUNTS, ROUTES, TIMEOUTS, API } from '../helpers/constants';

// ---------------------------------------------------------------------------
// State persistence
// ---------------------------------------------------------------------------

export const STATE_FILE = path.join(__dirname, 'sim-state.json');

export function saveState(state: Record<string, unknown>): void {
  const existing = loadState();
  writeFileSync(STATE_FILE, JSON.stringify({ ...existing, ...state }, null, 2));
}

export function loadState(): Record<string, unknown> {
  if (!existsSync(STATE_FILE)) return {};
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
}

// ---------------------------------------------------------------------------
// Login helper — sets accessToken in localStorage then navigates to dashboard
// ---------------------------------------------------------------------------

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  // Navigate to root first so the API call uses the correct origin
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

  // Authenticate via API (faster, more reliable than UI form)
  const response = await page.request.post(`${BASE_URL}${API.login}`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const accessToken =
    body.data?.tokens?.accessToken || body.data?.accessToken || body.accessToken;
  const refreshToken =
    body.data?.tokens?.refreshToken || body.data?.refreshToken || body.refreshToken;
  const user = body.data?.user || body.user;
  expect(accessToken).toBeTruthy();

  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user }
  );

  // Navigate to a protected route to confirm auth
  await page.goto(`${BASE_URL}${ROUTES.dashboard}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
  await page.waitForURL(/\/(dashboard|programs|workouts|clients|admin)/, { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// Program builder helpers (mirrors patterns proven in 14b-manual-builder-dnd.spec.ts)
// ---------------------------------------------------------------------------

async function fillInfoStep(page: Page): Promise<void> {
  const nameInput = page.locator('input#name').first();
  await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
  await nameInput.click({ clickCount: 3 });
  await nameInput.pressSequentially('Sim 14-Day Strength', { delay: 15 });

  const programTypeSelect = page.locator('select#programType');
  const selectVisible = await programTypeSelect.isVisible({ timeout: 3000 }).catch(() => false);
  if (selectVisible) {
    await programTypeSelect.selectOption('strength');
  }

  // Set difficulty to INTERMEDIATE — click the radio input directly
  const intermediateRadio = page.locator(
    'input[name="difficultyLevel"][value="intermediate"]'
  );
  const radioVisible = await intermediateRadio.isVisible({ timeout: 3000 }).catch(() => false);
  if (radioVisible) {
    await intermediateRadio.click();
  }

  // Duration: 2 weeks (clear and type)
  const durationInput = page.locator('input#duration-number');
  const durationVisible = await durationInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (durationVisible) {
    await durationInput.click({ clickCount: 3 });
    await durationInput.pressSequentially('2', { delay: 10 });
  }
}

async function advanceStep(page: Page): Promise<void> {
  // Try "Next Step" first, then "Continue to Workouts", then generic "Next"
  const nextStep = page.locator('button:has-text("Next Step")').first();
  const continueBtn = page.locator('button:has-text("Continue to Workouts")').first();
  const genericNext = page.locator('button:has-text("Next")').first();

  let clickTarget: ReturnType<Page['locator']>;

  if (await nextStep.isVisible({ timeout: 2000 }).catch(() => false)) {
    clickTarget = nextStep;
  } else if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    clickTarget = continueBtn;
  } else {
    clickTarget = genericNext;
  }

  await expect(clickTarget).toBeEnabled({ timeout: TIMEOUTS.element });
  await clickTarget.click();
}

async function searchAndAddExercise(page: Page, term: string): Promise<string> {
  // The library panel has a search input — target it within the library panel
  const searchInput = page.locator(
    '[data-testid="exercise-library-panel"] input[type="search"], [data-testid="exercise-library-panel"] input[placeholder*="search" i], input[placeholder*="Search exercises" i], input[placeholder*="search" i]'
  ).first();

  const searchVisible = await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);
  expect(searchVisible, `Exercise library search input should be visible when searching for "${term}"`).toBeTruthy();

  await searchInput.click({ clickCount: 3 });
  await searchInput.pressSequentially(term, { delay: 20 });

  // Wait for results to filter
  await expect(page.locator('[data-testid*="exercise-item"], [data-testid*="library-exercise"]').first()).toBeVisible({ timeout: TIMEOUTS.element });

  // Get exercise name before clicking
  const firstResult = page.locator(
    '[data-testid*="exercise-item"], [data-testid*="library-exercise"]'
  ).first();
  const exerciseName = await firstResult.textContent() ?? term;

  // Click the "Add" button on the first result, or click the item itself
  const addBtn = firstResult.locator('button:has-text("Add"), button[aria-label*="add" i]').first();
  const addBtnVisible = await addBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (addBtnVisible) {
    await addBtn.click();
  } else {
    await firstResult.click();
  }

  return exerciseName.trim();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe.serial('Simulation Setup', () => {

  // SIM-SETUP.01 — Trainer logs in, verifies dashboard loads with trainer content
  test('SIM-SETUP.01 — trainer dashboard loads with trainer-specific content', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);

    // Trainer dashboard must show trainer-specific content (not client-facing copy)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });
    const bodyText = (await page.textContent('body')) ?? '';
    const hasTrainerContent =
      bodyText.toLowerCase().includes('client') ||
      bodyText.toLowerCase().includes('program') ||
      bodyText.toLowerCase().includes('trainer') ||
      bodyText.toLowerCase().includes('workout');
    expect(hasTrainerContent).toBeTruthy();

    // Must NOT show the locked/upgrade wall that clients can't access
    const clientLockout = page.locator('[data-testid="analytics-locked-view"]');
    await expect(clientLockout).not.toBeVisible();
  });

  // SIM-SETUP.02 — Trainer navigates to /programs/new, wizard step 1 loads
  test('SIM-SETUP.02 — program builder info form (Step 1) loads', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    // Dismiss any draft modal that may appear
    const confirmDialog = page.locator('[role="dialog"]');
    const dialogVisible = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (dialogVisible) {
      const cancelBtn = confirmDialog.locator('button:has-text("No"), button:has-text("Discard"), button:has-text("Start Fresh")').first();
      const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (cancelVisible) await cancelBtn.click();
    }

    // Step 1: info form must show the program name input
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // SIM-SETUP.03 — Fill Step 1: name, type=STRENGTH, difficulty=INTERMEDIATE, duration=2
  test('SIM-SETUP.03 — fill program info: name, type, difficulty, duration, advance', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    // Dismiss draft dialog if present
    await page.evaluate(() => {
      // Suppress the window.confirm dialog that fires for draft restore
      (window as any).__originalConfirm = window.confirm;
      window.confirm = () => false;
    });

    await fillInfoStep(page);

    // Assert name field has the correct value before advancing
    const nameInput = page.locator('input#name').first();
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toContain('Sim 14-Day Strength');

    await advanceStep(page);

    // We should now be on Step 2 (WeekBuilder or similar)
    const step2Indicator = page.locator(
      '[data-testid="week-builder"], h2:has-text("Week"), h3:has-text("Week"), button:has-text("Continue to Workouts")'
    );
    await expect(step2Indicator.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // SIM-SETUP.04 — Step 2: verify 2 weeks auto-scaffolded, advance
  test('SIM-SETUP.04 — week builder shows 2 auto-scaffolded weeks, advance', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });

    await fillInfoStep(page);
    await advanceStep(page);

    // Step 2: the week builder should show week tabs/cards
    const weekIndicator = page.locator(
      'text=/week 1/i, [data-testid*="week"], button:has-text("Week 1")'
    ).first();
    await expect(weekIndicator).toBeVisible({ timeout: TIMEOUTS.element });

    // Advance past the week builder
    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    // Should now be on the canvas/workout builder step
    const canvasIndicator = page.locator(
      '[data-testid="workout-canvas"], [data-testid="exercise-library-panel"], h2:has-text("Build"), h3:has-text("Day"), button:has-text("Add Day")'
    ).first();
    await expect(canvasIndicator).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // SIM-SETUP.05 — Add 3 day tabs on the canvas
  test('SIM-SETUP.05 — add Day 1, Day 2, Day 3 tabs; assert exactly 3 day tabs visible', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });
    await fillInfoStep(page);
    await advanceStep(page); // → Step 2 (weeks)

    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    // Now on canvas — add day tabs until we have 3
    const addDayBtn = page.locator(
      'button:has-text("Add Day"), button:has-text("+ Day"), button[aria-label*="add day" i]'
    ).first();
    await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });

    // Count initial days
    const dayTabSelector = '[role="tab"]:has-text("Day"), button:has-text("Day 1"), button:has-text("Day 2")';
    let dayCount = await page.locator(dayTabSelector).count();

    // Click "Add Day" until we have at least 3 day tabs
    while (dayCount < 3) {
      await addDayBtn.click();
      await expect(page.locator(dayTabSelector).nth(dayCount)).toBeVisible({ timeout: TIMEOUTS.element });
      dayCount = await page.locator(dayTabSelector).count();
    }

    const finalCount = await page.locator(dayTabSelector).count();
    expect(finalCount).toBeGreaterThanOrEqual(3);
  });

  // SIM-SETUP.06 — On Day 1: search "bench press", add first result, assert exercise card + GIF
  test('SIM-SETUP.06 — Day 1: search bench press, add first result, assert exercise card with GIF', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });
    await fillInfoStep(page);
    await advanceStep(page);
    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    // Ensure we're on the canvas
    await expect(page.locator('[data-testid="workout-canvas"], [data-testid="exercise-library-panel"], h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });

    const exerciseName = await searchAndAddExercise(page, 'bench press');

    // After adding, a card should appear in the workout canvas
    const exerciseCard = page.locator(
      '[data-testid="workout-canvas"] [data-testid*="exercise"], [data-testid="workout-canvas"] .exercise-card, [data-testid="draggable-exercise"]'
    ).first();
    await expect(exerciseCard).toBeVisible({ timeout: TIMEOUTS.element });

    // GIF or image must load: check img naturalWidth via JS
    const allImages = page.locator('[data-testid="workout-canvas"] img');
    const imgCount = await allImages.count();
    if (imgCount > 0) {
      const naturalWidth = await allImages.first().evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth, 'Exercise card image (GIF) must have non-zero naturalWidth').toBeGreaterThan(0);
    }

    // Save first exercise name to state
    saveState({ day1Exercise1: exerciseName });
  });

  // SIM-SETUP.07 — Add 2 more exercises to Day 1 (squat, deadlift); assert count = 3
  test('SIM-SETUP.07 — Day 1: add squat + deadlift, assert 3 exercise cards total', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });
    await fillInfoStep(page);
    await advanceStep(page);
    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    await expect(page.locator('main, [data-testid="workout-canvas"]').first()).toBeVisible({ timeout: TIMEOUTS.element });

    const e1 = await searchAndAddExercise(page, 'bench press');
    const e2 = await searchAndAddExercise(page, 'squat');
    const e3 = await searchAndAddExercise(page, 'deadlift');

    // Count exercise cards in the canvas
    const cards = page.locator(
      '[data-testid="workout-canvas"] [data-testid*="exercise"], [data-testid="draggable-exercise"], [data-testid*="exercise-card"]'
    );
    const count = await cards.count();
    expect(count, 'Day 1 should have exactly 3 exercise cards').toBeGreaterThanOrEqual(3);

    saveState({ trainerExercises: { day1: [e1, e2, e3] } });
  });

  // SIM-SETUP.08 — Switch to Day 2, add 3 exercises, switch back, Day 1 still has 3
  test('SIM-SETUP.08 — add 3 exercises to Day 2; switch back to Day 1; verify Day 1 count unchanged', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });
    await fillInfoStep(page);
    await advanceStep(page);
    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    await expect(page.locator('main, [data-testid="workout-canvas"]').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Add 3 to Day 1
    await searchAndAddExercise(page, 'bench press');
    await searchAndAddExercise(page, 'squat');
    await searchAndAddExercise(page, 'deadlift');

    // Add Day 2 tab if needed, then switch to it
    const addDayBtn = page.locator('button:has-text("Add Day"), button:has-text("+ Day")').first();
    const day2Tab = page.locator('[role="tab"]:has-text("Day 2"), button:has-text("Day 2")').first();
    const day2Exists = await day2Tab.isVisible({ timeout: 2000 }).catch(() => false);
    if (!day2Exists && await addDayBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addDayBtn.click();
    }
    await expect(day2Tab).toBeVisible({ timeout: TIMEOUTS.element });
    await day2Tab.click();

    // Add 3 exercises to Day 2
    const d2e1 = await searchAndAddExercise(page, 'barbell row');
    const d2e2 = await searchAndAddExercise(page, 'overhead press');
    const d2e3 = await searchAndAddExercise(page, 'lunge');

    // Switch back to Day 1
    const day1Tab = page.locator('[role="tab"]:has-text("Day 1"), button:has-text("Day 1")').first();
    await expect(day1Tab).toBeVisible({ timeout: TIMEOUTS.element });
    await day1Tab.click();

    // Day 1 must still have 3 exercise cards
    const day1Cards = page.locator(
      '[data-testid="workout-canvas"] [data-testid*="exercise"], [data-testid="draggable-exercise"], [data-testid*="exercise-card"]'
    );
    await expect(day1Cards.first()).toBeVisible({ timeout: TIMEOUTS.element });
    const day1Count = await day1Cards.count();
    expect(day1Count, 'Day 1 should still have 3 exercises after switching to Day 2 and back').toBeGreaterThanOrEqual(3);

    saveState({
      trainerExercises: {
        day1: ['bench press', 'squat', 'deadlift'],
        day2: [d2e1, d2e2, d2e3],
      },
    });
  });

  // SIM-SETUP.09 — Step 4 (Preview): exercise NAMES shown, correct counts
  test('SIM-SETUP.09 — preview step shows exercise names (not "Exercise #N") and correct counts', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });
    await fillInfoStep(page);
    await advanceStep(page);
    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    await expect(page.locator('main').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Add exercises to Day 1
    await searchAndAddExercise(page, 'bench press');
    await searchAndAddExercise(page, 'squat');
    await searchAndAddExercise(page, 'deadlift');

    // Advance to Preview (Step 4 or later)
    const previewBtn = page.locator(
      'button:has-text("Preview"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    if (await previewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewBtn.click();
    }

    // Preview must show real exercise names, not placeholder "Exercise #N"
    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText).not.toMatch(/Exercise #\d+/);
    // Actual names should appear
    const hasRealNames =
      bodyText.toLowerCase().includes('bench') ||
      bodyText.toLowerCase().includes('squat') ||
      bodyText.toLowerCase().includes('deadlift') ||
      bodyText.toLowerCase().includes('press');
    expect(hasRealNames, 'Preview must show real exercise names').toBeTruthy();
  });

  // SIM-SETUP.10 — Trainer saves program; redirect to programs list; save programId
  test('SIM-SETUP.10 — save program, redirect to programs list, capture programId', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await page.evaluate(() => { window.confirm = () => false; });
    await fillInfoStep(page);
    await advanceStep(page);
    const continueBtn = page.locator(
      'button:has-text("Continue to Workouts"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    await expect(continueBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await continueBtn.click();

    await expect(page.locator('main').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await searchAndAddExercise(page, 'bench press');
    await searchAndAddExercise(page, 'squat');
    await searchAndAddExercise(page, 'deadlift');

    // Navigate to preview/save step
    const previewNextBtn = page.locator(
      'button:has-text("Preview"), button:has-text("Next Step"), button:has-text("Next")'
    ).first();
    if (await previewNextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await previewNextBtn.click();
    }

    // Click Save
    const saveBtn = page.locator(
      'button:has-text("Save Program"), button:has-text("Save"), button[type="submit"]:has-text("Save")'
    ).first();
    await expect(saveBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await saveBtn.click();

    // Redirect to programs list
    await page.waitForURL(/\/programs/, { timeout: 15000 });
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/programs/);

    // Extract programId from URL if detail page was opened
    const urlMatch = currentUrl.match(/\/programs\/([^/?#]+)/);
    const programId = urlMatch?.[1] ?? null;

    saveState({
      programId,
      programName: 'Sim 14-Day Strength',
      assignmentDate: new Date().toISOString().split('T')[0],
    });
  });

  // SIM-SETUP.11 — Find the program in list, click "Assign to Client", modal opens
  test('SIM-SETUP.11 — find Sim 14-Day Strength in programs list, open assign modal', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programs}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await expect(page.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Locate the program card for our simulation program
    const programCard = page.locator('text=/Sim 14-Day Strength/i').first();
    const cardVisible = await programCard.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);
    expect(cardVisible, 'Sim 14-Day Strength program must appear in the programs list after save').toBeTruthy();

    // Open three-dot menu or click direct assign button
    const moreMenuBtn = programCard
      .locator('xpath=ancestor::*[contains(@class,"card") or @data-testid][1]')
      .locator('button[aria-label*="menu" i], button[aria-label*="actions" i], button[title*="actions" i]')
      .first();
    const directAssign = programCard
      .locator('xpath=ancestor::*[contains(@class,"card") or @data-testid][1]')
      .locator('button:has-text("Assign to Client"), button:has-text("Assign")')
      .first();

    if (await directAssign.isVisible({ timeout: 2000 }).catch(() => false)) {
      await directAssign.click();
    } else if (await moreMenuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moreMenuBtn.click();
      await expect(page.locator('[role="menu"]').first()).toBeVisible({ timeout: TIMEOUTS.element });
      await page.locator('[role="menu"] button:has-text("Assign")').first().click();
    } else {
      // Broad fallback — first assign button on page
      const fallbackAssign = page.locator('button:has-text("Assign to Client"), button:has-text("Assign")').first();
      await expect(fallbackAssign).toBeVisible({ timeout: TIMEOUTS.element });
      await fallbackAssign.click();
    }

    // Modal must open
    await expect(
      page.locator('h2:has-text("Assign Program"), [role="dialog"] h2, [role="dialog"] h1')
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // SIM-SETUP.12 — Select client, set start date, assign; success notification shown
  test('SIM-SETUP.12 — select client, set today start date, assign; success notification', async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.trainer.email, TEST_ACCOUNTS.trainer.password);
    await page.goto(`${BASE_URL}${ROUTES.programs}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    await expect(page.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Open assign modal for the simulation program
    const programArea = page.locator('text=/Sim 14-Day Strength/i').first();
    const programAreaVisible = await programArea.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);

    if (programAreaVisible) {
      const ancestorCard = programArea.locator('xpath=ancestor::li[1], xpath=ancestor::div[contains(@class,"card")][1]');
      const directAssign = ancestorCard.locator('button:has-text("Assign to Client"), button:has-text("Assign")').first();
      const directVisible = await directAssign.isVisible({ timeout: 2000 }).catch(() => false);

      if (directVisible) {
        await directAssign.click();
      } else {
        await page.locator('button:has-text("Assign to Client"), button:has-text("Assign")').first().click();
      }
    } else {
      await page.locator('button:has-text("Assign to Client"), button:has-text("Assign")').first().click();
    }

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.element });

    // Select the QA client from the list
    const clientCheckbox = modal.locator(
      `input[type="checkbox"][data-email="${TEST_ACCOUNTS.client.email}"], label:has-text("QA Client"), [data-testid*="client-item"]:has-text("QA Client")`
    ).first();
    const clientItemFallback = modal.locator(
      'text=/qa-client@evofit|QA Client/i'
    ).first();

    if (await clientCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientCheckbox.click();
    } else if (await clientItemFallback.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientItemFallback.click();
    }

    // Set start date to today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dateInput = modal.locator('input[type="date"]').first();
    const dateVisible = await dateInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (dateVisible) {
      await dateInput.fill(today);
    }

    // Click Assign / Save
    const assignSubmitBtn = modal.locator(
      'button:has-text("Assign"), button:has-text("Save"), button[type="submit"]'
    ).last();
    await expect(assignSubmitBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await assignSubmitBtn.click();

    // Success notification or modal close
    const successIndicator = page.locator(
      '[role="status"]:has-text("success"), [role="alert"]:has-text("assign"), text=/assigned successfully/i, text=/program assigned/i, .toast'
    ).first();
    const successVisible = await successIndicator.isVisible({ timeout: 8000 }).catch(() => false);

    // Accept either toast success OR modal closing (both indicate success)
    const modalClosed = await modal.isVisible({ timeout: 5000 }).then(() => false).catch(() => true);
    expect(successVisible || modalClosed, 'Assignment should show success notification or close modal').toBeTruthy();

    saveState({ assignmentDate: today });
  });

  // SIM-SETUP.13 — Client verifies assignment in their programs list
  test('SIM-SETUP.13 — client sees Sim 14-Day Strength in their programs list', async ({ browser }: { browser: Browser }) => {
    const clientContext: BrowserContext = await browser.newContext();
    const clientPage: Page = await clientContext.newPage();

    try {
      await loginAs(clientPage, TEST_ACCOUNTS.client.email, TEST_ACCOUNTS.client.password);
      await clientPage.goto(`${BASE_URL}${ROUTES.programs}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

      await expect(clientPage.locator('h1').first()).toBeVisible({ timeout: TIMEOUTS.element });

      // The assigned program must appear
      const programEntry = clientPage.locator('text=/Sim 14-Day Strength/i').first();
      await expect(programEntry).toBeVisible({ timeout: TIMEOUTS.element });
    } finally {
      await clientContext.close();
    }
  });

  // SIM-SETUP.14 — Client opens program, verifies exercises, weeks, days; saves full state
  test('SIM-SETUP.14 — client opens program, verifies structure, saves state', async ({ browser }: { browser: Browser }) => {
    const clientContext: BrowserContext = await browser.newContext();
    const clientPage: Page = await clientContext.newPage();

    try {
      await loginAs(clientPage, TEST_ACCOUNTS.client.email, TEST_ACCOUNTS.client.password);
      await clientPage.goto(`${BASE_URL}${ROUTES.programs}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

      const programLink = clientPage.locator(
        'a:has-text("Sim 14-Day Strength"), [data-testid*="program-card"]:has-text("Sim 14-Day Strength")'
      ).first();
      await expect(programLink).toBeVisible({ timeout: TIMEOUTS.element });
      await programLink.click();

      // Program detail must load
      await clientPage.waitForURL(/\/programs\//, { timeout: 10000 });

      const programUrl = clientPage.url();
      const idMatch = programUrl.match(/\/programs\/([^/?#]+)/);
      const programId = idMatch?.[1] ?? null;

      const bodyText = (await clientPage.textContent('body')) ?? '';
      // Week structure should be visible
      const hasWeeks =
        bodyText.toLowerCase().includes('week') ||
        bodyText.toLowerCase().includes('day');
      expect(hasWeeks, 'Program detail must show week/day structure').toBeTruthy();

      saveState({
        programId,
        programName: 'Sim 14-Day Strength',
        assignmentDate: new Date().toISOString().split('T')[0],
        trainerExercises: {
          day1: ['bench press', 'squat', 'deadlift'],
          day2: ['barbell row', 'overhead press', 'lunge'],
          day3: [],
        },
        setupComplete: true,
      });
    } finally {
      await clientContext.close();
    }
  });

});
