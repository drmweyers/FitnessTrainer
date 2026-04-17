/**
 * FORGE QA Warfare v4 — Phase 2A: Profile Data Rendering
 *
 * Asserts that seeded profile data for the enterprise trainer and QA client
 * actually renders on screen. These are positive data assertions — if the seed
 * ran successfully the values must appear; a missing value indicates a fetch
 * regression, a rendering bug, or a lost seed.
 *
 * Seeded values asserted here (from scripts/seed-enterprise-full.ts):
 *   Trainer (qa-enterprise@evofit.io):
 *     - bio contains "NASM-certified"
 *     - phone "+27821234567"
 *     - gender "male" (shown as "Male" in select)
 *     - 3 certifications: NASM CPT, CSCS, Precision Nutrition L1
 *
 *   Client (qa-client@evofit.io):
 *     - bio contains "recreational runner"
 *     - health page: blood type select pre-populated with "O+"
 *
 * Accounts:
 *   Trainer : qa-enterprise@evofit.io / QaTest2026!
 *   Client  : qa-client@evofit.io     / QaTest2026!
 */

import { test, expect } from '@playwright/test';
import { BaseActor, ActorCredentials } from '../actors/base-actor';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

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

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to a route and wait generously for Neon cold-start + React hydration.
 * Spinner wait is best-effort; assertions run regardless.
 */
async function navigateAndSettle(actor: BaseActor, route: string): Promise<void> {
  const page = (actor as any).page;

  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // Wait for loading spinners to clear (Neon cold-start can take ~10 s)
  await page
    .waitForFunction(
      () => document.querySelectorAll('.animate-spin').length === 0,
      { timeout: 30_000 },
    )
    .catch(() => {});

  // Small grace period for React state hydration
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Trainer — /profile (read-only view)
// ---------------------------------------------------------------------------
test.describe('Profile Data Rendering — Trainer /profile', () => {
  test('Trainer profile page loads without error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Trainer profile shows email in header', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    // The profile header always shows the user's email
    await expect(
      page.getByText('qa-enterprise@evofit.io', { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Trainer profile shows bio containing "NASM-certified"', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    // Bio is rendered in the Personal Information card
    await expect(page.getByText(/NASM-certified/i)).toBeVisible({ timeout: 15_000 });
  });

  test('Trainer profile shows phone number +27821234567', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    await expect(page.getByText('+27821234567', { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Trainer profile shows role badge "trainer"', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    await expect(page.getByText(/trainer/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Trainer — /profile/edit (form pre-population)
// ---------------------------------------------------------------------------
test.describe('Profile Data Rendering — Trainer /profile/edit', () => {
  test('Profile edit page loads without error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Bio textarea is pre-populated with seeded bio', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    const bioField = page.locator('#bio, textarea[id="bio"]');
    await expect(bioField).toBeVisible({ timeout: 15_000 });
    const value = await bioField.inputValue();
    expect(value).toMatch(/NASM-certified/i);
  });

  test('Phone input is pre-populated with seeded phone', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    const phoneField = page.locator('#phone, input[id="phone"]');
    await expect(phoneField).toBeVisible({ timeout: 15_000 });
    const value = await phoneField.inputValue();
    expect(value).toBe('+27821234567');
  });

  test('Gender select is pre-populated with "male"', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    const genderSelect = page.locator('#gender, select[id="gender"]');
    await expect(genderSelect).toBeVisible({ timeout: 15_000 });
    const value = await genderSelect.inputValue();
    expect(value.toLowerCase()).toBe('male');
  });

  test('Certifications section is visible for trainer', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    await expect(page.getByText('Certifications', { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Certifications list shows NASM CPT entry', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    // Wait for certs to load (separate fetch from profile)
    await expect(page.getByText(/NASM Certified Personal Trainer/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test('Certifications list shows CSCS entry', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    await expect(
      page.getByText(/Certified Strength and Conditioning Specialist|CSCS/i),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('Certifications list shows Precision Nutrition entry', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    await expect(page.getByText(/Precision Nutrition/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test('At least 3 certification cards are rendered', async ({ page }) => {
    const actor = new BaseActor(page, QA_TRAINER);
    await actor.login();
    await navigateAndSettle(actor, '/profile/edit');

    // Wait for any certification entry to appear first
    await expect(page.getByText(/NASM Certified Personal Trainer/i)).toBeVisible({
      timeout: 20_000,
    });

    // Each cert row is rendered inside a bg-gray-50 rounded-lg container
    const certRows = page.locator('.bg-gray-50.rounded-lg');
    const count = await certRows.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Client — /profile (read-only view)
// ---------------------------------------------------------------------------
test.describe('Profile Data Rendering — Client /profile', () => {
  test('Client profile page loads without error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Client profile shows client email', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    await expect(
      page.getByText('qa-client@evofit.io', { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Client profile shows bio containing "recreational runner"', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile');
    await expect(page.getByText(/recreational runner/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Client — /profile/health (blood type pre-populated)
// ---------------------------------------------------------------------------
test.describe('Profile Data Rendering — Client /profile/health', () => {
  test('Health page loads without error boundary', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile/health');
    await actor.assertNoErrorBoundary();
    await actor.assertNoRenderBugs();
  });

  test('Blood type select is pre-populated with "O+"', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile/health');

    const bloodTypeSelect = page.locator('#bloodType, select[id="bloodType"]');
    await expect(bloodTypeSelect).toBeVisible({ timeout: 15_000 });
    const value = await bloodTypeSelect.inputValue();
    expect(value).toBe('O+');
  });

  test('Medical conditions textarea contains "mild asthma"', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile/health');

    const medField = page.locator('#medicalConditions, textarea[id="medicalConditions"]');
    await expect(medField).toBeVisible({ timeout: 15_000 });
    const value = await medField.inputValue();
    expect(value.toLowerCase()).toContain('mild asthma');
  });

  test('Allergies textarea contains "penicillin"', async ({ page }) => {
    const actor = new BaseActor(page, QA_CLIENT);
    await actor.login();
    await navigateAndSettle(actor, '/profile/health');

    const allergiesField = page.locator('#allergies, textarea[id="allergies"]');
    await expect(allergiesField).toBeVisible({ timeout: 15_000 });
    const value = await allergiesField.inputValue();
    expect(value.toLowerCase()).toContain('penicillin');
  });
});
