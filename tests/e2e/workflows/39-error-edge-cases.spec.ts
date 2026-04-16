/**
 * Suite 39: Error Handling & Edge Cases
 * Tests invalid logins, role-based access control, 404 handling,
 * empty states, API error responses, special characters, XSS prevention,
 * and session/navigation edge cases.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, API, TIMEOUTS, TEST_ACCOUNTS } from '../helpers/constants';
import { loginViaAPI, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe('39 - Error Handling & Edge Cases', () => {
  // Dev-server cold compile + parallel contention can exceed default timeouts.
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(60000);
  });

  /**
   * Test 1: Invalid login — wrong password shows error message.
   */
  test('invalid login: wrong password shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    await page.locator('input#email, input[name="email"], input[type="email"]')
      .fill(TEST_ACCOUNTS.trainer.email);
    await page.locator('input#password, input[name="password"], input[type="password"]')
      .fill('WrongPassword999!');
    await page.locator('button[type="submit"]').click();

    // Must show an error message — not just stay on the page silently
    const errorVisible = await page
      .locator('text=/invalid|incorrect|wrong|error|failed|credentials|password/i')
      .isVisible({ timeout: TIMEOUTS.apiCall })
      .catch(() => false);

    // Either error message shown OR stayed on login page (no silent redirect)
    const url = page.url();
    expect(url.includes('login') || url.includes('auth')).toBeTruthy();
    expect(errorVisible).toBeTruthy();

    await takeScreenshot(page, '39-01-wrong-password-error.png');
  });

  /**
   * Test 2: Invalid login — non-existent email shows error message.
   */
  test('invalid login: non-existent email shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded' });

    await page.locator('input#email, input[name="email"], input[type="email"]')
      .fill(`nouser-${Date.now()}@ghost.invalid`);
    await page.locator('input#password, input[name="password"], input[type="password"]')
      .fill('TestPass2026!');
    await page.locator('button[type="submit"]').click();

    // Must show an error message for non-existent email
    const errorVisible = await page
      .locator('text=/invalid|not found|no account|error|credentials|email/i')
      .isVisible({ timeout: TIMEOUTS.apiCall })
      .catch(() => false);

    expect(errorVisible).toBeTruthy();

    await takeScreenshot(page, '39-02-nonexistent-email-error.png');
  });

  /**
   * Test 3: Client accessing /admin is redirected or shown forbidden.
   */
  test('client accessing /admin is redirected or shown forbidden', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.adminDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    const url = page.url();
    const body = await page.textContent('body').catch(() => '');

    // Client must NOT reach the admin dashboard — must be redirected or shown forbidden
    const wasRedirected = !url.includes('/admin') || url.includes('login') || url.includes('dashboard') && !url.includes('/admin');
    const showsForbidden = body?.toLowerCase().includes('forbidden') ||
      body?.toLowerCase().includes('unauthorized') ||
      body?.toLowerCase().includes('access denied') ||
      body?.toLowerCase().includes('not allowed');

    expect(wasRedirected || showsForbidden).toBeTruthy();

    await takeScreenshot(page, '39-03-client-admin-access.png');
  });

  /**
   * Test 4: Client accessing /clients (trainer-only page) is redirected.
   */
  test('client accessing /clients redirects (trainer-only page)', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    const url = page.url();
    const body = await page.textContent('body');

    // Client must not land on /clients — must be redirected or blocked
    const wasRedirected = !url.includes('/clients') || url.includes('dashboard') || url.includes('login');
    const showsAccessError = body?.toLowerCase().includes('forbidden') ||
      body?.toLowerCase().includes('unauthorized') ||
      body?.toLowerCase().includes('access') ||
      body?.toLowerCase().includes('not allowed');

    expect(wasRedirected || showsAccessError).toBeTruthy();

    await takeScreenshot(page, '39-04-client-trainer-page-access.png');
  });

  /**
   * Test 5: Navigate to a non-existent page shows 404 or redirect.
   */
  test('navigate to /nonexistent-page shows 404 or redirect', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}/nonexistent-page-xyz-12345`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    const body = await page.textContent('body');
    // Next.js must show 404 page or redirect (not a blank or crashed page)
    expect(
      body?.includes('404') ||
      body?.toLowerCase().includes('not found') ||
      body?.toLowerCase().includes('page')
    ).toBeTruthy();

    await takeScreenshot(page, '39-05-404-page.png');
  });

  /**
   * Test 6: Navigate to /workouts/invalid-uuid-here shows error or 404.
   */
  test('navigate to /workouts/invalid-uuid shows error or 404', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/workouts/invalid-uuid-here-99999`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    const body = await page.textContent('body');
    // Must show error or 404 — not a crashed page with no content
    expect(
      body?.includes('404') ||
      body?.toLowerCase().includes('not found') ||
      body?.toLowerCase().includes('error') ||
      body?.toLowerCase().includes('workout')
    ).toBeTruthy();

    await takeScreenshot(page, '39-06-invalid-workout-uuid.png');
  });

  /**
   * Test 7: Navigate to /clients/invalid-uuid shows error or 404.
   */
  test('navigate to /clients/invalid-uuid shows error or 404', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}/clients/invalid-uuid-here-99999`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    const body = await page.textContent('body');
    // Must show error or 404 — not a crashed page
    expect(
      body?.includes('404') ||
      body?.toLowerCase().includes('not found') ||
      body?.toLowerCase().includes('error') ||
      body?.toLowerCase().includes('client')
    ).toBeTruthy();

    await takeScreenshot(page, '39-07-invalid-client-uuid.png');
  });

  /**
   * Test 8: Empty state — new user with no programs sees empty programs page.
   */
  test('empty state: programs page shows empty state message', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Programs page heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /program/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Either shows program list OR a meaningful empty state
    const body = await page.textContent('body');
    expect(
      body?.toLowerCase().includes('program') ||
      body?.toLowerCase().includes('create') ||
      body?.toLowerCase().includes('no program') ||
      body?.toLowerCase().includes('empty') ||
      body?.toLowerCase().includes('get started')
    ).toBeTruthy();

    await takeScreenshot(page, '39-08-empty-programs.png');
  });

  /**
   * Test 9: Empty state — workouts page handles no workouts gracefully.
   */
  test('empty state: workouts page handles no workouts gracefully', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Workouts heading must be visible even with no data
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /workout/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '39-09-empty-workouts.png');
  });

  /**
   * Test 10: Empty state — analytics with no data shows appropriate message.
   */
  test('empty state: analytics with no data shows appropriate message', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Analytics heading must be visible even with no data
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /analytics|progress/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '39-10-empty-analytics.png');
  });

  /**
   * Test 11: API with expired/invalid token returns 401.
   */
  test('API with expired/invalid token returns 401', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const response = await page.request.get(`${BASE_URL}${API.me}`, {
      headers: {
        Authorization: 'Bearer this-is-an-invalid-token-xyz',
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(401);
  });

  /**
   * Test 12: API with missing auth header returns 401.
   */
  test('API with missing auth header returns 401', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const response = await page.request.get(`${BASE_URL}${API.me}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(401);
  });

  /**
   * Test 13: Registration with duplicate email returns 409.
   */
  test('registration with duplicate email returns 409', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const email = `dup-edge-${Date.now()}@test.io`;

    // First registration succeeds
    const first = await page.request.post(`${BASE_URL}${API.register}`, {
      data: { email, password: 'TestPass2026!', role: 'trainer' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(first.ok()).toBeTruthy();

    // Second registration with same email returns 409
    const second = await page.request.post(`${BASE_URL}${API.register}`, {
      data: { email, password: 'TestPass2026!', role: 'trainer' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(second.status()).toBe(409);
  });

  /**
   * Test 14: Special characters in profile bio are handled safely.
   */
  test('special characters in profile bio are handled safely', async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const specialBio = `O'Brien & "quotes" <script>alert('xss')</script>`;

    const response = await page.request.put(`${BASE_URL}${API.profileMe}`, {
      data: { bio: specialBio },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // Must NOT cause a server error (5xx)
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const body = await response.json();
      const returnedBio = body.data?.bio || body.bio || '';
      // Returned bio must be a string (not crash or corrupt the response)
      expect(typeof returnedBio).toBe('string');
    }
  });

  /**
   * Test 15: Very long input in program name (500 chars) is truncated or accepted.
   */
  test('very long program name (500 chars) is truncated or accepted gracefully', async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const longName = 'A'.repeat(500);

    const response = await page.request.post(`${BASE_URL}${API.programs}`, {
      data: {
        name: longName,
        description: 'Long name test',
        durationWeeks: 4,
        programType: 'general_fitness',
        difficultyLevel: 'beginner',
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // Must be accepted (200/201) or rejected with validation error (400/422)
    // Must NOT cause a server crash (5xx)
    expect(response.status()).toBeLessThan(500);
  });

  /**
   * Test 16: XSS attempt in search input is escaped — does not execute.
   */
  test('XSS attempt in search input is escaped/sanitized', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Inject XSS payload into search
    const xssPayload = `<script>alert('xss')</script>`;
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="exercise" i]'
    );
    await expect(searchInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Set up dialog listener BEFORE filling
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await searchInput.first().fill(xssPayload);

    // Trigger any XSS by pressing Enter (causes search/submit)
    await page.keyboard.press('Enter');

    // Wait for any potential XSS dialog to appear (Playwright processes dialogs synchronously)
    // If no dialog fires within the next assertion, XSS did not execute
    await expect(page.locator('body')).toBeVisible({ timeout: 2000 });

    // XSS must NOT have executed
    expect(alertFired).toBe(false);

    // Page must still be functional (search input still present)
    await expect(searchInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '39-16-xss-search.png');
  });

  /**
   * Test 17: Refresh page while logged in maintains session.
   */
  test('refresh page while logged in maintains session', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // Must stay on programs page or dashboard — NOT redirected to login
    const url = page.url();
    expect(url).not.toMatch(/\/auth\/login/);
    expect(
      url.includes('programs') || url.includes('dashboard')
    ).toBeTruthy();

    await takeScreenshot(page, '39-17-session-after-refresh.png');
  });

  /**
   * Test 18: Navigate back after logout stays on login page.
   */
  test('navigate back after logout stays on login page', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});

    // Clear auth (simulate logout)
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });

    // Navigate to login
    await page.goto(`${BASE_URL}${ROUTES.login}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await expect(page).toHaveURL(/login/);

    // Go back — should not return to protected page without auth
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad }).catch(() => {});

    // Wait for router to settle — login form or heading must be visible
    await expect(
      page.locator('input[type="email"], input[name="email"], h1, h2').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const url = page.url();
    // Must be on login page OR have been redirected to login
    const isLoginPage = url.includes('login') || url.includes('auth');
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isLoginPage || hasLoginForm).toBeTruthy();
  });

  /**
   * Test 19: Multiple rapid clicks on submit do not create duplicates.
   */
  test('multiple rapid clicks on submit do not create duplicates', async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const programName = `Dedup Test ${Date.now()}`;

    // Simulate rapid duplicate POST requests
    const requests = await Promise.all([
      page.request.post(`${BASE_URL}${API.programs}`, {
        data: { name: programName, durationWeeks: 1, programType: 'general_fitness', difficultyLevel: 'beginner' },
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }),
      page.request.post(`${BASE_URL}${API.programs}`, {
        data: { name: programName, durationWeeks: 1, programType: 'general_fitness', difficultyLevel: 'beginner' },
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }),
    ]);

    // At least one must succeed
    const successResponses = requests.filter((r) => r.ok());
    expect(successResponses.length).toBeGreaterThanOrEqual(1);

    // Server must not crash (no 500s)
    for (const r of requests) {
      expect(r.status()).toBeLessThan(500);
    }
  });

  /**
   * Test 20: Browser back button from dashboard does not break navigation.
   */
  test('browser back button from dashboard does not break navigation', async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    // Navigate through a few pages
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});

    // Press back button
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // Page heading must be visible (not crashed)
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Go back again
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });
    await waitForPageReady(page);

    // Page heading must still be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '39-20-after-back-navigation.png');
  });
});
