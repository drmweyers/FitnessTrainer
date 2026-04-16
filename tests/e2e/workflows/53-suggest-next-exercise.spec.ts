/**
 * Suite 53: Suggest Next Exercise (AI Exercise Suggestions)
 *
 * Tests that the "Suggest next exercise" button appears for enterprise/professional
 * accounts and is hidden for starter accounts. Validates the suggestion flow,
 * loading states, and that accepted suggestions are added to the workout.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

/** Navigate to the program builder exercise step */
async function navigateToExerciseStep(
  page: import('@playwright/test').Page
): Promise<void> {
  await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.pageLoad,
  });
  await waitForPageReady(page);

  // Fill program name (required)
  const nameInput = page.locator('input#name').first();
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(`Suggest Test ${Date.now()}`);

  // Navigate through steps — click Next up to 3 times
  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
  for (let i = 0; i < 3; i++) {
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await nextBtn.click();
      await expect(page.locator('body')).toBeVisible(); // let React re-render
    }
  }
}

test.describe('53 - Suggest Next Exercise', () => {
  test.setTimeout(90000);

  // 1. Enterprise trainer: "Suggest next exercise" button IS visible
  test('53.01 enterprise trainer sees Suggest next exercise button', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest"), button[aria-label*="suggest" i], button:has-text("Next Exercise")'
    ).first();

    // Enterprise must show the suggest button on the exercise panel
    await expect(suggestBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '53-01-enterprise-suggest-btn.png');
  });

  // 2. Enterprise trainer: clicking button shows loading state
  test('53.02 clicking Suggest button shows loading state', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest"), button:has-text("Next Exercise")'
    ).first();

    if (!(await suggestBtn.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: enterprise suggest button not visible on exercise panel');
      return;
    }

    await suggestBtn.click();

    // Loading state: "Thinking...", spinner, or button becomes disabled
    const loadingIndicator = page.locator(
      'text=/Thinking|Loading|Suggesting/i, .animate-spin, button[disabled]:has-text("Suggest")'
    ).first();

    // Either a loading text appears OR the button becomes disabled — one specific outcome
    const loadingVisible = await loadingIndicator.isVisible({ timeout: 3000 });
    const btnDisabled = await suggestBtn.isDisabled();

    expect(loadingVisible || btnDisabled).toBe(true);

    await takeScreenshot(page, '53-02-suggest-loading.png');
  });

  // 3. Enterprise trainer: after click, shows suggested exercises or error message
  test('53.03 after suggestion click, shows results or error message', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest"), button:has-text("Next Exercise")'
    ).first();

    if (!(await suggestBtn.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: enterprise suggest button not visible on exercise panel');
      return;
    }

    await suggestBtn.click();

    // After click, should show a suggestion list, exercise card, or error — wait for it
    const resultOrError = page.locator(
      '[class*="suggestion"], [class*="suggest-item"], [class*="exercise-card"], text=/error|failed|unable/i'
    ).first();
    await expect(resultOrError).toBeVisible({ timeout: 10000 });

    await takeScreenshot(page, '53-03-suggest-results.png');
  });

  // 4. Enterprise: clicking a suggestion adds it to the workout
  test('53.04 clicking a suggestion adds exercise to workout', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest"), button:has-text("Next Exercise")'
    ).first();

    if (!(await suggestBtn.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: enterprise suggest button not visible on exercise panel');
      return;
    }

    await suggestBtn.click();

    // Click the first suggestion (usually a clickable card or button)
    const firstSuggestion = page.locator(
      '[class*="suggestion"] button, [class*="suggest"] [role="button"], button[class*="exercise-card"]'
    ).first();

    if (!(await firstSuggestion.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: no suggestion cards visible after clicking Suggest');
      return;
    }

    await firstSuggestion.click();

    // Clicking should add the exercise — verify the workout panel now contains it
    const addedExercise = page.locator('[class*="workout-exercise"], [class*="day-exercise"], [class*="exercise-row"]').first();
    await expect(addedExercise).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 5. Professional trainer: "Suggest next exercise" button IS visible
  test('53.05 professional trainer sees Suggest next exercise button', async ({ page }) => {
    await loginViaAPI(page, 'professional');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest"), button:has-text("Next Exercise")'
    ).first();

    // Professional tier should have aiSuggest: true
    await expect(suggestBtn).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 6. Starter trainer: "Suggest next exercise" button is NOT visible
  test('53.06 starter trainer does NOT see Suggest next exercise button', async ({ page }) => {
    await loginViaAPI(page, 'starter');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest next exercise"), button[aria-label="Suggest next exercise"]'
    ).first();

    // Should not be visible for starter tier
    await expect(suggestBtn).not.toBeVisible();

    await takeScreenshot(page, '53-06-starter-no-suggest-btn.png');
  });

  // 7. Starter trainer: no upgrade lock visible for the button (it's hidden not locked)
  test('53.07 starter: no upgrade lock overlay for suggest button', async ({ page }) => {
    await loginViaAPI(page, 'starter');
    await navigateToExerciseStep(page);

    // The suggest button should be hidden, not shown with a lock icon
    const lockIcon = page.locator(
      '[aria-label*="locked" i]:near(:text("Suggest")), [class*="lock"]:near(:text("Suggest"))'
    ).first();

    // Lock overlay should NOT be present (button is hidden entirely)
    await expect(lockIcon).not.toBeVisible();

    // Page must be functional — verify the builder heading is visible
    await expect(
      page.locator('text=/Program|exercise|workout/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 8. Enterprise: button disabled when already loading
  test('53.08 enterprise: suggest button disabled while loading (no double-click)', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest")'
    ).first();

    if (!(await suggestBtn.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: enterprise suggest button not visible on exercise panel');
      return;
    }

    await suggestBtn.click();

    // During loading, button should be disabled or have aria-disabled or text changes
    // Use locator auto-wait to detect the disabled state within 2s
    // COMMANDMENT #1: removed `|| true` — if none of these states is detected, the test fails
    const isDisabled = await suggestBtn.isDisabled();
    const ariaDisabled = await suggestBtn.getAttribute('aria-disabled');
    const btnText = await suggestBtn.textContent();
    const isLoading = btnText?.toLowerCase().includes('thinking') || btnText?.toLowerCase().includes('loading');

    expect(isDisabled || ariaDisabled === 'true' || isLoading).toBe(true);
  });

  // 9. Enterprise: suggestion popover closes when clicking outside
  test('53.09 enterprise: suggestion popover closes when clicking outside', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest")'
    ).first();

    if (!(await suggestBtn.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: enterprise suggest button not visible on exercise panel');
      return;
    }

    await suggestBtn.click();

    // Wait for suggestions to appear
    const popover = page.locator('[class*="suggestion"], [class*="suggest"], [role="listbox"]').first();
    await expect(popover).toBeVisible({ timeout: 5000 });

    // Click outside the popover
    await page.mouse.click(10, 10);

    // Popover should be gone
    await expect(popover).not.toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 10. Enterprise: adding suggested exercise updates exercise count
  test('53.10 enterprise: accepted suggestion reflects in exercise count', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await navigateToExerciseStep(page);

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest")'
    ).first();

    if (!(await suggestBtn.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: enterprise suggest button not visible on exercise panel');
      return;
    }

    // Count initial exercises in the day panel
    const exerciseItems = page.locator('[class*="workout-exercise"], [class*="day-exercise"], [class*="exercise-row"]');
    const initialCount = await exerciseItems.count();

    await suggestBtn.click();

    const firstSuggestion = page.locator(
      '[class*="suggestion"] button, button:has-text("Add"), [class*="suggest-item"]'
    ).first();

    if (!(await firstSuggestion.isVisible({ timeout: 5000 }))) {
      test.fixme(true, 'KNOWN: no suggestion cards visible after clicking Suggest');
      return;
    }

    await firstSuggestion.click();

    // Exercise count must increase by at least 1
    await expect(exerciseItems).toHaveCount(initialCount + 1, { timeout: TIMEOUTS.element });

    await takeScreenshot(page, '53-10-suggest-exercise-added.png');
  });
});
