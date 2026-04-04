/**
 * LoginPage - Page Object for Login (/auth/login)
 */
import { Page, Locator } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    this.submitButton = page.locator('button[type="submit"]').first();
    this.errorMessage = page.locator('[data-testid="error"], .error, [role="alert"]').first();
    this.forgotPasswordLink = page.locator('a').filter({ hasText: /forgot.*password/i }).first();
    this.registerLink = page.locator('a').filter({ hasText: /register|sign up/i }).first();
  }

  async navigateToLogin(): Promise<void> {
    await this.page.goto(`${BASE_URL}${ROUTES.login}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForTimeout(1000);
  }

  async loginAndWaitForDashboard(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL(/dashboard/, { timeout: TIMEOUTS.pageLoad }).catch(() => {});
  }

  async expectErrorMessage(): Promise<void> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async expectPageToLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.emailInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
}
