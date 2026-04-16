/**
 * Suite 51: Exercise GIF Rendering
 *
 * Verifies GIF images load correctly across all contexts: exercise library grid,
 * filtered views, exercise detail modal, favorites, program builder panel.
 * Uses page.evaluate() to detect broken <img> elements.
 *
 * All tests run as qa-trainer.
 *
 * Commandment #8: ZERO TOLERANCE FOR BROKEN IMAGES — broken image threshold MUST be 0.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

/** Returns the count of broken exercise GIF images in the current page */
async function countBrokenGifs(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const imgs = Array.from(
      document.querySelectorAll(
        'img[src*="gif"], img[src*="exerciseGifs"], img[src*="exercise"]'
      )
    );
    return imgs.filter(
      (img) =>
        !(img as HTMLImageElement).complete ||
        (img as HTMLImageElement).naturalWidth === 0
    ).length;
  });
}

/** Returns the total count of exercise GIF images in the current page */
async function countGifImages(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() =>
    document.querySelectorAll(
      'img[src*="gif"], img[src*="exerciseGifs"], img[src*="exercise"]'
    ).length
  );
}

test.describe('51 - Exercise GIF Rendering', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  // 1. Exercise library grid: visible exercise images load without errors
  test('51.01 exercise library grid: visible GIF images load without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for images to appear
    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      // ZERO broken images — Commandment #8
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-01-grid-gif-check.png');
  });

  // 2. Chest exercises page: GIFs render
  test('51.02 chest exercises: GIFs render correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.fill('chest');

    // Wait for results to load
    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-02-chest-gifs.png');
  });

  // 3. Back exercises page: GIFs render
  test('51.03 back exercises: GIFs render correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.fill('back');

    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }
  });

  // 4. Barbell equipment exercises: GIFs render
  test('51.04 barbell exercises: GIFs render correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.fill('barbell');

    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-04-barbell-gifs.png');
  });

  // 5. Bodyweight exercises: GIFs render
  test('51.05 bodyweight exercises: GIFs render correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.fill('bodyweight');

    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }
  });

  // 6. Exercise detail modal: GIF plays when clicked
  test('51.06 exercise detail modal shows GIF when exercise card is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for exercise cards to load
    const exerciseCard = page.locator(
      '[class*="card"] img, [class*="exercise"] img, img[alt][src*="exerciseGifs"]'
    ).first();

    await expect(exerciseCard).toBeVisible({ timeout: TIMEOUTS.element });
    await exerciseCard.click();

    // Modal or detail page should appear
    const modal = page.locator('[role="dialog"], [class*="modal"], [class*="sheet"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.element });

    // Check GIF in modal is not broken
    const modalGifBroken = await page.evaluate(() => {
      const modalEl = document.querySelector('[role="dialog"], [class*="modal"]');
      if (!modalEl) return 0;
      const imgs = Array.from(modalEl.querySelectorAll('img'));
      return imgs.filter(
        (img) => !(img as HTMLImageElement).complete || (img as HTMLImageElement).naturalWidth === 0
      ).length;
    });
    expect(modalGifBroken).toBe(0);

    await takeScreenshot(page, '51-06-exercise-modal-gif.png');
  });

  // 7. Favorite exercises page: GIF thumbnails render
  test('51.07 favorite exercises page: GIF thumbnails render', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page should load with a heading
    await expect(
      page.locator('h1').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-07-favorites-gifs.png');
  });

  // 8. Program builder exercise panel: GIFs render in drag cards
  test('51.08 program builder exercise panel: GIFs render in exercise cards', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Navigate through wizard steps to reach the exercise selection panel
    const nameInput = page.locator('input#name, input[placeholder*="program" i]').first();
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.fill('GIF Test Program');
    }

    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await nextBtn.click();
      if (await nextBtn.isVisible({ timeout: 2000 })) {
        await nextBtn.click();
      }
    }

    // Wait for exercise panel to appear
    await expect(
      page.locator('input[type="search"], input[placeholder*="exercise" i]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-08-program-builder-gifs.png');
  });

  // 9. Exercise search results: GIFs render
  test('51.09 exercise search results: GIFs render for "squat" search', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.fill('squat');

    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-09-search-results-gifs.png');
  });

  // 10. Exercise placeholder shows for exercises with null gifUrl
  test('51.10 exercises with missing GIF show placeholder, not broken icon', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for initial load
    await expect(
      page.locator('h1:has-text("Exercise Library")')
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // A well-implemented component uses onerror or next/image fallback — no img should be visually broken
    const brokenIconCount = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(
        (img) =>
          !(img as HTMLImageElement).complete &&
          (img as HTMLImageElement).naturalWidth === 0 &&
          img.getAttribute('alt') !== null
      ).length;
    });

    // Zero tolerance for broken image icons
    expect(brokenIconCount).toBe(0);
  });

  // 11. External URL GIFs (https://) load correctly
  test('51.11 external URL GIFs load correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('h1:has-text("Exercise Library")')
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const externalGifCount = await page.evaluate(() =>
      document.querySelectorAll('img[src^="https://"]').length
    );
    const brokenExternal = await page.evaluate(() => {
      const imgs = Array.from(
        document.querySelectorAll('img[src^="https://"]')
      );
      return imgs.filter(
        (img) =>
          !(img as HTMLImageElement).complete ||
          (img as HTMLImageElement).naturalWidth === 0
      ).length;
    });

    if (externalGifCount > 0) {
      expect(brokenExternal).toBe(0);
    }
  });

  // 12. Bare filename GIFs load from /exerciseGifs/ correctly
  test('51.12 bare filename GIFs load from /exerciseGifs/ path', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('h1:has-text("Exercise Library")')
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const exerciseGifsCount = await page.evaluate(() =>
      document.querySelectorAll('img[src*="/exerciseGifs/"]').length
    );
    const brokenExerciseGifs = await page.evaluate(() => {
      const imgs = Array.from(
        document.querySelectorAll('img[src*="/exerciseGifs/"]')
      );
      return imgs.filter(
        (img) =>
          !(img as HTMLImageElement).complete ||
          (img as HTMLImageElement).naturalWidth === 0
      ).length;
    });

    if (exerciseGifsCount > 0) {
      expect(brokenExerciseGifs).toBe(0);
    }

    await takeScreenshot(page, '51-12-exercise-gifs-path.png');
  });

  // 13. Absolute path GIFs load correctly
  test('51.13 absolute path GIFs (starting with /) load correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('h1:has-text("Exercise Library")')
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const absoluteGifs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => {
          const src = img.getAttribute('src') || '';
          return src.startsWith('/') && !src.startsWith('//');
        }).length
    );

    const brokenAbsolute = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
        const src = img.getAttribute('src') || '';
        return src.startsWith('/') && !src.startsWith('//');
      });
      return imgs.filter(
        (img) =>
          !(img as HTMLImageElement).complete ||
          (img as HTMLImageElement).naturalWidth === 0
      ).length;
    });

    if (absoluteGifs > 0) {
      expect(brokenAbsolute).toBe(0);
    }
  });

  // 14. GIF renders on mobile viewport (390px width)
  test('51.14 GIFs render correctly on mobile viewport (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('h1:has-text("Exercise Library")')
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const total = await countGifImages(page);
    const broken = await countBrokenGifs(page);

    if (total > 0) {
      expect(broken).toBe(0);
    }

    await takeScreenshot(page, '51-14-mobile-gifs.png');
  });

  // 15. No broken image icons visible in first page of exercises
  test('51.15 no broken image icons visible in first page of exercises', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Wait for images to load
    await expect(
      page.locator('img[src*="exerciseGifs"], img[src*="gif"], img[alt]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    const broken = await countBrokenGifs(page);
    // ZERO tolerance — Commandment #8
    expect(broken).toBe(0);

    await takeScreenshot(page, '51-15-no-broken-icons.png');
  });
});
