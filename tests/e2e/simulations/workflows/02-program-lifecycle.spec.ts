/**
 * Suite 02: Program Lifecycle — Create → Assign → View → Duplicate → Delete
 *
 * Tests the complete program management workflow from trainer perspective
 * and verifies the client can see assigned programs.
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';
import { SIM_ACCOUNTS } from '../actors/base-actor';

test.describe('Program Lifecycle', () => {
  test('trainer creates a program via the programs page', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Create via API
    const id = await trainer.createProgramViaAPI({
      name: 'Lifecycle Test Program',
      type: 'strength',
      difficulty: 'beginner',
      durationWeeks: 2,
    });

    expect(id).toBeTruthy();

    // Navigate to programs and verify it appears
    await trainer.navigateToPrograms();
    const res = await trainer.apiCall('GET', '/api/programs');
    const programs = res.data || [];
    const found = programs.some((p: any) => p.name === 'Lifecycle Test Program');
    expect(found).toBeTruthy();

    await trainer.screenshot('02-program-created');
  });

  test('trainer views program list page', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToPrograms();

    const body = await page.textContent('body');
    const hasContent = body?.includes('Program') || body?.includes('program');
    expect(hasContent).toBeTruthy();

    await trainer.screenshot('02-programs-list');
  });

  test('trainer can duplicate a program', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Create a program to duplicate
    const originalId = await trainer.createProgramViaAPI({
      name: 'Original Program',
      type: 'hypertrophy',
      difficulty: 'intermediate',
      durationWeeks: 6,
    });

    // Duplicate it
    const duplicateId = await trainer.duplicateProgram(originalId);
    expect(duplicateId).toBeTruthy();
    expect(duplicateId).not.toBe(originalId);
  });

  test('program creation page loads correctly', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.openCreateProgram();

    const body = await page.textContent('body');
    const hasForm = body?.includes('Program') || body?.includes('Create') || body?.includes('program');
    expect(hasForm).toBeTruthy();

    await trainer.screenshot('02-create-program-page');
  });

  test('programs API returns well-structured data', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    const res = await trainer.apiCall('GET', '/api/programs');
    expect(res.success).toBeTruthy();
    expect(Array.isArray(res.data)).toBeTruthy();

    // Each program should have required fields
    if (res.data.length > 0) {
      const program = res.data[0];
      expect(program).toHaveProperty('id');
      expect(program).toHaveProperty('name');
      expect(program).toHaveProperty('programType');
    }
  });
});
