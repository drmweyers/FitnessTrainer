/**
 * EvoFitTrainer Screenshot Capture Script
 * Captures 40 production screenshots for marketing across all app pages
 * Production URL: https://trainer.evofit.io
 *
 * Run with: npx tsx scripts/capture-screenshots.ts
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://trainer.evofit.io';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'marketing', 'screenshots');

const CREDENTIALS = {
  trainer: { email: 'qa-trainer@evofit.io', password: 'QaTest2026!' },
  client: { email: 'qa-client@evofit.io', password: 'QaTest2026!' },
  admin: { email: 'qa-admin@evofit.io', password: 'QaTest2026!' },
};

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// Ensure screenshots directory exists (flat structure)
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function screenshotPath(filename: string): string {
  return path.join(SCREENSHOTS_DIR, filename);
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a new context, login via UI on one page, then return the page.
 * The page stays open so auth (localStorage JWT) persists across navigations.
 */
async function createLoggedInPage(
  browser: Browser,
  role: 'trainer' | 'client' | 'admin',
  viewport: { width: number; height: number }
): Promise<{ context: BrowserContext; page: Page }> {
  const creds = CREDENTIALS[role];
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  console.log(`  Logging in as ${role}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(1500);

  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  try {
    await page.waitForURL(/\/(dashboard|clients|analytics|programs|workouts|schedule|profile|admin)/, {
      timeout: 15000,
    });
  } catch {
    await wait(3000);
  }
  await wait(3000);
  console.log(`  Logged in. Current URL: ${page.url()}`);

  return { context, page };
}

async function screenshot(page: Page, filename: string, options?: { fullPage?: boolean }): Promise<void> {
  const outPath = screenshotPath(filename);
  await page.screenshot({ path: outPath, fullPage: options?.fullPage ?? false });
  console.log(`  Saved: ${filename}`);
}

async function waitForContentLoaded(page: Page, extraMs = 0): Promise<void> {
  // Wait for network requests to settle
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    // networkidle timed out, proceed anyway
  }
  // Wait for loading spinners to disappear
  try {
    await page.waitForFunction(
      () => {
        const loadingTexts = ['Loading...', 'Loading dashboard', 'Loading programs', 'Loading clients'];
        const bodyText = document.body.innerText;
        return !loadingTexts.some((t) => bodyText.includes(t));
      },
      { timeout: 10000 }
    );
  } catch {
    // Loading text didn't disappear, proceed anyway
  }
  if (extraMs > 0) await new Promise((r) => setTimeout(r, extraMs));
}

async function navigateTo(
  page: Page,
  url: string,
  filename: string,
  options?: {
    fullPage?: boolean;
    waitMs?: number;
    beforeCapture?: (page: Page) => Promise<void>;
  }
): Promise<void> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForContentLoaded(page, options?.waitMs ?? 1000);

    if (options?.beforeCapture) {
      await options.beforeCapture(page);
      await wait(800);
    }

    await screenshot(page, filename, { fullPage: options?.fullPage });
  } catch (err) {
    console.log(`  Warning for ${filename}: ${err}`);
    try {
      await screenshot(page, filename);
    } catch {
      console.log(`  Error: Could not save ${filename}`);
    }
  }
}

async function clickTabByText(page: Page, tabText: string): Promise<boolean> {
  // Try to find any button whose text content includes the tab label
  const buttons = await page.locator('button, [role="tab"], a[role="tab"]').all();
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => '');
    if (text && text.includes(tabText)) {
      await btn.click();
      await wait(2000);
      return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('EvoFitTrainer Screenshot Capture');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Output: ${SCREENSHOTS_DIR}`);
  console.log('─'.repeat(60));

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // ── PUBLIC PAGES ────────────────────────────────────────────────────────
    console.log('\n[PUBLIC PAGES]');
    {
      const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
      const page = await context.newPage();

      // 1. Homepage full page
      console.log('1/40 homepage.png');
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
      await wait(3000);
      await screenshot(page, 'homepage.png', { fullPage: true });

      // 2. Features section
      console.log('2/40 homepage-features.png');
      await page.evaluate(() => {
        const el =
          document.querySelector('#features') ||
          document.querySelector('[id*="feature"]') ||
          document.querySelector('section:nth-of-type(2)');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollBy(0, window.innerHeight);
      });
      await wait(800);
      await screenshot(page, 'homepage-features.png');

      // 3. Pricing section
      console.log('3/40 homepage-pricing.png');
      await page.evaluate(() => {
        const el =
          document.querySelector('#pricing') ||
          document.querySelector('[id*="price"]') ||
          document.querySelector('section:nth-of-type(3)');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollBy(0, window.innerHeight * 2);
      });
      await wait(800);
      await screenshot(page, 'homepage-pricing.png');

      // 4. Roles section
      console.log('4/40 homepage-roles.png');
      await page.evaluate(() => {
        const el =
          document.querySelector('#roles') ||
          document.querySelector('[id*="role"]') ||
          document.querySelector('section:nth-of-type(4)');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollBy(0, window.innerHeight * 3);
      });
      await wait(800);
      await screenshot(page, 'homepage-roles.png');

      // 5. Login page
      console.log('5/40 login.png');
      await navigateTo(page, `${BASE_URL}/login`, 'login.png', { waitMs: 2500 });

      // 6. Register page
      console.log('6/40 register.png');
      await navigateTo(page, `${BASE_URL}/register`, 'register.png', { waitMs: 2500 });

      await context.close();
    }

    // ── TRAINER PAGES ────────────────────────────────────────────────────────
    console.log('\n[TRAINER PAGES]');
    {
      const { context, page } = await createLoggedInPage(browser, 'trainer', DESKTOP_VIEWPORT);

      // 7. Trainer dashboard
      console.log('7/40 trainer-dashboard.png');
      await navigateTo(page, `${BASE_URL}/dashboard/trainer`, 'trainer-dashboard.png', { waitMs: 5000 });

      // 8. Clients list
      console.log('8/40 clients-list.png');
      await navigateTo(page, `${BASE_URL}/clients`, 'clients-list.png', { waitMs: 4000 });

      // 9. Client detail
      console.log('9/40 client-detail.png');
      {
        // Navigate to clients, then click the first client link
        await page.goto(`${BASE_URL}/clients`, { waitUntil: 'domcontentloaded' });
        await wait(4000);
        let navigated = false;
        try {
          // Find any clickable client row/card
          const clientLinks = await page.locator('a[href*="/clients/"]').all();
          for (const link of clientLinks) {
            const href = await link.getAttribute('href');
            if (href && href.match(/\/clients\/[a-zA-Z0-9-]+$/)) {
              await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
              await wait(4000);
              navigated = true;
              break;
            }
          }
        } catch {
          // ignore
        }
        if (!navigated) {
          console.log('  Could not find client detail link');
        }
        await screenshot(page, 'client-detail.png');
      }

      // 10. Exercise library
      console.log('10/40 exercises-library.png');
      await navigateTo(page, `${BASE_URL}/dashboard/exercises`, 'exercises-library.png', { waitMs: 5000 });

      // 11. Exercises with filters open
      console.log('11/40 exercises-filters.png');
      await page.goto(`${BASE_URL}/dashboard/exercises`, { waitUntil: 'domcontentloaded' });
      await waitForContentLoaded(page, 1000);
      try {
        const filterBtn = page.locator('button:has-text("Filters"), button:has-text("Filter")').first();
        if (await filterBtn.isVisible({ timeout: 3000 })) {
          await filterBtn.click();
          await wait(1000);
        }
      } catch {
        console.log('  Filter button not found');
      }
      await screenshot(page, 'exercises-filters.png');

      // 12. Exercise detail
      console.log('12/40 exercise-detail.png');
      {
        await page.goto(`${BASE_URL}/dashboard/exercises`, { waitUntil: 'domcontentloaded' });
        await waitForContentLoaded(page, 1000);
        let clicked = false;
        try {
          const cards = await page.locator('a[href*="/exercises/"]').all();
          for (const card of cards) {
            const href = await card.getAttribute('href');
            if (href && href.match(/\/exercises\/[a-zA-Z0-9-]+$/)) {
              await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
              await waitForContentLoaded(page, 1000);
              clicked = true;
              break;
            }
          }
        } catch {
          // ignore
        }
        if (!clicked) {
          // Try clicking the first exercise card directly
          try {
            await page.locator('.exercise-card, [data-exercise], article').first().click();
            await waitForContentLoaded(page, 1000);
          } catch {
            console.log('  Could not navigate to exercise detail');
          }
        }
        await screenshot(page, 'exercise-detail.png');
      }

      // 13. Exercises favorites
      console.log('13/40 exercises-favorites.png');
      await navigateTo(page, `${BASE_URL}/dashboard/exercises/favorites`, 'exercises-favorites.png', {
        waitMs: 4000,
      });

      // 14. Programs list
      console.log('14/40 programs-list.png');
      await navigateTo(page, `${BASE_URL}/programs`, 'programs-list.png', { waitMs: 4000 });

      // 15. Program builder (new)
      console.log('15/40 program-builder.png');
      await navigateTo(page, `${BASE_URL}/programs/new`, 'program-builder.png', { waitMs: 4000 });

      // 16. Workouts hub
      console.log('16/40 workouts-hub.png');
      await navigateTo(page, `${BASE_URL}/workouts`, 'workouts-hub.png', { waitMs: 4000 });

      // 17. Workout builder
      console.log('17/40 workout-builder.png');
      await navigateTo(page, `${BASE_URL}/workouts/builder`, 'workout-builder.png', { waitMs: 4000 });

      // 18. Workout tracker
      console.log('18/40 workout-tracker.png');
      await navigateTo(page, `${BASE_URL}/workout-tracker`, 'workout-tracker.png', { waitMs: 4000 });

      // 19. Analytics overview
      console.log('19/40 analytics-overview.png');
      await navigateTo(page, `${BASE_URL}/analytics`, 'analytics-overview.png', { waitMs: 5000 });

      // 20. Analytics performance tab
      console.log('20/40 analytics-performance.png');
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
      await waitForContentLoaded(page, 1000);
      const perfClicked = await clickTabByText(page, 'Performance');
      if (!perfClicked) console.log('  Tab "Performance" not found, capturing current state');
      await screenshot(page, 'analytics-performance.png');

      // 21. Analytics training load tab
      console.log('21/40 analytics-training-load.png');
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
      await waitForContentLoaded(page, 1000);
      const tlClicked = await clickTabByText(page, 'Training Load');
      if (!tlClicked) console.log('  Tab "Training Load" not found, capturing current state');
      await screenshot(page, 'analytics-training-load.png');

      // 22. Analytics goals tab
      console.log('22/40 analytics-goals.png');
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
      await waitForContentLoaded(page, 1000);
      const goalsClicked = await clickTabByText(page, 'Goals');
      if (!goalsClicked) console.log('  Tab "Goals" not found, capturing current state');
      await screenshot(page, 'analytics-goals.png');

      // 23. Analytics charts tab
      console.log('23/40 analytics-charts.png');
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
      await waitForContentLoaded(page, 1000);
      const chartsClicked = await clickTabByText(page, 'Charts');
      if (!chartsClicked) console.log('  Tab "Charts" not found, capturing current state');
      await screenshot(page, 'analytics-charts.png');

      // 24. Schedule calendar
      console.log('24/40 schedule-calendar.png');
      await navigateTo(page, `${BASE_URL}/schedule`, 'schedule-calendar.png', { waitMs: 4000 });

      // 25. Schedule availability
      console.log('25/40 schedule-availability.png');
      await navigateTo(page, `${BASE_URL}/schedule/availability`, 'schedule-availability.png', {
        waitMs: 4000,
      });

      // 26. Profile view
      console.log('26/40 profile-view.png');
      await navigateTo(page, `${BASE_URL}/profile`, 'profile-view.png', { waitMs: 4000 });

      // 27. Profile edit
      console.log('27/40 profile-edit.png');
      await navigateTo(page, `${BASE_URL}/profile/edit`, 'profile-edit.png', { waitMs: 4000 });

      // 28. Profile health
      console.log('28/40 profile-health.png');
      await navigateTo(page, `${BASE_URL}/profile/health`, 'profile-health.png', { waitMs: 4000 });

      await context.close();
    }

    // ── CLIENT PAGES ────────────────────────────────────────────────────────
    console.log('\n[CLIENT PAGES]');
    {
      const { context, page } = await createLoggedInPage(browser, 'client', DESKTOP_VIEWPORT);

      // 29. Client dashboard
      console.log('29/40 client-dashboard.png');
      await navigateTo(page, `${BASE_URL}/dashboard/client`, 'client-dashboard.png', { waitMs: 5000 });

      // 30. Client workouts
      console.log('30/40 client-workouts.png');
      await navigateTo(page, `${BASE_URL}/workouts`, 'client-workouts.png', { waitMs: 4000 });

      // 31. Client analytics
      console.log('31/40 client-analytics.png');
      await navigateTo(page, `${BASE_URL}/analytics`, 'client-analytics.png', { waitMs: 5000 });

      // 32. Client profile
      console.log('32/40 client-profile.png');
      await navigateTo(page, `${BASE_URL}/profile`, 'client-profile.png', { waitMs: 4000 });

      await context.close();
    }

    // ── ADMIN PAGES ─────────────────────────────────────────────────────────
    console.log('\n[ADMIN PAGES]');
    {
      const { context, page } = await createLoggedInPage(browser, 'admin', DESKTOP_VIEWPORT);

      // 33. Admin dashboard
      console.log('33/40 admin-dashboard.png');
      await navigateTo(page, `${BASE_URL}/admin`, 'admin-dashboard.png', { waitMs: 5000 });

      // 34. Admin users
      console.log('34/40 admin-users.png');
      await navigateTo(page, `${BASE_URL}/admin/users`, 'admin-users.png', { waitMs: 4000 });

      // 35. Admin system
      console.log('35/40 admin-system.png');
      await navigateTo(page, `${BASE_URL}/admin/system`, 'admin-system.png', { waitMs: 4000 });

      await context.close();
    }

    // ── MOBILE SCREENSHOTS ──────────────────────────────────────────────────
    console.log('\n[MOBILE SCREENSHOTS (375x812)]');
    {
      const { context, page } = await createLoggedInPage(browser, 'trainer', MOBILE_VIEWPORT);

      // 36. Mobile dashboard
      console.log('36/40 mobile-dashboard.png');
      await navigateTo(page, `${BASE_URL}/dashboard/trainer`, 'mobile-dashboard.png', { waitMs: 5000 });

      // 37. Mobile exercises
      console.log('37/40 mobile-exercises.png');
      await navigateTo(page, `${BASE_URL}/dashboard/exercises`, 'mobile-exercises.png', { waitMs: 5000 });

      // 38. Mobile workouts
      console.log('38/40 mobile-workouts.png');
      await navigateTo(page, `${BASE_URL}/workouts`, 'mobile-workouts.png', { waitMs: 4000 });

      // 39. Mobile analytics
      console.log('39/40 mobile-analytics.png');
      await navigateTo(page, `${BASE_URL}/analytics`, 'mobile-analytics.png', { waitMs: 5000 });

      // 40. Mobile schedule
      console.log('40/40 mobile-schedule.png');
      await navigateTo(page, `${BASE_URL}/schedule`, 'mobile-schedule.png', { waitMs: 4000 });

      await context.close();
    }

    console.log('\n' + '─'.repeat(60));
    console.log('Screenshot capture complete!');

    // Verify captured files
    const files = fs.readdirSync(SCREENSHOTS_DIR).filter((f) => f.endsWith('.png') && !f.startsWith('debug'));
    console.log(`\nCaptures saved: ${files.length} files`);
    files.sort().forEach((f) => console.log(`  ${f}`));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
