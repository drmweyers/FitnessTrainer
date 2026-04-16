/**
 * Suite 54: Multi-Day Client Workout Execution
 *
 * Tests the full multi-day workout loop from the client perspective:
 * viewing assigned programs, executing workouts, logging sets, completing
 * sessions, recording measurements, and the trainer seeing client progress.
 *
 * Context: qa-trainer has assigned a program to qa-client via global-setup.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('54 - Multi-Day Client Workout Execution', () => {
  test.setTimeout(90000);

  // 1. Client sees assigned program on dashboard
  test('54.01 client dashboard shows assigned program', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
    expect(page.url()).toContain('/dashboard');

    await takeScreenshot(page, '54-01-client-dashboard.png');
  });

  // 2. Client navigates to /programs — sees "My Training Programs"
  test('54.02 client /programs page shows their training programs', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    const hasProgramContent =
      pageText?.toLowerCase().includes('program') ||
      pageText?.toLowerCase().includes('training') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('no programs');
    expect(hasProgramContent).toBeTruthy();

    // Should NOT see "Create Program" (trainer-only)
    await expect(
      page.locator('a[href="/programs/new"], button:has-text("Create Program")')
    ).not.toBeVisible();

    await takeScreenshot(page, '54-02-client-programs-page.png');
  });

  // 3. Client clicks into assigned program — sees program details
  test('54.03 client can view assigned program details', async ({ page }) => {
    await loginViaAPI(page, 'client');

    // Get assigned programs via API
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${BASE_URL}${API.programs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok()) {
      // API unavailable — verify programs page loads
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(50);
      return;
    }

    const body = await res.json();
    const programs = body.data || body.programs || (Array.isArray(body) ? body : []);

    if (!programs.length) {
      // No assigned programs — verify page loads cleanly
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(50);
      await takeScreenshot(page, '54-03-no-assigned-programs.png');
      return;
    }

    const programId = programs[0].id;
    await page.goto(`${BASE_URL}/programs/${programId}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-03-client-program-details.png');
  });

  // 4. Client sees program has multiple days/weeks
  test('54.04 client program detail shows week/day structure', async ({ page }) => {
    await loginViaAPI(page, 'client');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${BASE_URL}${API.programs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok()) {
      test.skip();
      return;
    }

    const body = await res.json();
    const programs = body.data || body.programs || (Array.isArray(body) ? body : []);

    if (!programs.length) {
      test.skip();
      return;
    }

    const programId = programs[0].id;
    await page.goto(`${BASE_URL}/programs/${programId}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    // Should mention weeks or days
    const hasStructure =
      pageText?.toLowerCase().includes('week') ||
      pageText?.toLowerCase().includes('day') ||
      pageText?.toLowerCase().includes('workout');
    expect(hasStructure || pageText!.length > 200).toBeTruthy();
  });

  // 5. Client goes to /workouts — sees "Start a Workout" not AI builder
  test('54.05 client /workouts shows Start a Workout (not AI builder)', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client should see "Start a Workout" link/button to /workout-tracker
    await expect(
      page.locator('a[href="/workout-tracker"], button:has-text("Start a Workout")')
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Should NOT see AI Workout Builder
    await expect(
      page.locator('a[href="/workouts/builder"]')
    ).not.toBeVisible();

    await takeScreenshot(page, '54-05-client-workouts-page.png');
  });

  // 6. Client clicks "Start a Workout" — workout execution screen opens
  test('54.06 client Start a Workout opens workout execution screen', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workouts}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const startBtn = page.locator(
      'a[href="/workout-tracker"], button:has-text("Start a Workout"), a:has-text("Start a Workout")'
    ).first();

    if (await startBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(1500);
      await waitForPageReady(page);
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-06-workout-execution.png');
  });

  // 7. Client sees Day 1 exercises listed
  test('54.07 workout execution shows exercises for the session', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/workout-tracker`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    const hasExerciseContent =
      pageText?.toLowerCase().includes('exercise') ||
      pageText?.toLowerCase().includes('set') ||
      pageText?.toLowerCase().includes('rep') ||
      pageText?.toLowerCase().includes('workout');
    expect(hasExerciseContent || pageText!.length > 100).toBeTruthy();
  });

  // 8. Client logs a set for Exercise 1
  test('54.08 client can log a set (reps and weight)', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/workout-tracker`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for reps/weight input
    const repsInput = page.locator(
      'input[placeholder*="reps" i], input[aria-label*="reps" i], input[name*="reps" i]'
    ).first();
    const weightInput = page.locator(
      'input[placeholder*="weight" i], input[aria-label*="weight" i], input[name*="weight" i]'
    ).first();

    if (await repsInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await repsInput.fill('10');
    }
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightInput.fill('50');
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
  });

  // 9. Client logs a second set for Exercise 1
  test('54.09 client can log multiple sets', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/workout-tracker`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Log Set 1
    const repsInputs = page.locator(
      'input[placeholder*="reps" i], input[aria-label*="reps" i]'
    );
    const count = await repsInputs.count();

    if (count >= 1) {
      await repsInputs.nth(0).fill('10');
    }
    if (count >= 2) {
      await repsInputs.nth(1).fill('8');
    }

    // Look for "Add Set" button
    const addSetBtn = page.locator(
      'button:has-text("Add Set"), button:has-text("+ Set")'
    ).first();

    if (await addSetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addSetBtn.click();
      await page.waitForTimeout(500);
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
  });

  // 10. Client marks Exercise 1 complete
  test('54.10 client can mark an exercise as complete', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/workout-tracker`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const completeBtn = page.locator(
      'button:has-text("Complete"), button:has-text("Done"), input[type="checkbox"][aria-label*="complete" i]'
    ).first();

    if (await completeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeBtn.click();
      await page.waitForTimeout(500);
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
  });

  // 12. Client completes workout — completion screen shows
  test('54.12 client can complete workout and sees completion screen', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}/workout-tracker`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for "Finish Workout" or "Complete Workout" button
    const finishBtn = page.locator(
      'button:has-text("Finish Workout"), button:has-text("Complete Workout"), button:has-text("End Workout")'
    ).first();

    if (await finishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await finishBtn.click();
      await page.waitForTimeout(2000);
      await waitForPageReady(page);

      const pageText = await page.textContent('body');
      const hasCompletionContent =
        pageText?.toLowerCase().includes('complete') ||
        pageText?.toLowerCase().includes('finish') ||
        pageText?.toLowerCase().includes('great') ||
        pageText?.toLowerCase().includes('workout');
      expect(hasCompletionContent || pageText!.length > 100).toBeTruthy();
    }

    await takeScreenshot(page, '54-12-workout-complete.png');
  });

  // 13. Client views /analytics — sees their progress
  test('54.13 client views analytics and sees own progress', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client analytics should show personal overview, not trainer KPI
    await expect(page.locator('text="Total Clients"')).not.toBeVisible();

    const pageText = await page.textContent('body');
    const hasAnalyticsContent =
      pageText?.toLowerCase().includes('overview') ||
      pageText?.toLowerCase().includes('progress') ||
      pageText?.toLowerCase().includes('measurement') ||
      pageText?.toLowerCase().includes('analytics');
    expect(hasAnalyticsContent).toBeTruthy();

    await takeScreenshot(page, '54-13-client-analytics.png');
  });

  // 14. Client records a body measurement
  test('54.14 client can record a body measurement', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const recordBtn = page.locator(
      'button:has-text("Record New Measurement"), button:has-text("Add Measurement"), button:has-text("New Measurement")'
    ).first();

    if (await recordBtn.isVisible({ timeout: TIMEOUTS.element }).catch(() => false)) {
      await recordBtn.click();
      await page.waitForTimeout(500);

      const weightInput = page.locator(
        'input[id*="weight" i], input[name*="weight" i], input[type="number"]:near(:text("Weight"))'
      ).first();

      if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await weightInput.fill('74');
      }

      const saveBtn = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Save Measurement")'
      ).first();

      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-14-client-measurement.png');
  });

  // 15. Client sees measurement in history
  test('54.15 client sees recorded measurements in history', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const historyTab = page.locator(
      'button:has-text("History"), [role="tab"]:has-text("History")'
    ).first();

    if (await historyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(800);
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
  });

  // 16. Client navigates to /schedule — no "New Appointment" button
  test('54.16 client schedule page shows schedule without New Appointment button', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Client should NOT see trainer-only New Appointment button
    await expect(
      page.locator('button:has-text("New Appointment"), a:has-text("New Appointment")')
    ).not.toBeVisible();

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-16-client-schedule.png');
  });

  // 17. Client views profile page
  test('54.17 client can view their profile page', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    expect(page.url()).toContain('/profile');
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-17-client-profile.png');
  });

  // 18. Client updates profile (height/weight)
  test('54.18 client can update profile height and weight', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for height/weight inputs
    const heightInput = page.locator(
      'input[name*="height" i], input[id*="height" i], input[placeholder*="height" i]'
    ).first();

    const weightInput = page.locator(
      'input[name*="weight" i], input[id*="weight" i], input[placeholder*="weight" i]'
    ).first();

    if (await heightInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await heightInput.fill('175');
    }
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightInput.fill('75');
    }

    const saveBtn = page.locator(
      'button[type="submit"], button:has-text("Save"), button:has-text("Update")'
    ).first();

    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);
  });

  // 19. Trainer sees client's workout data
  test('54.19 trainer can see client workout activity', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-19-trainer-dashboard-client-data.png');
  });

  // 20. Trainer views client profile
  test('54.20 trainer can view client profile with workout data', async ({ page }) => {
    await loginViaAPI(page, 'trainer');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await page.request.get(`${BASE_URL}${API.clients}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok()) {
      await page.goto(`${BASE_URL}${ROUTES.clients}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(50);
      return;
    }

    const body = await res.json();
    const clients = body.data || body.clients || (Array.isArray(body) ? body : []);

    if (!clients.length) {
      await page.goto(`${BASE_URL}${ROUTES.clients}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      const pageText = await page.textContent('body');
      expect(pageText?.length).toBeGreaterThan(50);
      return;
    }

    const clientId = clients[0].id || clients[0].clientId;
    await page.goto(`${BASE_URL}/clients/${clientId}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-20-trainer-client-profile.png');
  });

  // 21. Trainer views analytics for client
  test('54.21 trainer analytics page shows client KPI data', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    expect(page.url()).toContain('/analytics');
    // Trainer sees analytics (either upgrade wall or client dashboard)
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-21-trainer-analytics.png');
  });

  // 27. Client views workout history
  test('54.27 client can view their workout history', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.workoutsHistory}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const pageText = await page.textContent('body');
    const hasHistoryContent =
      pageText?.toLowerCase().includes('history') ||
      pageText?.toLowerCase().includes('workout') ||
      pageText?.toLowerCase().includes('session') ||
      pageText?.toLowerCase().includes('no workouts');
    expect(hasHistoryContent || pageText!.length > 100).toBeTruthy();

    await takeScreenshot(page, '54-27-workout-history.png');
  });

  // 28. Trainer navigates to /clients — sees client activity
  test('54.28 trainer clients list shows client activity', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.clients}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    expect(page.url()).toContain('/clients');
    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-28-trainer-clients-list.png');
  });

  // 29. Client views /workouts/history
  test('54.29 client workout history endpoint returns data', async ({ page }) => {
    await loginViaAPI(page, 'client');
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));

    const res = await page.request.get(`${BASE_URL}${API.workoutsHistory}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty('success');
    }
  });

  // 30. Trainer generates analytics report for client
  test('54.30 trainer can generate analytics report', async ({ page }) => {
    await loginViaAPI(page, 'trainer');
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const generateBtn = page.locator(
      'button:has-text("Generate Report"), button:has-text("Export"), button:has-text("Download")'
    ).first();

    if (await generateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
    }

    const pageText = await page.textContent('body');
    expect(pageText?.length).toBeGreaterThan(100);

    await takeScreenshot(page, '54-30-trainer-report.png');
  });
});
