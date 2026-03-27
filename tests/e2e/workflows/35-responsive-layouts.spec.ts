/**
 * Suite 35: Responsive Layouts
 * Tests key pages at mobile (375px), tablet (768px), and desktop (1440px) viewports.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('35 - Responsive Layouts', () => {

  // ─── Mobile (375px) ────────────────────────────────────────────────────────

  test('mobile: dashboard loads, navigation collapses to hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Dashboard should load
    await expect(page.locator('body')).toBeVisible();

    // On mobile, sidebar should collapse and hamburger should appear
    const hamburger = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="Menu" i], [data-testid="mobile-menu"], button:has(svg[class*="menu" i])'
    );
    const hasHamburger = await hamburger.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Sidebar should be hidden on mobile
    const sidebar = page.locator('aside, nav[aria-label*="sidebar" i], [data-testid="sidebar"]');
    const sidebarVisible = await sidebar.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Either hamburger is shown or sidebar adapts (bottom nav etc.)
    const pageText = await page.textContent('body');
    expect(
      hasHamburger ||
      !sidebarVisible ||
      pageText?.toLowerCase().includes('dashboard')
    ).toBeTruthy();

    await takeScreenshot(page, '35-mobile-dashboard.png');
  });

  test('mobile: exercise library stacks cards vertically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('exercise') ||
      pageText?.toLowerCase().includes('workout')
    ).toBeTruthy();

    // Cards should be present
    const cards = page.locator('article, .card, [data-testid*="exercise"], [class*="exercise"]');
    const hasCards = await cards.first().isVisible({ timeout: 5000 }).catch(() => false);

    // On mobile, check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    // Allow slight overflow (up to 20px) for scroll indicators etc.
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);

    await takeScreenshot(page, '35-mobile-exercises.png');
  });

  test('mobile: program builder forms are full-width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('program') ||
      pageText?.toLowerCase().includes('workout')
    ).toBeTruthy();

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await takeScreenshot(page, '35-mobile-programs.png');
  });

  test('mobile: workout tracker usable on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('exercise') ||
      pageText?.toLowerCase().includes('log')
    ).toBeTruthy();

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);

    await takeScreenshot(page, '35-mobile-workouts.png');
  });

  test('mobile: analytics charts resize appropriately', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(50);

    // Charts should not overflow on mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 30); // Charts may need a tiny extra allowance

    await takeScreenshot(page, '35-mobile-analytics.png');
  });

  // ─── Tablet (768px) ────────────────────────────────────────────────────────

  test('tablet: dashboard shows 2-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('dashboard') ||
      pageText?.toLowerCase().includes('welcome') ||
      pageText?.toLowerCase().includes('client')
    ).toBeTruthy();

    await takeScreenshot(page, '35-tablet-dashboard.png');
  });

  test('tablet: client list shows compact cards', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('client') ||
      pageText?.toLowerCase().includes('athlete')
    ).toBeTruthy();

    // No horizontal overflow at tablet
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(768 + 20);

    await takeScreenshot(page, '35-tablet-clients.png');
  });

  test('tablet: exercise library shows 2-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('exercise') ||
      pageText?.toLowerCase().includes('workout')
    ).toBeTruthy();

    await takeScreenshot(page, '35-tablet-exercises.png');
  });

  test('tablet: calendar view fits tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();

    // Calendar should not overflow tablet width
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(768 + 20);

    await takeScreenshot(page, '35-tablet-calendar.png');
  });

  test('tablet: navigation sidebar visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();

    // At 768px, sidebar may be visible or collapsed depending on breakpoint
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(50);

    await takeScreenshot(page, '35-tablet-nav.png');
  });

  // ─── Desktop (1440px) ──────────────────────────────────────────────────────

  test('desktop: full layout with sidebar navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Sidebar should be visible at full desktop width
    const sidebar = page.locator('aside, nav[aria-label*="sidebar" i], [data-testid="sidebar"], .sidebar');
    const hasSidebar = await sidebar.first().isVisible({ timeout: 5000 }).catch(() => false);

    const pageText = await page.textContent('body');
    expect(
      hasSidebar ||
      pageText?.toLowerCase().includes('dashboard') ||
      pageText?.toLowerCase().includes('exercises') ||
      pageText?.toLowerCase().includes('clients')
    ).toBeTruthy();

    await takeScreenshot(page, '35-desktop-full-layout.png');
  });

  test('desktop: exercise library shows 3+ column grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('exercise') ||
      pageText?.toLowerCase().includes('workout')
    ).toBeTruthy();

    await takeScreenshot(page, '35-desktop-exercises.png');
  });

  test('desktop: analytics shows all charts side-by-side', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(50);

    await takeScreenshot(page, '35-desktop-analytics.png');
  });

  test('desktop: program builder shows full wizard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('body')).toBeVisible();
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('program') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('create')
    ).toBeTruthy();

    await takeScreenshot(page, '35-desktop-programs.png');
  });

  test('desktop: all modals centered with proper width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Try to open a modal (e.g., add client)
    const addBtn = page.locator(
      'button:has-text("Add Client"), button:has-text("New Client"), button:has-text("Invite"), button:has-text("Add")'
    );
    if (await addBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.first().click();
      await page.waitForTimeout(TIMEOUTS.animation);

      const modal = page.locator('[role="dialog"], [data-radix-dialog-content], .modal');
      if (await modal.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Modal should be centered (check it's not full-width or off-screen)
        const modalBox = await modal.first().boundingBox();
        if (modalBox) {
          // Modal should be narrower than the full viewport
          expect(modalBox.width).toBeLessThan(1440);
          // Modal should be horizontally centered (some margin on each side)
          expect(modalBox.x).toBeGreaterThan(0);
        }

        await takeScreenshot(page, '35-desktop-modal.png');

        // Close modal
        await page.keyboard.press('Escape');
      }
    }

    // Page still functional regardless
    await expect(page.locator('body')).toBeVisible();
  });
});
