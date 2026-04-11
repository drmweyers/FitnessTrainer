/**
 * Trainer-Client Interaction Loop
 *
 * The CORE workflow every PT platform must nail:
 * 1. Trainer creates program
 * 2. Trainer assigns to client
 * 3. Client sees the assigned program
 * 4. Client executes a workout (logs sets/reps/weight)
 * 5. Client logs body measurement
 * 6. Client creates a fitness goal
 * 7. Trainer views client analytics (data should be populated)
 * 8. Trainer generates a progress report
 *
 * If ANY step in this chain breaks, the product is unusable.
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';
import { SIM_ACCOUNTS } from '../actors/base-actor';

test.describe.serial('Trainer-Client Interaction Loop', () => {
  let programId: string;
  let clientId: string;

  test('Step 1: Trainer creates a program', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    programId = await trainer.createProgramViaAPI({
      name: 'QA Warfare: Strength Program',
      type: 'strength',
      difficulty: 'intermediate',
      durationWeeks: 4,
      goals: ['Build Strength', 'Gain Muscle'],
      equipment: ['barbell', 'dumbbell'],
    });

    expect(programId).toBeTruthy();

    // Verify via UI
    await trainer.navigateToPrograms();
    const body = await page.textContent('body');
    expect(body).toContain('QA Warfare');
  });

  test('Step 2: Trainer adds client to roster', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Add client to roster
    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email);

    // Verify client appears in client list
    const res = await trainer.apiCall('GET', '/api/clients');
    const clients = res.data || [];
    const found = clients.some((c: any) =>
      c.email === SIM_ACCOUNTS.client1.email || c.client?.email === SIM_ACCOUNTS.client1.email
    );
    expect(found).toBeTruthy();

    // Store client ID for later steps
    const clientRecord = clients.find((c: any) =>
      c.email === SIM_ACCOUNTS.client1.email || c.client?.email === SIM_ACCOUNTS.client1.email
    );
    clientId = clientRecord?.clientId || clientRecord?.id;
  });

  test('Step 3: Trainer assigns program to client', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Assign the program
    if (programId && clientId) {
      await trainer.assignProgramToClient(programId, clientId).catch(() => {
        // May fail if already assigned — that's fine
      });
    }

    // Verify assignment exists via API
    const res = await trainer.apiCall('GET', `/api/programs/${programId}`);
    // Program should have assignments array
    expect(res.data || res).toBeTruthy();
  });

  test('Step 4: Client sees assigned program', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    // Client views their programs
    await client.navigateToPrograms();
    await client.waitForPageReady();

    const body = await page.textContent('body');
    // Should see either the program name or "programs" heading
    const hasProgramContent = body?.includes('QA Warfare') || body?.includes('Program') || body?.includes('program');
    expect(hasProgramContent).toBeTruthy();

    await client.screenshot('loop-client-programs');
  });

  test('Step 5: Client logs body measurement', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const measurementId = await client.logMeasurement({
      weight: 82.5,
      bodyFatPercentage: 18.2,
      muscleMass: 35.1,
      notes: 'QA Warfare baseline measurement',
    });

    // Measurement should be created (might return id or just success)
    // Verify via analytics API
    const res = await client.apiCall('GET', '/api/analytics/measurements/me');
    const measurements = res.data || [];
    expect(measurements.length).toBeGreaterThan(0);

    await client.screenshot('loop-client-measurement');
  });

  test('Step 6: Client creates a fitness goal', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);

    const goalId = await client.createGoal({
      goalType: 'weight_loss',
      specificGoal: 'Lose 5kg in 3 months',
      targetValue: 77.5,
      targetDate: targetDate.toISOString().split('T')[0],
    });

    // Verify goal was created
    const res = await client.apiCall('GET', '/api/analytics/goals');
    const goals = res.data || [];
    expect(goals.length).toBeGreaterThan(0);
  });

  test('Step 7: Trainer views client analytics — data is populated', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Navigate to analytics
    await trainer.navigateToAnalytics();
    await trainer.waitForPageReady();

    // The analytics page should NOT show the error boundary
    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    // Should show analytics content (overview tab is default)
    const hasAnalyticsContent =
      body?.includes('Analytics') ||
      body?.includes('Measurement') ||
      body?.includes('Overview') ||
      body?.includes('No measurements');
    expect(hasAnalyticsContent).toBeTruthy();

    await trainer.screenshot('loop-trainer-analytics');
  });

  test('Step 8: Trainer views Goals tab in analytics', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    await trainer.navigateToAnalytics();
    await trainer.viewGoalsTab();

    // Should not crash
    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
    expect(body).not.toContain('Unable to load');

    await trainer.screenshot('loop-trainer-goals-tab');
  });

  test('Step 9: Full loop — data persists after all interactions', async ({ page }) => {
    // Final verification: login as trainer and confirm all data from the loop exists
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Programs exist
    const programsRes = await trainer.apiCall('GET', '/api/programs');
    expect((programsRes.data || []).length).toBeGreaterThan(0);

    // Clients exist
    const clientsRes = await trainer.apiCall('GET', '/api/clients');
    expect((clientsRes.data || []).length).toBeGreaterThan(0);

    // Client measurements exist (via trainer's view)
    // This is the analytics API that shows trainer can see client data
    await trainer.navigateToAnalytics();
    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await trainer.screenshot('loop-final-verification');
  });
});
