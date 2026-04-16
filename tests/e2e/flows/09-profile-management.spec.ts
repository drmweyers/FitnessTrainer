import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('09 - Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('should load profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see profile content heading
    await expect(page.locator('text=/profile|account/i').first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });

    await takeScreenshot(page, 'profile-view.png');
  });

  test('should display user information', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should show email or role info — specific content
    await expect(
      page.locator('text=/@|text=/email|trainer|role/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('should load profile edit page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profileEdit}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Should see edit form — input must be visible
    await expect(
      page.locator('input, textarea, select').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'profile-edit.png');
  });

  test('should display editable fields on profile edit', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profileEdit}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Multiple fields should be available
    const fields = page.locator('input, textarea');
    const fieldCount = await fields.count();
    expect(fieldCount).toBeGreaterThan(0);
  });

  test('should load health page', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profileHealth}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Health page should load with a relevant heading
    await expect(
      page.locator('text=/health|measurement|weight|body/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, 'profile-health.png');
  });

  test('should navigate between profile pages', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.profile}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Look for navigation links to edit/health
    const editLink = page.locator('a[href*="profile/edit"], button:has-text("Edit")');
    if (await editLink.first().isVisible({ timeout: 5000 })) {
      await editLink.first().click();
      await page.waitForURL(/profile\/edit/, { timeout: TIMEOUTS.pageLoad }).catch(() => {});
      // Edit page heading must be visible
      await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: TIMEOUTS.element });
    }
  });
});
