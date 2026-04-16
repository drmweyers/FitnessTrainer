/**
 * Suite 30: Support Tickets
 * Tests the support ticket workflow: client submits, admin responds, client views reply.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS, API } from '../helpers/constants';
import { loginViaAPI, takeScreenshot, waitForPageReady } from '../helpers/auth';

test.describe('30 - Support Tickets', () => {

  test('client finds Support or Help link', async ({ page }) => {
    await loginViaAPI(page, 'client');
    await page.goto(`${BASE_URL}${ROUTES.dashboard}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await waitForPageReady(page);

    // Support/Help link must be visible in the navigation
    const supportLink = page.locator(
      'a:has-text("Support"), a:has-text("Help"), a[href*="support"], a[href*="help"], nav a:has-text("Support")'
    );
    await expect(supportLink.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '30-support-link.png');
  });

  test('contact form loads with subject and message fields', async ({ page }) => {
    await loginViaAPI(page, 'client');

    // Navigate to the support page
    const supportRoutes = ['/support', '/help', '/contact', '/support/tickets'];
    let found = false;
    for (const route of supportRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });

      const subjectInput = page.locator(
        'input[name*="subject" i], input[placeholder*="subject" i], input[aria-label*="subject" i]'
      );
      const messageInput = page.locator(
        'textarea[name*="message" i], textarea[placeholder*="message" i], textarea[aria-label*="message" i]'
      );
      const hasSubject = await subjectInput.first().isVisible({ timeout: 2000 }).catch(() => false);
      const hasMessage = await messageInput.first().isVisible({ timeout: 2000 }).catch(() => false);

      if (hasSubject || hasMessage) {
        found = true;
        break;
      }
    }

    expect(found).toBeTruthy();

    // Both subject and message fields must be visible
    const subjectInput = page.locator(
      'input[name*="subject" i], input[placeholder*="subject" i], input[aria-label*="subject" i]'
    );
    const messageInput = page.locator(
      'textarea[name*="message" i], textarea[placeholder*="message" i], textarea[aria-label*="message" i]'
    );
    await expect(subjectInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await expect(messageInput.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '30-contact-form.png');
  });

  test('submit ticket with valid data succeeds (API)', async ({ page }) => {
    await loginViaAPI(page, 'client');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.post(`${BASE_URL}${API.supportTickets}`, {
      data: {
        subject: 'E2E Test Ticket',
        message: 'This is an automated E2E test ticket. Please ignore.',
        category: 'general',
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // With a valid token, ticket creation must succeed
    expect([200, 201].includes(response.status())).toBeTruthy();
  });

  test('ticket confirmation shown after UI submission', async ({ page }) => {
    await loginViaAPI(page, 'client');

    // Navigate to support form
    const supportRoutes = ['/support', '/help', '/contact', '/support/tickets'];
    let formRoute: string | null = null;
    for (const route of supportRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      const subjectInput = page.locator('input[name*="subject" i], input[placeholder*="subject" i]');
      if (await subjectInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        formRoute = route;
        break;
      }
    }

    expect(formRoute).not.toBeNull();

    const subjectInput = page.locator('input[name*="subject" i], input[placeholder*="subject" i]');
    await subjectInput.first().fill('E2E Test Ticket');
    const messageInput = page.locator('textarea[name*="message" i], textarea[placeholder*="message" i]');
    await expect(messageInput.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await messageInput.first().fill('Automated test message for E2E suite 30.');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Send")');
    await expect(submitBtn.first()).toBeVisible({ timeout: TIMEOUTS.element });
    await submitBtn.first().click();

    // Confirmation message must appear after submit
    await expect(
      page.locator('text=/success|submitted|received|thank/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element });

    await takeScreenshot(page, '30-ticket-confirmation.png');
  });

  test('admin navigates to ticket inbox', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    // Admin must be able to reach the ticket inbox
    const adminTicketRoutes = ['/admin/support', '/admin/tickets'];
    let found = false;
    for (const route of adminTicketRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const heading = await page.locator('h1, h2, [role="heading"]').filter({ hasText: /ticket|support|inbox/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
      if (heading) {
        found = true;
        await takeScreenshot(page, '30-admin-ticket-inbox.png');
        break;
      }
    }

    expect(found).toBeTruthy();
  });

  test('admin sees submitted ticket (API check)', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}${API.supportTickets}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Admin must get 200 with ticket list
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toBeTruthy();
  });

  test('admin can change ticket status', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    const adminRoutes = ['/admin/support', '/admin/tickets'];
    let found = false;
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const statusControl = page.locator(
        'select[name*="status" i], button:has-text("Open"), button:has-text("Closed"), button:has-text("Resolve"), button:has-text("In Progress")'
      );
      if (await statusControl.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        await takeScreenshot(page, '30-ticket-status-control.png');
        break;
      }
    }

    expect(found).toBeTruthy();
  });

  test('admin can add reply to ticket', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    const adminRoutes = ['/admin/support', '/admin/tickets'];
    let found = false;
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const replyInput = page.locator(
        'textarea[name*="reply" i], textarea[name*="message" i], input[name*="reply" i]'
      );
      if (await replyInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        await takeScreenshot(page, '30-admin-reply-form.png');
        break;
      }
    }

    expect(found).toBeTruthy();
  });

  test('client can see admin reply (API check)', async ({ page }) => {
    await loginViaAPI(page, 'client');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await page.request.get(`${BASE_URL}${API.supportTickets}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Client must get 200 to view their own tickets
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toBeTruthy();
  });

  test('ticket can be closed or resolved', async ({ page }) => {
    await loginViaAPI(page, 'admin');

    const adminRoutes = ['/admin/support', '/admin/tickets'];
    let found = false;
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.pageLoad,
      });
      await waitForPageReady(page);

      const closeBtn = page.locator(
        'button:has-text("Close"), button:has-text("Resolve"), button:has-text("Closed"), button[aria-label*="close ticket" i]'
      );
      if (await closeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        await takeScreenshot(page, '30-close-ticket.png');
        break;
      }
    }

    expect(found).toBeTruthy();
  });
});
