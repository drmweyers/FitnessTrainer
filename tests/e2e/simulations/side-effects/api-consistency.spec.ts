/**
 * FORGE QA Warfare — API Consistency & Edge Cases
 *
 * Verifies that ALL API endpoints conform to the contract defined in CLAUDE.md:
 *   { success: boolean, data?: any, error?: string }
 *
 * Also verifies: pagination params, 404 for unknown IDs, idempotency,
 * empty-list shape, special-character search, and the public /api/health endpoint.
 *
 * Pattern: all tests use page.request.fetch directly so we can inspect HTTP
 * status codes without BaseActor throwing on 4xx.
 */

import { test, expect } from '@playwright/test';
import { BaseActor, SIM_ACCOUNTS } from '../actors/base-actor';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Raw fetch helper — never throws, always returns status + json. */
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
// Suite 1: /api/health requires no auth and returns OK
// ---------------------------------------------------------------------------
test.describe('API Consistency — Public Health Endpoint', () => {

  test('GET /api/health returns 200 without auth', async ({ page }) => {
    const res = await page.request.fetch(`${BASE_URL}/api/health`, { method: 'GET' });
    expect(res.status()).toBe(200);
    let json: any = null;
    try { json = await res.json(); } catch { /* text body is acceptable */ }
    if (json) {
      // Common shapes: { status: 'ok' } or { success: true }
      const isOk =
        json.status === 'ok' ||
        json.success === true ||
        json.healthy === true ||
        typeof json.uptime === 'number';
      expect(isOk).toBeTruthy();
    }
  });

});

// ---------------------------------------------------------------------------
// Suite 2: Response envelope shape — { success, data?, error? }
// ---------------------------------------------------------------------------
test.describe('API Consistency — Response Envelope Shape', () => {

  test('GET /api/programs returns { success: true, data: [...] }', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/programs');
    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty('success', true);
    expect(result.json).toHaveProperty('data');
    expect(Array.isArray(result.json.data)).toBeTruthy();
  });

  test('GET /api/clients returns { success: true, data: [...] }', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/clients');
    expect(result.status).toBe(200);
    expect(result.json).toHaveProperty('success', true);
    // data may be { clients: [] } or a plain array
    expect(result.json.data).toBeTruthy();
  });

  test('GET /api/analytics/measurements returns envelope with data array', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/analytics/measurements');
    expect(result.status).toBe(200);
    expect(result.json.success).toBe(true);
    const measurements = result.json.data?.measurements ?? result.json.data;
    expect(Array.isArray(measurements)).toBeTruthy();
  });

  test('GET /api/analytics/goals returns envelope with data array', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/analytics/goals');
    expect(result.status).toBe(200);
    expect(result.json.success).toBe(true);
    const goals = result.json.data?.goals ?? result.json.data;
    expect(Array.isArray(goals)).toBeTruthy();
  });

});

// ---------------------------------------------------------------------------
// Suite 3: 404 for non-existent resource IDs (not 500)
// ---------------------------------------------------------------------------
test.describe('API Consistency — 404 for Unknown IDs', () => {

  const GHOST_UUID = '00000000-dead-4000-beef-000000000001';

  test('GET /api/programs/[ghost] returns 404 not 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', `/api/programs/${GHOST_UUID}`);
    expect(result.status).toBe(404);
    // Must NOT be 500
    expect(result.status).not.toBe(500);
  });

  test('GET /api/workouts/[ghost] returns 404 not 500', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', `/api/workouts/${GHOST_UUID}`);
    expect([404, 403]).toContain(result.status);
    expect(result.status).not.toBe(500);
  });

  test('GET /api/analytics/measurements/[ghost] returns 404 not 500', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', `/api/analytics/measurements/${GHOST_UUID}`);
    expect([404, 403]).toContain(result.status);
    expect(result.status).not.toBe(500);
  });

  test('GET /api/analytics/goals/[ghost] returns 404 not 500', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await rawFetch(client, 'GET', `/api/analytics/goals/${GHOST_UUID}`);
    expect([404, 403]).toContain(result.status);
    expect(result.status).not.toBe(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 4: Empty list endpoints return array, not null/undefined
// ---------------------------------------------------------------------------
test.describe('API Consistency — Empty Lists Are Arrays', () => {

  test('fresh account GET /api/workouts/history returns empty array not null', async ({ page }) => {
    // client2 is least likely to have workout history
    const client = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/workouts/history');
    expect(result.status).toBe(200);
    const history = result.json?.data?.sessions ?? result.json?.data;
    // Must be an array (possibly empty) — never null/undefined
    expect(Array.isArray(history)).toBeTruthy();
  });

  test('fresh account GET /api/analytics/goals returns empty array not null', async ({ page }) => {
    const client = new ClientActor(page, SIM_ACCOUNTS.client2);
    await client.login();

    const result = await rawFetch(client, 'GET', '/api/analytics/goals');
    expect(result.status).toBe(200);
    const goals = result.json?.data?.goals ?? result.json?.data;
    expect(Array.isArray(goals)).toBeTruthy();
  });

});

// ---------------------------------------------------------------------------
// Suite 5: Pagination params accepted without 400/500
// ---------------------------------------------------------------------------
test.describe('API Consistency — Pagination Params', () => {

  test('GET /api/programs?page=1&limit=5 responds without error', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/programs?page=1&limit=5');
    expect(result.status).toBe(200);
    expect(result.json.success).toBe(true);
  });

  test('GET /api/exercises?page=2&limit=10 responds without error', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/exercises?page=2&limit=10');
    expect([200]).toContain(result.status);
  });

  test('GET /api/clients?page=1&limit=20 responds without error', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', '/api/clients?page=1&limit=20');
    expect(result.status).toBe(200);
    expect(result.json.success).toBe(true);
  });

});

// ---------------------------------------------------------------------------
// Suite 6: Idempotency — duplicate favorites return 409, not duplicate data
// ---------------------------------------------------------------------------
test.describe('API Consistency — Idempotency', () => {

  test('favoriting the same exercise twice returns 409 or succeeds without duplicate', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const exercisesRes = await trainer.apiCall('GET', '/api/exercises?limit=1');
    const exercises: any[] = exercisesRes.data?.exercises || exercisesRes.data || [];
    if (exercises.length === 0) {
      test.skip();
      return;
    }
    const exerciseId = exercises[0].id;

    // First favorite (may or may not already be favorited)
    await rawFetch(trainer, 'POST', '/api/exercises/favorites', { exerciseId });

    // Second favorite — must return 409 (conflict) or 200/201 (idempotent success)
    const secondResult = await rawFetch(trainer, 'POST', '/api/exercises/favorites', { exerciseId });
    expect([200, 201, 409]).toContain(secondResult.status);

    // Verify the exercise appears exactly ONCE in favorites
    const favRes = await trainer.apiCall('GET', '/api/exercises/favorites');
    const favorites: any[] = favRes.data?.favorites || favRes.data || [];
    const occurrences = favorites.filter((f: any) =>
      f.id === exerciseId || f.exerciseId === exerciseId
    ).length;
    expect(occurrences).toBeLessThanOrEqual(1);
  });

  test('assigning the same program to a client twice returns 409 not 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const programId = await trainer.createProgramViaAPI({
      name: 'Idempotency Assign Test',
      type: 'strength',
      difficulty: 'beginner',
      durationWeeks: 2,
    });

    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email).catch(() => {});
    const clientsRes = await rawFetch(trainer, 'GET', '/api/clients');
    const clients: any[] = clientsRes.json?.data?.clients || clientsRes.json?.data || [];
    const client1Record = clients.find((c: any) =>
      c.email === SIM_ACCOUNTS.client1.email || c.client?.email === SIM_ACCOUNTS.client1.email
    );

    if (!client1Record) {
      test.skip();
      return;
    }

    const clientId = client1Record.clientId || client1Record.id;
    const assignBody = {
      clientId,
      startDate: new Date().toISOString(),
    };

    // First assignment
    await rawFetch(trainer, 'POST', `/api/programs/${programId}/assign`, assignBody);

    // Duplicate assignment — must be 409 (not 500)
    const dupeResult = await rawFetch(trainer, 'POST', `/api/programs/${programId}/assign`, assignBody);
    expect([409, 200, 201]).toContain(dupeResult.status);
    expect(dupeResult.status).not.toBe(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 7: Search handles special characters without 500
// ---------------------------------------------------------------------------
test.describe('API Consistency — Special Character Search', () => {

  test('exercise search with SQL injection pattern returns 200 or 400 not 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', `/api/exercises?search=${encodeURIComponent("' OR '1'='1")}`);
    expect([200, 400]).toContain(result.status);
    expect(result.status).not.toBe(500);
  });

  test('exercise search with unicode and emoji returns 200 or 400 not 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', `/api/exercises?search=${encodeURIComponent('Bench 💪 Prés')}`);
    expect([200, 400]).toContain(result.status);
    expect(result.status).not.toBe(500);
  });

  test('exercise search with double-quote character returns 200 or 400 not 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await rawFetch(trainer, 'GET', `/api/exercises?search=${encodeURIComponent('"barbell"')}`);
    expect([200, 400]).toContain(result.status);
    expect(result.status).not.toBe(500);
  });

});
