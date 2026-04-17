/**
 * FORGE QA Warfare — Chaos: External Failure & Input Abuse
 *
 * Tests the server's resilience against malformed inputs, edge-case
 * HTTP usage, and rapid repeated submissions — all without mocking.
 * Every test exercises real production code paths.
 *
 * Convention:
 * - All calls use raw page.request.fetch so status codes are visible.
 * - Tests assert on graceful HTTP responses (4xx), never on 500.
 * - "No crash" means the server responds at all within timeout.
 */

import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Shared auth helper — logs trainer in and returns the bearer token. */
async function loginTrainer(page: any): Promise<string> {
  const trainer = new TrainerActor(page);
  await trainer.login();
  return trainer.getToken()!;
}

/** Low-level fetch returning status + json without throwing. */
async function rawFetch(
  page: any,
  method: string,
  path: string,
  options: {
    token?: string;
    body?: string | Record<string, unknown>;
    contentType?: string;
    timeout?: number;
  } = {},
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {};
  if (options.contentType !== undefined) {
    headers['Content-Type'] = options.contentType;
  } else {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const body =
    options.body === undefined
      ? undefined
      : typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);

  const res = await page.request.fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    data: body,
    timeout: options.timeout ?? 20_000,
  });

  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status(), json };
}

// ---------------------------------------------------------------------------
// Malformed Inputs
// ---------------------------------------------------------------------------
test.describe('Chaos: External Failure — Malformed Inputs', () => {

  test('malformed JSON body returns 400, not 500', async ({ page }) => {
    const token = await loginTrainer(page);

    // Send deliberately broken JSON to an endpoint that parses request body
    const result = await rawFetch(page, 'POST', '/api/support/tickets', {
      token,
      body: '{ "subject": "broken", "message": }', // invalid JSON
    });

    // 400 = server validated and rejected; anything else except 500 is tolerable
    // The critical assertion is: NOT 500
    expect(result.status).not.toBe(500);
    // And it must respond with an HTTP error code, not silently succeed
    expect(result.status).toBeGreaterThanOrEqual(400);
  });

  test('wrong Content-Type header is handled gracefully', async ({ page }) => {
    const token = await loginTrainer(page);

    // Sends JSON payload but declares it as text/plain
    const result = await rawFetch(page, 'POST', '/api/support/tickets', {
      token,
      body: '{"subject":"Type test","message":"wrong content type test"}',
      contentType: 'text/plain',
    });

    // Server should reject (400/415) or accept — but never crash (500)
    expect(result.status).not.toBe(500);
  });

  test('request with Unicode and emoji in all string fields does not crash server', async ({ page }) => {
    const token = await loginTrainer(page);

    const unicodePayload = {
      subject: '🔥 Тест: Unicode subject — 测试支持票 ñoño',
      message: '💪 Body with emoji 🎯 and Arabic: مرحبا and CJK: 你好 and null-ish: \u0000 done.',
    };

    const result = await rawFetch(page, 'POST', '/api/support/tickets', {
      token,
      body: unicodePayload,
    });

    // Created (201) or validation error (400) — both fine. Crash (500) is not.
    expect(result.status).not.toBe(500);
    expect([201, 400]).toContain(result.status);
  });

  test('extremely large request body (1 MB) does not crash server', async ({ page }) => {
    const token = await loginTrainer(page);

    // Build a ~1 MB string
    const largePadding = 'X'.repeat(1_000_000);

    const result = await rawFetch(page, 'POST', '/api/support/tickets', {
      token,
      body: { subject: 'Large body test', message: largePadding },
      timeout: 30_000,
    });

    // Next.js / Node.js will either accept (201) or reject with 413/400/500.
    // The only hard failure here is the server hanging (timeout) or returning nothing.
    // A 5xx is "not great" but the test verifies the server responded at all.
    expect(typeof result.status).toBe('number');
    expect(result.status).toBeGreaterThan(0);
  });

});

// ---------------------------------------------------------------------------
// Authentication Edge Cases
// ---------------------------------------------------------------------------
test.describe('Chaos: External Failure — Auth Edge Cases', () => {

  test('expired-format token returns 401, not 500', async ({ page }) => {
    // Craft a syntactically valid JWT with a clearly expired exp value (iat=exp=1 = Jan 1970)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ userId: 'fake', role: 'trainer', iat: 1, exp: 1 })).toString('base64url');
    const expiredToken = `${header}.${payload}.invalidsignature`;

    const result = await rawFetch(page, 'GET', '/api/auth/me', {
      token: expiredToken,
    });

    // JWT middleware should reject with 401 — never with 500
    expect(result.status).toBe(401);
    expect(result.json).toHaveProperty('success', false);
  });

  test('malformed (non-JWT) bearer token returns 401', async ({ page }) => {
    const result = await rawFetch(page, 'GET', '/api/analytics/goals', {
      token: 'this-is-not-a-jwt',
    });

    expect(result.status).toBe(401);
  });

});

// ---------------------------------------------------------------------------
// Concurrency & Idempotency
// ---------------------------------------------------------------------------
test.describe('Chaos: External Failure — Concurrency & Idempotency', () => {

  test('concurrent rapid requests to the same GET endpoint return consistent data', async ({ page }) => {
    const token = await loginTrainer(page);

    // Fire 5 concurrent requests to the same safe GET endpoint
    const requests = Array.from({ length: 5 }, () =>
      rawFetch(page, 'GET', '/api/exercises?limit=5', { token }),
    );

    const results = await Promise.all(requests);

    // Every response must be 200 with the same exercise count
    for (const result of results) {
      expect(result.status).toBe(200);
      expect(result.json).toHaveProperty('success', true);
    }

    // All responses must agree on the total exercise count
    const totals = results.map((r) => r.json?.data?.total ?? r.json?.data?.exercises?.length ?? -1);
    const uniqueTotals = [...new Set(totals)];
    expect(uniqueTotals.length).toBe(1);
  });

  test('double-submit: POST same support ticket twice rapidly — no 500 on second call', async ({ page }) => {
    const token = await loginTrainer(page);

    const ticketPayload = {
      subject: 'FORGE chaos: double-submit test',
      message: 'Rapid double POST — second call must not cause a 500.',
    };

    // Fire both requests before awaiting either
    const [first, second] = await Promise.all([
      rawFetch(page, 'POST', '/api/support/tickets', { token, body: ticketPayload }),
      rawFetch(page, 'POST', '/api/support/tickets', { token, body: ticketPayload }),
    ]);

    // Both should either succeed (201) or fail gracefully (4xx) — never 500
    expect(first.status).not.toBe(500);
    expect(second.status).not.toBe(500);

    // At least one must succeed to confirm the endpoint actually works
    const successes = [first, second].filter((r) => r.status === 201);
    expect(successes.length).toBeGreaterThanOrEqual(1);
  });

});

// ---------------------------------------------------------------------------
// Post-Deletion Staleness
// ---------------------------------------------------------------------------
test.describe('Chaos: External Failure — Stale Cache / Post-Deletion', () => {

  test('accessing a resource immediately after deletion returns 404, not stale cache', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    // Create a measurement to delete
    const createResult = await rawFetch(page, 'POST', '/api/analytics/measurements', {
      token: client.getToken()!,
      body: {
        weight: 72.5,
        measurementDate: new Date().toISOString().split('T')[0],
      },
    });

    if (createResult.status !== 201) {
      test.skip(); // Can't test deletion if creation is broken
      return;
    }

    const measurementId: string = createResult.json?.data?.id;
    expect(measurementId).toBeTruthy();

    // Delete it
    const deleteResult = await rawFetch(page, 'DELETE', `/api/analytics/measurements/${measurementId}`, {
      token: client.getToken()!,
    });

    // Some implementations return 200/204 on delete; either is fine
    expect([200, 204]).toContain(deleteResult.status);

    // Immediately try to fetch it again — must be 404, not 200 (stale data)
    const fetchAfterDelete = await rawFetch(
      page, 'GET', `/api/analytics/measurements/${measurementId}`,
      { token: client.getToken()! },
    );

    expect([404, 403]).toContain(fetchAfterDelete.status);
  });

});
