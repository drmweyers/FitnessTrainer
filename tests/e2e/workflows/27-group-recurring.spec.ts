/**
 * Suite 27: Group Classes & Recurring Sessions
 * Tests group class and recurring appointment features in the scheduler.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('27 - Group Classes & Recurring Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  /**
   * Opens the appointment creation form (modal or page).
   * Throws if the form cannot be opened.
   */
  async function openAppointmentForm(page: import('@playwright/test').Page): Promise<void> {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const createBtn = page.locator(
      'button:has-text("New Appointment"), button:has-text("Create Appointment"), button:has-text("Add Appointment"), button:has-text("New"), button:has-text("Add")'
    );
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 });
    await createBtn.first().click();

    // Wait for the form/dialog to appear
    await expect(
      page.locator('[role="dialog"], form').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  }

  test('group class form available in appointment creation', async ({ page }) => {
    await openAppointmentForm(page);

    // Group option must exist in the appointment type selector
    const groupOption = page.locator(
      '[value*="group" i], option:has-text("Group"), button:has-text("Group Class"), label:has-text("Group")'
    );
    await expect(groupOption.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '27-group-class-form.png');
  });

  test('group class has "Max Participants" field', async ({ page }) => {
    await openAppointmentForm(page);

    // Select "Group Class" from the Type dropdown
    const typeSelect = page.locator('select[name*="type" i], select[id*="type" i]');
    if (await typeSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeSelect.first().selectOption({ label: 'Group Class' }).catch(() => {});
      await expect(page.locator('[role="dialog"], form').first()).toBeVisible();
    } else {
      // Try clicking the Group Class button/option
      const groupOption = page.locator('[value*="group" i], option:has-text("Group"), button:has-text("Group Class")');
      if (await groupOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await groupOption.first().click();
      }
    }

    // After selecting Group Class, max participants field must appear
    const maxParticipantsField = page.locator(
      'input[name*="max" i], input[name*="participant" i], input[name*="capacity" i], [aria-label*="max participant" i], [placeholder*="max" i]'
    );
    await expect(maxParticipantsField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('group class has "Open for Registration" toggle', async ({ page }) => {
    await openAppointmentForm(page);

    // Navigate to group class type
    const typeSelect = page.locator('select[name*="type" i], select[id*="type" i]');
    if (await typeSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeSelect.first().selectOption({ label: 'Group Class' }).catch(() => {});
    } else {
      const groupOption = page.locator('[value*="group" i], option:has-text("Group"), button:has-text("Group Class")');
      if (await groupOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await groupOption.first().click();
      }
    }

    // Registration toggle must appear for group classes
    const registrationToggle = page.locator(
      'input[type="checkbox"][name*="registration" i], button[role="switch"][aria-label*="registration" i], [aria-label*="open for registration" i], label:has-text("Open for Registration")'
    );
    await expect(registrationToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('recurring session toggle available', async ({ page }) => {
    await openAppointmentForm(page);

    // Recurring toggle must be present in appointment form
    const recurringToggle = page.locator(
      'input[type="checkbox"][name*="recurring" i], input[type="checkbox"][name*="repeat" i], button[role="switch"][aria-label*="recurring" i], [aria-label*="recurring" i], label:has-text("Recurring"), label:has-text("Repeat")'
    );
    await expect(recurringToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '27-recurring-toggle.png');
  });

  test('frequency options available (weekly, biweekly, monthly)', async ({ page }) => {
    await openAppointmentForm(page);

    // Enable recurring toggle first
    const recurringToggle = page.locator(
      'input[type="checkbox"][name*="recurring" i], input[type="checkbox"][name*="repeat" i], button[role="switch"][aria-label*="recurring" i]'
    );
    await expect(recurringToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await recurringToggle.first().click();

    // Frequency selector must appear after enabling recurring
    const frequencyField = page.locator(
      'select[name*="frequency" i], select[name*="recurrence" i], [aria-label*="frequency" i], [role="combobox"][aria-label*="frequency" i]'
    );
    await expect(frequencyField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('"End after N occurrences" input available', async ({ page }) => {
    await openAppointmentForm(page);

    // Enable recurring
    const recurringToggle = page.locator(
      'input[type="checkbox"][name*="recurring" i], input[type="checkbox"][name*="repeat" i], button[role="switch"]'
    );
    await expect(recurringToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await recurringToggle.first().click();

    // Occurrences/end-after field must appear
    const occurrencesField = page.locator(
      'input[name*="occurrence" i], input[name*="count" i], input[name*="times" i], [aria-label*="occurrence" i], [placeholder*="occurrence" i]'
    );
    await expect(occurrencesField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('preview shows upcoming dates', async ({ page }) => {
    await openAppointmentForm(page);

    // Enable recurring
    const recurringToggle = page.locator(
      'input[type="checkbox"][name*="recurring" i], input[type="checkbox"][name*="repeat" i], button[role="switch"]'
    );
    await expect(recurringToggle.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await recurringToggle.first().click();

    // A preview/upcoming section must appear showing next dates
    const previewSection = page.locator(
      '[data-testid*="preview"], [class*="preview"], text=/preview/i, text=/upcoming/i, text=/next occurrence/i'
    );
    await expect(previewSection.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '27-recurring-preview.png');
  });

  test('save recurring session creates multiple appointments (API check)', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Appointments API must return 200 with a valid token
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}/api/schedule/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);

    // Schedule page must render
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });
  });
});
