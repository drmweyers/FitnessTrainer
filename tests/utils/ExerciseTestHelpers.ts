import { Page, expect } from '@playwright/test';
import { TestHelpers } from './TestHelpers';

export interface ExerciseTestData {
  exerciseId: string;
  name: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ExerciseFilterCriteria {
  bodyPart?: string;
  equipment?: string;
  targetMuscle?: string;
  difficulty?: string;
  searchQuery?: string;
}

export class ExerciseTestHelpers {
  /**
   * Generate realistic test exercise data
   */
  static generateTestExercise(overrides: Partial<ExerciseTestData> = {}): ExerciseTestData {
    const exerciseId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      exerciseId,
      name: 'Test Push-up',
      targetMuscles: ['pectorals'],
      bodyParts: ['chest'],
      equipments: ['body weight'],
      secondaryMuscles: ['triceps', 'anterior deltoid'],
      instructions: [
        'Step:1 Start in a plank position with your hands shoulder-width apart.',
        'Step:2 Lower your body until your chest nearly touches the floor.',
        'Step:3 Push back up to the starting position.',
        'Step:4 Repeat for the desired number of repetitions.'
      ],
      gifUrl: `test-${exerciseId}.gif`,
      difficulty: 'beginner',
      ...overrides
    };
  }

  /**
   * Create multiple test exercises via API
   */
  static async createTestExercises(page: Page, count: number = 5): Promise<ExerciseTestData[]> {
    const exercises: ExerciseTestData[] = [];
    
    for (let i = 0; i < count; i++) {
      const exercise = this.generateTestExercise({
        name: `Test Exercise ${i + 1}`,
        targetMuscles: this.getRandomMuscleGroup(),
        bodyParts: this.getRandomBodyPart(),
        equipments: this.getRandomEquipment(),
        difficulty: this.getRandomDifficulty()
      });
      
      const response = await page.request.post('/api/exercises', {
        data: exercise
      });
      
      if (response.ok()) {
        const createdExercise = await response.json();
        exercises.push({ ...exercise, exerciseId: createdExercise.id });
      }
    }
    
    return exercises;
  }

  /**
   * Create test exercise collection via API
   */
  static async createTestCollection(page: Page, name: string, description?: string): Promise<string> {
    const collectionData = {
      name,
      description: description || `Test collection: ${name}`,
      isPublic: false
    };
    
    const response = await page.request.post('/api/exercises/collections', {
      data: collectionData
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to create test collection: ${await response.text()}`);
    }
    
    const collection = await response.json();
    return collection.id;
  }

  /**
   * Add exercise to collection via API
   */
  static async addExerciseToCollection(page: Page, exerciseId: string, collectionId: string): Promise<void> {
    const response = await page.request.post(`/api/exercises/collections/${collectionId}/exercises`, {
      data: { exerciseId }
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to add exercise to collection: ${await response.text()}`);
    }
  }

  /**
   * Mark exercise as favorite via API
   */
  static async favoriteExercise(page: Page, exerciseId: string): Promise<void> {
    const response = await page.request.post(`/api/exercises/${exerciseId}/favorite`);
    
    if (!response.ok()) {
      throw new Error(`Failed to favorite exercise: ${await response.text()}`);
    }
  }

  /**
   * Clean up test exercise data
   */
  static async cleanupExerciseTestData(page: Page): Promise<void> {
    // Clean up test exercises (those with names containing 'Test Exercise')
    const exercisesResponse = await page.request.get('/api/exercises?search=Test Exercise');
    
    if (exercisesResponse.ok()) {
      const { exercises } = await exercisesResponse.json();
      
      for (const exercise of exercises) {
        await page.request.delete(`/api/exercises/${exercise.id}`);
      }
    }

    // Clean up test collections
    const collectionsResponse = await page.request.get('/api/exercises/collections');
    
    if (collectionsResponse.ok()) {
      const collections = await collectionsResponse.json();
      
      for (const collection of collections) {
        if (collection.name.includes('Test') || collection.name.includes('QA')) {
          await page.request.delete(`/api/exercises/collections/${collection.id}`);
        }
      }
    }

    // Clear favorites for test exercises
    const favoritesResponse = await page.request.get('/api/exercises/favorites');
    
    if (favoritesResponse.ok()) {
      const favorites = await favoritesResponse.json();
      
      for (const favorite of favorites) {
        if (favorite.exercise?.name?.includes('Test')) {
          await page.request.delete(`/api/exercises/${favorite.exercise.id}/favorite`);
        }
      }
    }
  }

  /**
   * Mock exercise API with large dataset for performance testing
   */
  static async mockLargeExerciseDataset(page: Page, count: number = 1324): Promise<void> {
    const exercises = [];
    
    for (let i = 0; i < count; i++) {
      exercises.push(this.generateTestExercise({
        exerciseId: `mock-${i}`,
        name: `Mock Exercise ${i}`,
        targetMuscles: this.getRandomMuscleGroup(),
        bodyParts: this.getRandomBodyPart(),
        equipments: this.getRandomEquipment()
      }));
    }
    
    await TestHelpers.mockApiResponse(page, '/api/exercises', {
      exercises,
      total: count,
      page: 1,
      limit: 20
    });
  }

  /**
   * Mock exercise API with slow response for performance testing
   */
  static async mockSlowExerciseApi(page: Page, delay: number = 2000): Promise<void> {
    await page.route('/api/exercises', async route => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exercises: [this.generateTestExercise()],
          total: 1,
          page: 1,
          limit: 20
        })
      });
    });
  }

  /**
   * Mock exercise API with error responses
   */
  static async mockExerciseApiError(page: Page, endpoint: string = '/api/exercises', statusCode: number = 500): Promise<void> {
    await page.route(`**${endpoint}`, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Exercise API error',
          message: 'Failed to load exercises'
        })
      });
    });
  }

  /**
   * Wait for exercise search results
   */
  static async waitForExerciseSearch(page: Page, timeout: number = 5000): Promise<void> {
    await page.waitForResponse(
      response => response.url().includes('/api/exercises') && response.status() === 200,
      { timeout }
    );
    
    // Wait for UI to update
    await page.waitForTimeout(300);
  }

  /**
   * Verify exercise search performance
   */
  static async measureExerciseSearchPerformance(page: Page, searchQuery: string): Promise<number> {
    const startTime = Date.now();
    
    // Trigger search
    const searchInput = page.locator('[data-testid="exercise-search"]');
    await searchInput.fill(searchQuery);
    
    // Wait for results
    await this.waitForExerciseSearch(page);
    
    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Verify GIF loading performance
   */
  static async measureGifLoadingPerformance(page: Page): Promise<{ averageLoadTime: number; totalLoaded: number; failures: number }> {
    const gifElements = await page.locator('[data-testid="exercise-gif"]').all();
    const loadTimes: number[] = [];
    let failures = 0;
    
    for (const gif of gifElements.slice(0, 10)) { // Test first 10 GIFs
      try {
        const startTime = Date.now();
        
        // Wait for GIF to load
        await expect(gif).toBeVisible({ timeout: 5000 });
        
        // Wait for actual image load
        await gif.evaluate((img: HTMLImageElement) => {
          return new Promise((resolve, reject) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => reject(new Error('Failed to load'));
              setTimeout(() => reject(new Error('Timeout')), 5000);
            }
          });
        });
        
        const endTime = Date.now();
        loadTimes.push(endTime - startTime);
      } catch (error) {
        failures++;
      }
    }
    
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;
    
    return {
      averageLoadTime,
      totalLoaded: loadTimes.length,
      failures
    };
  }

  /**
   * Test exercise filtering functionality
   */
  static async testExerciseFiltering(page: Page, criteria: ExerciseFilterCriteria): Promise<void> {
    const exerciseLibrary = page.locator('[data-testid="exercise-library"]');
    
    if (criteria.searchQuery) {
      await page.locator('[data-testid="exercise-search"]').fill(criteria.searchQuery);
      await this.waitForExerciseSearch(page);
    }
    
    if (criteria.bodyPart) {
      await page.locator('[data-testid="body-part-filter"]').selectOption(criteria.bodyPart);
      await this.waitForExerciseSearch(page);
    }
    
    if (criteria.equipment) {
      await page.locator('[data-testid="equipment-filter"]').selectOption(criteria.equipment);
      await this.waitForExerciseSearch(page);
    }
    
    if (criteria.targetMuscle) {
      await page.locator('[data-testid="target-muscle-filter"]').selectOption(criteria.targetMuscle);
      await this.waitForExerciseSearch(page);
    }
    
    if (criteria.difficulty) {
      await page.locator('[data-testid="difficulty-filter"]').selectOption(criteria.difficulty);
      await this.waitForExerciseSearch(page);
    }
    
    // Verify results are filtered correctly
    const exerciseCards = page.locator('[data-testid="exercise-card"]');
    const count = await exerciseCards.count();
    
    if (count > 0) {
      // Verify first few results match criteria
      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = exerciseCards.nth(i);
        
        if (criteria.searchQuery) {
          const name = await card.locator('[data-testid="exercise-name"]').textContent();
          expect(name?.toLowerCase()).toContain(criteria.searchQuery.toLowerCase());
        }
      }
    }
  }

  /**
   * Test exercise accessibility features
   */
  static async verifyExerciseAccessibility(page: Page): Promise<string[]> {
    const issues: string[] = [];
    
    // Check exercise cards for accessibility
    const exerciseCards = await page.locator('[data-testid="exercise-card"]').all();
    
    for (let i = 0; i < Math.min(exerciseCards.length, 5); i++) {
      const card = exerciseCards[i];
      
      // Check for proper ARIA labels
      const hasAriaLabel = await card.getAttribute('aria-label');
      if (!hasAriaLabel) {
        issues.push(`Exercise card ${i} missing aria-label`);
      }
      
      // Check for keyboard focusability
      const isFocusable = await card.getAttribute('tabindex');
      if (!isFocusable && isFocusable !== '0') {
        issues.push(`Exercise card ${i} not keyboard focusable`);
      }
      
      // Check GIF alt text
      const gif = card.locator('[data-testid="exercise-gif"]');
      if (await gif.count() > 0) {
        const altText = await gif.getAttribute('alt');
        if (!altText) {
          issues.push(`Exercise card ${i} GIF missing alt text`);
        }
      }
    }
    
    // Check search input accessibility
    const searchInput = page.locator('[data-testid="exercise-search"]');
    const searchLabel = await searchInput.getAttribute('aria-label');
    if (!searchLabel) {
      issues.push('Search input missing aria-label');
    }
    
    return issues;
  }

  /**
   * Helper methods for generating random test data
   */
  private static getRandomMuscleGroup(): string[] {
    const muscles = [
      ['pectorals'], ['latissimus dorsi'], ['quadriceps'], ['biceps'], 
      ['triceps'], ['deltoids'], ['abs'], ['glutes'], ['hamstrings'], ['calves']
    ];
    return muscles[Math.floor(Math.random() * muscles.length)];
  }

  private static getRandomBodyPart(): string[] {
    const bodyParts = [
      ['chest'], ['back'], ['upper legs'], ['upper arms'], 
      ['lower arms'], ['shoulders'], ['waist'], ['lower legs'], ['neck']
    ];
    return bodyParts[Math.floor(Math.random() * bodyParts.length)];
  }

  private static getRandomEquipment(): string[] {
    const equipment = [
      ['body weight'], ['barbell'], ['dumbbell'], ['cable'], 
      ['machine'], ['kettlebell'], ['resistance band'], ['medicine ball']
    ];
    return equipment[Math.floor(Math.random() * equipment.length)];
  }

  private static getRandomDifficulty(): 'beginner' | 'intermediate' | 'advanced' {
    const difficulties: ('beginner' | 'intermediate' | 'advanced')[] = ['beginner', 'intermediate', 'advanced'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  /**
   * Performance test utilities
   */
  static async measureInfiniteScrollPerformance(page: Page): Promise<{ scrollTime: number; exercisesLoaded: number }> {
    const initialCount = await page.locator('[data-testid="exercise-card"]').count();
    
    const startTime = Date.now();
    
    // Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for new exercises to load
    await page.waitForFunction((initialCount) => {
      const newCount = document.querySelectorAll('[data-testid="exercise-card"]').length;
      return newCount > initialCount;
    }, initialCount, { timeout: 10000 });
    
    const endTime = Date.now();
    const finalCount = await page.locator('[data-testid="exercise-card"]').count();
    
    return {
      scrollTime: endTime - startTime,
      exercisesLoaded: finalCount - initialCount
    };
  }

  /**
   * Memory usage testing
   */
  static async checkMemoryUsage(page: Page): Promise<{ usedMemory: number; totalMemory: number }> {
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedMemory: (performance as any).memory.usedJSHeapSize,
          totalMemory: (performance as any).memory.totalJSHeapSize
        };
      }
      return { usedMemory: 0, totalMemory: 0 };
    });
    
    return memoryInfo;
  }

  /**
   * Network request optimization testing
   */
  static async monitorNetworkRequests(page: Page, duration: number = 30000): Promise<{ requestCount: number; totalSize: number; duplicateRequests: number }> {
    let requestCount = 0;
    let totalSize = 0;
    const requestUrls: string[] = [];
    let duplicateRequests = 0;
    
    page.on('response', (response) => {
      if (response.url().includes('/api/exercises') || response.url().includes('.gif')) {
        requestCount++;
        
        // Check for duplicates
        if (requestUrls.includes(response.url())) {
          duplicateRequests++;
        } else {
          requestUrls.push(response.url());
        }
        
        // Estimate size (headers might not be available)
        response.allHeaders().then(headers => {
          if (headers['content-length']) {
            totalSize += parseInt(headers['content-length']);
          }
        }).catch(() => {
          // Ignore if content-length not available
        });
      }
    });
    
    // Wait for specified duration
    await page.waitForTimeout(duration);
    
    return { requestCount, totalSize, duplicateRequests };
  }

  /**
   * Visual regression testing helpers
   */
  static async takeExerciseLibraryScreenshot(page: Page, name: string, fullPage: boolean = true): Promise<void> {
    await page.screenshot({
      path: `screenshots/exercise-library-${name}.png`,
      fullPage
    });
  }

  static async compareExerciseCardLayouts(page: Page, viewports: Array<{width: number; height: number; name: string}>): Promise<void> {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000); // Allow layout to settle
      
      await this.takeExerciseLibraryScreenshot(page, `${viewport.name}-layout`);
      
      // Verify grid adaptation
      const exerciseCards = page.locator('[data-testid="exercise-card"]');
      const firstCard = exerciseCards.first();
      
      if (await firstCard.isVisible()) {
        const cardBox = await firstCard.boundingBox();
        expect(cardBox?.width).toBeGreaterThan(0);
        expect(cardBox?.height).toBeGreaterThan(0);
      }
    }
  }
}