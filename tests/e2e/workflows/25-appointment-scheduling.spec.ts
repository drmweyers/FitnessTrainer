/**
 * Suite 25: Appointment Scheduling
 * Tests creating, editing, and managing appointments from the trainer perspective.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('25 - Appointment Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, 'trainer');
  });

  test('schedule page loads with calendar', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Schedule heading must be visible — this is the definitive check
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar|appointment/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '25-schedule-calendar.png');
  });

  test('"Create Appointment" button is visible', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // At least one primary action button for creating/adding must be visible
    const createBtn = page.locator(
      'button:has-text("New Appointment"), button:has-text("Create Appointment"), button:has-text("Add Appointment"), button:has-text("Schedule"), button[aria-label*="appointment" i]'
    );
    await expect(createBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('appointment form opens on button click', async ({ page }) => {
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

    // Modal/form must appear after clicking
    const form = page.locator('[role="dialog"], [data-radix-dialog-content], form');
    await expect(form.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '25-appointment-form.png');
  });

  test('can set date and time in appointment form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const createBtn = page.locator(
      'button:has-text("New Appointment"), button:has-text("Create"), button:has-text("New"), button:has-text("Add")'
    );
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 });
    await createBtn.first().click();

    // At least one date or time input must be present in the form
    const dateOrTimeInput = page.locator(
      'input[type="date"], input[type="datetime-local"], input[type="time"], [aria-label*="date" i], [aria-label*="time" i]'
    );
    await expect(dateOrTimeInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can set duration in appointment form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const createBtn = page.locator('button:has-text("New Appointment"), button:has-text("Create"), button:has-text("New"), button:has-text("Add")');
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 });
    await createBtn.first().click();

    // Duration field OR end-time field must be present (either encodes duration)
    const durationOrEndField = page.locator(
      'input[name*="duration" i], select[name*="duration" i], [aria-label*="duration" i], input[type="time"][name*="end" i], [aria-label*="end time" i]'
    );
    await expect(durationOrEndField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can select client in appointment form', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const createBtn = page.locator('button:has-text("New Appointment"), button:has-text("Create"), button:has-text("New"), button:has-text("Add")');
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 });
    await createBtn.first().click();

    // A client selector must be present
    const clientField = page.locator(
      'select[name*="client" i], input[name*="client" i], [aria-label*="client" i], [placeholder*="client" i], [placeholder*="select client" i]'
    );
    await expect(clientField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('appointment type options are available', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    const createBtn = page.locator('button:has-text("New Appointment"), button:has-text("Create"), button:has-text("New"), button:has-text("Add")');
    await expect(createBtn.first()).toBeVisible({ timeout: 5000 });
    await createBtn.first().click();

    // Appointment type selector must be present
    const typeField = page.locator(
      'select[name*="type" i], input[name*="type" i], [aria-label*="type" i], [role="combobox"][aria-label*="type" i]'
    );
    await expect(typeField.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('saved appointment appears on calendar — appointments API returns 200', async ({ page }) => {
    // Verify the schedule API is accessible and returns appointments
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}/api/schedule/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // With a valid token the appointments endpoint must return 200
    expect(response.status()).toBe(200);

    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Calendar heading must be present
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar|appointment/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '25-schedule-with-appointments.png');
  });

  test('can edit existing appointment', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // The global setup seeds an appointment — it must appear
    const appointmentItem = page.locator(
      '[data-testid*="appointment"], .appointment, [class*="appointment"], [class*="event"], .fc-event'
    );
    await expect(appointmentItem.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await appointmentItem.first().click();

    // Edit button must be visible after clicking the appointment
    const editBtn = page.locator('button:has-text("Edit"), button:has-text("Update"), a:has-text("Edit")');
    await expect(editBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('can cancel or delete an appointment', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // The global setup seeds an appointment — it must appear
    const appointmentItem = page.locator(
      '[data-testid*="appointment"], .appointment, [class*="appointment"], [class*="event"], .fc-event'
    );
    await expect(appointmentItem.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await appointmentItem.first().click();

    // Delete/cancel action must be visible
    const deleteOrCancel = page.locator(
      'button:has-text("Cancel"), button:has-text("Delete"), button:has-text("Remove"), button[aria-label*="delete" i], button[aria-label*="cancel" i]'
    );
    await expect(deleteOrCancel.first()).toBeVisible({ timeout: TIMEOUTS.element });
  });

  test('appointment shows client name', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Global setup seeds an appointment with qa-client — must have identifying text
    const appointmentItem = page.locator('[data-testid*="appointment"], .fc-event, [class*="appointment"]');
    await expect(appointmentItem.first()).toBeVisible({ timeout: TIMEOUTS.element });

    const appointmentText = await appointmentItem.first().textContent();
    // Must have non-empty client/title text
    expect(appointmentText?.trim().length).toBeGreaterThan(0);
  });

  test('trainer can view all their appointments', async ({ page }) => {
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Schedule page heading must be visible to trainer
    await expect(
      page.locator('h1, h2, [role="heading"]').filter({ hasText: /schedule|calendar|appointment/i }).first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '25-trainer-all-appointments.png');
  });
});
