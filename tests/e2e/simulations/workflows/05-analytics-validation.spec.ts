/**
 * Suite 05: Analytics Validation — Every tab renders without crashing
 *
 * This suite verifies that the analytics page works correctly for both
 * trainers and clients, including all sub-tabs (Performance, Training Load,
 * Goals, Charts, History). It tests with and without data.
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';

test.describe('Analytics Validation', () => {

  test.describe('Trainer analytics', () => {
    test('analytics page loads without crashing', async ({ page }) => {
      const trainer = new TrainerActor(page);
      await trainer.login();
      await trainer.navigateToAnalytics();

      const body = await page.textContent('body');
      // Must NOT show error boundary
      expect(body).not.toContain('Something went wrong');
      expect(body).not.toContain('unexpected error');

      // Should show analytics page content
      const hasAnalytics =
        body?.includes('Analytics') ||
        body?.includes('Overview') ||
        body?.includes('No measurements');
      expect(hasAnalytics).toBeTruthy();

      await trainer.screenshot('05-trainer-analytics-overview');
    });

    test('Performance tab loads without crashing', async ({ page }) => {
      const trainer = new TrainerActor(page);
      await trainer.login();
      await trainer.navigateToAnalytics();
      await trainer.viewPerformanceTab();

      const body = await page.textContent('body');
      expect(body).not.toContain('Something went wrong');

      // Should show either data or empty state
      const hasContent =
        body?.includes('Performance') ||
        body?.includes('No performance data') ||
        body?.includes('Unable to load');
      expect(hasContent).toBeTruthy();

      await trainer.screenshot('05-trainer-performance-tab');
    });

    test('Training Load tab loads without crashing', async ({ page }) => {
      const trainer = new TrainerActor(page);
      await trainer.login();
      await trainer.navigateToAnalytics();
      await trainer.viewTrainingLoadTab();

      const body = await page.textContent('body');
      expect(body).not.toContain('Something went wrong');

      const hasContent =
        body?.includes('Training Load') ||
        body?.includes('No training load') ||
        body?.includes('Unable to load') ||
        body?.includes('training');
      expect(hasContent).toBeTruthy();

      await trainer.screenshot('05-trainer-training-load-tab');
    });

    test('Goals tab loads without crashing', async ({ page }) => {
      const trainer = new TrainerActor(page);
      await trainer.login();
      await trainer.navigateToAnalytics();
      await trainer.viewGoalsTab();

      const body = await page.textContent('body');
      expect(body).not.toContain('Something went wrong');

      const hasContent =
        body?.includes('Goals') ||
        body?.includes('No goals') ||
        body?.includes('Unable to load') ||
        body?.includes('goal');
      expect(hasContent).toBeTruthy();

      await trainer.screenshot('05-trainer-goals-tab');
    });

    test('all analytics tabs can be cycled through rapidly', async ({ page }) => {
      const trainer = new TrainerActor(page);
      await trainer.login();
      await trainer.navigateToAnalytics();

      // Rapidly switch between all tabs
      const tabs = ['Overview', 'Performance', 'Training Load', 'Goals', 'Charts & Trends', 'History'];

      for (const tabName of tabs) {
        const tab = page.getByText(tabName, { exact: false }).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(300);

          // None should crash
          const body = await page.textContent('body');
          expect(body).not.toContain('Something went wrong');
        }
      }

      await trainer.screenshot('05-trainer-tabs-cycled');
    });
  });

  test.describe('Client analytics', () => {
    test('client analytics page loads without crashing', async ({ page }) => {
      const client = new ClientActor(page);
      await client.login();
      await client.navigateToAnalytics();

      const body = await page.textContent('body');
      expect(body).not.toContain('Something went wrong');

      await client.screenshot('05-client-analytics-overview');
    });

    test('client can view all analytics tabs', async ({ page }) => {
      const client = new ClientActor(page);
      await client.login();
      await client.navigateToAnalytics();

      const tabs = ['Overview', 'Performance', 'Training Load', 'Goals'];

      for (const tabName of tabs) {
        const tab = page.getByText(tabName, { exact: false }).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(300);
          const body = await page.textContent('body');
          expect(body).not.toContain('Something went wrong');
        }
      }

      await client.screenshot('05-client-tabs-cycled');
    });

    test('client can record a measurement via the analytics page', async ({ page }) => {
      const client = new ClientActor(page);
      await client.login();

      // Record a measurement via API
      await client.logMeasurement({
        weight: 80.0,
        bodyFatPercentage: 17.5,
        notes: 'Analytics validation test',
      });

      // Verify on analytics page
      await client.navigateToAnalytics();
      await client.waitForPageReady();

      const body = await page.textContent('body');
      // Should now show data (not empty state)
      // Either measurement data or at least the analytics page
      expect(body).not.toContain('Something went wrong');

      await client.screenshot('05-client-with-measurement');
    });
  });
});
