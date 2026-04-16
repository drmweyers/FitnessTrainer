/**
 * Suite 46 - Bulk Client Operations E2E Tests
 *
 * Tests the POST /api/clients/bulk endpoint for all three supported actions:
 *   - assign-tags    : Replace tag assignments for multiple clients
 *   - update-status  : Update TrainerClient status for multiple clients
 *   - remove-tag     : Remove a single tag from multiple clients
 *
 * Also verifies the bulk action toolbar UI renders when clients are selected
 * on the /clients page.
 *
 * Test account: qa-trainer@evofit.io / QaTest2026!
 * Seeded data: qa-client and qa-client2 are already on the trainer's roster
 *              (done by global-setup.ts Step 2).
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

const BULK_URL = `${BASE_URL}${API.clientsBulk}`;

/** Authenticate as trainer and return the access token. */
async function getTrainerToken(page: import('@playwright/test').Page): Promise<string> {
  const { accessToken } = await loginViaAPI(page, 'trainer');
  return accessToken;
}

/** Helper: send a bulk POST request. */
async function bulkPost(
  page: import('@playwright/test').Page,
  token: string,
  body: Record<string, unknown>
) {
  return page.request.post(BULK_URL, {
    data: body,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

/** Resolve trainer's client IDs from the /api/clients list. */
async function getClientIds(
  page: import('@playwright/test').Page,
  token: string
): Promise<string[]> {
  const res = await page.request.get(`${BASE_URL}${API.clients}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return [];
  const body = await res.json();
  const clients: any[] =
    body.data?.clients || body.clients || (Array.isArray(body.data) ? body.data : []);
  return clients.map((c: any) => c.id).filter(Boolean);
}

/** Create a client tag and return its ID, or return an existing one. */
async function ensureTag(
  page: import('@playwright/test').Page,
  token: string,
  name: string
): Promise<string> {
  // Try fetching existing tags first
  const listRes = await page.request.get(`${BASE_URL}/api/clients/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (listRes.ok()) {
    const listBody = await listRes.json();
    const tags: any[] = listBody.data || listBody.tags || [];
    const existing = tags.find((t: any) => t.name === name);
    if (existing) return existing.id;
  }

  // Create a new tag
  const createRes = await page.request.post(`${BASE_URL}/api/clients/tags`, {
    data: { name, color: '#4f46e5' },
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  expect(createRes.ok()).toBeTruthy();
  const body = await createRes.json();
  const tagId = body.data?.id || body.id;
  expect(tagId).toBeTruthy();
  return tagId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('46 - Bulk Client Operations', () => {
  // ── API: Authentication & validation ──────────────────────────────────────

  test('returns 401 when called without an auth token', async ({ page }) => {
    const res = await page.request.post(BULK_URL, {
      data: { action: 'update-status', clientIds: ['some-id'], value: 'active' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 400 for an unknown action', async ({ page }) => {
    const token = await getTrainerToken(page);
    const res = await bulkPost(page, token, {
      action: 'nonexistent-action',
      clientIds: ['some-id'],
      value: 'active',
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('returns 400 when clientIds is empty', async ({ page }) => {
    const token = await getTrainerToken(page);
    const res = await bulkPost(page, token, {
      action: 'update-status',
      clientIds: [],
      value: 'active',
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when value is missing', async ({ page }) => {
    const token = await getTrainerToken(page);
    const res = await bulkPost(page, token, {
      action: 'update-status',
      clientIds: ['some-id'],
    });
    expect(res.status()).toBe(400);
  });

  // ── API: update-status ────────────────────────────────────────────────────

  test('update-status: marks seeded clients as paused then restores to active', async ({
    page,
  }) => {
    const token = await getTrainerToken(page);
    const clientIds = await getClientIds(page, token);

    // Need at least one client to test
    if (clientIds.length === 0) {
      test.skip(true, 'No clients on roster — skipping bulk status test');
      return;
    }

    // Set to paused
    const pauseRes = await bulkPost(page, token, {
      action: 'update-status',
      clientIds,
      value: 'paused',
    });
    expect(pauseRes.status()).toBe(200);
    const pauseBody = await pauseRes.json();
    expect(pauseBody.success).toBe(true);
    expect(pauseBody.data.updatedCount).toBeGreaterThanOrEqual(1);

    // Restore to active
    const activeRes = await bulkPost(page, token, {
      action: 'update-status',
      clientIds,
      value: 'active',
    });
    expect(activeRes.status()).toBe(200);
    const activeBody = await activeRes.json();
    expect(activeBody.success).toBe(true);
    expect(activeBody.data.updatedCount).toBeGreaterThanOrEqual(1);
  });

  // ── API: assign-tags ──────────────────────────────────────────────────────

  test('assign-tags: assigns a tag to multiple clients', async ({ page }) => {
    const token = await getTrainerToken(page);
    const clientIds = await getClientIds(page, token);

    if (clientIds.length === 0) {
      test.skip(true, 'No clients on roster — skipping assign-tags test');
      return;
    }

    const tagId = await ensureTag(page, token, 'E2E-Bulk-Tag');

    const res = await bulkPost(page, token, {
      action: 'assign-tags',
      clientIds,
      value: [tagId],
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── API: remove-tag ───────────────────────────────────────────────────────

  test('remove-tag: removes a tag from multiple clients', async ({ page }) => {
    const token = await getTrainerToken(page);
    const clientIds = await getClientIds(page, token);

    if (clientIds.length === 0) {
      test.skip(true, 'No clients on roster — skipping remove-tag test');
      return;
    }

    const tagId = await ensureTag(page, token, 'E2E-Remove-Tag');

    // First assign the tag so there's something to remove
    await bulkPost(page, token, {
      action: 'assign-tags',
      clientIds,
      value: [tagId],
    });

    // Now remove it
    const removeRes = await bulkPost(page, token, {
      action: 'remove-tag',
      clientIds,
      value: tagId,
    });
    expect(removeRes.status()).toBe(200);
    const body = await removeRes.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.removedCount).toBe('number');
  });

  test('remove-tag: returns 400 when tagId (value) is missing', async ({ page }) => {
    const token = await getTrainerToken(page);
    const res = await bulkPost(page, token, {
      action: 'remove-tag',
      clientIds: ['some-client-id'],
    });
    expect(res.status()).toBe(400);
  });

  test('remove-tag: returns 0 removedCount for clients that do not have the tag', async ({
    page,
  }) => {
    const token = await getTrainerToken(page);
    const clientIds = await getClientIds(page, token);

    if (clientIds.length === 0) {
      test.skip(true, 'No clients on roster');
      return;
    }

    // Use a random UUID that will never match a real tag
    const fakeTagId = '00000000-0000-0000-0000-000000000001';

    const res = await bulkPost(page, token, {
      action: 'remove-tag',
      clientIds,
      value: fakeTagId,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.removedCount).toBe(0);
  });

  // ── UI: BulkActionsToolbar renders when clients are selected ──────────────

  test('bulk actions toolbar appears when a client checkbox is checked', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for client list to populate
    const firstCheckbox = page.locator('input[type="checkbox"][aria-label*="Select"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: TIMEOUTS.element });

    await firstCheckbox.check();

    // BulkActionsToolbar shows "X selected" text and action buttons
    await expect(page.locator('text=/1 selected/i')).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(page.locator('button', { hasText: /update status/i }).first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });
    await expect(page.locator('button', { hasText: /assign tag/i }).first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, '46-bulk-toolbar-visible.png');
  });

  test('bulk actions toolbar disappears after "Clear Selection" is clicked', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const firstCheckbox = page.locator('input[type="checkbox"][aria-label*="Select"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: TIMEOUTS.element });

    await firstCheckbox.check();
    await expect(page.locator('text=/1 selected/i')).toBeVisible({ timeout: TIMEOUTS.element });

    const clearBtn = page.locator('button', { hasText: /clear selection/i });
    await clearBtn.first().click();

    // Toolbar should be gone (selectedCount === 0 → renders null)
    await expect(page.locator('text=/selected/i')).not.toBeVisible({ timeout: TIMEOUTS.element });
  });
});
