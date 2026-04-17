/**
 * FORGE QA Warfare — Input Validation
 *
 * Verifies that every mutation endpoint rejects malformed, out-of-range,
 * or structurally incorrect payloads with a 4xx response — never a 500.
 *
 * A 500 in this suite always means an unhandled server error on bad input,
 * which is itself a security concern (leaks stack traces, crashes workers).
 */

import { test, expect } from '@playwright/test';
import { ClientActor } from '../actors/client-actor';
import { TrainerActor } from '../actors/trainer-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Raw authenticated POST — returns status without throwing. */
async function authedPost(
  actor: ClientActor | TrainerActor,
  path: string,
  body: unknown,
): Promise<{ status: number; json: any }> {
  const page = (actor as any).page;
  const token = actor.getToken();
  const res = await page.request.fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data: JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status(), json };
}

/** Raw authenticated PUT — returns status without throwing. */
async function authedPut(
  actor: ClientActor | TrainerActor,
  path: string,
  body: unknown,
): Promise<{ status: number; json: any }> {
  const page = (actor as any).page;
  const token = actor.getToken();
  const res = await page.request.fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data: JSON.stringify(body),
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status(), json };
}

// ---------------------------------------------------------------------------
// Suite 1: Empty / missing body on mutation endpoints
// ---------------------------------------------------------------------------
test.describe('Input Validation — Empty Body Rejection', () => {

  test('POST /api/analytics/measurements with empty body returns 400', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/measurements', {});
    // Either 400 (missing required fields) is correct; 500 is always wrong
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('POST /api/analytics/goals with empty body returns 400', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/goals', {});
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('POST /api/programs with empty body returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {});
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('POST /api/clients with empty body returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/clients', {});
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('POST /api/schedule/appointments with empty body returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/schedule/appointments', {});
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 2: Out-of-range numeric values
// ---------------------------------------------------------------------------
test.describe('Input Validation — Out-of-Range Numbers', () => {

  test('negative weight in measurement returns 400', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/measurements', {
      measurementDate: '2026-01-01',
      weight: -50,
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('body fat > 100% returns 400', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/measurements', {
      measurementDate: '2026-01-01',
      bodyFatPercentage: 150,
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('program with durationWeeks=0 returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: 'Zero-Week Program',
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 0,
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('program with durationWeeks > 52 returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: 'Century Program',
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 100,
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 3: Invalid enum values
// ---------------------------------------------------------------------------
test.describe('Input Validation — Invalid Enum Values', () => {

  test('program with invalid programType enum returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: 'Hacker Program',
      programType: 'hacking', // not a valid enum
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('program with invalid difficultyLevel returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: 'Expert Program',
      programType: 'strength',
      difficultyLevel: 'expert', // only beginner/intermediate/advanced allowed
      durationWeeks: 4,
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('goal with invalid goalType returns 400', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/goals', {
      goalType: 'world_domination',
      targetDate: '2027-01-01',
      priority: 3,
      isActive: true,
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 4: Type mismatches (wrong JSON structure)
// ---------------------------------------------------------------------------
test.describe('Input Validation — Type Mismatches', () => {

  test('string where number expected (weight) returns 400', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/measurements', {
      measurementDate: '2026-01-01',
      weight: 'seventy-five', // string instead of number
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('object where string expected (email) returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/clients', {
      email: { injected: true }, // object instead of string
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('array where string expected (program name) returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: ['array', 'injection'], // array instead of string
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('string where array expected (program goals) returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: 'Type Attack',
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      goals: 'lose_weight', // string instead of array
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 5: Boundary-value strings
// ---------------------------------------------------------------------------
test.describe('Input Validation — Boundary Strings', () => {

  test('10KB string in measurement notes does not return 500', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const tenKb = 'A'.repeat(10_240);
    const result = await authedPost(client, '/api/analytics/measurements', {
      measurementDate: '2026-01-01',
      weight: 75,
      notes: tenKb,
    });
    // Server should return 400 (too long) or 201 (notes capped) — never 500
    expect(result.status).not.toBe(500);
  });

  test('zero-length required string (program name) returns 400', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/programs', {
      name: '',
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      weeks: [],
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

  test('special characters in exercise collection name do not crash server', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const result = await authedPost(trainer, '/api/exercises/collections', {
      name: "Robert'); DROP TABLE exercises;--",
      description: '<script>alert(1)</script>',
    });
    // Either accepts it (sanitised storage) or rejects it — never crashes
    expect(result.status).not.toBe(500);
  });

  test('future date far beyond range in goal targetDate does not crash server', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const result = await authedPost(client, '/api/analytics/goals', {
      goalType: 'weight_loss',
      targetValue: 70,
      targetDate: '9999-12-31', // far-future date
      priority: 3,
      isActive: true,
    });
    // May be 400 (out of range) or 201 (accepted) — must not be 500
    expect(result.status).not.toBe(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 6: Duplicate / idempotency edge cases
// ---------------------------------------------------------------------------
test.describe('Input Validation — Duplicate Operations', () => {

  test('adding the same client to trainer roster twice does not return 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // First add (may or may not already exist)
    await authedPost(trainer, '/api/clients', { email: 'sim-client1@evofit.io' });

    // Second add of the same client
    const result = await authedPost(trainer, '/api/clients', { email: 'sim-client1@evofit.io' });

    // Should return 409 Conflict or 200 (idempotent) — never a 500
    expect([200, 201, 409]).toContain(result.status);
  });

  test('favoriting the same exercise twice does not return 500', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Get a real exercise ID first
    const page_ = (trainer as any).page;
    const exRes = await page_.request.fetch(`${BASE_URL}/api/exercises?limit=1`, {
      headers: { Authorization: `Bearer ${trainer.getToken()}` },
    });
    const exJson = await exRes.json();
    const exercises: any[] = exJson?.data?.exercises || exJson?.data || [];

    if (exercises.length === 0) {
      test.skip(); // No exercises in DB, skip rather than false-fail
      return;
    }

    const exerciseId = exercises[0].id;

    // First favorite
    await authedPost(trainer, '/api/exercises/favorites', { exerciseId });

    // Second favorite of same exercise
    const result = await authedPost(trainer, '/api/exercises/favorites', { exerciseId });
    expect(result.status).not.toBe(500);
  });

  test('creating a program with duplicate name is not a server error', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const programPayload = {
      name: `Duplicate-Test-${Date.now()}`,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      goals: [],
      equipmentNeeded: [],
      weeks: [{
        weekNumber: 1,
        name: 'Week 1',
        workouts: [{
          dayNumber: 1,
          name: 'Day 1',
          workoutType: 'strength',
          estimatedDuration: 45,
        }],
      }],
    };

    // First creation should succeed
    const first = await authedPost(trainer, '/api/programs', programPayload);
    expect([200, 201]).toContain(first.status);

    // Second creation with same name — server should not crash
    const second = await authedPost(trainer, '/api/programs', programPayload);
    expect(second.status).not.toBe(500);
  });

});
