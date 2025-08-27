import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async waitForUrl(url: string | RegExp, timeout = 30000) {
    await this.page.waitForURL(url, { timeout });
  }

  async waitForSelector(selector: string, timeout = 10000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForFunction(
      text => document.body.innerText.includes(text),
      text,
      { timeout }
    );
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async fill(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  async waitForLoadingToComplete() {
    // Wait for any loading indicators to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid="loading"], .animate-pulse, .loading');
      return loadingElements.length === 0;
    }, {}, { timeout: 10000 });
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  // Mobile-specific helpers
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 390, height: 844 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  // Error handling helpers
  async checkForErrors() {
    const errors = await this.page.evaluate(() => {
      const errors = [];
      
      // Check for JavaScript errors
      const jsErrors = window.console.error;
      
      // Check for visible error messages
      const errorElements = document.querySelectorAll('[data-testid="error"], .error, .text-red-500');
      errorElements.forEach(el => {
        if (el.textContent) errors.push(el.textContent);
      });
      
      return errors;
    });
    
    if (errors.length > 0) {
      console.warn('Errors found on page:', errors);
    }
    
    return errors;
  }

  async expectNoErrors() {
    const errors = await this.checkForErrors();
    expect(errors).toHaveLength(0);
  }
}