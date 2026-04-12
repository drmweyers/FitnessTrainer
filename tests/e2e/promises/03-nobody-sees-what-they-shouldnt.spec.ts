/**
 * Promise 03: Nobody Sees What They Shouldn't
 *
 * Adversarial auth test suite. Verifies that every protected route and mutation:
 *   1. Rejects unauthenticated guests (401)
 *   2. Rejects wrong-role actors (403)
 *   3. Enforces cross-tenant isolation (trainer A cannot read trainer B's data)
 *
 * Rule: 500 is NOT a pass. A crashed guard is a failed guard.
 */

import { test, expect, APIResponse } from '@playwright/test';
import { getAuthToken } from '../helpers/auth';

// ─── helpers ────────────────────────────────────────────────────────────────

function assertNotLeak(res: APIResponse, label: string) {
  // 500 means the guard crashed — that is a bug, not a block.
  expect(res.status(), `${label}: got 500 (guard crashed, not blocked)`).not.toBe(500);
  expect(
    [401, 403, 404],
    `${label}: expected 401/403/404 but got ${res.status()}`
  ).toContain(res.status());
}

function assertBlocked403(res: APIResponse, label: string) {
  expect(res.status(), `${label}: expected 403 but got ${res.status()}`).toBe(403);
}

function assertBlocked401(res: APIResponse, label: string) {
  expect(res.status(), `${label}: expected 401 but got ${res.status()}`).toBe(401);
}

// ─── shared state ───────────────────────────────────────────────────────────

// Tokens are obtained once in beforeAll and reused across tests.
let trainerToken = '';
let clientToken = '';
let adminToken = '';

// IDs discovered at runtime from the trainer's real data
let trainerClientId = ''; // a client that belongs to qa-trainer
let trainerId = '';       // qa-trainer's own user id

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  trainerToken = await getAuthToken(page, 'trainer');
  clientToken = await getAuthToken(page, 'client');
  adminToken = await getAuthToken(page, 'admin');

  expect(trainerToken, 'trainer token not obtained').toBeTruthy();
  expect(clientToken, 'client token not obtained').toBeTruthy();
  expect(adminToken, 'admin token not obtained').toBeTruthy();

  // Fetch trainer's own user ID via /api/profiles/me
  const meRes = await page.request.get('/api/profiles/me', {
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  if (meRes.ok()) {
    const body = await meRes.json();
    trainerId = body.data?.id || '';
  }

  // Fetch trainer's client list to grab a real client ID for cross-tenant tests
  const clientsRes = await page.request.get('/api/clients', {
    headers: { Authorization: `Bearer ${trainerToken}` },
  });
  if (clientsRes.ok()) {
    const body = await clientsRes.json();
    const clients = body.clients || [];
    if (clients.length > 0) {
      trainerClientId = clients[0].id;
    }
  }

  await ctx.close();
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: API — guest (no token)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Guest (no token) — all protected API routes must return 401', () => {
  test('GET /api/clients → 401', async ({ request }) => {
    const res = await request.get('/api/clients');
    assertBlocked401(res, 'guest GET /api/clients');
  });

  test('POST /api/programs → 401', async ({ request }) => {
    const res = await request.post('/api/programs', { data: {} });
    assertBlocked401(res, 'guest POST /api/programs');
  });

  test('GET /api/analytics/goals → 401', async ({ request }) => {
    const res = await request.get('/api/analytics/goals');
    assertBlocked401(res, 'guest GET /api/analytics/goals');
  });

  test('GET /api/analytics/measurements → 401', async ({ request }) => {
    const res = await request.get('/api/analytics/measurements');
    assertBlocked401(res, 'guest GET /api/analytics/measurements');
  });

  test('GET /api/analytics/performance → 401', async ({ request }) => {
    const res = await request.get('/api/analytics/performance');
    assertBlocked401(res, 'guest GET /api/analytics/performance');
  });

  test('GET /api/analytics/training-load → 401', async ({ request }) => {
    const res = await request.get('/api/analytics/training-load');
    assertBlocked401(res, 'guest GET /api/analytics/training-load');
  });

  test('GET /api/schedule/appointments → 401', async ({ request }) => {
    const res = await request.get('/api/schedule/appointments');
    assertBlocked401(res, 'guest GET /api/schedule/appointments');
  });

  test('GET /api/schedule/availability → 401', async ({ request }) => {
    const res = await request.get('/api/schedule/availability');
    assertBlocked401(res, 'guest GET /api/schedule/availability');
  });

  test('GET /api/profiles/me → 401', async ({ request }) => {
    const res = await request.get('/api/profiles/me');
    assertBlocked401(res, 'guest GET /api/profiles/me');
  });

  test('GET /api/admin/users → 401', async ({ request }) => {
    const res = await request.get('/api/admin/users');
    assertBlocked401(res, 'guest GET /api/admin/users');
  });

  test('GET /api/admin/dashboard → 401', async ({ request }) => {
    const res = await request.get('/api/admin/dashboard');
    assertBlocked401(res, 'guest GET /api/admin/dashboard');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Client role — must be blocked from trainer/admin endpoints
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Client role — blocked from trainer-only routes', () => {
  test('GET /api/clients → 403 for client role', async ({ request }) => {
    const res = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assertBlocked403(res, 'client GET /api/clients');
  });

  test('POST /api/clients → 403 for client role', async ({ request }) => {
    const res = await request.post('/api/clients', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { email: 'victim@example.com' },
    });
    assertBlocked403(res, 'client POST /api/clients');
  });

  test('POST /api/programs → 403 for client role', async ({ request }) => {
    const res = await request.post('/api/programs', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        name: 'Evil Program',
        programType: 'strength',
        difficultyLevel: 'beginner',
        durationWeeks: 4,
      },
    });
    assertBlocked403(res, 'client POST /api/programs');
  });

  test('POST /api/schedule/availability → 403 for client role', async ({ request }) => {
    const res = await request.post('/api/schedule/availability', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] },
    });
    assertBlocked403(res, 'client POST /api/schedule/availability');
  });

  test('POST /api/schedule/appointments → 403 for client role', async ({ request }) => {
    const res = await request.post('/api/schedule/appointments', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        clientId: '00000000-0000-0000-0000-000000000001',
        title: 'Fake session',
        appointmentType: 'one_on_one',
        startDatetime: new Date(Date.now() + 86400000).toISOString(),
        endDatetime: new Date(Date.now() + 90000000).toISOString(),
      },
    });
    assertBlocked403(res, 'client POST /api/schedule/appointments');
  });

  test('GET /api/admin/users → 403 for client role', async ({ request }) => {
    const res = await request.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assertNotLeak(res, 'client GET /api/admin/users');
  });

  test('GET /api/admin/dashboard → 403 for client role', async ({ request }) => {
    const res = await request.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assertNotLeak(res, 'client GET /api/admin/dashboard');
  });

  test('GET /api/admin/activity → 403 for client role', async ({ request }) => {
    const res = await request.get('/api/admin/activity', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assertNotLeak(res, 'client GET /api/admin/activity');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Trainer role — blocked from admin-only routes
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Trainer role — blocked from admin-only routes', () => {
  test('GET /api/admin/users → 403 for trainer role', async ({ request }) => {
    const res = await request.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    assertNotLeak(res, 'trainer GET /api/admin/users');
  });

  test('GET /api/admin/dashboard → 403 for trainer role', async ({ request }) => {
    const res = await request.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    assertNotLeak(res, 'trainer GET /api/admin/dashboard');
  });

  test('GET /api/admin/activity → 403 for trainer role', async ({ request }) => {
    const res = await request.get('/api/admin/activity', {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    assertNotLeak(res, 'trainer GET /api/admin/activity');
  });

  test('GET /api/admin/feature-flags → 403 for trainer role', async ({ request }) => {
    const res = await request.get('/api/admin/feature-flags', {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
    assertNotLeak(res, 'trainer GET /api/admin/feature-flags');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Cross-tenant — trainer A cannot see trainer B's client data
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Cross-tenant isolation — client token cannot access trainer-scoped data', () => {
  /**
   * The client token belongs to qa-client. The qa-trainer owns this client.
   * Using the CLIENT token to hit client-management endpoints (which are
   * trainer-only) should be blocked — tested above.
   *
   * The critical cross-tenant test: can a CLIENT directly read/write
   * another user's profile, goals, or measurements by guessing IDs?
   */

  test('GET /api/analytics/goals — client cannot see trainer goals', async ({ request }) => {
    // Client gets their own goals (ok), but the response must NOT include
    // goals belonging to users outside their own userId.
    const res = await request.get('/api/analytics/goals', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const goals: Array<{ user?: { id: string } }> = body.data || [];
    // Every returned goal must belong to the client themselves
    for (const goal of goals) {
      if (goal.user) {
        // If user info is embedded, it must not be a different person's data
        // We can't know the client's exact ID here, but we ensure no trainer ID leaks
        expect(goal.user.id, 'goal user ID must not be trainer ID').not.toBe(trainerId);
      }
    }
  });

  test('PATCH /api/clients/[id]/profile — client cannot patch their own client record (trainer-only)', async ({
    request,
  }) => {
    if (!trainerClientId) {
      test.skip();
      return;
    }
    const res = await request.patch(`/api/clients/${trainerClientId}/profile`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { goals: 'I hacked this' },
    });
    assertBlocked403(res, 'client PATCH /api/clients/[id]/profile');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: IDOR probes — access another user's data by guessing IDs
// ═══════════════════════════════════════════════════════════════════════════

test.describe('IDOR probes — guessing IDs must not expose cross-user data', () => {
  const FAKE_UUID = '00000000-0000-0000-0000-000000000001';

  test('GET /api/analytics/goals/[fake-id] — client sees 404, not another user\'s goal', async ({
    request,
  }) => {
    const res = await request.get(`/api/analytics/goals/${FAKE_UUID}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    // Must be 404 (not found for this user), never 200 with someone else's data
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/analytics/goals/[trainer-goal-id] — client cannot delete trainer goals', async ({
    request,
  }) => {
    // First, create a goal as trainer
    const createRes = await request.post('/api/analytics/goals', {
      headers: { Authorization: `Bearer ${trainerToken}` },
      data: { goalType: 'strength' },
    });
    if (!createRes.ok()) {
      // If trainer can't create goals (role check), skip
      test.skip();
      return;
    }
    const { data: trainerGoal } = await createRes.json();

    // Now try to delete that goal as client
    const deleteRes = await request.delete(`/api/analytics/goals/${trainerGoal.id}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    // Client must NOT be able to delete the trainer's goal
    expect(deleteRes.status(), 'client deleted trainer goal — IDOR!').not.toBe(200);
    expect([403, 404]).toContain(deleteRes.status());

    // Cleanup: delete as trainer
    await request.delete(`/api/analytics/goals/${trainerGoal.id}`, {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
  });

  test('PUT /api/analytics/goals/[trainer-goal-id] — client cannot update trainer goal', async ({
    request,
  }) => {
    // Create trainer goal
    const createRes = await request.post('/api/analytics/goals', {
      headers: { Authorization: `Bearer ${trainerToken}` },
      data: { goalType: 'endurance' },
    });
    if (!createRes.ok()) {
      test.skip();
      return;
    }
    const { data: trainerGoal } = await createRes.json();

    const updateRes = await request.put(`/api/analytics/goals/${trainerGoal.id}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { specificGoal: 'hacked!' },
    });
    expect(updateRes.status(), 'client updated trainer goal — IDOR!').not.toBe(200);
    expect([403, 404]).toContain(updateRes.status());

    // Cleanup
    await request.delete(`/api/analytics/goals/${trainerGoal.id}`, {
      headers: { Authorization: `Bearer ${trainerToken}` },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Availability IDOR — trainerId param injection
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Availability trainerId param — cross-trainer read via query param', () => {
  /**
   * SUSPECTED LEAK:
   * GET /api/schedule/availability accepts ?trainerId=<any-uuid>
   * with no ownership check. A client (or any authenticated user) can
   * enumerate any trainer's weekly schedule by passing their ID.
   */
  test('GET /api/schedule/availability?trainerId=<trainerA> — client can read any trainer\'s schedule', async ({
    request,
  }) => {
    if (!trainerId) {
      test.skip();
      return;
    }
    const res = await request.get(`/api/schedule/availability?trainerId=${trainerId}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    // This SHOULD be 403. If it returns 200, that is a leak.
    if (res.status() === 200) {
      const body = await res.json();
      const slots = body.data || [];
      // If data is returned and it matches the trainer, we have a confirmed leak.
      console.error(`[LEAK] client read trainer availability: ${slots.length} slots returned`);
    }
    expect(
      res.status(),
      'client can enumerate trainer availability via ?trainerId param — LEAK'
    ).toBe(403);
  });

  test('GET /api/schedule/availability?trainerId=<trainerA> — other trainer can read competitor schedule', async ({
    request,
  }) => {
    // Using the client token is the harshest probe, but a second trainer
    // probing competitor schedule is also a business-logic leak.
    // We simulate "another trainer" with the client token here since
    // we only have one trainer QA account. The principle is the same.
    if (!trainerId) {
      test.skip();
      return;
    }
    const res = await request.get(`/api/schedule/availability?trainerId=${trainerId}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(
      res.status(),
      'availability trainerId probe must be blocked — LEAK'
    ).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Admin scoping — verify admin can access but non-admins cannot
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin routes — admin allowed, others blocked', () => {
  test('GET /api/admin/users — admin succeeds (200)', async ({ request }) => {
    const res = await request.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/admin/dashboard — admin succeeds', async ({ request }) => {
    const res = await request.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([200, 404]).toContain(res.status()); // 404 ok if route not fully implemented
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: Profile self-enforcement — can never update another user
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Profile ME endpoint — always self, never impersonation', () => {
  test('GET /api/profiles/me — returns own profile (not another user\'s)', async ({
    request,
  }) => {
    const res = await request.get('/api/profiles/me', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const returnedId: string = body.data?.id;
    // Must not accidentally return the trainer's profile
    expect(returnedId, 'profiles/me returned trainer ID for client token').not.toBe(trainerId);
  });

  test('PUT /api/profiles/me — client cannot PUT with a body targeting another userId', async ({
    request,
  }) => {
    // The API ignores any userId in the body and uses token identity.
    // Verify the response reflects only the client's own profile.
    const res = await request.put('/api/profiles/me', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { bio: 'legit update', userId: trainerId }, // trying to inject userId
    });
    expect(res.ok()).toBeTruthy();
    // The returned profile must still be the client's — not the trainer's
    const body = await res.json();
    const profileUserId: string = body.data?.userId || body.data?.id;
    if (profileUserId) {
      expect(profileUserId, 'PUT profiles/me updated the wrong user via userId injection').not.toBe(
        trainerId
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: Client token — GET /api/programs must be scoped or blocked
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Program scoping — client cannot read trainer programs', () => {
  test('GET /api/programs — client token returns only assigned data, not all programs', async ({
    request,
  }) => {
    const res = await request.get('/api/programs', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    // Programs endpoint scopes by trainerId = user.id.
    // A client will get an empty list (they have no programs as trainer)
    // OR a 403 if role-guarded. Either is acceptable. 200 with trainer programs = leak.
    if (res.status() === 200) {
      const body = await res.json();
      const programs: Array<{ trainerId: string }> = body.data || [];
      for (const program of programs) {
        expect(
          program.trainerId,
          'client received a program belonging to trainer — cross-tenant leak'
        ).not.toBe(trainerId);
      }
    } else {
      expect([403, 404]).toContain(res.status());
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: Workout completion — session ownership enforced
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workout session — complete endpoint enforces ownership', () => {
  test('POST /api/workouts/[fake-id]/complete — 404 when session not owned', async ({
    request,
  }) => {
    const fakeSessionId = '00000000-0000-0000-0000-000000000002';
    const res = await request.post(`/api/workouts/${fakeSessionId}/complete`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: { notes: 'hacked' },
    });
    // findFirst({where: {id, clientId: user.id}}) returns null for foreign sessions
    expect([404, 400], `workout complete must not leak on foreign session id (got ${res.status()})`).toContain(
      res.status()
    );
  });
});
