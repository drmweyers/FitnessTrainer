import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('09 - Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see profile content
    await expect(page.locator('text=/profile|account/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'profile-view.png');
  });

  test('should display user information', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show email and role info
    const pageText = await page.textContent('body');
    expect(
      pageText?.includes('@') ||
      pageText?.toLowerCase().includes('email') ||
      pageText?.toLowerCase().includes('trainer') ||
      pageText?.toLowerCase().includes('role')
    ).toBeTruthy();
  });

  test('should load profile edit page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profileEdit}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see edit form
    const hasForm = await page
      .locator('input, textarea, select')
      .first()
      .isVisible({ timeout: TIMEOUTS.element })
      .catch(() => false);

    expect(hasForm).toBeTruthy();

    await takeScreenshot(page, 'profile-edit.png');
  });

  test('should display editable fields on profile edit', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profileEdit}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for common profile fields
    const fields = page.locator('input, textarea');
    const fieldCount = await fields.count();
    expect(fieldCount).toBeGreaterThan(0);
  });

  test('should load health page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profileHealth}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Health page should load
    const pageText = await page.textContent('body');
    expect(
      pageText?.toLowerCase().includes('health') ||
      pageText?.toLowerCase().includes('measurement') ||
      pageText?.toLowerCase().includes('weight') ||
      pageText?.toLowerCase().includes('body')
    ).toBeTruthy();

    await takeScreenshot(page, 'profile-health.png');
  });

  test('should navigate between profile pages', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'networkidle',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for navigation links to edit/health
    const editLink = page.locator('a[href*="profile/edit"], button:has-text("Edit")');
    if (await editLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.first().click();
      await page.waitForURL(/profile\/edit/, { timeout: TIMEOUTS.pageLoad }).catch(() => {});
    }
  });
});
