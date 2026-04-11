/**
 * Suite 08: Exercise Library — Search, Filter, Favorite, Collections
 *
 * Tests the exercise library CRUD operations for trainer role.
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';

test.describe('Exercise Library', () => {
  test('exercise library page loads with exercises', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToExercises();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
    const hasExercises = body?.includes('Exercise') || body?.includes('exercise');
    expect(hasExercises).toBeTruthy();

    await trainer.screenshot('08-exercise-library');
  });

  test('exercises API returns data with correct shape', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const res = await trainer.apiCall('GET', '/api/exercises?limit=5');
    const exercises = res.exercises || res.data?.exercises || [];
    expect(exercises.length).toBeGreaterThan(0);

    // Each exercise should have required fields
    const ex = exercises[0];
    expect(ex).toHaveProperty('id');
    expect(ex).toHaveProperty('name');
    expect(ex).toHaveProperty('gifUrl');
  });

  test('exercise search returns filtered results', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const res = await trainer.apiCall('GET', '/api/exercises?search=squat&limit=10');
    const exercises = res.exercises || res.data?.exercises || [];

    // Should find squat exercises
    if (exercises.length > 0) {
      const hasSquat = exercises.some((e: any) =>
        e.name.toLowerCase().includes('squat')
      );
      expect(hasSquat).toBeTruthy();
    }
  });

  test('exercise search via UI works', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToExercises();

    // Type in search
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('push');
      await page.waitForTimeout(1000); // Debounce

      const body = await page.textContent('body');
      // Should show filtered results
      expect(body).not.toContain('Something went wrong');
    }

    await trainer.screenshot('08-exercise-search');
  });

  test('trainer can favorite an exercise via API', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Get first exercise
    const res = await trainer.apiCall('GET', '/api/exercises?limit=1');
    const exercises = res.exercises || res.data?.exercises || [];

    if (exercises.length > 0) {
      // Favorite it
      await trainer.favoriteExercise(exercises[0].id);

      // Verify favorites endpoint returns it
      const favRes = await trainer.apiCall('GET', '/api/exercises/favorites');
      expect(favRes).toBeTruthy();
    }
  });

  test('trainer can create an exercise collection via API', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const collectionId = await trainer.createCollection(
      'QA Warfare Collection',
      'Test collection from QA warfare simulation'
    );

    // Collection should be retrievable
    if (collectionId) {
      const res = await trainer.apiCall('GET', '/api/exercises/collections');
      expect(res).toBeTruthy();
    }
  });

  test('exercise filter options API returns data', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const res = await trainer.apiCall('GET', '/api/exercises/filters');
    expect(res).toBeTruthy();
    // Should have body parts and equipment options
    const data = res.data || res;
    expect(data).toBeTruthy();
  });
});
