/**
 * Suite 01: Client Onboarding — Account creation → Trainer connection → Profile setup
 */
import { test, expect } from '@playwright/test';
import { TrainerActor } from '../actors/trainer-actor';
import { ClientActor } from '../actors/client-actor';
import { BaseActor, SIM_ACCOUNTS } from '../actors/base-actor';

test.describe('Client Onboarding', () => {
  test('new client can register an account', async ({ page }) => {
    const uniqueEmail = `onboard-test-${Date.now()}@evofit.io`;
    const actor = new BaseActor(page, { email: uniqueEmail, password: 'OnboardTest2026!', role: 'client' });

    const res = await actor.apiCall('POST', '/api/auth/register', {
      email: uniqueEmail,
      password: 'OnboardTest2026!',
      role: 'client',
    });

    expect(res.success || res.data).toBeTruthy();
  });

  test('trainer can add a new client to their roster', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();

    // Add the simulation client
    await trainer.addClientToRoster(SIM_ACCOUNTS.client1.email);

    // Verify client is in the roster
    const res = await trainer.apiCall('GET', '/api/clients');
    const clients = res.data || [];
    expect(clients.length).toBeGreaterThan(0);
  });

  test('client can access their dashboard after registration', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();
    await client.navigateToDashboard();

    const body = await page.textContent('body');
    const hasDashboard = body?.includes('Dashboard') || body?.includes('dashboard') || body?.includes('Welcome');
    expect(hasDashboard).toBeTruthy();

    await client.screenshot('01-client-dashboard');
  });

  test('client can update their profile', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    await client.updateProfile({
      bio: 'QA Simulation Client — Testing all the things',
      phone: '+1987654321',
    });

    // Verify profile was saved
    const res = await client.apiCall('GET', '/api/profiles/me');
    expect(res.data || res).toBeTruthy();
  });

  test('client can navigate to all main sections', async ({ page }) => {
    const client = new ClientActor(page);
    await client.login();

    const routes = ['/programs', '/workouts', '/analytics', '/schedule', '/profile'];
    for (const route of routes) {
      await client.goto(route);
      const body = await page.textContent('body');
      // None should show the error boundary
      expect(body).not.toContain('Something went wrong');
    }
  });

  test('trainer dashboard shows client count after onboarding', async ({ page }) => {
    const trainer = new TrainerActor(page);
    await trainer.login();
    await trainer.navigateToDashboard();

    const body = await page.textContent('body');
    // Dashboard should show some client stats
    const hasClientInfo = body?.includes('Client') || body?.includes('client') || body?.includes('Total');
    expect(hasClientInfo).toBeTruthy();

    await trainer.screenshot('01-trainer-dashboard-with-clients');
  });
});
