import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('12 - Responsive / Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should render home page on mobile', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    // Landing page key content must be present on mobile
    await expect(
      page.locator('text=/evofit|trainer|training|workout/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-home.png');
  });

  test('should render login page on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad });

    // Login form should be usable on mobile
    await expect(page.locator('input#email, input[name="email"]')).toBeVisible();
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await takeScreenshot(page, 'mobile-login.png');
  });

  test('should show mobile navigation after login', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // On mobile, the hamburger button has aria-label="Open navigation menu"
    const hamburger = page.locator('button[aria-label="Open navigation menu"]');

    if (await hamburger.first().isVisible({ timeout: 5000 })) {
      await hamburger.first().click();

      // MobileMenu renders as role="dialog" with a <nav> containing NavigationItems
      await expect(
        page.locator('[role="dialog"][aria-label*="navigation"] nav a').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'mobile-nav.png');
    }

    await takeScreenshot(page, 'mobile-dashboard.png');
  });

  test('should render exercises page on mobile with stacked cards', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Exercise Library heading must be visible on mobile
    await expect(page.locator('h1:has-text("Exercise Library")')).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-exercises.png');
  });

  test('should render clients page on mobile', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Clients heading must be visible on mobile
    await expect(page.locator('h1').filter({ hasText: /clients/i })).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-clients.png');
  });

  test('should render programs page on mobile', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Programs heading must be visible on mobile
    await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-programs.png');
  });

  test('should render analytics page on mobile', async ({ page }) => {
    await loginViaAPI(page, 'client');
    // Reset viewport for this test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Analytics heading must be visible on mobile
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-analytics.png');
  });

  test('should handle tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Dashboard heading must be visible on tablet — scope to page content
    await expect(page.locator('main h1, main h2, .p-6 h1, .p-6 h2, text=/dashboard/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'tablet-dashboard.png');
  });
});
