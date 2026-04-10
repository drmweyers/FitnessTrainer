/**
 * Suite E06: Permission Leak / Authorization Edge Cases
 *
 * CRITICAL SECURITY SUITE.
 *
 * Verifies that URL-tampering and cross-account authorization attempts are
 * properly rejected by the API. Every test here asserts that a user cannot
 * access another user's data or perform a role-restricted action by guessing,
 * tampering with, or fabricating identifiers / tokens.
 *
 * Expected behavior: 401 (unauth) / 403 (forbidden) / 404 (not found, used by
 * the codebase to hide resource existence from unauthorized callers) — never
 * 200 with another user's data.
 */
import { test, expect, type APIResponse } from '@playwright/test';
import { BASE_URL, API, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaAPI } from '../helpers/auth';

// Status codes considered a "safe rejection" for authorization checks.
// 401 = unauthenticated, 403 = forbidden, 404 = hidden ("cannot prove resource
// exists to you"), 400 = validation rejection before reaching business logic,
// 409 = conflict (e.g. idempotent "already assigned"). Any of these prove the
// unauthorized caller did NOT get the protected resource.
// The ONLY statuses that would signal a real leak are 200/201/204.
const REJECTED_STATUSES = [400, 401, 403, 404, 409];

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

test.describe('E06 - Permission Leak / Authorization Edge Cases', () => {
  // -----------------------------------------------------------------------
  // Test 1: Client A requests Client B's profile
  // -----------------------------------------------------------------------
  test('client cannot PATCH another clients profile (cross-tenant)', async ({ page }) => {
    // Log in as client A and capture their identity
    const { accessToken: clientAToken, user: clientAUser } = await loginViaAPI(page, 'client');

    // Discover client B's id by logging in as them in a separate request context
    // ASSUMPTION: /api/auth/me returns { data: { user: { id } } } or similar shape.
    const clientBLoginRes = await page.request.post(API.login, {
      data: {
        email: TEST_ACCOUNTS.client2.email,
        password: TEST_ACCOUNTS.client2.password,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(clientBLoginRes.ok()).toBeTruthy();
    const clientBBody = await clientBLoginRes.json();
    const clientBId: string =
      clientBBody.data?.user?.id || clientBBody.user?.id || clientBBody.data?.id;
    expect(clientBId).toBeTruthy();

    // Client A tries to PATCH client B's profile — should be rejected
    // ASSUMPTION: /api/clients/[clientId]/profile only exposes a PATCH handler
    // (no GET) — so we exercise the tamper path via PATCH.
    const res = await page.request.patch(
      `${BASE_URL}/api/clients/${clientBId}/profile`,
      {
        headers: authHeaders(clientAToken),
        data: { notes: 'leaked by client A' },
      }
    );

    expect(REJECTED_STATUSES).toContain(res.status());
    // The critical assertion: this must NOT be 200
    expect(res.status()).not.toBe(200);
  });

  // -----------------------------------------------------------------------
  // Test 2: Workout history with tampered userId query param
  // -----------------------------------------------------------------------
  test('client cannot read another users workout history via userId query param', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client');

    // Capture client2 id from a login call
    const c2Login = await page.request.post(API.login, {
      data: {
        email: TEST_ACCOUNTS.client2.email,
        password: TEST_ACCOUNTS.client2.password,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    const c2Body = await c2Login.json();
    const clientBId: string =
      c2Body.data?.user?.id || c2Body.user?.id || c2Body.data?.id;
    expect(clientBId).toBeTruthy();

    // Attempt to read history filtered by another user's id
    const res = await page.request.get(
      `${BASE_URL}${API.workoutsHistory}?userId=${clientBId}`,
      { headers: authHeaders(accessToken) }
    );

    // ASSUMPTION: history endpoint ignores the userId query param and only
    // returns workouts for the authenticated user, OR rejects with 401/403.
    // We accept either, but if 200, every returned record must belong to the
    // authenticated caller (not clientBId).
    if (res.ok()) {
      const body = await res.json();
      const items = body.data?.workouts || body.data || body.workouts || [];
      for (const item of items) {
        // Reject if any record shows another user's id
        if (item.userId || item.clientId) {
          expect([item.userId, item.clientId]).not.toContain(clientBId);
        }
      }
    } else {
      expect(REJECTED_STATUSES).toContain(res.status());
    }
  });

  // -----------------------------------------------------------------------
  // Test 3: Non-admin cannot list admin users
  // -----------------------------------------------------------------------
  test('trainer cannot GET /api/admin/users', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer');

    const res = await page.request.get(`${BASE_URL}${API.adminUsers}`, {
      headers: authHeaders(accessToken),
    });

    expect(res.status()).toBe(403);
  });

  // -----------------------------------------------------------------------
  // Test 4: Non-admin cannot modify admin user
  // -----------------------------------------------------------------------
  test('trainer cannot PATCH another admin users record', async ({ page }) => {
    // First, log in as admin to discover admin user id
    const adminLogin = await page.request.post(API.login, {
      data: {
        email: TEST_ACCOUNTS.admin.email,
        password: TEST_ACCOUNTS.admin.password,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const adminBody = await adminLogin.json();
    const adminId: string =
      adminBody.data?.user?.id || adminBody.user?.id || adminBody.data?.id;
    expect(adminId).toBeTruthy();

    // Now act as trainer
    const { accessToken: trainerToken } = await loginViaAPI(page, 'trainer');
    const res = await page.request.patch(
      `${BASE_URL}${API.adminUsers}/${adminId}`,
      {
        headers: authHeaders(trainerToken),
        data: { role: 'client' },
      }
    );

    // Must be rejected — accept 401/403/404/405 (405 if PATCH not implemented,
    // which is still not a leak).
    expect([...REJECTED_STATUSES, 405]).toContain(res.status());
  });

  // -----------------------------------------------------------------------
  // Test 5: Client role cannot create a program
  // -----------------------------------------------------------------------
  test('client cannot POST /api/programs (role-restricted action)', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client');

    const res = await page.request.post(`${BASE_URL}${API.programs}`, {
      headers: authHeaders(accessToken),
      data: {
        name: 'Leaked Program (should be rejected)',
        description: 'client attempted to create',
        programType: 'strength',
        difficultyLevel: 'beginner',
        durationWeeks: 4,
        goals: [],
        equipmentNeeded: [],
      },
    });

    // ASSUMPTION: As of code review, POST /api/programs only calls
    // authenticate() and does not check role. This test will FAIL if the
    // server returns 200/201 for a client role — that is a security gap worth
    // flagging. The test enforces the correct behavior (403).
    expect(REJECTED_STATUSES).toContain(res.status());
  });

  // -----------------------------------------------------------------------
  // Test 6: Client cannot assign a program to someone else
  // -----------------------------------------------------------------------
  test('client cannot POST /api/programs/{id}/assign', async ({ page }) => {
    // First grab a real program id as trainer
    const { accessToken: trainerToken } = await loginViaAPI(page, 'trainer');
    const programsRes = await page.request.get(`${BASE_URL}${API.programs}`, {
      headers: authHeaders(trainerToken),
    });

    let programId: string | undefined;
    if (programsRes.ok()) {
      const body = await programsRes.json();
      const items = body.data || body.programs || (Array.isArray(body) ? body : []);
      programId = Array.isArray(items) && items.length ? items[0].id : undefined;
    }

    // Fall back to a random UUID if no program exists — the assign endpoint
    // should still reject the client-role caller (with 404 for ownership
    // mismatch or 403 for role).
    const targetId = programId || '00000000-0000-0000-0000-000000000000';

    // Now act as client and try to assign
    const { accessToken: clientToken, user: clientUser } = await loginViaAPI(page, 'client');

    const res = await page.request.post(
      `${BASE_URL}${API.programs}/${targetId}/assign`,
      {
        headers: authHeaders(clientToken),
        data: {
          clientId: clientUser?.id || '00000000-0000-0000-0000-000000000000',
          startDate: new Date().toISOString(),
        },
      }
    );

    // ASSUMPTION: Current impl scopes program lookup to trainerId = user.id,
    // so a client caller will see 404 (program not found for them). Accept
    // 401/403/404 — all are safe rejections; 200 would be a leak.
    expect(REJECTED_STATUSES).toContain(res.status());
  });

  // -----------------------------------------------------------------------
  // Test 7: Unauthenticated request to protected endpoint
  // -----------------------------------------------------------------------
  test('unauthenticated GET /api/profiles/me returns 401', async ({ page }) => {
    // Deliberately do NOT log in and do not include any auth header.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const res = await page.request.get(`${BASE_URL}${API.profileMe}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(401);
  });

  // -----------------------------------------------------------------------
  // Test 8: Garbage / invalid bearer token
  // -----------------------------------------------------------------------
  test('garbage bearer token returns 401 on protected endpoint', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const res = await page.request.get(`${BASE_URL}${API.profileMe}`, {
      headers: {
        Authorization: 'Bearer invalidtoken123',
        'Content-Type': 'application/json',
      },
    });

    expect(res.status()).toBe(401);
  });

  // -----------------------------------------------------------------------
  // Test 9: Measurements/me with tampered clientId query param
  // -----------------------------------------------------------------------
  test('client cannot read another users measurements via clientId query param', async ({ page }) => {
    const { accessToken, user: clientAUser } = await loginViaAPI(page, 'client');

    // Grab client2 id
    const c2Login = await page.request.post(API.login, {
      data: {
        email: TEST_ACCOUNTS.client2.email,
        password: TEST_ACCOUNTS.client2.password,
      },
      headers: { 'Content-Type': 'application/json' },
    });
    const c2Body = await c2Login.json();
    const clientBId: string =
      c2Body.data?.user?.id || c2Body.user?.id || c2Body.data?.id;
    expect(clientBId).toBeTruthy();

    // ASSUMPTION: /api/analytics/measurements/me exists as the canonical
    // "self measurements" endpoint. We add a bogus clientId query param to
    // test whether the endpoint honors tampering or ignores it.
    const res = await page.request.get(
      `${BASE_URL}${API.analyticsMeasurements}/me?clientId=${clientBId}`,
      { headers: authHeaders(accessToken) }
    );

    if (res.ok()) {
      const body = await res.json();
      const items = body.data?.measurements || body.data || body.measurements || [];
      for (const item of items) {
        if (item.userId || item.clientId) {
          expect([item.userId, item.clientId]).not.toContain(clientBId);
        }
      }
    } else {
      expect(REJECTED_STATUSES).toContain(res.status());
    }
  });

  // -----------------------------------------------------------------------
  // Test 10: Trainer accessing a client not in their roster
  // -----------------------------------------------------------------------
  test('trainer cannot PATCH profile of a client not in their roster', async ({ page }) => {
    const { accessToken: trainerToken } = await loginViaAPI(page, 'trainer');

    // Use a fabricated UUID — guaranteed not to be in any roster
    const fakeClientId = '11111111-2222-3333-4444-555555555555';

    const res = await page.request.patch(
      `${BASE_URL}/api/clients/${fakeClientId}/profile`,
      {
        headers: authHeaders(trainerToken),
        data: { notes: 'tamper' },
      }
    );

    // From route source: trainers who do not own the relationship get 404.
    // Accept 401/403/404 — all are safe rejections.
    expect(REJECTED_STATUSES).toContain(res.status());
    expect(res.status()).not.toBe(200);
  });
});
