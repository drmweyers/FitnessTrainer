/**
 * Suite 09: Admin Operations — User management, System health, Feature flags
 *
 * Tests admin-specific functionality.
 */
import { test, expect } from '@playwright/test';
import { AdminActor } from '../actors/admin-actor';

test.describe('Admin Operations', () => {
  test('admin dashboard loads', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();
    await admin.navigateToDashboard();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await admin.screenshot('09-admin-dashboard');
  });

  test('admin panel loads', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();
    await admin.navigateToAdminPanel();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await admin.screenshot('09-admin-panel');
  });

  test('admin can list all users via API', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();

    const users = await admin.listUsers();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
  });

  test('admin can filter users by role', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();

    const trainers = await admin.listUsers({ role: 'trainer' });
    expect(Array.isArray(trainers)).toBeTruthy();

    const clients = await admin.listUsers({ role: 'client' });
    expect(Array.isArray(clients)).toBeTruthy();
  });

  test('admin can check system health', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();

    const health = await admin.checkSystemHealth();
    expect(health).toBeTruthy();
  });

  test('admin dashboard metrics API returns data', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();

    const metrics = await admin.getDashboardMetrics();
    expect(metrics).toBeTruthy();
  });

  test('admin can view feature flags', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();

    const flags = await admin.getFeatureFlags();
    expect(flags).toBeTruthy();
  });

  test('admin users page loads in UI', async ({ page }) => {
    const admin = new AdminActor(page);
    await admin.login();
    await admin.navigateToUsers();

    const body = await page.textContent('body');
    expect(body).not.toContain('Something went wrong');

    await admin.screenshot('09-admin-users');
  });
});
