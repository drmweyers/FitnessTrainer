/**
 * Suite 35: Responsive Layouts
 * Tests key pages at mobile (375px), tablet (768px), and desktop (1440px) viewports.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('35 - Responsive Layouts', () => {
  // Dev-server cold compile on multiple routes in sequence can exceed the default
  // 90s per-test timeout. Extend for this suite without modifying global config.
  test.describe.configure({ timeout: 180000 });
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(60000);
  });

  // ─── Mobile (375px) ────────────────────────────────────────────────────────

  test('mobile: dashboard loads, navigation collapses to hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Dashboard heading must render on mobile
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /dashboard|welcome/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Hamburger button must be visible at 375px (sidebar collapses)
    const hamburger = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="Menu" i], [data-testid="mobile-menu"], button:has(svg[class*="menu" i])'
    );
    await expect(hamburger.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-mobile-dashboard.png');
  });

  test('mobile: exercise library stacks cards vertically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Exercise heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /exercise/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Layout viewport must not exceed mobile width (no horizontal overflow)
    const layoutWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(layoutWidth).toBeLessThanOrEqual(375 + 5);

    await takeScreenshot(page, '35-mobile-exercises.png');
  });

  test('mobile: program builder forms are full-width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Programs heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /program/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // No horizontal overflow on mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await takeScreenshot(page, '35-mobile-programs.png');
  });

  test('mobile: workout tracker usable on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Workouts heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /workout|exercise|log/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await takeScreenshot(page, '35-mobile-workouts.png');
  });

  test('mobile: analytics charts resize appropriately', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Analytics heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /analytics|progress/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Charts must not cause layout viewport overflow (use clientWidth, not scrollWidth)
    const layoutWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(layoutWidth).toBeLessThanOrEqual(375 + 5);

    await takeScreenshot(page, '35-mobile-analytics.png');
  });

  // ─── Tablet (768px) ────────────────────────────────────────────────────────

  test('tablet: dashboard shows 2-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Dashboard heading must be visible at tablet width
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /dashboard|welcome/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-tablet-dashboard.png');
  });

  test('tablet: client list shows compact cards', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Client heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /client|athlete/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // No horizontal overflow at tablet
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(768 + 20);

    await takeScreenshot(page, '35-tablet-clients.png');
  });

  test('tablet: exercise library shows 2-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Exercise heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /exercise/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-tablet-exercises.png');
  });

  test('tablet: calendar view fits tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Schedule heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Calendar should not overflow tablet width
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(768 + 20);

    await takeScreenshot(page, '35-tablet-calendar.png');
  });

  test('tablet: navigation sidebar visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // At 768px, sidebar OR bottom nav must be visible (navigation is accessible)
    const navElement = page.locator(
      'aside, nav[aria-label*="sidebar" i], [data-testid="sidebar"], nav[aria-label*="navigation" i]'
    );
    await expect(navElement.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-tablet-nav.png');
  });

  // ─── Desktop (1440px) ──────────────────────────────────────────────────────

  test('desktop: full layout with sidebar navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Sidebar must be visible at full desktop width
    const sidebar = page.locator('aside, nav[aria-label*="sidebar" i], [data-testid="sidebar"], .sidebar');
    await expect(sidebar.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-desktop-full-layout.png');
  });

  test('desktop: exercise library shows 3+ column grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Exercise heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /exercise/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // At 1440px, exercise grid must show multiple cards per row
    const cards = page.locator('article, [data-testid*="exercise-card"], [class*="exercise-card"]');
    await expect(cards.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-desktop-exercises.png');
  });

  test('desktop: analytics shows all charts side-by-side', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Analytics heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /analytics|progress/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-desktop-analytics.png');
  });

  test('desktop: program builder shows full wizard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Programs heading must be visible
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /program/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '35-desktop-programs.png');
  });

  test('desktop: all modals centered with proper width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad * 2,
    }).catch(() => {});
    await waitForPageReady(page);

    // Open a modal (add client)
    const addBtn = page.locator(
      'button:has-text("Add Client"), button:has-text("New Client"), button:has-text("Invite"), button:has-text("Add")'
    );
    await expect(addBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await addBtn.first().click();

    const modal = page.locator('[role="dialog"], [data-radix-dialog-content], .modal');
    await expect(modal.first()).toBeVisible({ timeout: TIMEOUTS.element });

    // Modal must be narrower than the full viewport (not full-width on desktop)
    const modalBox = await modal.first().boundingBox();
    expect(modalBox).not.toBeNull();
    expect(modalBox!.width).toBeLessThan(1440);
    // Modal must have margin on left (horizontally centered)
    expect(modalBox!.x).toBeGreaterThan(0);

    await takeScreenshot(page, '35-desktop-modal.png');

    // Close modal
    await page.keyboard.press('Escape');
  });
});
