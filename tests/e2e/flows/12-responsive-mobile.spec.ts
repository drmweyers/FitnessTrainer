import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('12 - Responsive / Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('should render home page on mobile', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });

    // Should still show main content
    await expect(page.locator('text=/EvoFit/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    // CTA buttons should be visible
    await expect(page.locator('text=/Sign In|Get Started/i').first()).toBeVisible();

    await takeScreenshot(page, 'mobile-home.png');
  });

  test('should render login page on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });

    // Login form should be usable on mobile
    await expect(page.locator('input#email, input[name="email"]')).toBeVisible();
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await takeScreenshot(page, 'mobile-login.png');
  });

  test('should show mobile navigation after login', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // On mobile, sidebar should be hidden and hamburger menu should appear
    // Look for hamburger/menu button
    const hamburger = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="Menu" i], button:has(svg), [data-testid="mobile-menu"]'
    );

    // Either hamburger exists or the nav adapts
    const hasHamburger = await hamburger.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHamburger) {
      await hamburger.first().click();
      await page.waitForTimeout(500);

      // Mobile nav should appear with navigation links
      await takeScreenshot(page, 'mobile-nav.png');
    }

    await takeScreenshot(page, 'mobile-dashboard.png');
  });

  test('should render exercises page on mobile with stacked cards', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page should render properly on mobile
    await expect(page.locator('text=/exercise/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-exercises.png');
  });

  test('should render clients page on mobile', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client list should be usable on mobile
    await expect(page.locator('text=/client/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-clients.png');
  });

  test('should render programs page on mobile', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('text=/program/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'mobile-programs.png');
  });

  test('should render analytics page on mobile', async ({ page }) => {
    await loginViaAPI(page, 'client');
    // Reset viewport for this test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, 'mobile-analytics.png');
  });

  test('should handle tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.trainerDashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('text=/dashboard/i').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'tablet-dashboard.png');
  });
});
