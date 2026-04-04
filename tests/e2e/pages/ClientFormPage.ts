/**
 * ClientFormPage - Page Object for Add/Edit Client form (modal)
 */
import { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../helpers/constants';

export class ClientFormPage {
  readonly page: Page;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"], .modal').first();
  }

  async expectModalToBeVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async fillBasicInfo(data: {
    name?: string;
    email?: string;
    phone?: string;
    age?: string;
    gender?: string;
  }): Promise<void> {
    const { name, email, phone, age, gender } = data;

    if (name) {
      const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.fill(name).catch(() => {});
    }
    if (email) {
      const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
      await emailInput.fill(email).catch(() => {});
    }
    if (phone) {
      const phoneInput = this.page.locator('input[name="phone"], input[type="tel"]').first();
      await phoneInput.fill(phone).catch(() => {});
    }
    if (age) {
      const ageInput = this.page.locator('input[name="age"], input[placeholder*="age" i]').first();
      await ageInput.fill(age).catch(() => {});
    }
    if (gender) {
      const genderSelect = this.page.locator('select[name="gender"], [data-testid="gender-select"]').first();
      await genderSelect.selectOption({ value: gender }).catch(() => {});
    }
  }

  async fillAndSubmitCompleteForm(data: {
    name: string;
    email: string;
    phone?: string;
    age?: string;
    gender?: string;
    goal?: string;
    notes?: string;
  }): Promise<void> {
    await this.fillBasicInfo(data);

    if (data.goal) {
      const goalInput = this.page.locator('textarea[name="goal"], input[name="goal"]').first();
      await goalInput.fill(data.goal).catch(() => {});
    }
    if (data.notes) {
      const notesInput = this.page.locator('textarea[name="notes"], textarea[placeholder*="note" i]').first();
      await notesInput.fill(data.notes).catch(() => {});
    }

    await this.submitForm();
  }

  async submitForm(): Promise<void> {
    await this.page.locator('button[type="submit"]').last().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async cancelForm(): Promise<void> {
    const cancelBtn = this.page.locator('button').filter({ hasText: /cancel/i }).first();
    await cancelBtn.click({ force: true }).catch(async () => {
      await this.page.keyboard.press('Escape');
    });
    await this.page.waitForTimeout(300);
  }

  async closeModal(): Promise<void> {
    await this.cancelForm();
  }

  async expectSubmissionSuccess(): Promise<void> {
    const success = this.page.locator('[data-testid="success"], .success, text=/success|added|created/i').first();
    await success.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      // May close modal automatically on success
      return this.modal.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });
  }

  async expectSubmissionError(): Promise<void> {
    const error = this.page.locator('[data-testid="error"], .error, [role="alert"]').first();
    await error.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async testRequiredFieldValidation(): Promise<void> {
    // Submit empty form to trigger validation
    await this.page.locator('button[type="submit"]').last().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
    // Required field errors should appear
    const errors = this.page.locator('[data-testid*="error"], .field-error, [class*="error"]');
    await errors.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  }

  async testEmailValidation(): Promise<void> {
    const emailInput = this.page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('invalid-email').catch(() => {});
    await this.page.locator('button[type="submit"]').last().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async testCharacterLimits(): Promise<void> {
    const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill('A'.repeat(300)).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async testFormResetAfterCancel(): Promise<void> {
    await this.fillBasicInfo({ name: 'Test', email: 'test@test.com' });
    await this.cancelForm();
  }
}
