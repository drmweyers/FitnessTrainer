/**
 * Suite 10 - Client Profile Detail
 *
 * Tests the client detail page (/clients/[clientId]).
 *
 * UI reference (app/clients/[clientId]/page.tsx):
 *   - Header: "{name}'s Dashboard", status Badge, "Edit Profile" / "Cancel Edit" Button
 *   - When isEditingProfile === true:  ClientProfileEditor card appears with:
 *       - emergencyContactName (input), emergencyContactPhone (input)
 *       - goals (textarea), limitations (textarea), notes (textarea)
 *       - "Save" button, "Cancel" button
 *   - Client info rendered by <ClientProfile client={client} /> in the sidebar
 *
 * Strategy: navigate to the first available client link from /clients.
 * If no clients exist the tests are skipped gracefully.
 */
import { test, expect, Page } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

/** Navigate to /clients and return the href of the first client link, or null. */
async function getFirstClientHref(page: Page): Promise<string | null> {
  await loginViaAPI(page, 'trainer');
  await page.goto(`${BASE_URL}${ROUTES.clients}`, {
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.pageLoad,
  });
  await waitForPageReady(page);

  const firstLink = page.locator('a[href^="/clients/"]').first();
  const visible = await firstLink.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);
  if (!visible) return null;

  return firstLink.getAttribute('href');
}

test.describe('10 - Client Profile Detail', () => {
  let clientHref: string | null = null;

  test.beforeAll(async ({ browser }) => {
    // Discover a real client ID once for the whole suite
    const context = await browser.newContext();
    const page = await context.newPage();
    clientHref = await getFirstClientHref(page);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    if (clientHref) {
      await page.goto(`${BASE_URL}${clientHref}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);
    }
  });

  // ── 1. Client detail page loads ───────────────────────────────────────────

  test('client detail page loads with client information', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    // The page heading is "{displayName}'s Dashboard"
    const heading = page.locator('h1');
    await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.element });

    const headingText = await heading.first().textContent();
    expect(headingText).toMatch(/dashboard/i);
    await takeScreenshot(page, '10-01-client-detail.png');
  });

  // ── 2. Client name and email displayed ────────────────────────────────────

  test('client name is displayed on the detail page', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    // h1 contains the client display name + "Dashboard"
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.element });

    const text = await heading.textContent();
    // Must be more than just "Dashboard" — should include a name or email
    expect(text?.length).toBeGreaterThan('Dashboard'.length);
  });

  // ── 3. Status badge shows current status ─────────────────────────────────

  test('status badge is visible in the client header', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    // Badge component renders status text (active, pending, etc.)
    // ClientProfilePage uses shadcn Badge with statusColors
    const badge = page.locator('.bg-green-100, .bg-yellow-100, .bg-gray-100, .bg-orange-100, .bg-red-100').first();
    const visible = await badge.isVisible({ timeout: TIMEOUTS.element }).catch(() => false);

    if (!visible) {
      // Fallback: any element containing a known status word
      const statusText = page.locator('text=/active|pending|offline|archived/i').first();
      await expect(statusText).toBeVisible({ timeout: TIMEOUTS.element });
    } else {
      await expect(badge).toBeVisible();
    }
    await takeScreenshot(page, '10-03-status-badge.png');
  });

  // ── 4. "Edit Profile" button visible ─────────────────────────────────────

  test('"Edit Profile" button is visible', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    const editBtn = page.locator('button', { hasText: /edit profile/i });
    await expect(editBtn).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // ── 5. Click edit toggles edit mode (form fields appear) ──────────────────

  test('clicking "Edit Profile" reveals the inline edit form', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    const editBtn = page.locator('button', { hasText: /edit profile/i });
    await editBtn.click();

    // ClientProfileEditor card appears after setIsEditingProfile(true)
    const editorCard = page.locator('h3', { hasText: /edit profile/i });
    await expect(editorCard).toBeVisible({ timeout: TIMEOUTS.element });
    await takeScreenshot(page, '10-05-edit-mode.png');
  });

  // ── 6. Can edit emergency contact field ──────────────────────────────────

  test('emergency contact name field is editable', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    await page.locator('button', { hasText: /edit profile/i }).click();

    const ecNameInput = page.locator('#emergencyContactName');
    await expect(ecNameInput).toBeVisible({ timeout: TIMEOUTS.element });

    await ecNameInput.fill('Jane Doe');
    await expect(ecNameInput).toHaveValue('Jane Doe');
  });

  // ── 7. Can edit goals text ────────────────────────────────────────────────

  test('goals textarea is editable', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    await page.locator('button', { hasText: /edit profile/i }).click();

    const goalsTextarea = page.locator('#goals');
    await expect(goalsTextarea).toBeVisible({ timeout: TIMEOUTS.element });

    await goalsTextarea.fill('Build endurance and lose 5kg');
    await expect(goalsTextarea).toHaveValue('Build endurance and lose 5kg');
  });

  // ── 8. Can edit limitations/notes ─────────────────────────────────────────

  test('limitations and notes textareas are editable', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    await page.locator('button', { hasText: /edit profile/i }).click();

    const limitationsTextarea = page.locator('#limitations');
    await expect(limitationsTextarea).toBeVisible({ timeout: TIMEOUTS.element });
    await limitationsTextarea.fill('Lower back injury');
    await expect(limitationsTextarea).toHaveValue('Lower back injury');

    const notesTextarea = page.locator('#notes');
    await expect(notesTextarea).toBeVisible({ timeout: TIMEOUTS.element });
    await notesTextarea.fill('Prefers morning sessions');
    await expect(notesTextarea).toHaveValue('Prefers morning sessions');
  });

  // ── 9. Save button persists changes (calls PATCH /api/clients/[id]/profile) ─

  test('clicking Save submits the profile update', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    // Intercept the PATCH call to avoid actually modifying production data
    let patchCalled = false;
    await page.route('**/api/clients/**/profile', (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });

    await page.locator('button', { hasText: /edit profile/i }).click();

    // Make a small edit
    const goalsTextarea = page.locator('#goals');
    await goalsTextarea.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await goalsTextarea.fill('E2E test goal update');

    // Click Save
    const saveBtn = page.locator('button', { hasText: /^save$/i });
    await saveBtn.click();

    // Wait briefly for the request
    await page.waitForTimeout(1000);

    // Either the PATCH was intercepted or the form closed (onSave callback)
    const editorGone = await page
      .locator('h3', { hasText: /edit profile/i })
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(patchCalled || !editorGone).toBeTruthy();
    await takeScreenshot(page, '10-09-save-clicked.png');
  });

  // ── 10. Cancel button discards changes ────────────────────────────────────

  test('clicking Cancel in the editor closes the form without saving', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    await page.locator('button', { hasText: /edit profile/i }).click();

    const editorCard = page.locator('h3', { hasText: /edit profile/i });
    await editorCard.waitFor({ state: 'visible', timeout: TIMEOUTS.element });

    // Type something that should be discarded
    const notesTextarea = page.locator('#notes');
    await notesTextarea.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    await notesTextarea.fill('This should be discarded');

    // Click the Cancel button inside the editor (not the outer "Cancel Edit")
    // ClientProfileEditor has its own Cancel button
    const cancelBtn = page.locator('button', { hasText: /^cancel$/i }).first();
    await cancelBtn.click();

    // The editor card should disappear (onCancel → setIsEditingProfile(false))
    await expect(editorCard).not.toBeVisible({ timeout: TIMEOUTS.element });

    // The "Edit Profile" button should reappear
    await expect(page.locator('button', { hasText: /edit profile/i })).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await takeScreenshot(page, '10-10-cancel-edit.png');
  });
});
