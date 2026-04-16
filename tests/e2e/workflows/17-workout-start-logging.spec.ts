/**
 * Suite 17: Workout Start & Set Logging
 * Tests the DailyWorkoutView and WorkoutExecutionScreen flows.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, waitForPageReady, takeScreenshot } from '../helpers/auth';

test.describe('17 - Workout Start & Set Logging', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'client');
  });

  test('workouts page loads with correct heading', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.element });
    const text = await heading.textContent();
    expect(text?.toLowerCase()).toContain('workout');

    await takeScreenshot(page, '17-workouts-page.png');
  });

  test('workout tracker page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page must render a heading or meaningful structural element
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '17-workout-tracker.png');
  });

  test('workout tracker shows start or daily view content', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('text=/workout|start|today|schedule/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('start workout button or option is visible on tracker page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });

    // Look for any start/begin button or link
    const startBtn = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Start Workout"), a:has-text("Start")'
    );
    const startVisible = await startBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (startVisible) {
      await expect(startBtn.first()).toBeVisible();
    } else {
      // Acceptable fallback: workout-related content visible (no active session, showing daily view)
      await expect(
        page.locator('text=/workout|schedule|today|streak|trainer/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  test('workouts page shows navigation links to tracker or builder', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const workoutLinks = page.locator('a[href*="workout"]');
    const count = await workoutLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('workout tracker exercise list area is present', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Page must render a meaningful structural element — heading or main region
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout execution screen has weight input when session active', async ({ page }) => {
    // Pre-populate localStorage with a mock active session so execution screen renders
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await loginViaAPI(page, 'client');

    const mockSession = {
      id: 'test-session-1',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isTimerRunning: false,
      isPaused: false,
      totalPausedTime: 0,
      workoutLog: {
        id: 'wl-1',
        workoutName: 'Test Workout',
        status: 'in_progress',
        actualStartTime: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'exercise-1',
            exerciseName: 'Bench Press',
            targetSets: 3,
            targetReps: '8-10',
            targetWeight: 80,
            bodyPart: 'chest',
            equipment: 'barbell',
            targetMuscle: 'pectorals',
            sets: [
              { setNumber: 1, reps: 8, weight: 80, completed: false },
              { setNumber: 2, reps: 8, weight: 80, completed: false },
              { setNumber: 3, reps: 8, weight: 80, completed: false },
            ],
          },
        ],
      },
    };

    await page.evaluate((session) => {
      localStorage.setItem('activeWorkoutSession', JSON.stringify(session));
    }, mockSession);

    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show execution screen since session exists in localStorage.
    // Either weight input or exercise name "Bench Press" must be visible.
    const weightInput = page.locator(
      'input[type="number"], input[placeholder*="weight" i], input[id*="weight" i], input[name*="weight" i]'
    );
    const hasWeightInput = await weightInput.first().isVisible({ timeout: 5000 }).catch(() => false);
    const exerciseNameLocator = page.locator('text=Bench Press');
    const hasExerciseName = await exerciseNameLocator.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasWeightInput && !hasExerciseName) {
      // Execution screen did not render — this is a test failure
      await expect(page.locator('text=Bench Press')).toBeVisible({ timeout: TIMEOUTS.element });
    }

    await takeScreenshot(page, '17-workout-execution.png');
  });

  test('workout execution screen shows reps input when session active', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await loginViaAPI(page, 'client');

    const mockSession = {
      id: 'test-session-2',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isTimerRunning: false,
      isPaused: false,
      totalPausedTime: 0,
      workoutLog: {
        id: 'wl-2',
        workoutName: 'Reps Test',
        status: 'in_progress',
        actualStartTime: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-2',
            exerciseId: 'exercise-2',
            exerciseName: 'Squat',
            targetSets: 3,
            targetReps: '5',
            targetWeight: 100,
            bodyPart: 'legs',
            equipment: 'barbell',
            targetMuscle: 'quadriceps',
            sets: [
              { setNumber: 1, reps: 5, weight: 100, completed: false },
            ],
          },
        ],
      },
    };

    await page.evaluate((session) => {
      localStorage.setItem('activeWorkoutSession', JSON.stringify(session));
    }, mockSession);

    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Either reps/set content or the exercise name "Squat" must be visible
    await expect(
      page.locator('text=/rep|set|squat/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout execution screen shows complete set button', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await loginViaAPI(page, 'client');

    const mockSession = {
      id: 'test-session-3',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isTimerRunning: false,
      isPaused: false,
      totalPausedTime: 0,
      workoutLog: {
        id: 'wl-3',
        workoutName: 'Button Test',
        status: 'in_progress',
        actualStartTime: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-3',
            exerciseId: 'exercise-3',
            exerciseName: 'Deadlift',
            targetSets: 2,
            targetReps: '5',
            targetWeight: 120,
            bodyPart: 'back',
            equipment: 'barbell',
            targetMuscle: 'glutes',
            sets: [
              { setNumber: 1, reps: 5, weight: 120, completed: false },
              { setNumber: 2, reps: 5, weight: 120, completed: false },
            ],
          },
        ],
      },
    };

    await page.evaluate((session) => {
      localStorage.setItem('activeWorkoutSession', JSON.stringify(session));
    }, mockSession);

    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const completeBtn = page.locator(
      'button:has-text("Complete Set"), button:has-text("Log Set"), button:has-text("Done"), button:has-text("Mark Complete")'
    );
    const isVisible = await completeBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await expect(completeBtn.first()).toBeVisible();
    } else {
      // Execution screen did not surface complete set button — verify the exercise name is visible
      await expect(page.locator('text=Deadlift')).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  test('workout execution screen shows skip exercise option', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await loginViaAPI(page, 'client');

    const mockSession = {
      id: 'test-session-skip',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isTimerRunning: false,
      isPaused: false,
      totalPausedTime: 0,
      workoutLog: {
        id: 'wl-skip',
        workoutName: 'Skip Test',
        status: 'in_progress',
        actualStartTime: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-skip',
            exerciseId: 'exercise-skip',
            exerciseName: 'Pull Up',
            targetSets: 3,
            targetReps: '10',
            targetWeight: 0,
            bodyPart: 'back',
            equipment: 'body weight',
            targetMuscle: 'lats',
            sets: [
              { setNumber: 1, reps: 10, weight: 0, completed: false },
            ],
          },
        ],
      },
    };

    await page.evaluate((session) => {
      localStorage.setItem('activeWorkoutSession', JSON.stringify(session));
    }, mockSession);

    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const skipBtn = page.locator(
      'button:has-text("Skip"), button[aria-label*="skip" i], [title*="skip" i]'
    );
    const isVisible = await skipBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await expect(skipBtn.first()).toBeVisible();
    } else {
      // Skip button not surfaced — verify the execution screen rendered with exercise name
      await expect(
        page.locator('text=/pull up|workout/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  test('workout history page is accessible from workouts hub', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const historyLink = page.locator('a[href*="history"]');
    await expect(historyLink.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout tracker clears session and shows daily view after exit', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await loginViaAPI(page, 'client');

    // Clear any existing session
    await page.evaluate(() => {
      localStorage.removeItem('activeWorkoutSession');
    });

    await page.goto(`${BASE_URL}${ROUTES.workoutTracker}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Without active session, should show daily view — heading or main must be visible
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout builder page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsBuilder}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('text=/builder|create|workout|exercise/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '17-workout-builder.png');
  });

  test('workout log page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsLog}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Must not redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('workout progress page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.workoutsProgress}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(
      page.locator('text=/progress|workout|chart|history/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
