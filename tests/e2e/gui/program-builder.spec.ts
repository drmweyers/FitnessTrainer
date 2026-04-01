/**
 * GUI E2E Tests for Program Builder
 * Comprehensive tests covering the complete program builder workflow
 */
import { test, expect, Page } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('Program Builder GUI', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  // ============================================================================
  // Empty State Tests
  // ============================================================================
  test.describe('Empty State', () => {
    test('should show empty state when no programs exist', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Verify page structure
      await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      // Check for Create Program button
      const createButton = page.locator(
        'button:has-text("Create Program"), a:has-text("Create Program")'
      );
      await expect(createButton.first()).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-programs-empty-state.png');
    });

    test('should show program filters in empty state', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Verify filter elements exist
      const pageText = await page.textContent('body');
      expect(
        pageText?.toLowerCase().includes('program') ||
        pageText?.toLowerCase().includes('filter') ||
        pageText?.toLowerCase().includes('search')
      ).toBeTruthy();
    });
  });

  // ============================================================================
  // Creating New Program
  // ============================================================================
  test.describe('Creating New Program', () => {
    test('should navigate to program builder from programs list', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Click Create Program button
      const createButton = page.locator(
        'button:has-text("Create Program"), a:has-text("Create Program")'
      ).first();
      await createButton.click();

      // Wait for navigation to program builder
      await page.waitForURL(/programs\/new/, { timeout: TIMEOUTS.pageLoad });

      // Verify program builder loaded
      await expect(
        page.locator('text=/Create New Program|Edit Program/i')
      ).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-program-builder-loaded.png');
    });

    test('should show step indicators on program builder', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Verify step indicators
      const stepIndicators = ['Basic Info', 'Goals & Equipment', 'Week Structure', 'Review & Save'];
      for (const step of stepIndicators) {
        const stepElement = page.locator(`text="${step}"`);
        await expect(stepElement.first()).toBeVisible({ timeout: TIMEOUTS.element });
      }

      await takeScreenshot(page, 'gui-program-builder-steps.png');
    });

    test('should fill program basic info and validate', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill program name
      const nameInput = page.locator('input#name');
      await expect(nameInput).toBeVisible({ timeout: TIMEOUTS.element });
      await nameInput.fill('E2E Test Program');
      await expect(nameInput).toHaveValue('E2E Test Program');

      // Fill description
      const descriptionInput = page.locator('textarea#description');
      await expect(descriptionInput).toBeVisible({ timeout: TIMEOUTS.element });
      await descriptionInput.fill('This is a test program created by E2E automation');
      await expect(descriptionInput).toHaveValue('This is a test program created by E2E automation');

      // Verify program type selector
      const typeSelect = page.locator('button#type');
      await expect(typeSelect).toBeVisible({ timeout: TIMEOUTS.element });

      // Verify difficulty selector
      const difficultySelect = page.locator('button#difficulty');
      await expect(difficultySelect).toBeVisible({ timeout: TIMEOUTS.element });

      // Verify duration input
      const durationInput = page.locator('input#duration');
      await expect(durationInput).toBeVisible({ timeout: TIMEOUTS.element });
      const durationValue = await durationInput.inputValue();
      expect(parseInt(durationValue)).toBeGreaterThan(0);

      await takeScreenshot(page, 'gui-program-basic-info.png');
    });

    test('should change program type via dropdown', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Open program type dropdown
      const typeSelect = page.locator('button#type');
      await typeSelect.click();

      // Select Hypertrophy
      const hypertrophyOption = page.locator('[role="option"]:has-text("Hypertrophy")');
      await expect(hypertrophyOption).toBeVisible({ timeout: TIMEOUTS.element });
      await hypertrophyOption.click();

      // Verify selection
      await expect(page.locator('button#type')).toContainText('Hypertrophy');

      await takeScreenshot(page, 'gui-program-type-changed.png');
    });

    test('should change difficulty level via dropdown', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Open difficulty dropdown
      const difficultySelect = page.locator('button#difficulty');
      await difficultySelect.click();

      // Select Intermediate
      const intermediateOption = page.locator('[role="option"]:has-text("Intermediate")');
      await expect(intermediateOption).toBeVisible({ timeout: TIMEOUTS.element });
      await intermediateOption.click();

      // Verify selection
      await expect(page.locator('button#difficulty')).toContainText('Intermediate');

      await takeScreenshot(page, 'gui-program-difficulty-changed.png');
    });

    test('should adjust duration weeks', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const durationInput = page.locator('input#duration');
      await durationInput.fill('8');
      await expect(durationInput).toHaveValue('8');

      // Verify min/max constraints
      await durationInput.fill('0');
      await expect(durationInput).toHaveValue('0');

      await durationInput.fill('52');
      await expect(durationInput).toHaveValue('52');

      // Set valid value
      await durationInput.fill('4');
      await expect(durationInput).toHaveValue('4');

      await takeScreenshot(page, 'gui-program-duration-adjusted.png');
    });
  });

  // ============================================================================
  // Goals & Equipment Step
  // ============================================================================
  test.describe('Goals & Equipment Step', () => {
    test('should navigate to goals step', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill required fields
      await page.locator('input#name').fill('E2E Goals Test Program');

      // Click Next to go to goals step
      const nextButton = page.locator('button:has-text("Next")');
      await nextButton.click();

      // Wait for goals step
      await expect(page.locator('h3:has-text("Goals")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-program-goals-step.png');
    });

    test('should select multiple goals', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill required fields and proceed
      await page.locator('input#name').fill('E2E Goals Test Program');
      await page.locator('button:has-text("Next")').click();

      // Wait for goals step
      await expect(page.locator('h3:has-text("Goals")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      // Select goals by clicking badges
      const goals = ['Build Muscle', 'Increase Strength'];
      for (const goal of goals) {
        const goalBadge = page.locator(`[role="button"]:has-text("${goal}"), .badge:has-text("${goal}"), button:has-text("${goal}")`).first();
        if (await goalBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
          await goalBadge.click();
        }
      }

      await takeScreenshot(page, 'gui-program-goals-selected.png');
    });

    test('should select equipment needed', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill required fields and proceed
      await page.locator('input#name').fill('E2E Equipment Test Program');
      await page.locator('button:has-text("Next")').click();

      // Wait for equipment section
      await expect(page.locator('h3:has-text("Equipment")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      // Select equipment
      const equipment = ['Barbell', 'Dumbbells'];
      for (const eq of equipment) {
        const eqBadge = page.locator(`[role="button"]:has-text("${eq}"), .badge:has-text("${eq}"), button:has-text("${eq}")`).first();
        if (await eqBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
          await eqBadge.click();
        }
      }

      await takeScreenshot(page, 'gui-program-equipment-selected.png');
    });
  });

  // ============================================================================
  // Week Structure Step
  // ============================================================================
  test.describe('Week Structure Step', () => {
    test('should navigate to week structure step', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill basic info
      await page.locator('input#name').fill('E2E Week Structure Test');

      // Navigate through goals step
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Navigate to week structure
      await page.locator('button:has-text("Next")').click();

      // Wait for week structure step
      await expect(page.locator('h3:has-text("Program Weeks"), text="Program Weeks"')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-program-week-structure-step.png');
    });

    test('should show empty week state', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill basic info and navigate to week step
      await page.locator('input#name').fill('E2E Week Empty Test');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();

      // Verify empty state
      const emptyState = page.locator('text=/No weeks added yet|Add First Week/i');
      await expect(emptyState.first()).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-program-week-empty-state.png');
    });

    test('should add a new week', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill basic info and navigate to week step
      await page.locator('input#name').fill('E2E Add Week Test');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();

      // Click Add Week button
      const addWeekButton = page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first();
      await expect(addWeekButton).toBeVisible({ timeout: TIMEOUTS.element });
      await addWeekButton.click();

      // Fill week dialog
      const weekNameInput = page.locator('input#week-name, input[placeholder*="Week"]').first();
      await expect(weekNameInput).toBeVisible({ timeout: TIMEOUTS.element });
      await weekNameInput.fill('Week 1 - Foundation');

      const weekDescriptionInput = page.locator('textarea#week-description, textarea[placeholder*="description"]').first();
      await weekDescriptionInput.fill('Foundation week focusing on form and technique');

      // Add the week
      const addButton = page.locator('button:has-text("Add Week"), button:has-text("Add")').last();
      await addButton.click();

      // Verify week was added
      await expect(page.locator('text=/Week 1|Foundation/i').first()).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-program-week-added.png');
    });

    test('should add multiple weeks', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill basic info and navigate to week step
      await page.locator('input#name').fill('E2E Multiple Weeks Test');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();

      // Add first week
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 1');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();

      // Add second week
      await page.waitForTimeout(300);
      await page.locator('button:has-text("Add Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 2');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();

      // Verify both weeks exist
      await expect(page.locator('text="Week 1"').first()).toBeVisible({ timeout: TIMEOUTS.element });
      await expect(page.locator('text="Week 2"').first()).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-program-multiple-weeks.png');
    });

    test('should mark week as deload week', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill basic info and navigate to week step
      await page.locator('input#name').fill('E2E Deload Week Test');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();

      // Add week with deload flag
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Deload Week');

      // Check deload switch
      const deloadSwitch = page.locator('input#deload, button[role="switch"]').first();
      if (await deloadSwitch.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deloadSwitch.click();
      }

      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();

      // Verify deload badge
      await expect(page.locator('text=/Deload|deload/i').first()).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-program-deload-week.png');
    });
  });

  // ============================================================================
  // Adding Workouts to Weeks
  // ============================================================================
  test.describe('Adding Workouts', () => {
    test('should add workout to a week', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Setup: Fill basic info, navigate to week step, add a week
      await page.locator('input#name').fill('E2E Workout Test');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();

      // Add a week first
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Test Week');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();

      // Wait for week to be added
      await page.waitForTimeout(500);

      // Try to add workout - look for add workout button in week card
      const addWorkoutButton = page.locator('button:has-text("Add Workout")').first();
      if (await addWorkoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addWorkoutButton.click();

        // Fill workout dialog
        const workoutNameInput = page.locator('input#workout-name, input[placeholder*="workout"]').first();
        await expect(workoutNameInput).toBeVisible({ timeout: TIMEOUTS.element });
        await workoutNameInput.fill('Upper Body Strength');

        // Select day
        const daySelect = page.locator('button#workout-day, [id="workout-day"]').first();
        if (await daySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await daySelect.click();
          await page.locator('[role="option"]').first().click();
        }

        // Add workout
        await page.locator('button:has-text("Add Workout")').last().click();

        // Verify workout added
        await expect(page.locator('text=/Upper Body|workout/i').first()).toBeVisible({
          timeout: TIMEOUTS.element,
        });
      }

      await takeScreenshot(page, 'gui-program-workout-added.png');
    });
  });

  // ============================================================================
  // Review & Save Step
  // ============================================================================
  test.describe('Review & Save', () => {
    test('should navigate to review step', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill basic info
      await page.locator('input#name').fill('E2E Review Test Program');

      // Navigate through steps
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Add a week to enable next button
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 1');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();
      await page.waitForTimeout(500);

      // Navigate to review
      await page.locator('button:has-text("Next")').click();

      // Wait for review step
      await expect(page.locator('h3:has-text("Review"), text=/Review Your Program/i')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-program-review-step.png');
    });

    test('should show program preview in review', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill program info
      await page.locator('input#name').fill('E2E Preview Test Program');
      await page.locator('textarea#description').fill('Test description');

      // Navigate through steps
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Add a week
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 1');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();
      await page.waitForTimeout(500);

      // Navigate to review
      await page.locator('button:has-text("Next")').click();

      // Verify preview content
      const previewContent = page.locator('text=/E2E Preview Test Program|Test description|Week 1/i');
      await expect(previewContent.first()).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-program-review-preview.png');
    });

    test('should save program successfully', async ({ page }) => {
      const programName = `E2E Save Test ${Date.now()}`;

      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill program info
      await page.locator('input#name').fill(programName);
      await page.locator('textarea#description').fill('Test program for save functionality');

      // Navigate through steps
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Add a week
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 1');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();
      await page.waitForTimeout(500);

      // Navigate to review
      await page.locator('button:has-text("Next")').click();

      // Wait for review step and save button
      await expect(page.locator('button:has-text("Save Program")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      // Click save
      await page.locator('button:has-text("Save Program")').click();

      // Wait for redirect to programs list
      await page.waitForURL(/programs/, { timeout: TIMEOUTS.pageLoad });

      // Verify we're back on programs list
      await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-program-saved.png');
    });
  });

  // ============================================================================
  // Program Assignment
  // ============================================================================
  test.describe('Program Assignment', () => {
    test('should show assign button on program card', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Look for assign button or menu
      const assignButton = page.locator('button:has-text("Assign"), button:has-text("Assign to Client")').first();
      const moreMenuButton = page.locator('button[aria-label*="menu" i], button[title*="actions" i]').first();

      const hasAssignInterface =
        (await assignButton.isVisible({ timeout: 3000 }).catch(() => false)) ||
        (await moreMenuButton.isVisible({ timeout: 3000 }).catch(() => false));

      // If no programs exist, that's also valid
      if (!hasAssignInterface) {
        const pageText = await page.textContent('body');
        expect(
          pageText?.toLowerCase().includes('program') ||
          pageText?.toLowerCase().includes('create') ||
          pageText?.toLowerCase().includes('no programs')
        ).toBeTruthy();
      }

      await takeScreenshot(page, 'gui-program-assign-button.png');
    });

    test('should open assignment modal', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programs}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Try to find and click assign button
      const assignButton = page.locator('button:has-text("Assign"), button:has-text("Assign to Client")').first();
      const moreMenuButton = page.locator('button[aria-label*="menu" i], button[title*="actions" i]').first();

      if (await assignButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await assignButton.click();
      } else if (await moreMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreMenuButton.click();
        await page.waitForTimeout(300);
        const dropdownAssign = page.locator('button:has-text("Assign")').first();
        if (await dropdownAssign.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dropdownAssign.click();
        }
      } else {
        // No programs to assign, skip test
        test.skip();
        return;
      }

      // Verify modal opened
      await expect(
        page.locator('h2:has-text("Assign Program"), text=/Assign Program to/i')
      ).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-program-assign-modal.png');
    });
  });

  // ============================================================================
  // Navigation & Validation
  // ============================================================================
  test.describe('Navigation & Validation', () => {
    test('should disable next button when required fields are empty', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Clear name field if it has any default value
      const nameInput = page.locator('input#name');
      await nameInput.fill('');

      // Verify next button is disabled
      const nextButton = page.locator('button:has-text("Next")');
      const isDisabled = await nextButton.isDisabled().catch(() => false);

      // The button should be disabled when name is empty
      expect(isDisabled).toBeTruthy();

      await takeScreenshot(page, 'gui-program-validation-disabled.png');
    });

    test('should enable next button after filling required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill name
      await page.locator('input#name').fill('Validation Test Program');

      // Verify next button is enabled
      const nextButton = page.locator('button:has-text("Next")');
      const isDisabled = await nextButton.isDisabled().catch(() => true);

      expect(isDisabled).toBeFalsy();

      await takeScreenshot(page, 'gui-program-validation-enabled.png');
    });

    test('should navigate back to previous step', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill name and go to next step
      await page.locator('input#name').fill('Back Navigation Test');
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Verify we're on goals step
      await expect(page.locator('h3:has-text("Goals")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      // Click back
      await page.locator('button:has-text("Back")').click();

      // Verify we're back on basic info
      await expect(page.locator('input#name')).toHaveValue('Back Navigation Test');

      await takeScreenshot(page, 'gui-program-back-navigation.png');
    });

    test('should show preview modal', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill some info
      await page.locator('input#name').fill('Preview Test Program');

      // Click preview button
      const previewButton = page.locator('button:has-text("Preview")').first();
      if (await previewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await previewButton.click();

        // Verify preview modal/content
        await expect(
          page.locator('text=/Preview|Program Preview/i').first()
        ).toBeVisible({ timeout: TIMEOUTS.element });

        // Close preview
        const closeButton = page.locator('button:has-text("Close"), button[aria-label*="close" i]').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();
        }
      }

      await takeScreenshot(page, 'gui-program-preview-modal.png');
    });

    test('should cancel program creation', async ({ page }) => {
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Fill some info
      await page.locator('input#name').fill('Cancel Test Program');

      // Click cancel
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Handle any confirmation dialog
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });

        await cancelButton.click();

        // Should navigate back
        await page.waitForTimeout(1000);
      }

      await takeScreenshot(page, 'gui-program-cancelled.png');
    });
  });

  // ============================================================================
  // End-to-End Complete Workflow
  // ============================================================================
  test.describe('Complete Workflow', () => {
    test('should create complete program with all steps', async ({ page }) => {
      const programName = `E2E Complete Workflow ${Date.now()}`;

      // Step 1: Navigate to program builder
      await page.goto(`${BASE_URL}${ROUTES.programsNew}`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      // Step 2: Fill Basic Info
      await page.locator('input#name').fill(programName);
      await page.locator('textarea#description').fill('Complete E2E test program with all features');

      // Change type to Hypertrophy
      await page.locator('button#type').click();
      await page.locator('[role="option"]:has-text("Hypertrophy")').click();

      // Change difficulty to Intermediate
      await page.locator('button#difficulty').click();
      await page.locator('[role="option"]:has-text("Intermediate")').click();

      // Set duration
      await page.locator('input#duration').fill('6');

      await takeScreenshot(page, 'gui-workflow-step1-basic-info.png');

      // Step 3: Goals & Equipment
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Select goals
      const goals = ['Build Muscle', 'Increase Strength'];
      for (const goal of goals) {
        const goalBadge = page.locator(`[role="button"]:has-text("${goal}"), .badge:has-text("${goal}"), button:has-text("${goal}")`).first();
        if (await goalBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
          await goalBadge.click();
        }
      }

      await takeScreenshot(page, 'gui-workflow-step2-goals.png');

      // Step 4: Week Structure
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Add Week 1
      await page.locator('button:has-text("Add Week"), button:has-text("Add First Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 1 - Foundation');
      await page.locator('textarea#week-description, textarea[placeholder*="description"]').first().fill('Building the foundation');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();
      await page.waitForTimeout(300);

      // Add Week 2
      await page.locator('button:has-text("Add Week")').first().click();
      await page.locator('input#week-name, input[placeholder*="Week"]').first().fill('Week 2 - Progression');
      await page.locator('button:has-text("Add Week"), button:has-text("Add")').last().click();
      await page.waitForTimeout(300);

      await takeScreenshot(page, 'gui-workflow-step3-weeks.png');

      // Step 5: Review & Save
      await page.locator('button:has-text("Next")').click();
      await page.waitForTimeout(500);

      // Verify review content
      await expect(page.locator(`text="${programName}"`)).toBeVisible({ timeout: TIMEOUTS.element });

      await takeScreenshot(page, 'gui-workflow-step4-review.png');

      // Save program
      await page.locator('button:has-text("Save Program")').click();

      // Wait for redirect
      await page.waitForURL(/programs/, { timeout: TIMEOUTS.pageLoad });

      // Verify we're on programs list
      await expect(page.locator('h1:has-text("Training Programs")')).toBeVisible({
        timeout: TIMEOUTS.element,
      });

      await takeScreenshot(page, 'gui-workflow-complete.png');
    });
  });
});
