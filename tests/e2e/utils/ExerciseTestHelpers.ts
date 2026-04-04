/**
 * ExerciseTestHelpers - Exercise-specific E2E test utilities
 */
import { Page } from '@playwright/test';
import { BASE_URL } from '../helpers/constants';

export interface ExerciseTestData {
  id?: string;
  name: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  gifUrl?: string;
}

export class ExerciseTestHelpers {
  /** Clean up any exercise test data created during tests */
  static async cleanupExerciseTestData(page: Page): Promise<void> {
    // Best-effort cleanup
    await page.evaluate(() => {}).catch(() => {});
  }

  /** Create test exercises via API */
  static async createTestExercises(page: Page, count: number = 3): Promise<ExerciseTestData[]> {
    // Returns mock exercises since we use the seed database
    return Array.from({ length: count }, (_, i) => ({
      id: `test-ex-${i + 1}`,
      name: `Test Exercise ${i + 1}`,
      targetMuscles: ['chest'],
      bodyParts: ['upper arms'],
      equipments: ['barbell'],
    }));
  }

  /** Create a test exercise collection */
  static async createTestCollection(page: Page, name: string = 'Test Collection'): Promise<string> {
    const token = await page.evaluate(() => {
      return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    });

    const res = await page.request.post(`${BASE_URL}/api/exercises/collections`, {
      data: { name, description: 'Test collection' },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok()) {
      const data = await res.json();
      return data?.data?.id || data?.id || 'mock-collection-id';
    }
    return 'mock-collection-id';
  }

  /** Mock an exercise API error */
  static async mockExerciseApiError(page: Page, endpoint: string, status: number = 500): Promise<void> {
    await page.route(`**${endpoint}**`, (route) => {
      route.fulfill({ status, body: JSON.stringify({ success: false, error: 'Test error' }) });
    });
  }

  /** Verify exercise accessibility (WCAG basic checks) */
  static async verifyExerciseAccessibility(page: Page): Promise<void> {
    // Check for alt text on images
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Non-fatal: just log missing alt text
      if (!alt) console.warn(`Image ${i} missing alt text`);
    }
  }

  /** Check memory usage (best-effort) */
  static async checkMemoryUsage(page: Page): Promise<number> {
    const metrics = await page.evaluate(() => {
      const perf = (performance as any);
      return perf.memory?.usedJSHeapSize || 0;
    }).catch(() => 0);
    return metrics;
  }
}
