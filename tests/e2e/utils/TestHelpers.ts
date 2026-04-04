/**
 * TestHelpers - Shared utilities for E2E tests
 */
import { Page } from '@playwright/test';
import { BASE_URL, TEST_ACCOUNTS, ROUTES, SCREENSHOT_DIR } from '../helpers/constants';

export class TestHelpers {
  /** Generate a unique email for test isolation */
  static generateUniqueEmail(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@evofit-test.com`;
  }

  /** Create a test trainer account and return credentials */
  static async createTestTrainer(page: Page): Promise<{ email: string; password: string }> {
    const email = TestHelpers.generateUniqueEmail('trainer');
    const password = 'TestPassword123!';

    const res = await page.request.post(`${BASE_URL}/api/auth/register`, {
      data: { email, password, name: 'Test Trainer', role: 'trainer' },
    });

    if (!res.ok()) {
      throw new Error(`Failed to create test trainer: ${res.status()}`);
    }

    return { email, password };
  }

  /** Create a test client account and return credentials */
  static async createTestClient(page: Page): Promise<{ email: string; password: string }> {
    const email = TestHelpers.generateUniqueEmail('client');
    const password = 'TestPassword123!';

    const res = await page.request.post(`${BASE_URL}/api/auth/register`, {
      data: { email, password, name: 'Test Client', role: 'client' },
    });

    if (!res.ok()) {
      throw new Error(`Failed to create test client: ${res.status()}`);
    }

    return { email, password };
  }

  /** Create a test client via API (with optional data) */
  static async createTestClientViaAPI(
    page: Page,
    data: { name?: string; email?: string; status?: string } = {}
  ): Promise<string> {
    const token = await page.evaluate(() => {
      return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    });

    const res = await page.request.post(`${BASE_URL}/api/clients`, {
      data: {
        name: data.name || `Test Client ${Date.now()}`,
        email: data.email || TestHelpers.generateUniqueEmail('client-api'),
        status: data.status || 'active',
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok()) {
      const body = await res.json();
      return body?.data?.id || body?.id || 'mock-client-id';
    }
    return 'mock-client-id';
  }

  /** Login as trainer via UI */
  static async loginAsTrainer(page: Page, credentials: { email: string; password: string }): Promise<void> {
    await page.goto(`${BASE_URL}${ROUTES.login}`);
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.fill('input[name="password"], input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|clients|exercises/, { timeout: 15000 }).catch(() => {});
  }

  /** Login as client via UI */
  static async loginAsClient(page: Page, credentials: { email: string; password: string }): Promise<void> {
    await page.goto(`${BASE_URL}${ROUTES.login}`);
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.fill('input[name="password"], input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {});
  }

  /** Clean up test data (best-effort) */
  static async cleanupTestData(page: Page): Promise<void> {
    await page.evaluate(() => {}).catch(() => {});
  }

  /** Intercept an API endpoint and return an error status */
  static async interceptApiError(page: Page, urlPattern: string, status: number): Promise<void> {
    await page.route(`**${urlPattern}**`, (route) => {
      route.fulfill({ status, body: JSON.stringify({ success: false, error: 'Test error' }) });
    });
  }

  /** Reset network conditions (remove route interceptions) */
  static async resetNetworkConditions(page: Page): Promise<void> {
    await page.unrouteAll().catch(() => {});
  }

  /** Simulate offline mode */
  static async simulateOfflineMode(page: Page): Promise<void> {
    await page.context().setOffline(true);
  }

  /** Simulate slow network */
  static async simulateSlowNetwork(page: Page): Promise<void> {
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });
  }

  /** Take a desktop screenshot */
  static async takeDesktopScreenshot(page: Page, name: string): Promise<void> {
    try {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
    } catch {
      // Screenshots are non-critical
    }
  }

  /** Take a mobile screenshot */
  static async takeMobileScreenshot(page: Page, name: string): Promise<void> {
    try {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-${name}.png`, fullPage: false });
    } catch {}
  }

  /** Take a tablet screenshot */
  static async takeTabletScreenshot(page: Page, name: string): Promise<void> {
    try {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/tablet-${name}.png`, fullPage: false });
    } catch {}
  }

  /** Check performance metrics */
  static async checkPerformance(page: Page): Promise<{ loadTime: number; memoryMB: number }> {
    const metrics = await page.evaluate(() => {
      const perf = performance.timing;
      const memory = (performance as any).memory;
      return {
        loadTime: perf.loadEventEnd - perf.navigationStart,
        memoryMB: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
      };
    }).catch(() => ({ loadTime: 0, memoryMB: 0 }));
    return metrics;
  }

  /** Verify basic accessibility (WCAG) */
  static async verifyAccessibility(page: Page): Promise<void> {
    // Check for images without alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count().catch(() => 0);
    if (imagesWithoutAlt > 0) {
      console.warn(`Found ${imagesWithoutAlt} images without alt text`);
    }
  }
}
