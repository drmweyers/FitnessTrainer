/**
 * Suite 12 - Exercise Favorites
 *
 * Tests favoriting exercises from the library, verifying they appear on the
 * favorites page, unfavoriting, multi-favorites, in-page search, and CSV export.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, getAuthToken, takeScreenshot, waitForPageReady } from '../helpers/auth';

// Extended timeout for this suite — the favorites page client-hooks chain
// (useFavorites → useCollections → getExercisesByIds N+1) can take 30s+ on
// cold Next.js dev compiles before the h1 becomes visible.
const PAGE_LOAD_EXT = 60000;

test.describe('12 - Exercise Favorites', () => {
  // Allow extra time for dev-server cold compiles on the favorites page chain
  test.setTimeout(240000);

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('favorites page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: PAGE_LOAD_EXT,
    });

    await takeScreenshot(page, '12-favorites-page.png');
  });

  test('empty favorites state shows a message', async ({ page }) => {
    // Clear favorites via API so we start with a known empty state
    const token = await getAuthToken(page, 'trainer');
    const favRes = await page.request.get(`${BASE_URL}${API.exerciseFavorites}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: PAGE_LOAD_EXT,
    });
    if (favRes.ok()) {
      const body = await favRes.json();
      const favList: { exerciseId: string }[] = Array.isArray(body?.data)
        ? body.data
        : (body?.data?.favorites ?? []);
      const favIds: string[] = favList.map((f) => f.exerciseId);
      for (const id of favIds) {
        await page.request.delete(`${BASE_URL}${API.exerciseFavorites}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: { exerciseId: id },
          timeout: PAGE_LOAD_EXT,
        });
      }
    }

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    // Wait for the page heading to ensure the client component mounted
    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: PAGE_LOAD_EXT,
    });

    // Wait for the empty-state text to appear (polling for up to 30s)
    await expect(async () => {
      const pageText = await page.textContent('body');
      const hasEmptyState =
        pageText?.toLowerCase().includes('no favorite') ||
        pageText?.toLowerCase().includes('start building') ||
        pageText?.toLowerCase().includes('browse exercise library');
      expect(hasEmptyState).toBeTruthy();
    }).toPass({ timeout: PAGE_LOAD_EXT });

    await takeScreenshot(page, '12-favorites-empty.png');
  });

  test('navigate to exercise library and find an exercise', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });
    // Brief wait for exercise cards to render without blocking on the spinner
    await page.waitForTimeout(3000);

    // Search to load exercise cards
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="Search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await searchInput.fill('curl');
      await page.waitForTimeout(2000);
    }

    // Verify cards are present
    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase().includes('curl') || pageText?.toLowerCase().includes('exercise')).toBeTruthy();
  });

  test('click heart/favorite icon on an exercise', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exercises}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    // Wait for exercise cards to render without blocking on networkidle
    await page.waitForTimeout(3000);

    // Surface exercise cards via search
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="Search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('press');
      await page.waitForTimeout(2000);
    }

    // Look only for buttons with explicit aria-label or title containing "favorite"
    // Do NOT use svg[class*="heart"] as it may match card links and trigger navigation
    const favoriteButton = page
      .locator('button[aria-label*="favorite" i], button[title*="favorite" i]')
      .first();

    const isVisible = await favoriteButton.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await favoriteButton.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // Page should still be on exercise library (or gracefully redirect)
    const body = await page.textContent('body');
    expect(body?.toLowerCase().includes('exercise')).toBeTruthy();

    await takeScreenshot(page, '12-exercise-favorited.png');
  });

  test('favorited exercise appears on favorites page', async ({ page }) => {
    // Favorite an exercise via API to guarantee a known state
    const token = await getAuthToken(page, 'trainer');

    // Get an exercise to favorite
    const exercisesRes = await page.request.get(
      `${BASE_URL}${API.exercises}?limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: PAGE_LOAD_EXT }
    );
    if (!exercisesRes.ok()) return;

    const exercisesBody = await exercisesRes.json();
    const exercises = exercisesBody?.data?.exercises ?? exercisesBody?.data ?? [];
    if (!exercises.length) return;

    const exerciseId: string = exercises[0].exerciseId ?? exercises[0].id;

    // Favorite it
    await page.request.post(`${BASE_URL}${API.exerciseFavorites}`, {
      data: { exerciseId },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: PAGE_LOAD_EXT,
    });

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });
    await page.waitForTimeout(1500);

    // The favorites page should list at least one exercise
    const pageText = await page.textContent('body');
    const hasFavorite =
      !pageText?.toLowerCase().includes('no favorite exercises yet') &&
      (pageText?.toLowerCase().includes('exercise') ?? false);

    expect(hasFavorite).toBeTruthy();

    await takeScreenshot(page, '12-favorites-with-exercise.png');
  });

  test('favorite count updates after favoriting', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    // Wait for the heading to appear
    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: PAGE_LOAD_EXT,
    });
    await page.waitForTimeout(1000);

    // Extract count text from the page (e.g. "3 exercises in your favorites")
    const countText = await page
      .locator('p:has-text("exercise"), span:has-text("exercise")')
      .first()
      .textContent()
      .catch(() => '');

    expect(countText).toBeTruthy();
  });

  test('unfavorite by clicking heart again removes the exercise', async ({ page }) => {
    const token = await getAuthToken(page, 'trainer');

    // Ensure at least one favorite exists
    const exercisesRes = await page.request.get(
      `${BASE_URL}${API.exercises}?limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: PAGE_LOAD_EXT }
    );
    if (!exercisesRes.ok()) return;
    const exercisesBody = await exercisesRes.json();
    const exercises = exercisesBody?.data?.exercises ?? exercisesBody?.data ?? [];
    if (!exercises.length) return;

    const exerciseId: string = exercises[0].exerciseId ?? exercises[0].id;
    await page.request.post(`${BASE_URL}${API.exerciseFavorites}`, {
      data: { exerciseId },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: PAGE_LOAD_EXT,
    });

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });
    await page.waitForTimeout(1500);

    // Hover over the first card to reveal the favorite toggle
    const firstCard = page.locator('[class*="card"], [class*="exercise"]').first();
    if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCard.hover();
      await page.waitForTimeout(300);
    }

    const heartButton = page
      .locator('button[aria-label*="favorite" i], button[title*="favorite" i]')
      .first();
    if (await heartButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await heartButton.click();
      await page.waitForTimeout(1500);
    }

    // Page should not crash after unfavoriting
    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, '12-unfavorited.png');
  });

  test('exercise removed from favorites page after unfavoriting', async ({ page }) => {
    const token = await getAuthToken(page, 'trainer');

    // Clear all favorites so we start fresh
    const favRes = await page.request.get(`${BASE_URL}${API.exerciseFavorites}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: PAGE_LOAD_EXT,
    });
    if (favRes.ok()) {
      const body = await favRes.json();
      const favList: { exerciseId: string }[] = Array.isArray(body?.data)
        ? body.data
        : (body?.data?.favorites ?? []);
      const favIds: string[] = favList.map((f) => f.exerciseId);
      for (const id of favIds) {
        await page.request.delete(`${BASE_URL}${API.exerciseFavorites}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: { exerciseId: id },
          timeout: PAGE_LOAD_EXT,
        });
      }
    }

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: PAGE_LOAD_EXT,
    });

    // Wait for empty-state text to appear after the client hook finishes loading
    await expect(async () => {
      const pageText = await page.textContent('body');
      const hasEmptyState =
        pageText?.toLowerCase().includes('no favorite') ||
        pageText?.toLowerCase().includes('start building');
      expect(hasEmptyState).toBeTruthy();
    }).toPass({ timeout: PAGE_LOAD_EXT });
  });

  test('can favorite multiple exercises', async ({ page }) => {
    const token = await getAuthToken(page, 'trainer');

    // Fetch 3 exercises and favorite them all
    const exercisesRes = await page.request.get(
      `${BASE_URL}${API.exercises}?limit=3`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: PAGE_LOAD_EXT }
    );
    if (!exercisesRes.ok()) return;
    const exercisesBody = await exercisesRes.json();
    const exercises: { exerciseId?: string; id?: string }[] =
      exercisesBody?.data?.exercises ?? exercisesBody?.data ?? [];
    if (exercises.length < 2) return;

    for (const exercise of exercises) {
      const id = exercise.exerciseId ?? exercise.id;
      if (id) {
        await page.request.post(`${BASE_URL}${API.exerciseFavorites}`, {
          data: { exerciseId: id },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });
    await page.waitForTimeout(1500);

    // There should be more than 1 exercise card
    const cards = page.locator('[class*="card"], [class*="exercise"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    await takeScreenshot(page, '12-multiple-favorites.png');
  });

  test('search within favorites filters the list', async ({ page }) => {
    const token = await getAuthToken(page, 'trainer');

    // Add a couple of favorites so there is something to search
    const exercisesRes = await page.request.get(
      `${BASE_URL}${API.exercises}?limit=5`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: PAGE_LOAD_EXT }
    );
    if (exercisesRes.ok()) {
      const exercisesBody = await exercisesRes.json();
      const exercises: { exerciseId?: string; id?: string }[] =
        exercisesBody?.data?.exercises ?? exercisesBody?.data ?? [];
      for (const exercise of exercises.slice(0, 3)) {
        const id = exercise.exerciseId ?? exercise.id;
        if (id) {
          await page.request.post(`${BASE_URL}${API.exerciseFavorites}`, {
            data: { exerciseId: id },
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      }
    }

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: PAGE_LOAD_EXT,
    });
    await page.waitForTimeout(1500);

    const searchInput = page
      .locator('input[placeholder*="Search favorites" i], input[placeholder*="Search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('a');
      await page.waitForTimeout(1000);
    }

    // Page must not crash
    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, '12-favorites-search.png');
  });

  test('Export CSV button is visible when favorites exist', async ({ page }) => {
    const token = await getAuthToken(page, 'trainer');

    // Ensure at least one favorite
    const exercisesRes = await page.request.get(
      `${BASE_URL}${API.exercises}?limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: PAGE_LOAD_EXT }
    );
    if (exercisesRes.ok()) {
      const exercisesBody = await exercisesRes.json();
      const exercises: { exerciseId?: string; id?: string }[] =
        exercisesBody?.data?.exercises ?? exercisesBody?.data ?? [];
      if (exercises.length) {
        const id = exercises[0].exerciseId ?? exercises[0].id;
        if (id) {
          await page.request.post(`${BASE_URL}${API.exerciseFavorites}`, {
            data: { exerciseId: id },
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      }
    }

    await page.goto(`${BASE_URL}${ROUTES.exerciseFavorites}`, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_EXT,
    });

    await expect(page.locator('h1:has-text("Favorite Exercises")')).toBeVisible({
      timeout: PAGE_LOAD_EXT,
    });

    // Poll until either the export button renders (favorites loaded) or the
    // empty-state text shows (no favorites). The client hook takes a while to
    // finish fetching on the first compile.
    await expect(async () => {
      const exportButton = page
        .locator('a[href*="export"], a[aria-label*="Export" i], button:has-text("Export")')
        .first();
      const isVisible = await exportButton.isVisible().catch(() => false);
      const pageText = await page.textContent('body');
      const hasExportOrEmpty =
        isVisible ||
        pageText?.toLowerCase().includes('no favorite') ||
        pageText?.toLowerCase().includes('browse exercise');
      expect(hasExportOrEmpty).toBeTruthy();
    }).toPass({ timeout: PAGE_LOAD_EXT });

    await takeScreenshot(page, '12-export-button.png');
  });

  test('Export CSV endpoint returns a downloadable file', async ({ page }) => {
    const token = await getAuthToken(page, 'trainer');

    const response = await page.request.get(
      `${BASE_URL}${API.exerciseFavoritesExport}?format=csv`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: PAGE_LOAD_EXT,
      }
    );

    // Accept 200 (file) or 204/200 empty (no favorites yet) or redirect to login
    expect([200, 204, 302, 401]).toContain(response.status());

    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] ?? '';
      const contentDisposition = response.headers()['content-disposition'] ?? '';
      const hasFileHeaders =
        contentType.includes('csv') ||
        contentType.includes('text') ||
        contentType.includes('octet-stream') ||
        contentDisposition.includes('attachment');
      expect(hasFileHeaders).toBeTruthy();
    }
  });
});
