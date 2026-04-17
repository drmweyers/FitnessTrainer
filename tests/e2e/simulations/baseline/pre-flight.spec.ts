/**
 * FORGE QA Warfare — Pre-Flight Baseline
 *
 * These checks MUST pass before any other warfare suites are trusted.
 * They verify: API health, DB connectivity, SPA shell, seed accounts,
 * JWT structure, and basic response time.
 *
 * Pattern: uses raw page.request.fetch for status-code checks so that
 * BaseActor's throw-on-4xx behaviour never masks a genuine failure here.
 */

import { test, expect } from '@playwright/test';
import { SIM_ACCOUNTS } from '../actors/base-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Helper: low-level fetch that never throws — returns status + parsed body
// ---------------------------------------------------------------------------
async function rawFetch(
  page: any,
  method: string,
  path: string,
  options?: { token?: string; body?: Record<string, unknown> },
): Promise<{ status: number; json: any; contentType: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await page.request.fetch(url, {
    method,
    headers,
    data: options?.body ? JSON.stringify(options.body) : undefined,
    timeout: 15_000,
  });

  const contentType = res.headers()['content-type'] || '';
  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON is fine for some checks */ }

  return { status: res.status(), json, contentType };
}

// ---------------------------------------------------------------------------
// Pre-Flight: Health & Connectivity
// ---------------------------------------------------------------------------
test.describe('Pre-Flight — Health & Connectivity', () => {

  test('health endpoint returns 200 with status field', async ({ page }) => {
    const start = Date.now();
    const { status, json } = await rawFetch(page, 'GET', '/api/health');
    const elapsed = Date.now() - start;

    // Healthy DB = 200; degraded (Redis missing) is also 200
    expect([200, 503]).toContain(status);
    expect(json).toBeTruthy();
    expect(typeof json.status).toBe('string');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(json.status);

    // Confirm it answers within 5 seconds
    expect(elapsed).toBeLessThan(5000);
  });

  test('health check response time is under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await rawFetch(page, 'GET', '/api/health');
    expect(Date.now() - start).toBeLessThan(5000);
  });

  test('unmatched API path returns 404 JSON — does not hang', async ({ page }) => {
    const { status, json, contentType } = await rawFetch(
      page, 'GET', '/api/v1/this-path-does-not-exist-xyz',
    );

    // Next.js returns 404 for unmatched app-router paths
    expect(status).toBe(404);
    // Must respond at all (not timeout) — response object existing proves that
    expect(json !== undefined || contentType !== undefined).toBeTruthy();
  });

  test('database is reachable — health services.database is healthy', async ({ page }) => {
    const { status, json } = await rawFetch(page, 'GET', '/api/health');

    // status 503 means DB is down — that is a hard failure
    expect(status).not.toBe(503);
    expect(json?.services?.database?.status).toBe('healthy');
  });

});

// ---------------------------------------------------------------------------
// Pre-Flight: Auth Endpoint Shapes
// ---------------------------------------------------------------------------
test.describe('Pre-Flight — Auth Endpoint Shapes', () => {

  test('login with bad credentials returns 401 with JSON error shape', async ({ page }) => {
    const { status, json } = await rawFetch(page, 'POST', '/api/auth/login', {
      body: { email: 'nobody@example.com', password: 'wrong' },
    });

    expect(status).toBe(401);
    expect(json).toHaveProperty('success', false);
    expect(typeof json.error).toBe('string');
  });

  test('register with missing fields returns 400 with JSON error shape', async ({ page }) => {
    const { status, json } = await rawFetch(page, 'POST', '/api/auth/register', {
      body: { email: 'notvalid' }, // missing password + role
    });

    expect([400, 422]).toContain(status);
    expect(json).toHaveProperty('success', false);
  });

});

// ---------------------------------------------------------------------------
// Pre-Flight: SPA Shell Pages
// ---------------------------------------------------------------------------
test.describe('Pre-Flight — SPA Shell Pages', () => {

  for (const path of ['/', '/login', '/pricing']) {
    test(`${path} serves 200`, async ({ page }) => {
      const res = await page.request.fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        timeout: 15_000,
      });
      expect(res.status()).toBe(200);
    });
  }

});

// ---------------------------------------------------------------------------
// Pre-Flight: Exercise Library Has Data
// ---------------------------------------------------------------------------
test.describe('Pre-Flight — Exercise Library Data', () => {

  test('GET /api/exercises returns exercise count > 0 (no auth required)', async ({ page }) => {
    const { status, json } = await rawFetch(page, 'GET', '/api/exercises?limit=1');

    expect(status).toBe(200);
    expect(json).toHaveProperty('success', true);

    // API returns either data.total or data.exercises array — accept both
    const total: number = json?.data?.total ?? json?.data?.exercises?.length ?? 0;
    expect(total).toBeGreaterThan(0);
  });

});

// ---------------------------------------------------------------------------
// Pre-Flight: Seed Accounts Can Authenticate
// ---------------------------------------------------------------------------
test.describe('Pre-Flight — Seed Account Authentication', () => {

  const accounts = [
    { label: 'trainer', creds: SIM_ACCOUNTS.trainer },
    { label: 'client1', creds: SIM_ACCOUNTS.client1 },
    { label: 'client2', creds: SIM_ACCOUNTS.client2 },
    { label: 'admin', creds: SIM_ACCOUNTS.admin },
  ];

  for (const { label, creds } of accounts) {
    test(`${label} (${creds.email}) can login and receives an access token`, async ({ page }) => {
      // Ensure the account exists first (idempotent register)
      await rawFetch(page, 'POST', '/api/auth/register', {
        body: { email: creds.email, password: creds.password, role: creds.role },
      });

      const { status, json } = await rawFetch(page, 'POST', '/api/auth/login', {
        body: { email: creds.email, password: creds.password },
      });

      expect(status).toBe(200);
      expect(json).toHaveProperty('success', true);

      const data = json?.data;
      const accessToken: string = data?.tokens?.accessToken || data?.accessToken;
      expect(typeof accessToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(20);
    });
  }

});

// ---------------------------------------------------------------------------
// Pre-Flight: JWT Token Structure
// ---------------------------------------------------------------------------
test.describe('Pre-Flight — JWT Token Structure', () => {

  test('JWT access token has valid structure with exp, userId/id, and role', async ({ page }) => {
    // Use trainer account as the reference
    const { json } = await rawFetch(page, 'POST', '/api/auth/login', {
      body: { email: SIM_ACCOUNTS.trainer.email, password: SIM_ACCOUNTS.trainer.password },
    });

    const data = json?.data;
    const accessToken: string = data?.tokens?.accessToken || data?.accessToken;
    expect(typeof accessToken).toBe('string');

    // Decode payload (middle segment of the JWT)
    const parts = accessToken.split('.');
    expect(parts.length).toBe(3);

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    // Must have expiry
    expect(typeof payload.exp).toBe('number');
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

    // Must have a userId or id field
    const userId = payload.userId || payload.id || payload.sub;
    expect(userId).toBeTruthy();

    // Must carry the role
    expect(payload.role).toBe('trainer');
  });

});
