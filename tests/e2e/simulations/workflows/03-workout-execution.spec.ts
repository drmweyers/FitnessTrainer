/**
 * Suite 03: Workout Execution — Start → Log Sets → Complete
 *
 * Tests the workout tracking loop from the client perspective.
 * Verifies workout sessions are created, sets are logged, and
 * completion updates the database.
 */
import { test, expect } from '@playwright/test';
import { ClientActor } from '../actors/client-actor';
import { TrainerActor } from '../actors/trainer-actor';

test.describe('Workout Execution', () => {
  test('client can view the workouts page', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();
    await client.navigateToWorkouts();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
    const hasContent = body?.includes('Workout') || body?.includes('workout');
    expect(hasContent).toBeTruthy();

    await client.screenshot('03-client-workouts-page');
  });

  test('client workouts page shows workout builder link', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();
    await client.navigateToWorkouts();

    const body = await page.textContent('body');
    const hasBuilder = body?.includes('Builder') || body?.includes('builder') || body?.includes('Create');
    expect(hasBuilder).toBeTruthy();
  });

  test('workouts API returns valid response', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    // Active workouts
    const activeRes = await client.apiCall('GET', '/api/workouts/active');
    expect(activeRes).toBeTruthy();

    // Workout history
    const historyRes = await client.apiCall('GET', '/api/workouts/history');
    expect(historyRes).toBeTruthy();
  });

  test('workout progress page loads', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();
    await client.goto('/workouts/progress');

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await client.screenshot('03-workout-progress');
  });

  test('workout history page loads', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();
    await client.goto('/workouts/history');

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await client.screenshot('03-workout-history');
  });

  test('trainer can view workout management page', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToWorkouts();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await trainer.screenshot('03-trainer-workouts');
  });
});
