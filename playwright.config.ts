import { defineConfig, devices } from '@playwright/test';

/**
 * EvoFitTrainer Playwright Configuration
 *
 * Dual-environment support:
 *   - Default: http://localhost:3000 (local dev)
 *   - Production: E2E_BASE_URL=https://trainer.evofit.io npx playwright test
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Allow 2 retries for production runs to handle Neon free-tier cold-start/rate-limit issues
  retries: process.env.CI ? 2 : (process.env.E2E_BASE_URL ? 2 : 0),
  // Limit workers for production runs to avoid overwhelming Neon free-tier DB (cold-start issue)
  workers: process.env.CI ? 1 : (process.env.E2E_BASE_URL ? 2 : undefined),
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    // Block service worker: the app's SW does cache-first for .js files and
    // intermittently serves stale 404 HTML for Next.js dev chunks, breaking
    // client-side hydration (buttons become non-interactive).
    serviceWorkers: 'block',
  },
  outputDir: 'test-results/e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Increase timeout for production runs (Neon cold-start + retry backoff)
  timeout: process.env.E2E_BASE_URL ? 120 * 1000 : 90 * 1000,
  expect: {
    timeout: 10000,
  },
});
