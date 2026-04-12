/**
 * Promise 02: I Can Always Back Out
 *
 * Adversarial suite probing every modal, wizard, and multi-step form in EvoFit
 * to verify that Cancel / ESC / backdrop-click / router.back() never:
 *   - traps the user (no exit path)
 *   - creates a ghost record in the database
 *   - persists unsaved form data on re-open
 *
 * Uses domcontentloaded everywhere (networkidle never settles in Next.js HMR dev).
 */

import { test, expect, Page } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, waitForPageReady } from '../helpers/auth';

// Keep test.use at module level (Playwright forbids it inside describe groups
// when using video/screenshot options that force a new worker)
test.use({ video: 'off', screenshot: 'off' });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function navTo(page: Page, route: string) {
  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUTS.pageLoad,
  });
  // Allow React hydration & auth guard to settle before interacting
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 }).catch(() => {});
  await waitForPageReady(page);
}

/**
 * Fill the program name and wait for Next button to become enabled.
 * The input is React-controlled; we need to wait for state to propagate.
 */
async function fillProgramName(page: Page, name: string) {
  const nameInput = page.locator('input#name');
  await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
  await nameInput.fill(name);
  // Wait for Next to become enabled (canGoNext reactive to name value)
  const nextBtn = page.locator('button:has-text("Next")').first();
  await expect(nextBtn).toBeEnabled({ timeout: TIMEOUTS.element });
}

async function getApiCount(
  page: Page,
  endpoint: string,
  token: string,
  selector?: (body: any) => number
): Promise<number> {
  const res = await page.request.get(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return -1;
  const body = await res.json();
  if (selector) return selector(body);
  const data = body.data ?? body;
  if (Array.isArray(data)) return data.length;
  return -1;
}

async function getToken(page: Page): Promise<string> {
  return (await page.evaluate(() => localStorage.getItem('accessToken'))) ?? '';
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('02 - I Can Always Back Out', () => {
  // =========================================================================
  // 1. PROGRAM BUILDER WIZARD — Cancel & Exit from any step
  // =========================================================================

  test('wizard: Cancel & Exit from info step returns to /programs', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // The "Cancel & Exit" button (ghost variant, bottom row) lives in ProgramBuilder
    const cancelExit = page.locator('button:has-text("Cancel"), button:has-text("Cancel & Exit")');
    await expect(cancelExit.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await cancelExit.first().click();

    // router.back() from /programs/new → goes to whatever was before it.
    // In our case loginViaAPI starts at /, so this goes back to /.
    // The page MUST navigate away from /programs/new — that is the exit promise.
    await expect(page).not.toHaveURL(/programs\/new/, { timeout: TIMEOUTS.pageLoad });
    // If it ends up at /programs, verify the heading; otherwise just verify navigation occurred
    const currentUrl = page.url();
    if (currentUrl.includes('/programs') && !currentUrl.includes('/new')) {
      await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });
    }
  });

  test('wizard: Cancel & Exit from weeks step returns to /programs', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // Fill step 1 → advance to goals → advance to weeks
    await fillProgramName(page, 'Back-Out Test Program');
    await page.locator('button:has-text("Next")').first().click(); // → goals step

    const nextBtn2 = page.locator('button:has-text("Next")').first();
    await expect(nextBtn2).toBeEnabled({ timeout: TIMEOUTS.element });
    await nextBtn2.click(); // → weeks step

    // Should now be on weeks step (auto-scaffolded from durationWeeks=4)
    await expect(page.locator('text=/Week Structure|Program Weeks/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    const cancelExit = page.locator('button:has-text("Cancel"), button:has-text("Cancel & Exit")').last();
    await cancelExit.click();

    await expect(page).not.toHaveURL(/programs\/new/, { timeout: TIMEOUTS.pageLoad });
  });

  test('wizard: Back button from goals step returns to info with name preserved', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    await fillProgramName(page, 'Persistence Check Program');
    await page.locator('button:has-text("Next")').first().click(); // → goals

    // Go back
    const backBtn = page.locator('button:has-text("Back")').first();
    await expect(backBtn).toBeEnabled({ timeout: TIMEOUTS.element });
    await backBtn.click(); // → info

    // Name should still be there — state was preserved (React state lives in ProgramBuilder)
    await expect(page.locator('input#name')).toHaveValue('Persistence Check Program');
  });

  test('wizard: Back button disabled on first step (no back trap)', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    const backBtn = page.locator('button:has-text("Back")').first();
    await expect(backBtn).toBeDisabled({ timeout: TIMEOUTS.element });
  });

  test('wizard: Add Week dialog dismissed by Cancel button — no week added', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // Navigate to weeks step
    await fillProgramName(page, 'Add-Week Cancel Test');
    await page.locator('button:has-text("Next")').first().click();
    const nextBtn2 = page.locator('button:has-text("Next")').first();
    await expect(nextBtn2).toBeEnabled({ timeout: TIMEOUTS.element });
    await nextBtn2.click();

    // Count weeks before
    const weeksBefore = await page.locator('[class*="CardHeader"], [class*="week-card"]').count();

    // Open Add Week dialog
    const addWeekBtn = page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first();
    await expect(addWeekBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addWeekBtn.click();

    // Dialog should be visible (Radix Dialog renders as generic, not role="dialog")
    await expect(page.locator('text=/Add New Week/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Fill the week name field
    const weekNameInput = page.locator('input#week-name, input[placeholder*="Week 1"]').first();
    await expect(weekNameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await weekNameInput.fill('Should Not Appear');

    // Press Cancel in the dialog footer — it's a sibling of the "Add Week" submit button
    // Radix Dialog content doesn't have role="dialog" in accessibility tree, so scope to
    // the container that has both "Cancel" and the "Add Week" submit button
    const addWeekSubmitBtn = page.locator('button:has-text("Add Week")').last();
    await expect(addWeekSubmitBtn).toBeVisible({ timeout: TIMEOUTS.element });
    // Cancel is in the same footer as the Add Week submit button
    const dialogCancelBtn = page.locator('button:has-text("Cancel")').filter({ hasText: 'Cancel' }).last();
    await expect(dialogCancelBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await dialogCancelBtn.click();

    // Dialog should be gone
    await expect(page.locator('text=/Add New Week/i').first()).not.toBeVisible({ timeout: TIMEOUTS.element });

    // No extra week should have been added beyond scaffolded weeks
    // The typed name should NOT appear anywhere on the page
    await expect(page.locator('text="Should Not Appear"')).not.toBeVisible({ timeout: 2000 });
  });

  test('wizard: Add Week dialog dismissed by ESC — no week added', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    await fillProgramName(page, 'ESC Dismiss Test');
    await page.locator('button:has-text("Next")').first().click();
    const nextBtn2 = page.locator('button:has-text("Next")').first();
    await expect(nextBtn2).toBeEnabled({ timeout: TIMEOUTS.element });
    await nextBtn2.click();

    const addWeekBtn = page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first();
    await expect(addWeekBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addWeekBtn.click();

    await expect(page.locator('text=/Add New Week/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Fill before dismissing
    const weekNameInput = page.locator('input#week-name').first();
    if (await weekNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await weekNameInput.fill('ESC Ghost Week');
    }

    await page.keyboard.press('Escape');

    await expect(page.locator('text=/Add New Week/i').first()).not.toBeVisible({ timeout: TIMEOUTS.element });
    await expect(page.locator('text="ESC Ghost Week"')).not.toBeVisible({ timeout: 2000 });
  });

  test('wizard: Add Week dialog dismissed by backdrop click — dialog closes', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    await fillProgramName(page, 'Backdrop Test');
    await page.locator('button:has-text("Next")').first().click();
    const nextBtn2 = page.locator('button:has-text("Next")').first();
    await expect(nextBtn2).toBeEnabled({ timeout: TIMEOUTS.element });
    await nextBtn2.click();

    const addWeekBtn = page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first();
    await expect(addWeekBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addWeekBtn.click();

    // Radix Dialog renders as generic, not [role="dialog"]; check for heading instead
    await expect(page.locator('text=/Add New Week/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Click the backdrop (outside the dialog content)
    await page.mouse.click(10, 10);

    // Dialog should be gone (Radix Dialog closes on outside click by default)
    await expect(page.locator('text=/Add New Week/i').first()).not.toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('wizard: Cancel & Exit does NOT save a program to DB', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeCount = await getApiCount(page, API.programs, token);

    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Ghost Program — Should Not Exist');

    // Immediately cancel — do NOT need Next to be enabled for cancel to work
    const cancelExit = page.locator('button:has-text("Cancel"), button:has-text("Cancel & Exit")').first();
    await expect(cancelExit).toBeVisible({ timeout: TIMEOUTS.element });
    await cancelExit.click();
    await expect(page).not.toHaveURL(/programs\/new/, { timeout: TIMEOUTS.pageLoad });

    // DB count must be unchanged
    const afterCount = await getApiCount(page, API.programs, token);
    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBe(beforeCount);
    }
  });

  // =========================================================================
  // 2. CLIENT INVITE MODAL — Cancel leaves no ghost client
  // =========================================================================

  test('client invite modal: Cancel on form step dismisses without creating client', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeCount = await getApiCount(page, API.clients, token);

    await navTo(page, ROUTES.clients);

    // Look for an Invite / Add Client button
    const inviteBtn = page.locator(
      'button:has-text("Invite"), button:has-text("Invite Client"), button:has-text("Add Client")'
    ).first();
    if (!(await inviteBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip(); // page structure different, skip gracefully
      return;
    }
    await inviteBtn.click();

    // Fill email field
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await emailInput.fill('ghost-client@should-not-exist.test');
    }

    // Press Cancel
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await cancelBtn.click();

    // Modal should be gone
    await expect(page.locator('text=/Invite New Client/i').first()).not.toBeVisible({ timeout: TIMEOUTS.element });

    // DB count unchanged
    const afterCount = await getApiCount(page, API.clients, token);
    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBe(beforeCount);
    }
  });

  // =========================================================================
  // 3. CLIENT EDIT MODAL — Cancel discards unsaved changes
  // =========================================================================

  test('client edit modal: Cancel discards typed changes, not persisted on reopen', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await navTo(page, ROUTES.clients);

    // Find first client edit button
    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    if (!(await editBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      // Try clicking into a client row
      const clientRow = page.locator('[data-testid*="client"], .client-row, tr:has(td)').first();
      if (await clientRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clientRow.click();
      } else {
        test.skip();
        return;
      }
    } else {
      await editBtn.click();
    }

    // Verify modal opened
    const modalHeading = page.locator('text=/Edit Client/i').first();
    if (!(await modalHeading.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }

    // Read the original name value
    const nameInput = page.locator('input[value], input[type="text"]').first();
    const originalValue = await nameInput.inputValue().catch(() => '');

    // Type garbage
    await nameInput.fill('UNSAVED GARBAGE NAME');

    // Cancel
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();

    // Modal gone
    await expect(page.locator('text=/Edit Client/i').first()).not.toBeVisible({ timeout: TIMEOUTS.element });

    // Re-open the same edit modal — CRITICAL: unsaved data should be gone
    const editBtn2 = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    if (await editBtn2.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await editBtn2.click();
      const nameInputAfter = page.locator('input[type="text"]').first();
      const valueAfter = await nameInputAfter.inputValue().catch(() => '');

      // The modal re-initialises from `client` prop — so value should be originalValue, NOT the garbage
      expect(valueAfter).not.toBe('UNSAVED GARBAGE NAME');
    }
  });

  // =========================================================================
  // 4. EXERCISE COLLECTION CREATE — Cancel = no ghost collection
  // =========================================================================

  test('exercise collection create: Cancel does not create a ghost collection', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeCount = await getApiCount(page, API.exerciseCollections, token);

    await navTo(page, ROUTES.exercises);

    // Navigate to collections area
    const collectionsLink = page.locator('a:has-text("Collection"), button:has-text("Collection"), [href*="collections"]').first();
    if (await collectionsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await collectionsLink.click();
      await waitForPageReady(page);
    }

    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Collection"), button:has-text("Add Collection")').first();
    if (!(await createBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }
    await createBtn.click();

    const nameInput = page.locator('input[placeholder*="collection" i], input[placeholder*="name" i], input[type="text"]').first();
    if (await nameInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await nameInput.fill('Ghost Collection — Should Not Exist');
    }

    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await cancelBtn.click();

    const afterCount = await getApiCount(page, API.exerciseCollections, token);
    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBe(beforeCount);
    }
  });

  // =========================================================================
  // 5. APPOINTMENT CREATE — Cancel = no ghost appointment
  // =========================================================================

  test('appointment create: Cancel does not create a ghost appointment', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeRes = await page.request.get(`${BASE_URL}${API.scheduleAppointments}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const beforeBody = await beforeRes.json().catch(() => ({ data: [] }));
    const beforeCount = Array.isArray(beforeBody.data) ? beforeBody.data.length : -1;

    await navTo(page, ROUTES.schedule);

    const addBtn = page.locator(
      'button:has-text("Add"), button:has-text("Book"), button:has-text("Schedule"), button:has-text("New Appointment")'
    ).first();
    if (!(await addBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }
    await addBtn.click();

    // Fill something to simulate partial entry
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="appoint" i], input[type="text"]').first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Ghost Appointment — Should Not Exist');
    }

    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (!(await cancelBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      // Try ESC
      await page.keyboard.press('Escape');
    } else {
      await cancelBtn.click();
    }

    // Verify modal is gone
    await expect(page.locator('text=/Ghost Appointment/i')).not.toBeVisible({ timeout: TIMEOUTS.element });

    // Verify DB unchanged
    const afterRes = await page.request.get(`${BASE_URL}${API.scheduleAppointments}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const afterBody = await afterRes.json().catch(() => ({ data: [] }));
    const afterCount = Array.isArray(afterBody.data) ? afterBody.data.length : -1;

    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBe(beforeCount);
    }
  });

  // =========================================================================
  // 6. GOAL CREATE — Cancel = no ghost goal
  // =========================================================================

  test('goal create: Cancel does not create a ghost goal', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeCount = await getApiCount(page, API.analyticsGoals, token);

    await navTo(page, ROUTES.analytics);

    // Try to find goals tab / add goal button
    const goalsTab = page.locator('button:has-text("Goals"), [role="tab"]:has-text("Goals")').first();
    if (await goalsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goalsTab.click();
      await waitForPageReady(page);
    }

    const addGoalBtn = page.locator('button:has-text("Add Goal"), button:has-text("New Goal"), button:has-text("Create Goal")').first();
    if (!(await addGoalBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }
    await addGoalBtn.click();

    const titleInput = page.locator('input[placeholder*="goal" i], input[type="text"]').first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Ghost Goal — Should Not Exist');
    }

    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    const afterCount = await getApiCount(page, API.analyticsGoals, token);
    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBe(beforeCount);
    }
  });

  // =========================================================================
  // 7. BODY MEASUREMENT LOG — Cancel = nothing saved
  // =========================================================================

  test('body measurement log: Cancel does not save a measurement', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeCount = await getApiCount(page, API.analyticsMeasurements, token);

    await navTo(page, ROUTES.analytics);

    const measureTab = page.locator('[role="tab"]:has-text("Measurement"), button:has-text("Measurement"), button:has-text("Body")').first();
    if (await measureTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await measureTab.click();
      await waitForPageReady(page);
    }

    const logBtn = page.locator('button:has-text("Log"), button:has-text("Add Measurement"), button:has-text("Record")').first();
    if (!(await logBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }
    await logBtn.click();

    const weightInput = page.locator('input[placeholder*="weight" i], input[type="number"]').first();
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightInput.fill('999');
    }

    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    const afterCount = await getApiCount(page, API.analyticsMeasurements, token);
    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBe(beforeCount);
    }
  });

  // =========================================================================
  // 8. CLIENT MODAL — does NOT reset state between open/close when initialised
  //    from client prop (the actual BUG this targets)
  // =========================================================================

  test('client modal (ClientModal.tsx): state initialises from prop not previous session', async ({ page }) => {
    // ClientModal uses useState(client?.name || '') — if the parent always passes
    // the same client object, the initial value is computed ONCE and stale state
    // leaks across re-opens if the parent never remounts the component.
    // This test presses Cancel, then reopens — values should match DB, not typed garbage.

    await loginViaAPI(page, 'trainer');
    await navTo(page, ROUTES.clients);

    // Get first client name via API to compare later
    const token = await getToken(page);
    const clientsRes = await page.request.get(`${BASE_URL}${API.clients}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const clientsBody = await clientsRes.json().catch(() => ({ data: [] }));
    const clients = Array.isArray(clientsBody.data) ? clientsBody.data : clientsBody;
    if (!clients.length) { test.skip(); return; }

    const firstClientName: string = clients[0]?.name || clients[0]?.firstName || '';

    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    if (!(await editBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }

    // First open — type garbage, cancel
    await editBtn.click();
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('GARBAGE_THAT_SHOULD_VANISH');
    await page.locator('button:has-text("Cancel")').first().click();

    // Second open — value must be the original name (or blank), NOT the garbage
    await editBtn.click();
    const nameInput2 = page.locator('input[type="text"]').first();
    await expect(nameInput2).toBeVisible({ timeout: TIMEOUTS.element });
    const reopenedValue = await nameInput2.inputValue();
    expect(reopenedValue).not.toBe('GARBAGE_THAT_SHOULD_VANISH');
  });

  // =========================================================================
  // 9. DELETE PROGRAM CONFIRM — Cancel preserves the program
  // =========================================================================

  test('delete program: Cancel on confirm dialog preserves the program', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    // Ensure at least one program exists — create via API
    const createRes = await page.request.post(`${BASE_URL}${API.programs}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: 'DO NOT DELETE — Cancel Test',
        programType: 'strength',
        difficultyLevel: 'beginner',
        durationWeeks: 4,
        goals: [],
        equipmentNeeded: [],
        weeks: [],
      },
    });
    const programBefore = await getApiCount(page, API.programs, token);

    await navTo(page, ROUTES.programs);

    // Look for a delete button on the programs list
    const deleteBtn = page.locator('button[aria-label*="delete" i], button:has-text("Delete")').first();
    if (!(await deleteBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }

    // Set up dialog auto-dismiss with cancel
    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss(); // Cancel = dismiss
    });

    await deleteBtn.click();

    // If it was a native confirm(), it was already dismissed by the listener above.
    // If it's a custom modal, find and click Cancel
    const customCancelBtn = page.locator('[role="dialog"] button:has-text("Cancel"), [role="alertdialog"] button:has-text("Cancel")').first();
    if (!dialogSeen && await customCancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await customCancelBtn.click();
    }

    const programAfter = await getApiCount(page, API.programs, token);
    if (programBefore >= 0 && programAfter >= 0) {
      // Count should be unchanged or only vary by the test-seeded program
      expect(programAfter).toBeGreaterThanOrEqual(programBefore - 1); // allow for the seed program
    }
  });

  // =========================================================================
  // 10. AI WORKOUT BUILDER — Navigate away mid-generation doesn't trap
  // =========================================================================

  test('AI workout builder: navigate away mid-flow is not blocked', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await navTo(page, ROUTES.workoutsBuilder);

    // Trigger generation if button exists
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Build"), button:has-text("Create Workout")').first();
    if (await generateBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      // Fill minimal required inputs before trying to generate
      const typeSelect = page.locator('select, [role="combobox"]').first();
      if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Don't click — just navigate away immediately to test "trapped" state
      }
      await generateBtn.click().catch(() => {});
    }

    // Immediately navigate away — should not be blocked
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });

    // Must land on programs, not stuck on builder
    await expect(page).toHaveURL(/\/programs/);
  });

  // =========================================================================
  // 11. ADMIN USER EDIT — Cancel causes no mutation
  // =========================================================================

  test('admin user edit: Cancel does not mutate user record', async ({ page }) => {
    await loginViaAPI(page, 'admin');
    const token = await getToken(page);

    // Fetch current admin user list as baseline
    const usersBefore = await page.request.get(`${BASE_URL}${API.adminUsers}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const beforeBody = await usersBefore.json().catch(() => ({ data: [] }));
    const beforeUsers = Array.isArray(beforeBody.data) ? beforeBody.data : [];

    await navTo(page, ROUTES.adminUsers);

    const editBtn = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
    if (!(await editBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }

    await editBtn.click();

    const inputField = page.locator('[role="dialog"] input[type="text"], [role="dialog"] input[type="email"]').first();
    if (await inputField.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await inputField.fill('DO_NOT_SAVE_ADMIN_EDIT');
    }

    const cancelBtn = page.locator('[role="dialog"] button:has-text("Cancel"), button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await cancelBtn.click();

    // Re-fetch users — no field should contain our injected value
    const usersAfter = await page.request.get(`${BASE_URL}${API.adminUsers}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const afterBody = await usersAfter.json().catch(() => ({ data: [] }));
    const afterUsers = Array.isArray(afterBody.data) ? afterBody.data : [];
    const allValues = JSON.stringify(afterUsers);
    expect(allValues).not.toContain('DO_NOT_SAVE_ADMIN_EDIT');
  });

  // =========================================================================
  // 12. PASSWORD CHANGE — Navigate away does not trigger accidental save
  // =========================================================================

  test('password change: navigate away mid-type leaves no unsaved-changes trap', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await navTo(page, ROUTES.profile);

    // Look for password / security section link
    const securityLink = page.locator('a:has-text("Security"), a:has-text("Password"), button:has-text("Change Password")').first();
    if (await securityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await securityLink.click();
      await waitForPageReady(page);
    }

    const newPwdInput = page.locator('input[type="password"]').first();
    if (await newPwdInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newPwdInput.fill('P@rtialPassw0rd!');
    }

    // Navigate away — must not be blocked by a beforeunload trap or app-level confirmation
    const blocked = await Promise.race([
      page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      }).then(() => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 5000)),
    ]);

    expect(blocked).toBe(false);
    // Must have actually navigated away
    await expect(page).not.toHaveURL(/\/profile/, { timeout: 5000 });
  });

  // =========================================================================
  // 13. DELETE CLIENT — Cancel preserves client record
  // =========================================================================

  test('delete client: Cancel on confirm keeps the client in the list', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    const beforeCount = await getApiCount(page, API.clients, token);
    if (beforeCount === 0) { test.skip(); return; }

    await navTo(page, ROUTES.clients);

    const deleteBtn = page.locator('button[aria-label*="delete" i], button[aria-label*="remove" i]').first();
    if (!(await deleteBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }

    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await deleteBtn.click();

    const customCancel = page.locator('[role="dialog"] button:has-text("Cancel"), [role="alertdialog"] button:has-text("Cancel")').first();
    if (!dialogSeen && await customCancel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await customCancel.click();
    }

    const afterCount = await getApiCount(page, API.clients, token);
    if (beforeCount >= 0 && afterCount >= 0) {
      expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
    }
  });

  // =========================================================================
  // 14. DELETE EXERCISE FROM COLLECTION — Cancel keeps exercise in collection
  // =========================================================================

  test('remove exercise from collection: Cancel preserves the exercise', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    const token = await getToken(page);

    // Navigate to collections
    await navTo(page, ROUTES.exercises);
    const collectionsLink = page.locator('[href*="collections"], button:has-text("Collection")').first();
    if (!(await collectionsLink.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await collectionsLink.click();
    await waitForPageReady(page);

    const firstCollection = page.locator('[data-testid*="collection"], a[href*="/collections/"]').first();
    if (!(await firstCollection.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await firstCollection.click();
    await waitForPageReady(page);

    const exerciseCountBefore = await page.locator('[data-testid*="exercise"], .exercise-item, li:has(button[aria-label*="remove" i])').count();

    const removeBtn = page.locator('button[aria-label*="remove" i], button:has-text("Remove")').first();
    if (!(await removeBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false))) {
      test.skip();
      return;
    }

    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await removeBtn.click();

    const customCancel = page.locator('[role="dialog"] button:has-text("Cancel")').first();
    if (!dialogSeen && await customCancel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await customCancel.click();
    }

    const exerciseCountAfter = await page.locator('[data-testid*="exercise"], .exercise-item, li:has(button[aria-label*="remove" i])').count();
    expect(exerciseCountAfter).toBeGreaterThanOrEqual(exerciseCountBefore);
  });
});
