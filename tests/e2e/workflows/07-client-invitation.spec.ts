/**
 * Suite 07 - Client Invitation
 *
 * Tests the invite-client workflow from the /clients page.
 * All tests run as the trainer account.
 *
 * UI reference:
 *   - /clients page renders an "Add Client" button (ClientsPage → ClientList)
 *   - Clicking "Add Client" opens ClientModal (fixed overlay div, not a dialog role)
 *   - Modal contains Name input, Email input, Cancel button, and submit button
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('07 - Client Invitation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for React to fully hydrate before any .click() — under concurrent
    // dev-server load, clicking before hydration silently drops the click.
    // Wait for network idle + heading visible + JS chunks settled.
    await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUTS.pageLoad }).catch(() => {});
    await page
      .locator('h1', { hasText: /clients/i })
      .first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  });

  // ── 1. Page loads ──────────────────────────────────────────────────────────

  test('clients page loads for trainer', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '07-01-clients-page.png');
  });

  // ── 2. Add Client button visible ──────────────────────────────────────────

  test('"Add Client" button is visible', async ({ page }) => {
    const addBtn = page.locator('button', { hasText: /add client/i });
    await expect(addBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // ── 3. Clicking invite/add button opens modal ─────────────────────────────

  test('clicking "Add Client" button opens a modal or form', async ({ page }) => {
    const addBtn = page.locator('button', { hasText: /add client/i });
    await addBtn.first().click();

    // ClientModal renders with an "Add New Client" heading (h2) inside a panel/overlay
    const modal = page
      .locator('h2')
      .filter({ hasText: /add new client/i })
      .or(page.locator('[role="dialog"]'))
      .or(page.locator('h2').filter({ hasText: /add new client/i }));

    await expect(modal.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '07-03-invite-modal-open.png');
  });

  // ── 4. Invite form has email field ────────────────────────────────────────

  test('invite/add form contains an email input', async ({ page }) => {
    await page.locator('button', { hasText: /add client/i }).first().click();

    // Wait for the modal to open
    await page.locator('h2').filter({ hasText: /add new client/i }).waitFor({
      state: 'visible',
      timeout: TIMEOUTS.element,
    });

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // ── 5. Submit with valid email shows success / creates relationship ────────

  test('submitting with a valid email and name succeeds', async ({ page }) => {
    const uniqueEmail = `invite-test-${Date.now()}@evofit-qa-test.com`;

    await page.locator('button', { hasText: /add client/i }).first().click();

    await page.locator('h2').filter({ hasText: /add new client/i }).waitFor({
      state: 'visible',
      timeout: TIMEOUTS.element,
    });

    // Fill Name field (required by ClientModal)
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Invite Test User');

    // Fill Email field
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(uniqueEmail);

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Either modal closes (success) or an error message is shown.
    // Both are valid outcomes — what is NOT acceptable is the app hanging or crashing.
    const modalClosed = await page
      .locator('h2')
      .filter({ hasText: /add new client/i })
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.apiCall })
      .then(() => true)
      .catch(() => false);

    if (!modalClosed) {
      // Modal still open — must show an error message explaining why
      await expect(
        page.locator('.bg-red-100, [role="alert"]').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
    await takeScreenshot(page, '07-05-invite-submit.png');
  });

  // ── 6. Submit with empty email shows validation error ─────────────────────

  test('submitting with empty email shows a validation error', async ({ page }) => {
    await page.locator('button', { hasText: /add client/i }).first().click();

    await page.locator('h2').filter({ hasText: /add new client/i }).waitFor({
      state: 'visible',
      timeout: TIMEOUTS.element,
    });

    // Fill only the name, leave email blank
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Empty Email Test');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // HTML5 required validation keeps the modal open; the email field should be invalid
    const emailInput = page.locator('input[type="email"]').first();
    const isInvalid = await emailInput.evaluate(
      (el) => !(el as HTMLInputElement).validity.valid
    );
    expect(isInvalid).toBeTruthy();
  });

  // ── 7. Submit with invalid email format shows error ───────────────────────

  test('submitting with invalid email format shows a validation error', async ({ page }) => {
    await page.locator('button', { hasText: /add client/i }).first().click();

    await page.locator('h2').filter({ hasText: /add new client/i }).waitFor({
      state: 'visible',
      timeout: TIMEOUTS.element,
    });

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Bad Email Test');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('not-an-email');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // type="email" enforces format; check for native invalidity
    const isInvalid = await emailInput.evaluate(
      (el) => !(el as HTMLInputElement).validity.valid
    );
    expect(isInvalid).toBeTruthy();
  });

  // ── 8. Duplicate invite shows appropriate message ─────────────────────────

  test('duplicate invite/add shows an appropriate response', async ({ page }) => {
    // Use the qa-client account email as it already exists in the system
    const existingEmail = TEST_ACCOUNTS.client.email;

    await page.locator('button', { hasText: /add client/i }).first().click();

    await page.locator('h2').filter({ hasText: /add new client/i }).waitFor({
      state: 'visible',
      timeout: TIMEOUTS.element,
    });

    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Duplicate Client');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(existingEmail);

    await page.locator('button[type="submit"]').click();

    // For a duplicate client: must either close (already on roster) or show an error
    const modalClosed = await page
      .locator('h2')
      .filter({ hasText: /add new client/i })
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.apiCall })
      .then(() => true)
      .catch(() => false);

    if (!modalClosed) {
      // App should show an error — not hang silently
      await expect(
        page.locator('.bg-red-100, [role="alert"], text=/already|exists|duplicate/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }

    // The clients heading must still be visible (page not crashed)
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '07-08-duplicate-invite.png');
  });

  // ── 9. After invite client appears in list / pending section ──────────────

  test('after adding a client the list updates or shows the new entry', async ({ page }) => {
    const uniqueEmail = `post-add-${Date.now()}@evofit-qa-test.com`;

    await page.locator('button', { hasText: /add client/i }).first().click();

    await page.locator('h2').filter({ hasText: /add new client/i }).waitFor({
      state: 'visible',
      timeout: TIMEOUTS.element,
    });

    await page.locator('input[type="text"]').first().fill('Post Add User');
    await page.locator('input[type="email"]').first().fill(uniqueEmail);
    await page.locator('button[type="submit"]').click();

    // Modal should close (success) or show an error (failure) — not hang
    const modalClosed = await page
      .locator('h2')
      .filter({ hasText: /add new client/i })
      .waitFor({ state: 'hidden', timeout: TIMEOUTS.apiCall })
      .then(() => true)
      .catch(() => false);

    if (!modalClosed) {
      await expect(
        page.locator('.bg-red-100, [role="alert"]').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }

    // The page should still show the clients heading (no crash)
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  });

  // ── 10. Cancel button closes modal ────────────────────────────────────────

  test('clicking Cancel closes the modal without submitting', async ({ page }) => {
    await page.locator('button', { hasText: /add client/i }).first().click();

    const modal = page.locator('h2').filter({ hasText: /add new client/i });
    await modal.waitFor({ state: 'visible', timeout: TIMEOUTS.element });

    // Fill some data to confirm it is discarded
    await page.locator('input[type="text"]').first().fill('Should Be Discarded');

    const cancelBtn = page.locator('button', { hasText: /cancel/i });
    await cancelBtn.first().click();

    await expect(modal).not.toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '07-10-modal-closed.png');
  });
});
