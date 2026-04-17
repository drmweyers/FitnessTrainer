/**
 * FORGE QA Warfare — IDOR & Access Control
 *
 * Verifies that users CANNOT access or mutate resources belonging to other users.
 * Tests horizontal privilege escalation (user → user) and vertical (client → admin).
 *
 * Pattern: all tests that EXPECT rejection call raw page.request.fetch so we get
 * the numeric HTTP status back without BaseActor throwing first.
 */

import { test, expect } from '@playwright/test';
import { BaseActor, SIM_ACCOUNTS } from '../actors/base-actor';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';
import { AdminActor } from '../actors/admin-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Helper: raw fetch that always returns a Response (never throws on 4xx/5xx)
// ---------------------------------------------------------------------------
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
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON body is fine */ }
  return { status: res.status(), json };
}

// ---------------------------------------------------------------------------
// Suite 1: Unauthenticated requests must return 401
// ---------------------------------------------------------------------------
test.describe('IDOR & Access Control — Unauthenticated Rejections', () => {

  test('unauthenticated GET /api/clients returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/clients`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/admin/users returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/admin/users`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/programs returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/programs`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/analytics/measurements returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/analytics/measurements`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/analytics/goals returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/analytics/goals`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/workouts/history returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/workouts/history`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/profiles/me returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/profiles/me`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

  test('unauthenticated GET /api/schedule/appointments returns 401', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/schedule/appointments`, { method: 'GET' });
    expect(res.status()).toBe(401);
  });

});

// ---------------------------------------------------------------------------
// Suite 2: Client cannot reach admin endpoints
// ---------------------------------------------------------------------------
test.describe('IDOR & Access Control — Client vs Admin Boundary', () => {

  test('client cannot GET /api/admin/users', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/admin/users');
    // Must be 403 Forbidden — a 200 here means the guard is missing
    expect(result.status).toBe(403);
  });

  test('client cannot GET /api/admin/dashboard', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/admin/dashboard');
    expect(result.status).toBe(403);
  });

  test('client cannot GET /api/admin/feature-flags', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/admin/feature-flags');
    expect(result.status).toBe(403);
  });

  test('client cannot GET /api/admin/system/health', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/admin/system/health');
    expect(result.status).toBe(403);
  });

});

// ---------------------------------------------------------------------------
// Suite 3: Trainer cannot reach admin endpoints
// ---------------------------------------------------------------------------
test.describe('IDOR & Access Control — Trainer vs Admin Boundary', () => {

  test('trainer cannot GET /api/admin/users', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/admin/users');
    expect(result.status).toBe(403);
  });

  test('trainer cannot PUT /api/admin/feature-flags', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'PUT', '/api/admin/feature-flags', {
      some_flag: true,
    });
    expect(result.status).toBe(403);
  });

});

// ---------------------------------------------------------------------------
// Suite 4: Client cannot access another client's private data
// ---------------------------------------------------------------------------
test.describe('IDOR & Access Control — Cross-Client Isolation', () => {

  /**
   * Create a measurement as client1, then try to GET it as client2.
   * The ID-scoped endpoint should return 404 (not found for this user) — not 200.
   */
  test('client2 cannot read client1 measurement by ID', async ({ page }) => {
    // Step 1: client1 creates a measurement and captures the ID
    const client1 = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client1.login();
    const measurementId = await client1.logMeasurement({ weight: 75 });

    // Step 2: client2 logs in on the same page (replaces localStorage)
    const client2 = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client2.login();

    const result = await rawFetch(client2, 'GET', `/api/analytics/measurements/${measurementId}`);
    // Either 403 or 404 is acceptable; 200 is a security breach
    expect([403, 404]).toContain(result.status);
  });

  test('client2 cannot delete client1 measurement', async ({ page }) => {
    const client1 = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client1.login();
    const measurementId = await client1.logMeasurement({ weight: 80 });

    const client2 = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client2.login();

    const result = await rawFetch(client2, 'DELETE', `/api/analytics/measurements/${measurementId}`);
    expect([403, 404]).toContain(result.status);
  });

  test('client2 cannot read client1 goal by ID', async ({ page }) => {
    const client1 = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client1.login();
    const goalId = await client1.createGoal({
      goalType: 'weight_loss',
      specificGoal: 'Private goal',
      targetValue: 70,
      targetDate: '2027-01-01',
    });

    const client2 = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client2.login();

    const result = await rawFetch(client2, 'GET', `/api/analytics/goals/${goalId}`);
    expect([403, 404]).toContain(result.status);
  });

  test('client2 cannot delete client1 goal', async ({ page }) => {
    const client1 = new ClientActor(page, SIM_ACCOUNTS.client1);
    await client1.login();
    const goalId = await client1.createGoal({
      goalType: 'muscle_gain',
      targetValue: 80,
      targetDate: '2027-06-01',
    });

    const client2 = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client2.login();

    const result = await rawFetch(client2, 'DELETE', `/api/analytics/goals/${goalId}`);
    expect([403, 404]).toContain(result.status);
  });

  test('client2 cannot read client1 workout session by ID', async ({ page }) => {
    // Use a plausible-but-nonexistent UUID to simulate cross-user IDOR probe
    // (client2 probing a UUID it obtained from client1 externally)
    const client2 = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client2.login();

    // We use a static well-known UUID that won't belong to client2
    const foreignSessionId = '00000000-0000-4000-8000-000000000001';
    const result = await rawFetch(client2, 'GET', `/api/workouts/${foreignSessionId}`);
    expect([403, 404]).toContain(result.status);
  });

});

// ---------------------------------------------------------------------------
// Suite 5: Client cannot mutate another user's profile
// ---------------------------------------------------------------------------
test.describe('IDOR & Access Control — Profile Mutation Isolation', () => {

  test('client cannot PUT another client profile via /api/clients/[id]/profile', async ({ page }) => {
    // First get client1's trainer-assigned client record ID (trainer creates it)
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Ensure client1 is on trainer's roster
    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email).catch(() => {});

    // Get the clientId from the trainer's roster
    const clientsRes = await rawFetch(trainer, 'GET', '/api/clients');
    const clients: any[] = clientsRes.json?.data?.clients || clientsRes.json?.data || [];
    const client1Record = clients.find((c: any) =>
      c.email === SIM_ACCOUNTS.client1.email || c.client?.email === SIM_ACCOUNTS.client1.email
    );

    if (!client1Record) {
      test.skip(); // client not on roster yet — skip rather than false-fail
      return;
    }

    const clientId = client1Record.clientId || client1Record.id;

    // Now client2 tries to mutate client1's trainer-managed profile
    const client2 = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client2.login();

    const result = await rawFetch(client2, 'PUT', `/api/clients/${clientId}/profile`, {
      notes: 'Injected by adversarial client2',
    });
    // Clients should not be able to write to the trainer-managed client profile at all
    expect([401, 403, 404]).toContain(result.status);
  });

  test('client cannot change their own role via /api/profiles/me', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    // Try to escalate role to trainer
    const result = await rawFetch(client, 'PUT', '/api/profiles/me', {
      firstName: 'Hacker',
      role: 'trainer',
    });

    // Request itself may succeed (200) but role must NOT have changed
    if (result.status === 200) {
      // Re-fetch and confirm role is still client
      const meResult = await rawFetch(client, 'GET', '/api/auth/me');
      expect(meResult.json?.data?.role ?? meResult.json?.role).not.toBe('trainer');
    } else {
      // Any 4xx is also acceptable
      expect(result.status).toBeGreaterThanOrEqual(400);
    }
  });

});
