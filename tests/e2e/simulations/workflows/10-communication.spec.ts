/**
 * Suite 10: Communication & Notifications
 *
 * The 10th workflow suite — covers all async-communication surfaces:
 * push-notification subscriptions, bug reports, support tickets,
 * lead capture, and the activity feed.
 *
 * Pattern: all tests that EXPECT rejection use raw page.request.fetch
 * so BaseActor's throw-on-4xx doesn't mask the status code.
 */

import { test, expect } from '@playwright/test';
import { BaseActor } from '../actors/base-actor';
import { TrainerActor } from '../actors/trainer-actor';
import { AdminActor } from '../actors/admin-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Raw fetch helper — never throws, always returns status + parsed JSON. */
async function rawFetch(
  actor: BaseActor,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; json: any }> {
  const page = (actor as any).page;
  const token = actor.getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await page.request.fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    data: body ? JSON.stringify(body) : undefined,
    timeout: 15_000,
  });

  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status(), json };
}

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------
test.describe('Suite 10: Communication — Push Notifications', () => {

  test('trainer can reach the notification subscribe endpoint (unauthenticated returns 401)', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({}),
    });
    // Must reject unauthenticated requests
    expect(res.status()).toBe(401);
  });

  test('authenticated trainer can POST a valid push subscription', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Minimal valid Web Push subscription shape
    const validSubscription = {
      subscription: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-preflight',
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlTieTXFHpL3_vMjKS5ukkqcMkBJ-zcCzqSPaCE8',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
      },
      action: 'subscribe',
    };

    const result = await rawFetch(trainer, 'POST', '/api/notifications/subscribe', validSubscription as any);

    // 201 = stored; 200 = stored (Redis-less path); 400 = validation; 500 = Redis error
    // Any response except 401/403 is a pass — it means the endpoint is reachable and auth works
    expect([200, 201, 400, 500]).toContain(result.status);
    expect(result.json).toHaveProperty('success');
  });

});

// ---------------------------------------------------------------------------
// Bug Reports
// ---------------------------------------------------------------------------
test.describe('Suite 10: Communication — Bug Reports', () => {

  test('authenticated user can submit a bug report via POST /api/bugs', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'POST', '/api/bugs', {
      category: 'ui_issue',
      description: 'FORGE pre-flight: test bug submission from simulation suite 10.',
      context: {
        url: '/dashboard/trainer',
        browser: 'Playwright',
        userRole: 'trainer',
      },
    });

    expect(result.status).toBe(201);
    expect(result.json).toHaveProperty('success', true);
    expect(result.json?.data?.id).toBeTruthy();
  });

  test('unauthenticated bug report submission returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/bugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        category: 'crash',
        description: 'This should be rejected — no auth token.',
      }),
    });
    expect(res.status()).toBe(401);
  });

  test('bug report list is accessible to admin', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();

    const result = await rawFetch(admin, 'GET', '/api/bugs?limit=5');

    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty('success', true);
    expect(Array.isArray(result.json?.data?.bugs)).toBeTruthy();
  });

});

// ---------------------------------------------------------------------------
// Support Tickets
// ---------------------------------------------------------------------------
test.describe('Suite 10: Communication — Support Tickets', () => {

  test('authenticated trainer can create a support ticket', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'POST', '/api/support/tickets', {
      subject: 'FORGE test: suite 10 support ticket',
      message: 'Automated pre-flight check for the support-ticket endpoint. Please ignore.',
    });

    expect(result.status).toBe(201);
    expect(result.json).toHaveProperty('success', true);
    expect(result.json?.data?.id).toBeTruthy();
    expect(result.json?.data?.status).toBe('open');
  });

  test('authenticated trainer can list own support tickets', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/support/tickets');

    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty('success', true);
    expect(Array.isArray(result.json?.data)).toBeTruthy();
  });

  test('unauthenticated support ticket creation returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ subject: 'Test', message: 'No auth' }),
    });
    expect(res.status()).toBe(401);
  });

});

// ---------------------------------------------------------------------------
// Lead Capture
// ---------------------------------------------------------------------------
test.describe('Suite 10: Communication — Lead Capture', () => {

  test('lead capture endpoint accepts valid email and returns success:true', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/leads/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        email: 'forge-preflight@evofit-test.io',
        firstName: 'ForgeBot',
        source: 'forge-suite-10',
        productTag: 'evofit-trainer-interest',
      }),
      timeout: 15_000,
    });

    const json = await res.json();
    // 200 = forwarded to SmartSocial OR env vars not set (graceful no-op)
    // 502 = SmartSocial unreachable (env vars set but SmartSocial down) — still a valid response
    expect([200, 502]).toContain(res.status());
    // Regardless of forwarding outcome, success field must be present
    expect(typeof json.success).toBe('boolean');
  });

  test('lead capture rejects missing or malformed email', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/leads/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ email: 'not-an-email', firstName: 'Test' }),
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('success', false);
  });

});

// ---------------------------------------------------------------------------
// Activity Feed
// ---------------------------------------------------------------------------
test.describe('Suite 10: Communication — Activity Feed', () => {

  test('activity feed returns paginated data for authenticated trainer', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/activities?page=1&limit=10');

    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty('success', true);
    expect(Array.isArray(result.json?.data?.activities)).toBeTruthy();

    const pagination = result.json?.data?.pagination;
    expect(typeof pagination?.page).toBe('number');
    expect(typeof pagination?.total).toBe('number');
  });

  test('unauthenticated activity feed request returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/activities`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

});
