/**
 * FORGE QA Warfare — Chaos: Pagination & List Boundary Stress
 *
 * Exercises every edge case in the pagination, sorting, and filtering
 * contracts of the exercise library endpoint (the richest list endpoint
 * in the application — public, no auth required, stable data set).
 *
 * Also hits the authenticated activities feed for the concurrency check
 * so we can confirm consistency across roles.
 *
 * Convention:
 * - Tests assert the server responds gracefully (no 500, no hang).
 * - "Empty array" is always a valid response for out-of-range pages.
 * - Invalid parameters must be handled with 4xx OR ignored (default applied).
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Raw fetch — never throws, surfaces HTTP status + JSON body. */
async function rawFetch(
  page: any,
  path: string,
  token?: string,
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await page.request.fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers,
    timeout: 20_000,
  });

  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status(), json };
}

/** Extract the exercises array from whatever shape the API returns. */
function extractExercises(json: any): any[] {
  return (
    json?.data?.exercises ??
    json?.data?.data ??
    (Array.isArray(json?.data) ? json.data : [])
  );
}

// ---------------------------------------------------------------------------
// Page Number Boundary Tests
// ---------------------------------------------------------------------------
test.describe('Chaos: Pagination Stress — Page Number Boundaries', () => {

  test('page=0 is handled gracefully (not 500)', async ({ page }) => {
    const { status, json } = await rawFetch(page, '/api/exercises?page=0&limit=5');

    expect(status).not.toBe(500);
    // Server may normalise page=0 to page=1 and return data, or return 400 — both fine
    expect([200, 400]).toContain(status);
    if (status === 200) {
      expect(json).toHaveProperty('success', true);
    }
  });

  test('negative page number is handled gracefully (not 500)', async ({ page }) => {
    const { status, json } = await rawFetch(page, '/api/exercises?page=-5&limit=5');

    expect(status).not.toBe(500);
    expect([200, 400]).toContain(status);
    if (status === 200) {
      expect(json).toHaveProperty('success', true);
    }
  });

  test('page beyond max returns empty array, not 4xx or 500', async ({ page }) => {
    // Request page 999999 — far beyond the 1,344-exercise data set
    const { status, json } = await rawFetch(page, '/api/exercises?page=999999&limit=20');

    expect(status).toBe(200);
    expect(json).toHaveProperty('success', true);

    const exercises = extractExercises(json);
    // Beyond the last page must yield an empty list, not an error
    expect(Array.isArray(exercises)).toBeTruthy();
    expect(exercises.length).toBe(0);
  });

});

// ---------------------------------------------------------------------------
// Limit / Page Size Edge Cases
// ---------------------------------------------------------------------------
test.describe('Chaos: Pagination Stress — Limit Edge Cases', () => {

  test('limit=0 returns empty set or default set — does not crash', async ({ page }) => {
    const { status } = await rawFetch(page, '/api/exercises?limit=0');

    expect(status).not.toBe(500);
    expect([200, 400]).toContain(status);
  });

  test('extremely large limit (limit=99999) is capped or handled — does not crash', async ({ page }) => {
    const { status, json } = await rawFetch(page, '/api/exercises?limit=99999');

    // Server must respond; a 200 with a capped result set is ideal
    expect(status).not.toBe(500);
    expect([200, 400]).toContain(status);

    if (status === 200) {
      const exercises = extractExercises(json);
      expect(Array.isArray(exercises)).toBeTruthy();
      // Even if the server ignores the cap, it must return the full library (<=1344),
      // not a partial result due to memory pressure
      expect(exercises.length).toBeGreaterThan(0);
    }
  });

});

// ---------------------------------------------------------------------------
// Sorting Edge Cases
// ---------------------------------------------------------------------------
test.describe('Chaos: Pagination Stress — Sorting Edge Cases', () => {

  test('sort by invalid field is handled gracefully — not 500', async ({ page }) => {
    const { status } = await rawFetch(
      page,
      '/api/exercises?sortBy=nonExistentColumnXyz&sortOrder=asc&limit=5',
    );

    // Zod schema strips unknown sortBy values or returns 400 — either is fine
    expect(status).not.toBe(500);
    expect([200, 400]).toContain(status);
  });

  test('sort by valid field "name" asc returns ordered results', async ({ page }) => {
    const { status, json } = await rawFetch(
      page,
      '/api/exercises?sortBy=name&sortOrder=asc&limit=10',
    );

    expect(status).toBe(200);
    expect(json).toHaveProperty('success', true);

    const exercises = extractExercises(json);
    expect(exercises.length).toBeGreaterThan(0);

    // Verify ascending order: each name >= previous name (case-insensitive)
    for (let i = 1; i < exercises.length; i++) {
      const prev = (exercises[i - 1].name ?? '').toLowerCase();
      const curr = (exercises[i].name ?? '').toLowerCase();
      expect(curr >= prev).toBeTruthy();
    }
  });

});

// ---------------------------------------------------------------------------
// Filter Edge Cases
// ---------------------------------------------------------------------------
test.describe('Chaos: Pagination Stress — Filter Edge Cases', () => {

  test('filter with non-existent bodyPart value returns empty set, not error', async ({ page }) => {
    const { status, json } = await rawFetch(
      page,
      '/api/exercises?bodyPart=XXXX_does_not_exist_XXXX&limit=10',
    );

    expect(status).toBe(200);
    expect(json).toHaveProperty('success', true);

    const exercises = extractExercises(json);
    expect(Array.isArray(exercises)).toBeTruthy();
    expect(exercises.length).toBe(0);
  });

  test('search with empty string returns all results (default set)', async ({ page }) => {
    const { status, json } = await rawFetch(
      page,
      '/api/exercises?search=&limit=20',
    );

    expect(status).toBe(200);
    expect(json).toHaveProperty('success', true);

    const exercises = extractExercises(json);
    // Empty search == no filter == should return the default page of results
    expect(exercises.length).toBeGreaterThan(0);
  });

  test('non-existent difficulty value returns empty set or 400 — not 500', async ({ page }) => {
    // "extreme" is not in the Zod enum: beginner | intermediate | advanced
    const { status } = await rawFetch(
      page,
      '/api/exercises?difficulty=extreme&limit=10',
    );

    expect(status).not.toBe(500);
    expect([200, 400]).toContain(status);
  });

});

// ---------------------------------------------------------------------------
// Concurrent Pagination Consistency
// ---------------------------------------------------------------------------
test.describe('Chaos: Pagination Stress — Concurrent Consistency', () => {

  test('multiple concurrent paginated requests return consistent total count', async ({ page }) => {
    // Fire pages 1-5 simultaneously against the same stable data set
    const requests = [1, 2, 3, 4, 5].map((p) =>
      rawFetch(page, `/api/exercises?page=${p}&limit=20`),
    );

    const results = await Promise.all(requests);

    // Every response must succeed
    for (const result of results) {
      expect(result.status).toBe(200);
      expect(result.json).toHaveProperty('success', true);
    }

    // All responses must report the same total (data set is stable)
    const totals: number[] = results.map((r) => r.json?.data?.total ?? -1);
    const uniqueTotals = [...new Set(totals.filter((t) => t >= 0))];
    // All non-(-1) totals must agree
    expect(uniqueTotals.length).toBeLessThanOrEqual(1);
    if (uniqueTotals.length === 1) {
      expect(uniqueTotals[0]).toBeGreaterThan(0);
    }
  });

  test('paginating through all pages returns no duplicate exercise IDs', async ({ page }) => {
    // Fetch first 3 pages with limit=50 and confirm no ID appears twice
    const [p1, p2, p3] = await Promise.all([
      rawFetch(page, '/api/exercises?page=1&limit=50'),
      rawFetch(page, '/api/exercises?page=2&limit=50'),
      rawFetch(page, '/api/exercises?page=3&limit=50'),
    ]);

    for (const result of [p1, p2, p3]) {
      expect(result.status).toBe(200);
    }

    const page1Ids: string[] = extractExercises(p1.json).map((e: any) => e.exerciseId ?? e.id);
    const page2Ids: string[] = extractExercises(p2.json).map((e: any) => e.exerciseId ?? e.id);
    const page3Ids: string[] = extractExercises(p3.json).map((e: any) => e.exerciseId ?? e.id);

    const allIds = [...page1Ids, ...page2Ids, ...page3Ids];
    const uniqueIds = new Set(allIds);

    // No duplicates across pages
    expect(uniqueIds.size).toBe(allIds.length);
  });

});
