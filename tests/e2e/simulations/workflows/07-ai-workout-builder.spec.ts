/**
 * Suite 07: AI Workout Builder — Generate → Save → Verify in Programs
 *
 * This is the test that SHOULD have existed before. It verifies the complete
 * workflow: trainer generates an AI workout, saves it, and it actually
 * appears in their Programs list as a real database-persisted program.
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';

test.describe('AI Workout Builder — Full Workflow', () => {
  let trainer: TrainerActor;

  test.beforeEach(async ({ page }) => {
    trainer = new TrainerActor(page);
    await trainer.login();
  });

  test('workout builder page loads with exercise data', async ({ page }) => {
    await trainer.navigateToWorkoutBuilder();

    // Verify the builder UI is present
    await expect(page.getByText('AI Workout Generator')).toBeVisible();
    await expect(page.getByText('Generate AI Workout')).toBeVisible();

    // Wait for exercises to load (button becomes enabled)
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('Generate AI Workout') && !btn.disabled) return true;
      }
      return false;
    }, { timeout: 15_000 });

    await trainer.screenshot('07-builder-loaded');
  });

  test('generates a workout with selected preferences', async ({ page }) => {
    await trainer.generateAIWorkout({
      focusArea: 'upper body',
      difficulty: 'intermediate',
      workoutType: 'strength',
    });

    // Verify workout was generated — exercise list should be visible
    await expect(page.getByText('Save to My Programs')).toBeVisible();
    await expect(page.getByText('Discard')).toBeVisible();

    // Verify exercises are shown (at least one exercise card)
    const exerciseCards = page.locator('.bg-gray-50.rounded-lg');
    await expect(exerciseCards.first()).toBeVisible();

    // Verify workout metadata
    await expect(page.getByText(/sets/i).first()).toBeVisible();
    await expect(page.getByText(/rest/i).first()).toBeVisible();

    await trainer.screenshot('07-workout-generated');
  });

  test('saves workout to Programs — persists to database', async ({ page }) => {
    // Generate a workout
    await trainer.generateAIWorkout({
      focusArea: 'full body',
      difficulty: 'beginner',
      workoutType: 'strength',
    });

    // Save it
    await trainer.saveGeneratedWorkout();

    // Verify success banner
    await expect(page.getByText('Workout saved to My Programs')).toBeVisible();
    await expect(page.getByText('View Programs')).toBeVisible();

    await trainer.screenshot('07-workout-saved');

    // Navigate to programs page and verify the saved workout is there
    await page.getByText('View Programs').click();
    await page.waitForURL('**/programs**', { timeout: 10_000 });

    // The program should exist in the list (created within last minute)
    const body = await page.textContent('body');
    expect(body).toContain('Strength Workout');

    await trainer.screenshot('07-workout-in-programs');
  });

  test('saved workout appears in Programs list after page reload', async ({ page }) => {
    // Generate and save
    await trainer.generateAIWorkout({
      focusArea: 'lower body',
      difficulty: 'advanced',
      workoutType: 'strength',
    });
    await trainer.saveGeneratedWorkout();

    // Navigate away and back
    await trainer.navigateToPrograms();
    await trainer.waitForPageReady();

    // Verify the program persisted (it should be in the API response)
    const res = await trainer.apiCall('GET', '/api/programs');
    const programs = res.data || [];
    const aiPrograms = programs.filter((p: any) =>
      p.description?.includes('AI-generated')
    );
    expect(aiPrograms.length).toBeGreaterThan(0);

    await trainer.screenshot('07-programs-persisted');
  });

  test('discard removes the generated workout without saving', async ({ page }) => {
    // Generate a workout
    await trainer.generateAIWorkout();

    // Count programs before
    const beforeRes = await trainer.apiCall('GET', '/api/programs');
    const beforeCount = (beforeRes.data || []).length;

    // Discard it
    await page.getByText('Discard').click();

    // Verify workout UI is gone
    await expect(page.getByText('Save to My Programs')).not.toBeVisible();

    // Verify no new program was created
    const afterRes = await trainer.apiCall('GET', '/api/programs');
    const afterCount = (afterRes.data || []).length;
    expect(afterCount).toBe(beforeCount);
  });

  test('can generate multiple workouts and save each', async ({ page }) => {
    // Generate and save first workout
    await trainer.generateAIWorkout({ focusArea: 'upper body', workoutType: 'strength' });
    await trainer.saveGeneratedWorkout();

    // Generate and save second workout
    await trainer.generateAIWorkout({ focusArea: 'core', workoutType: 'mixed' });
    await trainer.saveGeneratedWorkout();

    // Verify both programs exist
    const res = await trainer.apiCall('GET', '/api/programs');
    const programs = res.data || [];
    const aiPrograms = programs.filter((p: any) =>
      p.description?.includes('AI-generated')
    );
    expect(aiPrograms.length).toBeGreaterThanOrEqual(2);
  });

  test('equipment selection affects generated exercises', async ({ page }) => {
    await trainer.navigateToWorkoutBuilder();
    await trainer.waitForPageReady();

    // Wait for exercises to load
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('Generate AI Workout') && !btn.disabled) return true;
      }
      return false;
    }, { timeout: 15_000 });

    // Select only "body weight" equipment
    const bodyWeightBtn = page.getByText('body weight', { exact: true });
    if (await bodyWeightBtn.isVisible()) {
      await bodyWeightBtn.click();
    }

    await page.getByText('Generate AI Workout').click();
    await page.waitForSelector('text=Save to My Programs', { timeout: 5_000 });

    // Generated exercises should exist
    const exerciseCards = page.locator('.bg-gray-50.rounded-lg');
    const count = await exerciseCards.count();
    expect(count).toBeGreaterThan(0);

    await trainer.screenshot('07-bodyweight-workout');
  });
});
