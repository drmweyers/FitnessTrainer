/**
 * Suite 41 - Tier Enforcement
 *
 * Tests that Starter-tier trainers cannot exceed plan limits:
 *   - 5 active clients maximum
 *   - 3 color tags maximum
 *   - Upgrade prompt ("Upgrade to Professional") is shown in the error
 *
 * NOTE: Tier enforcement is being wired in the feat/manual-program-builder-rebuild
 * branch (plan: dynamic-baking-planet.md). The enforcement tests below are skipped
 * until that branch merges into master and the following conditions are true:
 *   - lib/subscription/tiers.ts sets starter.clients = 5 and starter.colorTags = 3
 *   - POST /api/clients returns 403 when a starter trainer has 5+ active clients
 *   - POST /api/clients/tags returns 403 when a starter trainer has 3+ color tags
 *
 * The API smoke tests at the bottom (not skipped) validate the existing routes
 * continue to work correctly in the meantime.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, TEST_ACCOUNTS, API, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI } from '../helpers/auth';

const STARTER_EMAIL = 'qa-starter@evofit.io';
const STARTER_PASSWORD = 'QaTest2026!';

/** Helper: authenticate as a given account and return the token */
async function getToken(page: import('@playwright/test').Page, email: string, password: string): Promise<string> {
  const res = await page.request.post(`${BASE_URL}${API.login}`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`);
  const body = await res.json();
  return body.data?.tokens?.accessToken || body.data?.accessToken || body.accessToken;
}

// ── Pending: Client Limit Enforcement ─────────────────────────────────────────
// These tests will be activated when feat/manual-program-builder-rebuild merges.

test.describe('41 - Tier Enforcement (Client Limit)', () => {
  test.skip(
    true,
    'Tier enforcement wired in feat/manual-program-builder-rebuild — tests will pass after that branch merges'
  );

  /**
   * Starter trainer with 5 existing active clients must receive a 403 with the
   * upgrade prompt when attempting to add a 6th client via POST /api/clients.
   *
   * Test setup (requires feat/manual-program-builder-rebuild to be merged):
   *   1. Ensure qa-starter@evofit.io exists with role=trainer and no active subscription
   *      (defaults to 'starter' tier in EntitlementsService).
   *   2. Seed exactly 5 active TrainerClient rows for that trainer in the DB.
   *   3. Attempt to add a 6th client — expect 403.
   */
  test('POST /api/clients returns 403 when starter trainer has 5 active clients', async ({ page }) => {
    const token = await getToken(page, STARTER_EMAIL, STARTER_PASSWORD);

    // The trainer already has 5 active clients seeded. Try to add a 6th.
    const res = await page.request.post(`${BASE_URL}${API.clients}`, {
      data: { email: 'overflow-client@evofit.io' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/client limit/i);
    expect(body.error).toMatch(/upgrade to professional/i);
  });

  test('403 error message mentions "Upgrade to Professional"', async ({ page }) => {
    const token = await getToken(page, STARTER_EMAIL, STARTER_PASSWORD);

    const res = await page.request.post(`${BASE_URL}${API.clients}`, {
      data: { email: 'overflow-client@evofit.io' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    expect(body.error).toContain('Upgrade to Professional');
  });
});

// ── Pending: Color Tag Limit Enforcement ──────────────────────────────────────

test.describe('41 - Tier Enforcement (Color Tag Limit)', () => {
  test.skip(
    true,
    'Tier enforcement wired in feat/manual-program-builder-rebuild — tests will pass after that branch merges'
  );

  /**
   * Starter trainer with 3 existing color tags must receive a 403 with the
   * upgrade prompt when attempting to create a 4th tag via POST /api/clients/tags.
   *
   * Test setup (requires feat/manual-program-builder-rebuild to be merged):
   *   1. Ensure qa-starter@evofit.io exists with role=trainer and no active subscription.
   *   2. Seed exactly 3 ClientTag rows for that trainer in the DB.
   *   3. Attempt to create a 4th tag — expect 403.
   */
  test('POST /api/clients/tags returns 403 when starter trainer has 3 color tags', async ({ page }) => {
    const token = await getToken(page, STARTER_EMAIL, STARTER_PASSWORD);

    const res = await page.request.post(`${BASE_URL}/api/clients/tags`, {
      data: { name: 'Fourth Tag', color: '#FF0000' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/tag limit/i);
    expect(body.error).toMatch(/upgrade to professional/i);
  });

  test('tag 403 error message mentions "Upgrade to Professional"', async ({ page }) => {
    const token = await getToken(page, STARTER_EMAIL, STARTER_PASSWORD);

    const res = await page.request.post(`${BASE_URL}/api/clients/tags`, {
      data: { name: 'Fourth Tag', color: '#FF0000' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    expect(body.error).toContain('Upgrade to Professional');
  });
});

// ── Active: Existing API Route Smoke Tests ─────────────────────────────────────
// These run immediately against the current codebase (no tier enforcement needed).

test.describe('41 - Existing API Routes (smoke)', () => {
  test('GET /api/clients returns 200 for authenticated trainer', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer');

    const res = await page.request.get(`${BASE_URL}${API.clients}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response uses a clients array (not { success, data })
    expect(body).toHaveProperty('clients');
    expect(Array.isArray(body.clients)).toBe(true);
  });

  test('GET /api/clients returns 401 without auth token', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const res = await page.request.get(`${BASE_URL}${API.clients}`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/clients returns 403 for client-role user', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client');

    const res = await page.request.post(`${BASE_URL}${API.clients}`, {
      data: { email: 'someone@example.com' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status()).toBe(403);
  });

  test('POST /api/clients returns 400 when email is missing', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer');

    const res = await page.request.post(`${BASE_URL}${API.clients}`, {
      data: {},
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status()).toBe(400);
  });

  test('POST /api/clients returns 404 when client email does not exist', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer');

    const res = await page.request.post(`${BASE_URL}${API.clients}`, {
      data: { email: `nonexistent-${Date.now()}@evofit.io` },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status()).toBe(404);
  });

  test('POST /api/clients/bulk returns 401 without auth', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const res = await page.request.post(`${BASE_URL}${API.clientsBulk}`, {
      data: { action: 'update-status', clientIds: [], value: 'active' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(401);
  });
});
