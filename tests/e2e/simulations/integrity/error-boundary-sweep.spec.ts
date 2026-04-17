/**
 * FORGE QA Warfare v4 — Error Boundary Sweep
 *
 * Visits every trainer-accessible, client-accessible, and admin-accessible route
 * and asserts that:
 *   1. No error boundary or crash-state text is present in the main content area.
 *   2. No raw JS serialisation artefacts ([object Object], NaN) are rendered.
 *   3. No uncaught JS exceptions occurred during the navigation.
 *
 * Each route × role combination is its own test so failures are granular.
 *
 * Accounts used:
 *   Trainer : qa-enterprise@evofit.io  / QaTest2026!
 *   Client  : qa-client@evofit.io      / QaTest2026!
 *   Admin   : qa-admin@evofit.io       / QaTest2026!
 *
 * These are the same QA accounts seeded by tests/e2e/global-setup.ts.
 */

import { test, expect } from '@playwright/test';
import { BaseActor, ActorCredentials } from '../actors/base-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// QA credentials — deliberately separate from SIM_ACCOUNTS so this suite
// uses the fully-seeded QA world (programs, clients, appointments, etc.)
// ---------------------------------------------------------------------------
const QA_TRAINER: ActorCredentials = {
  email: 'qa-enterprise@evofit.io',
  password: 'QaTest2026!',
  role: 'trainer',
};

const QA_CLIENT: ActorCredentials = {
  email: 'qa-client@evofit.io',
  password: 'QaTest2026!',
  role: 'client',
};

const QA_ADMIN: ActorCredentials = {
  email: 'qa-admin@evofit.io',
  password: 'QaTest2026!',
  role: 'admin',
};

// ---------------------------------------------------------------------------
// Routes under test
// ---------------------------------------------------------------------------
const TRAINER_ROUTES: string[] = [
  '/dashboard/trainer',
  '/clients',
  '/programs',
  '/exercises',
  '/workouts',
  '/analytics',
  '/schedule',
  '/profile',
  '/profile/edit',
  '/profile/health',
];

const CLIENT_ROUTES: string[] = [
  '/dashboard/client',
  '/programs',
  '/exercises',
  '/workouts',
  '/analytics',
  '/profile',
  '/profile/edit',
  '/profile/health',
];

const ADMIN_ROUTES: string[] = [
  '/dashboard/admin',
  '/admin',
  '/admin/users',
  '/admin/bugs',
  '/admin/system',
];

// ---------------------------------------------------------------------------
// Shared helper: navigate and wait for spinners to clear
// ---------------------------------------------------------------------------
/**
 * Navigate to a route, wait for domcontentloaded, then wait up to 30 s for
 * any visible loading spinners to disappear (accommodates Neon cold-start).
 * If spinners never clear we proceed anyway — a blank/timeout page will still
 * be caught by the error-boundary and render-bug assertions.
 */
async function navigateAndSettle(actor: BaseActor, route: string): Promise<void> {
  const page = (actor as any).page;

  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // Wait for loading spinners to clear (generous timeout for Neon cold-start)
  await page
    .waitForFunction(
      () => document.querySelectorAll('.animate-spin').length === 0,
      { timeout: 30_000 },
    )
    .catch(() => {
      // Best-effort — don't fail the test solely because a spinner persisted
    });

  // Additional small wait for React hydration on slow pages
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Trainer — Error Boundary Sweep
// ---------------------------------------------------------------------------
test.describe('Error Boundary Sweep — Trainer routes', () => {
  for (const route of TRAINER_ROUTES) {
    test(`No error boundary on ${route} (trainer)`, async ({ page }) => {
      const actor = new BaseActor(page, QA_TRAINER);
      await actor.login();
      await navigateAndSettle(actor, route);
      await actor.assertNoErrorBoundary();
      await actor.assertNoRenderBugs();

      const jsErrors = actor.getConsoleErrors();
      expect(
        jsErrors,
        `Uncaught JS errors on ${route} (trainer): ${jsErrors.join(' | ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Client — Error Boundary Sweep
// ---------------------------------------------------------------------------
test.describe('Error Boundary Sweep — Client routes', () => {
  for (const route of CLIENT_ROUTES) {
    test(`No error boundary on ${route} (client)`, async ({ page }) => {
      const actor = new BaseActor(page, QA_CLIENT);
      await actor.login();
      await navigateAndSettle(actor, route);
      await actor.assertNoErrorBoundary();
      await actor.assertNoRenderBugs();

      const jsErrors = actor.getConsoleErrors();
      expect(
        jsErrors,
        `Uncaught JS errors on ${route} (client): ${jsErrors.join(' | ')}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Admin — Error Boundary Sweep
// ---------------------------------------------------------------------------
test.describe('Error Boundary Sweep — Admin routes', () => {
  for (const route of ADMIN_ROUTES) {
    test(`No error boundary on ${route} (admin)`, async ({ page }) => {
      const actor = new BaseActor(page, QA_ADMIN);
      await actor.login();
      await navigateAndSettle(actor, route);
      await actor.assertNoErrorBoundary();
      await actor.assertNoRenderBugs();

      const jsErrors = actor.getConsoleErrors();
      expect(
        jsErrors,
        `Uncaught JS errors on ${route} (admin): ${jsErrors.join(' | ')}`,
      ).toHaveLength(0);
    });
  }
});
