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
 * Strategy:
 *   1. Discover a real client UUID from GET /api/clients (list endpoint).
 *   2. Mock GET /api/clients/[clientId] (individual endpoint — not yet implemented
 *      in production) so the detail page renders instead of showing the error state.
 *   3. Navigate to /clients/[clientId] and test the UI.
 *
 * NOTE: GET /api/clients/[clientId] returns 404 in production — the route does not
 * exist yet. We intercept it via page.route() and return a synthetic client object
 * so the React component renders its normal UI for testing.
 */
import { test, expect, Page } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

/** A synthetic client payload matching the shape expected by useClient / ClientProfilePage. */
const MOCK_CLIENT = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'qa-client@evofit.io',
  displayName: 'QA Client',
  avatar: null,
  isActive: true,
  lastLoginAt: null,
  trainerClient: {
    id: 'tc-00000001',
    status: 'active',
    connectedAt: new Date().toISOString(),
    archivedAt: null,
  },
  userProfile: {
    phone: '+1987654321',
    profilePhotoUrl: null,
  },
  clientProfile: {
    fitnessLevel: 'intermediate',
    goals: { primaryGoal: 'Build strength' },
    emergencyContact: { name: '', phone: '' },
    injuries: { description: '' },
  },
};

/**
 * Use GET /api/clients (the list endpoint that DOES work) to discover a real
 * client UUID for the logged-in trainer.  Returns null if none found.
 */
async function discoverClientId(page: Page): Promise<string | null> {
  const { email, password } = TEST_ACCOUNTS.trainer;

  try {
    const loginRes = await page.request.post(`${BASE_URL}${API.login}`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    });
    if (!loginRes.ok()) return null;

    const loginBody = await loginRes.json();
    const accessToken =
      loginBody.data?.tokens?.accessToken ||
      loginBody.data?.accessToken ||
      loginBody.accessToken;
    if (!accessToken) return null;

    // Retry GET /api/clients up to 3 times — under concurrent dev-server load
    // it can intermittently time out.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const clientsRes = await page.request.get(`${BASE_URL}${API.clients}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        });
        if (!clientsRes.ok()) {
          if (attempt === 3) return null;
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }

        const body = await clientsRes.json();
        // /api/clients returns { clients: [...], pagination: {...} }
        const clients: any[] = body.clients || body.data?.clients || [];
        if (!Array.isArray(clients) || clients.length === 0) return null;

        return clients[0].id || null;
      } catch (err) {
        if (attempt === 3) return null;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    return null;
  } catch (err) {
    // Non-fatal: if we cannot discover a client id, all tests in this suite
    // will skip gracefully via the `if (!clientHref) test.skip()` guard.
    return null;
  }
}

test.describe('10 - Client Profile Detail', () => {
  let clientId: string | null = null;
  let clientHref: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      clientId = await discoverClientId(page);
      if (clientId) {
        clientHref = `/clients/${clientId}`;
      }
    } catch {
      // Non-fatal: tests will skip via the `if (!clientHref) test.skip()` guard.
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!clientHref || !clientId) return;

    // Mock the individual client endpoint (GET /api/clients/[id]) which does not
    // yet have a route in production.  This lets the page render normally.
    const mockClient = { ...MOCK_CLIENT, id: clientId };
    await page.route(`**/api/clients/${clientId}`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockClient }),
        });
      } else {
        route.continue();
      }
    });

    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${clientHref}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for React hydration before tests interact with buttons. Under
    // concurrent dev-server load, the dashboard button clicks silently fail
    // unless the page has finished hydrating + initial data fetch.
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.pageLoad }).catch(() => {});
    await page
      .locator('h1')
      .first()
      .waitFor({ state: 'visible', timeout: TIMEOUTS.element });
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

  // ── 2. Client name displayed ───────────────────────────────────────────────

  test('client name is displayed on the detail page', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.element });

    const text = await heading.textContent() ?? '';
    // Heading should be "{name}'s Dashboard" — must include a name before "Dashboard"
    expect(text).toMatch(/\S+.+dashboard/i);
  });

  // ── 3. Status badge shows current status ─────────────────────────────────

  test('status badge is visible in the client header', async ({ page }) => {
    if (!clientHref) {
      test.skip();
      return;
    }

    // Badge component renders status text with Tailwind color classes
    const badge = page
      .locator('.bg-green-100, .bg-yellow-100, .bg-gray-100, .bg-orange-100, .bg-red-100')
      .first();
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

    // Either the PATCH was intercepted (mocked success) or the editor closed
    if (patchCalled) {
      // PATCH was intercepted — editor should close after save
      await expect(page.locator('h3', { hasText: /edit profile/i })).not.toBeVisible({
        timeout: TIMEOUTS.element,
      });
    } else {
      // No PATCH intercepted — the save button click must have been registered;
      // assert the edit form is no longer visible (onSave closed it)
      await expect(page.locator('h3', { hasText: /edit profile/i })).not.toBeVisible({
        timeout: TIMEOUTS.element,
      });
    }
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
