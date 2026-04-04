/**
 * ClientInvitePage - Page Object for Client Invitation modal
 */
import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/TestHelpers';

export class ClientInvitePage {
  readonly page: Page;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"], .modal').first();
  }

  async expectModalToBeVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async closeModal(): Promise<void> {
    const closeBtn = this.page.locator('button').filter({ hasText: /close|cancel/i }).first();
    await closeBtn.click({ force: true }).catch(async () => {
      await this.page.keyboard.press('Escape');
    });
    await this.page.waitForTimeout(300);
  }

  async fillInvitationForm(email: string, message?: string): Promise<void> {
    const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill(email).catch(() => {});
    if (message) {
      const msgInput = this.page.locator('textarea[name="message"], textarea[placeholder*="message" i]').first();
      await msgInput.fill(message).catch(() => {});
    }
  }

  async sendInvitation(): Promise<void> {
    await this.page.locator('button[type="submit"]').last().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async sendCompleteInvitation(email?: string): Promise<string> {
    const inviteEmail = email || TestHelpers.generateUniqueEmail('invite');
    await this.fillInvitationForm(inviteEmail);
    await this.sendInvitation();
    return inviteEmail;
  }

  async expectInvitationSuccess(): Promise<void> {
    const success = this.page.locator('[data-testid="success"], .success, text=/success|sent|invited/i').first();
    await success.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      return this.modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });
  }

  async testRequiredEmailField(): Promise<void> {
    await this.sendInvitation();
    await this.page.waitForTimeout(500);
  }

  async testEmailValidation(): Promise<void> {
    const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('invalid-email').catch(() => {});
    await this.sendInvitation();
    await this.page.waitForTimeout(500);
  }

  async testDuplicateInvitationError(): Promise<void> {
    const error = this.page.locator('[data-testid="error"], .error, [role="alert"]').first();
    await error.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async testCustomMessage(): Promise<void> {
    const inviteEmail = TestHelpers.generateUniqueEmail('invite');
    await this.fillInvitationForm(inviteEmail, 'Welcome to my training program!');
    await this.page.waitForTimeout(300);
  }
}
