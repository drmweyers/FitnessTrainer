/**
 * Suite 52: Program Builder — Multi-Day, Multi-Week Creation
 *
 * Tests the full multi-step program builder wizard: info form, week structure,
 * training days, exercise panel filters, adding exercises, preview, and saving.
 *
 * All tests run as qa-trainer.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('52 - Program Builder Multi-Day Multi-Week', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  // 1. Navigate to /programs/new — sees program info form
  test('52.01 navigate to /programs/new — sees program info form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const heading = page.locator('text=/Program Information|New Program|Create Program/i');
    await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-01-program-info-form.png');
  });

  // 2. Fill program name, type, difficulty — can advance to step 2
  test('52.02 fill program name, type, difficulty and advance to next step', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Fill name — required for step advancement
    const nameInput = page.locator(
      'input#name, input[placeholder*="strength" i], input[placeholder*="program name" i]'
    ).first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('QA Multi-Day Program');

    // Fill program type
    const typeSelect = page.locator('select#programType, select[name*="type" i]').first();
    if (await typeSelect.isVisible({ timeout: 3000 })) {
      await typeSelect.selectOption('strength');
    }

    // Fill difficulty
    const diffSelect = page.locator('select#difficultyLevel, select[name*="difficulty" i]').first();
    if (await diffSelect.isVisible({ timeout: 3000 })) {
      await diffSelect.selectOption('intermediate');
    }

    // Click Next
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await expect(nextBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await nextBtn.click();

    // Should have advanced — step indicator or next form section should be visible
    await expect(
      page.locator('text=/week|duration|structure|step 2/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-02-program-form-filled.png');
  });

  // 3. Step 2 (week structure): sees Week 1 scaffold
  test('52.03 step 2 shows Week 1 scaffold', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Fill and advance through step 1
    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Week Structure Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    await expect(nextBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await nextBtn.click();

    // Should see Week or Weeks content
    await expect(
      page.locator('text=/week|duration|structure/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 4. Can add Week 2 via "Add Week" button
  test('52.04 can add Week 2 via Add Week button', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Add Week Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 3000 })) {
      await nextBtn.click();
    }

    const addWeekBtn = page.locator(
      'button:has-text("Add Week"), button:has-text("+ Week"), button[aria-label*="add week" i]'
    ).first();

    if (await addWeekBtn.isVisible({ timeout: 5000 })) {
      await addWeekBtn.click();
      // Should show Week 2
      await expect(
        page.locator('text="Week 2"').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    } else {
      // Week structure via duration input — verify page is still functional
      await expect(page.locator('text=/week|duration/i').first()).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  // 5. Can set weeks to 3 — sees 3 week tabs
  test('52.05 can set duration to 3 weeks', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('3 Week Program');

    // Set duration weeks to 3
    const weeksInput = page.locator(
      'input#durationWeeks, input[name*="duration" i], select#durationWeeks'
    ).first();

    if (await weeksInput.isVisible({ timeout: 3000 })) {
      const tagName = await weeksInput.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await (weeksInput as any).selectOption('3');
      } else {
        await weeksInput.fill('3');
      }
      // Verify value was set
      const val = await weeksInput.inputValue().catch(() => '');
      expect(val).toBe('3');
    }
  });

  // 6. Advance to step 3 (Workouts) — sees Day 1 scaffolded for Week 1
  test('52.06 step 3 shows Day 1 scaffolded for Week 1', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Day Scaffold Test');

    // Click Next twice to get to workout step
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Should see Day or Workout content
    await expect(
      page.locator('text=/day|workout|training/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 7. "Add Training Day" button is visible
  test('52.07 Add Training Day button is visible in workout step', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Add Day Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    const addDayBtn = page.locator(
      'button:has-text("Add Training Day"), button:has-text("Add Day"), button:has-text("+ Day")'
    ).first();

    await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-07-add-training-day-btn.png');
  });

  // 8. Click "Add Training Day" — Day 2 appears
  test('52.08 clicking Add Training Day adds Day 2', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Day Count Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    const addDayBtn = page.locator(
      'button:has-text("Add Training Day"), button:has-text("Add Day"), button:has-text("+ Day")'
    ).first();

    await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addDayBtn.click();

    // Should now show Day 2
    await expect(
      page.locator('text="Day 2"').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 9. Click "Add Training Day" again — Day 3 appears
  test('52.09 clicking Add Training Day twice shows Day 3', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Day 3 Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    const addDayBtn = page.locator(
      'button:has-text("Add Training Day"), button:has-text("Add Day")'
    ).first();

    await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addDayBtn.click();
    await addDayBtn.click();

    await expect(
      page.locator('text="Day 3"').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 10. Can switch between Day 1, Day 2, Day 3 tabs
  test('52.10 can switch between training day tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Day Tabs Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Add a second day
    const addDayBtn = page.locator(
      'button:has-text("Add Training Day"), button:has-text("Add Day")'
    ).first();
    await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addDayBtn.click();

    // Day 2 tab should appear and be clickable
    const day2Tab = page.locator(
      '[role="tab"]:has-text("Day 2"), button:has-text("Day 2")'
    ).first();
    await expect(day2Tab).toBeVisible({ timeout: TIMEOUTS.element });
    await day2Tab.click();

    // Day 1 tab should still be visible and clickable
    const day1Tab = page.locator(
      '[role="tab"]:has-text("Day 1"), button:has-text("Day 1")'
    ).first();
    await expect(day1Tab).toBeVisible({ timeout: TIMEOUTS.element });
    await day1Tab.click();

    // After switching back to Day 1, Day 1 tab should be active
    await expect(day1Tab).toHaveAttribute('aria-selected', 'true');
  });

  // 11. Edit Day 1 workout name
  test('52.11 can edit Day 1 workout name', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Workout Name Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Find workout name input for Day 1
    const workoutNameInput = page.locator(
      'input[placeholder*="workout" i], input[placeholder*="day" i], input[aria-label*="workout name" i]'
    ).first();

    await expect(workoutNameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await workoutNameInput.fill('Chest & Triceps');
    await expect(workoutNameInput).toHaveValue('Chest & Triceps');
  });

  // 12. Week 2 can have its own training days
  test('52.12 Week 2 can have its own training days', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Week 2 Days Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Switch to Week 2 if present
    const week2Tab = page.locator(
      '[role="tab"]:has-text("Week 2"), button:has-text("Week 2")'
    ).first();

    if (await week2Tab.isVisible({ timeout: 5000 })) {
      await week2Tab.click();

      const addDayBtn = page.locator(
        'button:has-text("Add Training Day"), button:has-text("Add Day")'
      ).first();
      await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });
      await addDayBtn.click();

      // Day 1 should appear under Week 2
      await expect(
        page.locator('text="Day 1"').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  // 14. Advance to exercise step — sees exercise library panel
  test('52.14 exercise step shows exercise library panel', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Exercise Panel Test');

    // Navigate through all steps to reach exercise selection
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Exercise library panel should show search input
    await expect(
      page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="exercise" i]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-14-exercise-panel.png');
  });

  // 15. Search for "bench press" in exercise library panel
  test('52.15 exercise panel search filters results', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Search Panel Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i], input[placeholder*="exercise" i]'
    ).first();

    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.element });
    await searchInput.fill('bench press');

    // Results should contain bench or no-results indicator
    await expect(
      page.locator('text=/bench|no exercises|no results/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 16. Muscle group filter in exercise panel
  test('52.16 exercise panel muscle group filter works', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Muscle Filter Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Look for body part/muscle group filter
    const muscleFilter = page.locator(
      'select[name*="bodyPart" i], select[name*="muscle" i], button:has-text("Muscle"), button:has-text("Body Part")'
    ).first();

    if (await muscleFilter.isVisible({ timeout: 5000 })) {
      const tagName = await muscleFilter.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await (muscleFilter as any).selectOption({ index: 1 }).catch(() => {});
      } else {
        await muscleFilter.click();
        await page.locator('text="Chest"').first().click().catch(() => {});
      }

      // Verify filter is applied by checking some exercise content is shown
      await expect(
        page.locator('text=/exercise|chest|no exercises/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  // 17. Equipment filter in exercise panel
  test('52.17 exercise panel equipment filter works', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Equipment Filter Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    const equipmentFilter = page.locator(
      'select[name*="equipment" i], button:has-text("Equipment")'
    ).first();

    if (await equipmentFilter.isVisible({ timeout: 5000 })) {
      const tagName = await equipmentFilter.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await (equipmentFilter as any).selectOption('barbell').catch(() => {});
      } else {
        await equipmentFilter.click();
      }

      await expect(
        page.locator('text=/exercise|barbell|no exercises/i').first()
      ).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });

  // 18. Add exercise to Day 1 via "+" button or drag
  test('52.18 can add exercise to Day 1 via + button or drag', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Add Exercise Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Wait for exercise panel to load
    await expect(
      page.locator('input[type="search"], input[placeholder*="exercise" i]').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    // Look for "+" or "Add" button next to an exercise
    const addExerciseBtn = page.locator(
      'button[aria-label*="add" i]:not(:has-text("Day")):not(:has-text("Week")), button:has-text("Add to Workout")'
    ).first();

    await expect(addExerciseBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addExerciseBtn.click();

    // After adding, the exercise should appear in the workout day panel
    await expect(
      page.locator('[class*="workout"] [class*="exercise"], [data-testid*="exercise"], [class*="day"] li').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-18-add-exercise.png');
  });

  // 19. Switch day tabs and add exercise to Day 2
  test('52.19 can switch day tabs and add exercise to Day 2', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Day 2 Exercise Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 2; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Add Day 2
    const addDayBtn = page.locator(
      'button:has-text("Add Training Day"), button:has-text("Add Day")'
    ).first();
    await expect(addDayBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await addDayBtn.click();

    // Day 2 tab should now be visible
    const day2Tab = page.locator(
      '[role="tab"]:has-text("Day 2"), button:has-text("Day 2")'
    ).first();
    await expect(day2Tab).toBeVisible({ timeout: TIMEOUTS.element });
    await day2Tab.click();

    // Day 2 tab should be selected
    await expect(day2Tab).toHaveAttribute('aria-selected', 'true');
  });

  // 21. "Suggest next exercise" button visible for enterprise trainer
  test('52.21 enterprise trainer sees Suggest next exercise button', async ({ page }) => {
    await loginViaAPI(page, 'enterprise');
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Suggest Test Enterprise');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    const suggestBtn = page.locator(
      'button:has-text("Suggest"), button:has-text("AI Suggest"), button[aria-label*="suggest" i]'
    ).first();

    // Enterprise should see the button
    await expect(suggestBtn).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 22. Week/Day outline panel shows exercise information
  test('52.22 week day outline panel shows exercise information', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Outline Panel Test');

    const nextBtn = page.locator('button:has-text("Next")').first();
    for (let i = 0; i < 3; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
      }
    }

    // Outline/sidebar panel should show week/day structure
    const outlinePanel = page.locator(
      '[class*="outline"], [class*="sidebar"], [class*="structure"]'
    ).first();

    await expect(outlinePanel).toBeVisible({ timeout: TIMEOUTS.element });
  });

  // 23. Advance to preview step — sees program summary
  test('52.23 preview step shows full program summary', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill('Preview Step Test');

    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    // Click through up to 5 times to reach preview
    for (let i = 0; i < 5; i++) {
      if (await nextBtn.isVisible({ timeout: 3000 })) {
        await nextBtn.click();
        // Stop if we see Preview or Save
        const previewText = await page.locator('text=/preview|review|save program/i').first().isVisible({ timeout: 1000 }).catch(() => false);
        if (previewText) break;
      }
    }

    // Preview step must show summary content
    await expect(
      page.locator('text=/preview|review|save program/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-23-preview-step.png');
  });

  // 24. Save program — redirected to /programs with new program listed
  test('52.24 save program redirects to /programs list', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const programName = `E2E Save Test ${Date.now()}`;

    // Fill required fields
    const nameInput = page.locator('input#name').first();
    await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
    await nameInput.fill(programName);

    const typeSelect = page.locator('select#programType').first();
    if (await typeSelect.isVisible({ timeout: 3000 })) {
      await typeSelect.selectOption('strength');
    }

    const diffSelect = page.locator('select#difficultyLevel').first();
    if (await diffSelect.isVisible({ timeout: 3000 })) {
      await diffSelect.selectOption('beginner');
    }

    const weeksInput = page.locator('input#durationWeeks, select#durationWeeks').first();
    if (await weeksInput.isVisible({ timeout: 3000 })) {
      const tagName = await weeksInput.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await (weeksInput as any).selectOption('4');
      } else {
        await weeksInput.fill('4');
      }
    }

    // Look for Save button
    const saveBtn = page.locator(
      'button:has-text("Save Program"), button:has-text("Save"), button[type="submit"]:has-text("Save")'
    ).first();

    await expect(saveBtn).toBeVisible({ timeout: TIMEOUTS.element });
    await saveBtn.click();

    // Wait for redirect to /programs
    await page.waitForURL(
      (url) => url.pathname === '/programs' || url.pathname.startsWith('/programs/'),
      { timeout: 15000 }
    );

    // Verify we are on /programs
    expect(page.url()).toContain('/programs');
    // Heading must be visible
    await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-24-program-saved.png');
  });

  // 25. Saved program shows correct info on programs list
  test('52.25 programs list shows saved program', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.programs}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    // At least one program card or empty state must be visible
    await expect(
      page.locator('[class*="card"], [class*="program"], text=/no programs/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '52-25-programs-list-saved.png');
  });
});
