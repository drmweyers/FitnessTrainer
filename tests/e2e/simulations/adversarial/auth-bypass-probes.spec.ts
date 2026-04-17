/**
 * FORGE QA Warfare — Auth Bypass Probes
 *
 * Tests that the authentication layer correctly rejects all bypass attempts:
 * invalid tokens, missing headers, injection, mass-assignment, enumeration, etc.
 *
 * All probes use raw page.request.fetch to inspect HTTP status codes directly
 * without BaseActor's 4xx-throw behaviour masking the result.
 */

import { test, expect } from '@playwright/test';
import { BaseActor, SIM_ACCOUNTS } from '../actors/base-actor';
import { ClientActor } from '../actors/client-actor';
import { TrainerActor } from '../actors/trainer-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

/** Perform a raw HTTP request without any actor abstraction. */
async function rawRequest(
  page: import('@playwright/test').Page,
  method: string,
  path: string,
  options?: {
    headers?: Record<string, string>;
    body?: Record<string, unknown> | string;
  },
): Promise<{ status: number; json: any; text: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  let data: string | undefined;
  if (options?.body !== undefined) {
    data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await page.request.fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    data,
  });

  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status(), json, text };
}

// ---------------------------------------------------------------------------
// Suite 1: Invalid / missing JWT tokens
// ---------------------------------------------------------------------------
test.describe('Auth Bypass — Token Validation', () => {

  test('missing Authorization header returns 401 on protected route', async ({ page }) => {
    const result = await rawRequest(page, 'GET', '/api/analytics/measurements');
    expect(result.status).toBe(401);
  });

  test('empty Bearer token returns 401', async ({ page }) => {
    const result = await rawRequest(page, 'GET', '/api/profiles/me', {
      headers: { Authorization: 'Bearer ' },
    });
    expect(result.status).toBe(401);
  });

  test('malformed JWT (random string) returns 401', async ({ page }) => {
    const result = await rawRequest(page, 'GET', '/api/clients', {
      headers: { Authorization: 'Bearer notajwttoken' },
    });
    expect(result.status).toBe(401);
  });

  test('structurally valid but wrong-signature JWT returns 401', async ({ page }) => {
    // Header.payload.wrong-signature — all base64 valid but signature is garbage
    const fakeToken = [
      btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, ''),
      btoa(JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001', role: 'trainer', iat: 9999999999 })).replace(/=/g, ''),
      'invalidsignaturexyz',
    ].join('.');

    const result = await rawRequest(page, 'GET', '/api/clients', {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    expect(result.status).toBe(401);
  });

  test('expired JWT (well-formed, iat in the past) returns 401', async ({ page }) => {
    // Use a real expired-looking token structure (exp in the past)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      userId: '00000000-0000-0000-0000-000000000001',
      role: 'admin',
      iat: 1000000000,
      exp: 1000001000, // expired in year 2001
    })).toString('base64url');
    const fakeToken = `${header}.${payload}.invalidsig`;

    const result = await rawRequest(page, 'GET', '/api/admin/users', {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    expect(result.status).toBe(401);
  });

  test('Authorization with wrong scheme (Basic) returns 401', async ({ page }) => {
    const result = await rawRequest(page, 'GET', '/api/profiles/me', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(result.status).toBe(401);
  });

});

// ---------------------------------------------------------------------------
// Suite 2: Registration edge cases
// ---------------------------------------------------------------------------
test.describe('Auth Bypass — Registration Hardening', () => {

  test('register with existing email returns 409 not 500', async ({ page }) => {
    // Use a known sim account email that already exists
    const result = await rawRequest(page, 'POST', '/api/auth/register', {
      body: {
        email: SIM_ACCOUNTS.client1.email,
        password: 'SomePassword123!',
        role: 'client',
      },
    });
    // Must be 409 Conflict — a 500 means the server crashed on the duplicate
    expect(result.status).toBe(409);
  });

  test('mass assignment: register with role=admin does not create admin account', async ({ page }) => {
    // Use a fresh throwaway address
    const testEmail = `adversarial-mass-assign-${Date.now()}@evofit-test.invalid`;
    const result = await rawRequest(page, 'POST', '/api/auth/register', {
      body: {
        email: testEmail,
        password: 'ValidPass2026!',
        role: 'admin', // <-- attempted privilege escalation
      },
    });

    // Registration may succeed (201) or reject the admin role (400/422)
    if (result.status === 201 || result.status === 200) {
      // If it succeeds, the granted role must NOT be admin
      const grantedRole = result.json?.data?.user?.role ?? result.json?.role;
      expect(grantedRole).not.toBe('admin');
    } else {
      // Any 4xx is an acceptable hard rejection of the admin role attempt
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.status).toBeLessThan(500);
    }
  });

  test('register with invalid email format returns 400', async ({ page }) => {
    const result = await rawRequest(page, 'POST', '/api/auth/register', {
      body: {
        email: 'not-an-email',
        password: 'ValidPass2026!',
        role: 'client',
      },
    });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.status).toBeLessThan(500);
  });

});

// ---------------------------------------------------------------------------
// Suite 3: Login hardening
// ---------------------------------------------------------------------------
test.describe('Auth Bypass — Login Hardening', () => {

  test('login with wrong password returns 401 not 500', async ({ page }) => {
    const result = await rawRequest(page, 'POST', '/api/auth/login', {
      body: {
        email: SIM_ACCOUNTS.client1.email,
        password: 'WrongPassword999!',
      },
    });
    expect(result.status).toBe(401);
  });

  test('SQL injection in login email field is rejected gracefully', async ({ page }) => {
    const result = await rawRequest(page, 'POST', '/api/auth/login', {
      body: {
        email: "' OR 1=1 --",
        password: 'anything',
      },
    });
    // Must not return 200 (successful login) and must not be 500 (server error / SQLi)
    expect(result.status).not.toBe(200);
    expect(result.status).not.toBe(500);
  });

  test('SQL injection in login password field is rejected gracefully', async ({ page }) => {
    const result = await rawRequest(page, 'POST', '/api/auth/login', {
      body: {
        email: SIM_ACCOUNTS.client1.email,
        password: "' OR '1'='1",
      },
    });
    expect(result.status).not.toBe(200);
    expect(result.status).not.toBe(500);
  });

  test('password reset with non-existent email returns 200 or 404 but not user details', async ({ page }) => {
    const result = await rawRequest(page, 'POST', '/api/auth/forgot-password', {
      body: { email: 'ghost-user-who-does-not-exist@evofit-test.invalid' },
    });

    // Should NOT be a 500, should NOT reveal whether the user exists in a different way
    expect(result.status).not.toBe(500);

    // If it returns 200, the body must not contain user-identifying data
    if (result.status === 200) {
      const body = result.text.toLowerCase();
      expect(body).not.toContain('password');
      expect(body).not.toContain('token');
      expect(body).not.toContain('userId');
    }
  });

});

// ---------------------------------------------------------------------------
// Suite 4: XSS & Input Injection in Profile Fields
// ---------------------------------------------------------------------------
test.describe('Auth Bypass — XSS Sanitisation', () => {

  test('XSS payload in profile bio is stored as escaped text, not live script', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const xssPayload = '<script>window.__xss=true</script>';
    // Store the payload in the profile bio
    await client.updateProfile({ bio: xssPayload }).catch(() => {});

    // Navigate to profile page and confirm no script execution
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // If the script tag executed, window.__xss would be true
    const xssExecuted = await page.evaluate(() => !!(window as any).__xss);
    expect(xssExecuted).toBe(false);
  });

  test('XSS payload in profile firstName does not execute as script', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const xssPayload = '<img src=x onerror="window.__xss2=true">';
    await client.updateProfile({ firstName: xssPayload }).catch(() => {});

    await page.goto(`${BASE_URL}/dashboard/client`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const xssExecuted = await page.evaluate(() => !!(window as any).__xss2);
    expect(xssExecuted).toBe(false);
  });

});

// ---------------------------------------------------------------------------
// Suite 5: Internal endpoints
// ---------------------------------------------------------------------------
test.describe('Auth Bypass — Internal Route Hardening', () => {

  test('unauthenticated access to /api/internal/force-verify returns 401 or 403', async ({ page }) => {
    const result = await rawRequest(page, 'POST', '/api/internal/force-verify', {
      body: { email: SIM_ACCOUNTS.client1.email },
    });
    // This endpoint should not be reachable without a privileged token
    expect([401, 403, 404]).toContain(result.status);
  });

  test('client cannot access /api/internal/seed-tier', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const clientPage = (client as any).page;
    const token = client.getToken();
    const res = await clientPage.request.fetch(`${BASE_URL}/api/internal/seed-tier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ tier: 'enterprise' }),
    });
    expect([401, 403, 404]).toContain(res.status());
  });

});
