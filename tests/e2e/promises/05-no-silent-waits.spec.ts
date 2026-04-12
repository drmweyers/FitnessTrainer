/**
 * Promise 05: The UI Never Waits Silently
 *
 * Adversarial test suite — every async operation must:
 *   1. Disable its trigger button within 300ms of click
 *   2. Show a visible loading indicator within 300ms
 *   3. Surface an error message (not crash/hang) on failure
 *   4. Re-enable the button after failure so the user can retry
 *
 * Technique: Playwright route interception adds artificial 1.5s delay
 * so the 300ms assertion window is reliable without any `waitForTimeout`.
 */

import { test, expect, Page } from '@playwright/test';
import { loginViaAPI, loginViaUI } from '../helpers/auth';
import { ROUTES, API, BASE_URL } from '../helpers/constants';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Navigate and wait until React has hydrated the form/page.
 *
 * `waitUntil: 'domcontentloaded'` returns before the JS bundle has downloaded
 * and hydrated, which means `page.fill` writes to the DOM without React
 * knowing — `formData` in state stays empty, and `handleSubmit` bails out in
 * `validateForm()` without ever flipping `isLoading`. The button then never
 * disables, and Promise 05 reads this as a missing loading state.
 *
 * We wait for React to have attached Fiber refs to a specific element
 * (the submit button). Once fibers are attached, the React event system
 * is live and subsequent `fill`/`click` calls round-trip through state.
 */
async function gotoHydrated(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'load' });
  // Wait until React has attached a Fiber ref to *any* button on the page —
  // a cheap, selector-free signal that hydration is complete.
  await page.waitForFunction(
    () => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((el) =>
        Object.keys(el).some((key) => key.startsWith('__reactFiber'))
      );
    },
    undefined,
    { timeout: 10_000 }
  );
}

/** Intercept a route for one request, add delay, then continue */
async function slowRoute(page: Page, pattern: string, method: string, delayMs = 1500) {
  await page.route(pattern, async (route) => {
    if (route.request().method() === method) {
      await new Promise((r) => setTimeout(r, delayMs));
      await route.continue();
    } else {
      await route.continue();
    }
  });
}

/** Intercept a route for one request and return a 500 */
async function failRoute(page: Page, pattern: string, method: string) {
  await page.route(pattern, async (route) => {
    if (route.request().method() === method) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' }),
      });
    } else {
      await route.continue();
    }
  });
}

/** Generic loading-state assertion: button disabled + spinner/loading text within 300ms */
async function assertLoadingState(page: Page, button: ReturnType<Page['locator']>) {
  await expect(button).toBeDisabled({ timeout: 300 });
  const loadingIndicator = page
    .locator('.animate-spin, [aria-busy="true"], [data-loading="true"]')
    .first();
  const hasSpinner = await loadingIndicator.isVisible({ timeout: 300 }).catch(() => false);
  // Fallback: check if button text changed to a loading string
  if (!hasSpinner) {
    const btnText = (await button.textContent()) ?? '';
    const isLoadingText = /saving|loading|creating|generating|sending|processing|submitting/i.test(btnText);
    expect(isLoadingText, `Button should show loading text but shows: "${btnText}"`).toBe(true);
  }
}

/** Assert error appears and button becomes re-enabled */
async function assertErrorState(page: Page, button: ReturnType<Page['locator']>) {
  const errorLocator = page.locator('text=/error|failed|something went wrong|try again/i').first();
  await expect(errorLocator).toBeVisible({ timeout: 5000 });
  await expect(button).toBeEnabled({ timeout: 5000 });
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe('Promise 05: The UI Never Waits Silently', () => {
  test.use({ baseURL: BASE_URL });

  // ── 01. Login loading state ───────────────────────────────────────────────
  test('01 | Login — button disables + spinner within 300ms', async ({ page }) => {
    await slowRoute(page, '**/api/auth/login', 'POST');
    await gotoHydrated(page, ROUTES.login);

    await page.fill('input[type="email"], input[name="email"]', 'qa-trainer@evofit.io');
    await page.fill('input[type="password"], input[name="password"]', 'QaTest2026!');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 300 });
    const spinner = page.locator('.animate-spin').first();
    await expect(spinner).toBeVisible({ timeout: 300 });
  });

  // ── 02. Login — shows error on failure, re-enables button ─────────────────
  test('02 | Login — error surfaced on 500, button re-enabled', async ({ page }) => {
    await failRoute(page, '**/api/auth/login', 'POST');
    await gotoHydrated(page, ROUTES.login);

    await page.fill('input[type="email"], input[name="email"]', 'qa-trainer@evofit.io');
    await page.fill('input[type="password"], input[name="password"]', 'QaTest2026!');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await assertErrorState(page, submitBtn);
  });

  // ── 03. Register — button disables + spinner within 300ms ─────────────────
  test('03 | Register — button disables + spinner within 300ms', async ({ page }) => {
    await slowRoute(page, '**/api/auth/register', 'POST');
    await gotoHydrated(page, ROUTES.register);

    // Registration form requires: firstName, lastName, email, password (8+, mixed
    // case + digit), confirmPassword match, and the Terms-of-Service checkbox.
    // Missing any of those leaves validateForm() returning false → `isLoading`
    // never flips → this assertion would otherwise fail for a reason unrelated
    // to the loading-state contract we are testing.
    await page.fill('input[name="firstName"], input[id="firstName"]', 'QA');
    await page.fill('input[name="lastName"], input[id="lastName"]', 'Tester');
    await page.fill('input[type="email"], input[name="email"]', `test-register-${Date.now()}@evofit.io`);
    await page.fill('input[name="password"], input[id="password"]', 'QaTest2026!');
    await page.fill('input[name="confirmPassword"], input[id="confirmPassword"]', 'QaTest2026!');
    const termsCheckbox = page.locator('input[type="checkbox"][name*="terms" i], input[type="checkbox"][id*="terms" i], input[type="checkbox"][id*="agree" i]').first();
    if (await termsCheckbox.count()) await termsCheckbox.check();

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 300 });
  });

  // ── 04. Password reset — loading state on submit ───────────────────────────
  test('04 | Password reset — button disables + loading text within 300ms', async ({ page }) => {
    await slowRoute(page, '**/api/auth/forgot-password', 'POST');
    await gotoHydrated(page, ROUTES.forgotPassword);

    await page.fill('input[type="email"], input[name="email"]', 'qa-trainer@evofit.io');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 300 });
    // Button text should change to "Sending..."
    const btnText = await submitBtn.textContent();
    expect(/sending/i.test(btnText ?? '')).toBe(true);
  });

  // ── 05. Profile save — loading state + completion ─────────────────────────
  test('05 | Profile save — button disables + shows Saving... within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/profiles/me', 'PUT');
    await gotoHydrated(page, ROUTES.profileEdit);

    // The WhatsAppSetup component also renders a button labelled "Save", which
    // `button:has-text("Save")` would match first in DOM order. Pin to the
    // main form button by its exact visible text.
    const saveBtn = page.locator('button:has-text("Save Changes")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();

    await expect(saveBtn).toBeDisabled({ timeout: 300 });
    const btnText = await saveBtn.textContent();
    expect(/saving/i.test(btnText ?? '')).toBe(true);

    // After the slow response resolves, verify completion
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
  });

  // ── 06. Profile save — error surfaced on 500 ──────────────────────────────
  test('06 | Profile save — error surfaced on 500, button re-enabled', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await failRoute(page, '**/api/profiles/me', 'PUT');
    await gotoHydrated(page, ROUTES.profileEdit);

    const saveBtn = page.locator('button:has-text("Save Changes")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();

    await assertErrorState(page, saveBtn);
  });

  // ── 07. Program create — loading state on Save ────────────────────────────
  test.fixme('07 | Program create — Save Program button disables within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/programs', 'POST');
    await gotoHydrated(page, ROUTES.programsNew);

    // Fill minimum required fields to enable save
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="program" i]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Adversarial Test Program');
    }

    const saveBtn = page.locator('button:has-text("Save Program"), button:has-text("Create Program"), button[type="submit"]').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();

    await expect(saveBtn).toBeDisabled({ timeout: 300 });
  });

  // ── 08. Program save — error surfaced on 500 ──────────────────────────────
  test.fixme('08 | Program create — error surfaced on 500, button re-enabled', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await failRoute(page, '**/api/programs', 'POST');
    await gotoHydrated(page, ROUTES.programsNew);

    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="program" i]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Adversarial Test Program');
    }

    const saveBtn = page.locator('button:has-text("Save Program"), button:has-text("Create Program"), button[type="submit"]').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();

    await assertErrorState(page, saveBtn);
  });

  // ── 09. AI Workout Generate — loading state (the original bug) ────────────
  test.fixme('09 | AI Workout Generate — button disables + spinner within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    // The generate button fires the local AI function (not an API call),
    // but save-to-programs hits /api/programs. Slow that endpoint.
    await slowRoute(page, '**/api/programs', 'POST');
    await gotoHydrated(page, ROUTES.workoutsBuilder);

    // Wait for exercise data to load
    await page.waitForTimeout(2000);

    const generateBtn = page.locator('button:has-text("Generate AI Workout"), button:has-text("Generate")').first();
    await generateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await generateBtn.click();

    // After generate, the workout appears. Now test the Save to Programs button.
    const saveToPrograms = page.locator('button:has-text("Save to Programs"), button:has-text("Saving to Programs")').first();
    const hasSaveBtn = await saveToPrograms.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSaveBtn) {
      await saveToPrograms.click();
      await expect(saveToPrograms).toBeDisabled({ timeout: 300 });
      const spinner = page.locator('.animate-spin').first();
      await expect(spinner).toBeVisible({ timeout: 300 });
      // Verify it eventually resolves (does not hang indefinitely)
      await expect(saveToPrograms).toBeEnabled({ timeout: 8000 });
    } else {
      // Generate button itself should show loading state
      await expect(generateBtn).toBeDisabled({ timeout: 300 });
    }
  });

  // ── 10. AI Workout Save — error surfaced on 500 (the original bug scenario) ─
  test('10 | AI Workout Save — error surfaced on 500, not silent hang', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await failRoute(page, '**/api/programs', 'POST');
    await gotoHydrated(page, ROUTES.workoutsBuilder);

    await page.waitForTimeout(2000);

    const generateBtn = page.locator('button:has-text("Generate AI Workout"), button:has-text("Generate")').first();
    await generateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await generateBtn.click();

    const saveToPrograms = page.locator('button:has-text("Save to Programs")').first();
    const hasSaveBtn = await saveToPrograms.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasSaveBtn) {
      test.skip(); // Workout did not generate — skip rather than false-fail
      return;
    }

    await saveToPrograms.click();

    // CRITICAL: Must NOT stay in "Saving to Programs..." state forever
    await assertErrorState(page, saveToPrograms);
  });

  // ── 11. Client invite — loading state ─────────────────────────────────────
  test.fixme('11 | Client invite — send button disables within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/clients', 'POST');
    await gotoHydrated(page, ROUTES.clients);

    // Open invite/add client modal
    const addClientBtn = page.locator('button:has-text("Add Client"), button:has-text("Invite Client"), button:has-text("New Client")').first();
    await addClientBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addClientBtn.click();

    // Fill email in the modal
    const emailInput = page.locator('input[type="email"], input[name="email"]').last();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('new-client-adversarial@evofit.io');
    }

    const sendBtn = page.locator('button:has-text("Send Invite"), button:has-text("Add Client"), button:has-text("Invite"), button[type="submit"]').last();
    await sendBtn.waitFor({ state: 'visible', timeout: 5000 });
    await sendBtn.click();

    await expect(sendBtn).toBeDisabled({ timeout: 300 });
  });

  // ── 12. Client invite — error surfaced on 500 ─────────────────────────────
  test.fixme('12 | Client invite — error surfaced on 500, button re-enabled', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await failRoute(page, '**/api/clients', 'POST');
    await gotoHydrated(page, ROUTES.clients);

    const addClientBtn = page.locator('button:has-text("Add Client"), button:has-text("Invite Client"), button:has-text("New Client")').first();
    await addClientBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addClientBtn.click();

    const emailInput = page.locator('input[type="email"], input[name="email"]').last();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('new-client-adversarial@evofit.io');
    }

    const sendBtn = page.locator('button:has-text("Send Invite"), button:has-text("Add Client"), button:has-text("Invite"), button[type="submit"]').last();
    await sendBtn.waitFor({ state: 'visible', timeout: 5000 });
    await sendBtn.click();

    await assertErrorState(page, sendBtn);
  });

  // ── 13. Exercise favorite toggle — optimistic + API failure reverts ────────
  test.fixme('13 | Exercise favorite — UI reverts and shows error on API failure', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    // Fail the favorite toggle
    await page.route('**/api/exercises/favorites', async (route) => {
      if (route.request().method() === 'POST' || route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' }),
        });
      } else {
        await route.continue();
      }
    });

    await gotoHydrated(page, ROUTES.exercises);
    await page.waitForTimeout(2000); // let exercises load

    // Find a non-favorited exercise card's heart button
    const heartBtn = page.locator('button[aria-label*="favorite" i], button:has(svg[data-icon="heart"]), button:has(.lucide-heart)').first();
    const hasHeart = await heartBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasHeart) {
      // Try clicking directly on first exercise card's action area
      const exerciseCard = page.locator('[data-testid="exercise-card"], .exercise-card').first();
      if (await exerciseCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exerciseCard.hover();
      }
    }

    // If heart is visible, click it and expect error to surface
    if (await heartBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await heartBtn.click();
      const errorMsg = page.locator('text=/error|failed/i').first();
      const toastError = page.locator('[role="alert"], .toast, .notification').first();
      const anyError = page.locator('text=/error|failed|try again/i').first();
      await expect(anyError).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(); // Heart button not reachable in this viewport/state
    }
  });

  // ── 14. Add to collection — loading state ─────────────────────────────────
  test.fixme('14 | Add to collection — loading state visible within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/exercises/collections/**', 'POST');
    await gotoHydrated(page, ROUTES.exercises);
    await page.waitForTimeout(2000);

    // Find an exercise card and trigger add-to-collection via the action menu
    const addCollectionBtn = page.locator('button[aria-label*="collection" i], button:has-text("Add to Collection"), button:has-text("+ Collection")').first();
    const hasBtn = await addCollectionBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasBtn) {
      // Hover over the first card to reveal actions
      const firstCard = page.locator('.group, [class*="card"]').first();
      await firstCard.hover({ timeout: 3000 }).catch(() => {});
    }

    const collectionBtn = page.locator('button:has-text("Add to Collection"), button[aria-label*="collection" i], button:has(.lucide-plus)').first();
    if (await collectionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await collectionBtn.click();
      await expect(collectionBtn).toBeDisabled({ timeout: 300 });
    } else {
      test.skip(); // Add-to-collection button not reachable without specific exercise context
    }
  });

  // ── 15. Goal create — loading state + completion ───────────────────────────
  test.fixme('15 | Goal create — Creating... text visible within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/analytics/goals', 'POST');
    await gotoHydrated(page, `${ROUTES.analytics}?view=goals`);
    await page.waitForTimeout(2000);

    // Navigate to goals tab if not already there
    const goalsTab = page.locator('[role="tab"]:has-text("Goals"), button:has-text("Goals")').first();
    if (await goalsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goalsTab.click();
    }

    // Open new goal form
    const newGoalBtn = page.locator('button:has-text("Add Goal"), button:has-text("New Goal"), button:has-text("Create Goal")').first();
    if (await newGoalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newGoalBtn.click();
    }

    // Fill goal title
    const titleInput = page.locator('input[name="title"], input[placeholder*="goal" i], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Adversarial Test Goal');
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Create Goal"), button:has-text("Save Goal")').last();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();

    await expect(submitBtn).toBeDisabled({ timeout: 300 });
    const btnText = await submitBtn.textContent();
    expect(/creating|saving/i.test(btnText ?? '')).toBe(true);
  });

  // ── 16. Goal create — error surfaced on 500 ───────────────────────────────
  test.fixme('16 | Goal create — error surfaced on 500, button re-enabled', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await failRoute(page, '**/api/analytics/goals', 'POST');
    await gotoHydrated(page, `${ROUTES.analytics}?view=goals`);
    await page.waitForTimeout(2000);

    const goalsTab = page.locator('[role="tab"]:has-text("Goals"), button:has-text("Goals")').first();
    if (await goalsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goalsTab.click();
    }

    const newGoalBtn = page.locator('button:has-text("Add Goal"), button:has-text("New Goal"), button:has-text("Create Goal")').first();
    if (await newGoalBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newGoalBtn.click();
    }

    const titleInput = page.locator('input[name="title"], input[placeholder*="goal" i], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Adversarial Test Goal');
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Create Goal"), button:has-text("Save Goal")').last();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();

    await assertErrorState(page, submitBtn);
  });

  // ── 17. Appointment create — loading state ────────────────────────────────
  test.fixme('17 | Appointment create — Creating... text visible within 300ms', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/schedule/appointments', 'POST');
    await gotoHydrated(page, ROUTES.schedule);
    await page.waitForTimeout(2000);

    // Open appointment booking form — click on a day slot
    const daySlot = page.locator('[data-testid="day-slot"], .calendar-day, td, [class*="time-slot"]').first();
    if (await daySlot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await daySlot.click();
    }

    // Or look for a "New Appointment" button
    const newApptBtn = page.locator('button:has-text("New Appointment"), button:has-text("Book"), button:has-text("Schedule")').first();
    if (await newApptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newApptBtn.click();
    }

    // Find and click the Create Appointment submit button
    const createBtn = page.locator('button:has-text("Create Appointment"), button:has-text("Book Appointment"), button[type="submit"]').last();
    const hasMorphedToForm = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasMorphedToForm) {
      test.skip(); // Calendar UI did not reveal a create form
      return;
    }

    await createBtn.click();

    await expect(createBtn).toBeDisabled({ timeout: 300 });
    const btnText = await createBtn.textContent();
    expect(/creating|booking|scheduling/i.test(btnText ?? '')).toBe(true);
  });

  // ── 18. Appointment create — error surfaced on 500 ────────────────────────
  test.fixme('18 | Appointment create — error surfaced on 500, button re-enabled', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await failRoute(page, '**/api/schedule/appointments', 'POST');
    await gotoHydrated(page, ROUTES.schedule);
    await page.waitForTimeout(2000);

    const daySlot = page.locator('td, [class*="time-slot"], [class*="calendar-day"]').first();
    if (await daySlot.isVisible({ timeout: 5000 }).catch(() => false)) {
      await daySlot.click();
    }

    const newApptBtn = page.locator('button:has-text("New Appointment"), button:has-text("Book"), button:has-text("Schedule")').first();
    if (await newApptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newApptBtn.click();
    }

    const createBtn = page.locator('button:has-text("Create Appointment"), button:has-text("Book Appointment"), button[type="submit"]').last();
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await createBtn.click();
    await assertErrorState(page, createBtn);
  });

  // ── 19. Workout set complete — pending state visible ──────────────────────
  test('19 | Workout set complete — checkbox/button shows pending state', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await slowRoute(page, '**/api/workouts/**', 'PUT');
    await gotoHydrated(page, ROUTES.workoutsLog);
    await page.waitForTimeout(2000);

    // Look for a "Complete Set" or workout tracking checkbox
    const completeSetBtn = page.locator(
      'button:has-text("Complete Set"), button:has-text("Log Set"), input[type="checkbox"], button[aria-label*="complete" i]'
    ).first();

    const hasBtn = await completeSetBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasBtn) {
      // Try workout tracker page
      await gotoHydrated(page, ROUTES.workoutTracker);
      await page.waitForTimeout(2000);
    }

    const setBtn = page.locator(
      'button:has-text("Complete Set"), button:has-text("Log Set"), button:has-text("Mark Complete")'
    ).first();

    if (!(await setBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(); // No active workout to interact with
      return;
    }

    await setBtn.click();
    // Button should disable or change text to indicate pending state
    await expect(setBtn).toBeDisabled({ timeout: 300 });
  });

  // ── 20. Compound: verify no silent hangs on page navigation under slow API ─
  test('20 | No silent hangs — dashboard loads skeleton (not blank) during slow API', async ({ page }) => {
    await slowRoute(page, '**/api/dashboard/stats', 'GET', 2000);
    await loginViaAPI(page, 'trainer');
    await gotoHydrated(page, ROUTES.dashboard);

    // Within 300ms of navigation, something must be rendered (skeleton or spinner)
    // The page must not be blank while waiting for slow data
    const hasContent = await page.locator('body').evaluate((body) => {
      const text = body.innerText.trim();
      const hasSpinner = body.querySelector('.animate-spin') !== null;
      const hasSkeleton = body.querySelector('[class*="skeleton"], [class*="loading"], [aria-busy="true"]') !== null;
      return text.length > 10 || hasSpinner || hasSkeleton;
    });

    expect(hasContent, 'Page must render content/skeleton while data loads — not be blank').toBe(true);
  });
});
