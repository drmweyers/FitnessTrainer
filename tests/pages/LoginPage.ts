import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');
    this.signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Register")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password")');
    this.errorMessage = page.locator('[data-testid="error"], .error, .text-red-500');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
  }

  async navigateToLogin() {
    await this.page.goto('/login');
    await this.waitForUrl('/login');
  }

  async login(email: string, password: string, rememberMe = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.loginButton.click();
    
    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL('/dashboard', { timeout: 10000 }),
      this.errorMessage.waitFor({ timeout: 5000 })
    ]);
  }

  async expectLoginError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectLoginSuccess() {
    await this.waitForUrl('/dashboard');
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async navigateToSignUp() {
    await this.signUpLink.click();
    await this.waitForUrl('/signup');
  }

  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.waitForUrl('/forgot-password');
  }

  // Test data validation
  async testEmailValidation() {
    await this.emailInput.fill('invalid-email');
    await this.passwordInput.fill('password123');
    await this.loginButton.click();
    
    // Should show validation error
    const validationError = this.page.locator('input[name="email"]:invalid, [data-testid="email-error"]');
    await expect(validationError).toBeVisible();
  }

  async testRequiredFields() {
    await this.loginButton.click();
    
    // Should show required field errors
    const emailError = this.page.locator('[data-testid="email-error"], input[name="email"]:invalid');
    const passwordError = this.page.locator('[data-testid="password-error"], input[name="password"]:invalid');
    
    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
  }
}