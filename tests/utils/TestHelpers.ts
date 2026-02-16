import { Page, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

export class TestHelpers {
  static generateUniqueEmail(): string {
    const timestamp = Date.now();
    const randomSuffix = randomBytes(4).toString('hex');
    return `test.${timestamp}.${randomSuffix}@evofit-qa.com`;
  }

  static generateTestClient(overrides: Partial<any> = {}) {
    return {
      email: this.generateUniqueEmail(),
      firstName: 'Test',
      lastName: 'Client',
      fitnessLevel: 'beginner',
      primaryGoal: 'Weight Loss',
      targetWeight: '150',
      sessionDuration: '60',
      emergencyName: 'Emergency Contact',
      emergencyPhone: '555-0123',
      emergencyRelationship: 'Spouse',
      ...overrides
    };
  }

  static async createTestTrainer(page: Page) {
    const trainerData = {
      email: this.generateUniqueEmail(),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Trainer',
      role: 'trainer'
    };

    // Register trainer via API
    const response = await page.request.post('/api/auth/register', {
      data: trainerData
    });

    if (!response.ok()) {
      throw new Error(`Failed to create test trainer: ${await response.text()}`);
    }

    return trainerData;
  }

  static async loginAsTrainer(page: Page, credentials?: { email: string; password: string }) {
    let trainerCredentials = credentials;

    if (!trainerCredentials) {
      trainerCredentials = await this.createTestTrainer(page);
    }

    // Login via API to get tokens
    const response = await page.request.post('/api/auth/login', {
      data: {
        email: trainerCredentials.email,
        password: trainerCredentials.password
      }
    });

    if (!response.ok()) {
      throw new Error(`Failed to login trainer: ${await response.text()}`);
    }

    const { accessToken, refreshToken } = await response.json();

    // Set authentication cookies/localStorage
    await page.addInitScript((tokens) => {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }, { accessToken, refreshToken });

    return trainerCredentials;
  }

  static async createTestClientViaAPI(page: Page, clientData?: Partial<any>) {
    const client = this.generateTestClient(clientData);

    const response = await page.request.post('/api/clients', {
      data: client
    });

    if (!response.ok()) {
      throw new Error(`Failed to create test client: ${await response.text()}`);
    }

    const createdClient = await response.json();
    return { ...client, id: createdClient.id };
  }

  static async cleanupTestData(page: Page) {
    // Clean up test clients (those with emails containing 'evofit-qa.com')
    const response = await page.request.get('/api/clients?search=evofit-qa.com');
    
    if (response.ok()) {
      const { clients } = await response.json();
      
      for (const client of clients) {
        await page.request.delete(`/api/clients/${client.id}`);
      }
    }

    // Clean up test invitations
    const invitesResponse = await page.request.get('/api/invitations');
    
    if (invitesResponse.ok()) {
      const invitations = await invitesResponse.json();
      
      for (const invitation of invitations) {
        if (invitation.clientEmail.includes('evofit-qa.com')) {
          await page.request.delete(`/api/invitations/${invitation.id}`);
        }
      }
    }
  }

  static async waitForApiResponse(page: Page, urlPattern: string | RegExp, timeout = 10000) {
    return await page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' 
          ? url.includes(urlPattern)
          : urlPattern.test(url);
      },
      { timeout }
    );
  }

  static async interceptApiError(page: Page, endpoint: string, statusCode = 500) {
    await page.route(`**${endpoint}`, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated API error' })
      });
    });
  }

  static async mockApiResponse(page: Page, endpoint: string, responseData: any, statusCode = 200) {
    await page.route(`**${endpoint}`, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });
  }

  static async verifyAccessibility(page: Page) {
    // Basic accessibility checks
    const issues = await page.evaluate(() => {
      const issues = [];
      
      // Check for alt text on images
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        issues.push(`${images.length} images missing alt text`);
      }
      
      // Check for form labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
      inputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label) {
          issues.push(`Input missing label: ${(input as HTMLInputElement).name || (input as HTMLInputElement).type}`);
        }
      });
      
      // Check for heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let previousLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1));
        if (level > previousLevel + 1) {
          issues.push(`Heading level skipped: ${heading.textContent}`);
        }
        previousLevel = level;
      });
      
      return issues;
    });
    
    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
    }
    
    return issues;
  }

  static async checkPerformance(page: Page) {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Performance assertions
    expect(performanceMetrics.loadTime).toBeLessThan(3000); // Load time under 3 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500); // DOM ready under 1.5 seconds
    
    return performanceMetrics;
  }

  static async simulateSlowNetwork(page: Page) {
    // Simulate slow 3G network conditions
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40
    });
  }

  static async simulateOfflineMode(page: Page) {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0
    });
  }

  static async resetNetworkConditions(page: Page) {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
  }

  static async waitForStableState(page: Page, timeout = 5000) {
    // Wait for JavaScript execution to complete
    await page.waitForLoadState('networkidle');
    
    // Wait for animations to complete
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('*');
      for (const element of elements) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.animationPlayState === 'running' || 
            computedStyle.transitionProperty !== 'none') {
          return false;
        }
      }
      return true;
    }, {}, { timeout });
    
    // Small additional wait for any remaining async operations
    await page.waitForTimeout(100);
  }

  static async takeMobileScreenshot(page: Page, name: string) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ 
      path: `screenshots/mobile-${name}.png`, 
      fullPage: true 
    });
  }

  static async takeTabletScreenshot(page: Page, name: string) {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ 
      path: `screenshots/tablet-${name}.png`, 
      fullPage: true 
    });
  }

  static async takeDesktopScreenshot(page: Page, name: string) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ 
      path: `screenshots/desktop-${name}.png`, 
      fullPage: true 
    });
  }

  static async verifyResponsiveDesign(page: Page, elementSelector: string) {
    const viewports = [
      { width: 390, height: 844, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    const measurements = [];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to settle
      
      const element = page.locator(elementSelector);
      const box = await element.boundingBox();
      
      measurements.push({
        viewport: viewport.name,
        width: box?.width || 0,
        height: box?.height || 0,
        visible: await element.isVisible()
      });
    }
    
    // Verify element is visible on all viewports
    measurements.forEach(measurement => {
      expect(measurement.visible).toBe(true);
    });
    
    return measurements;
  }

  static async generateTestReport(testResults: any[]) {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'passed').length,
      failed: testResults.filter(r => r.status === 'failed').length,
      skipped: testResults.filter(r => r.status === 'skipped').length,
      results: testResults
    };
    
    return report;
  }
}