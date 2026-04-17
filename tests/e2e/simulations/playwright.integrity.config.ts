import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * FORGE QA Warfare v4 — Integrity Pipeline Playwright Configuration
 *
 * Purpose:
 *   Runs only the 3-layer integrity test suite in the
 *   tests/e2e/simulations/integrity/ directory.
 *
 * Layers:
 *   Layer 1 — Error Boundary Sweep   (error-boundary-sweep.spec.ts)
 *   Layer 2 — Rendered Data Assertions (*-data-rendering.spec.ts)
 *   Layer 3 — Data Completeness Verification (*-data-completeness.spec.ts)
 *
 * Usage:
 *   npx playwright test --config tests/e2e/simulations/playwright.integrity.config.ts
 *   E2E_BASE_URL=https://trainer.evofit.io npx playwright test --config tests/e2e/simulations/playwright.integrity.config.ts
 */

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Integrity tests share seeded global state, so they must run sequentially.
// A single worker prevents concurrent DB reads from producing non-deterministic
// ordering that causes phantom failures.
const WORKERS = 1;

// 60 s per test: enough time for Neon free-tier cold-start (~15 s) + page load
// + assertion retries on slower CI runners.
const TIMEOUT_MS = 60_000;

export default defineConfig({
  // Scope strictly to the integrity sub-directory — no other simulations leak in.
  testDir: path.join(__dirname, 'integrity'),

  // Sequential: integrity suites share seeded DB state.
  fullyParallel: false,
  workers: WORKERS,

  // Retry once on CI to absorb flaky network/cold-start without masking real bugs.
  retries: process.env.CI ? 1 : 0,

  // Fail fast in CI if a --forbid-only test.only was accidentally committed.
  forbidOnly: !!process.env.CI,

  // Per-test timeout (ms).
  timeout: TIMEOUT_MS,

  // Assertion timeout — 15 s gives React enough time to hydrate before giving up.
  expect: {
    timeout: 15_000,
  },

  // Dual reporter:
  //   html  → human-readable local report (open with `playwright show-report`)
  //   json  → machine-readable for CI artifact upload / gate scripts
  reporter: [
    ['html', { outputFolder: 'test-results/integrity/html', open: 'never' }],
    ['json', { outputFile: 'test-results/integrity/results.json' }],
    // Line reporter surfaces failures inline during CI log streaming.
    ['line'],
  ],

  // Reuse the same global-setup that seeds the full QA world (accounts,
  // clients, programs, appointments, measurements, goals, favorites).
  globalSetup: path.join(__dirname, '../../global-setup.ts'),

  use: {
    baseURL,

    // Capture evidence on failure — keeps artifact size down on passing runs.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Per-action timeout (ms) — generous enough for Neon cold-start fetches.
    actionTimeout: 30_000,

    // Block the app's service worker so Next.js dev chunks are never served
    // from a stale cache (same fix as the main playwright.config.ts).
    serviceWorkers: 'block',
  },

  // Integrity artifacts land in their own directory so they don't clobber
  // main E2E run output.
  outputDir: 'test-results/integrity/artifacts',

  projects: [
    {
      name: 'integrity-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
