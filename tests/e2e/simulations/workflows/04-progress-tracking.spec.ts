/**
 * Suite 04: Progress Tracking — Measurements, Goals, Goal Progress
 *
 * Tests the full progress tracking loop:
 * Client logs measurements → creates goals → updates progress → views analytics
 */
import { test, expect } from '@playwright/test';
import { ClientActor } from '../actors/client-actor';

test.describe('Progress Tracking', () => {
  test('client logs a body measurement via API', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const id = await client.logMeasurement({
      weight: 83.0,
      bodyFatPercentage: 19.0,
      muscleMass: 34.5,
      notes: 'Progress tracking test',
    });

    // Verify the measurement exists
    const res = await client.apiCall('GET', '/api/analytics/measurements/me');
    expect((res.data || []).length).toBeGreaterThan(0);
  });

  test('client creates a fitness goal via API', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 2);

    const goalId = await client.createGoal({
      goalType: 'muscle_gain',
      specificGoal: 'Gain 2kg lean muscle mass',
      targetValue: 36.5,
      targetDate: targetDate.toISOString().split('T')[0],
    });

    // Verify goal was created
    const res = await client.apiCall('GET', '/api/analytics/goals');
    expect((res.data || []).length).toBeGreaterThan(0);
  });

  test('client views analytics overview with measurement data', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    // Seed a measurement first
    await client.logMeasurement({ weight: 81.0, bodyFatPercentage: 17.0 });

    // View analytics
    await client.viewAnalyticsOverview();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await client.screenshot('04-progress-analytics');
  });

  test('client views goals tab', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    await client.viewGoals();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');
    // Should have some goals content
    const hasGoals = body?.includes('Goals') || body?.includes('goal') || body?.includes('No goals');
    expect(hasGoals).toBeTruthy();

    await client.screenshot('04-goals-tab');
  });

  test('measurements API returns correct data shape', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const res = await client.apiCall('GET', '/api/analytics/measurements/me');
    expect(res.success).toBeTruthy();
    expect(Array.isArray(res.data)).toBeTruthy();

    if (res.data.length > 0) {
      const m = res.data[0];
      expect(m).toHaveProperty('measurementDate');
      // Should have at least one metric
      const hasMetric = m.weight || m.bodyFatPercentage || m.muscleMass;
      expect(hasMetric).toBeTruthy();
    }
  });
});
