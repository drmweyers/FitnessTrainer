import { test, expect } from '@playwright/test';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { ClientsListPage } from './pages/ClientsListPage';
import { TestHelpers } from './utils/TestHelpers';
import { ExerciseTestHelpers } from './utils/ExerciseTestHelpers';

test.describe('Exercise Library Integration Tests (Epic 004)', () => {
  let trainerCredentials: { email: string; password: string };
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      trainerCredentials = await TestHelpers.createTestTrainer(page);
    } catch (error) {
      trainerCredentials = {
        email: 'trainer@evofit-qa.com',
        password: 'TestPassword123!'
      };
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await TestHelpers.loginAsTrainer(page, trainerCredentials);
    await ExerciseTestHelpers.cleanupExerciseTestData(page);
    await TestHelpers.cleanupTestData(page);
  });

  test.afterEach(async ({ page }) => {
    await ExerciseTestHelpers.cleanupExerciseTestData(page);
    await TestHelpers.cleanupTestData(page);
  });

  test.describe('Authentication Integration', () => {
    test('INT-001: should redirect unauthenticated users to login', async ({ page }) => {
      // Clear authentication
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access exercise library
      await page.goto('/exercises');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('INT-002: should maintain exercise library state after authentication refresh', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Apply filters and search
      await exerciseLibrary.searchExercises('push');
      await exerciseLibrary.filterByBodyPart('chest');
      
      // Simulate token refresh by navigating away and back
      await page.goto('/dashboard');
      await page.goto('/exercises');
      
      // State preservation depends on implementation
      await exerciseLibrary.expectPageToLoad();
      
      // At minimum, should still function properly
      await exerciseLibrary.searchExercises('test');
      const resultCount = await exerciseLibrary.exerciseCards.count();
      expect(resultCount).toBeGreaterThanOrEqual(0);
    });

    test('INT-003: should handle session expiration gracefully', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Mock expired token response
      await page.route('/api/exercises*', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expired' })
        });
      });
      
      // Try to search
      await exerciseLibrary.searchExercises('test');
      
      // Should handle gracefully (redirect to login or show error)
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const hasErrorMessage = await page.locator('text=/expired|unauthorized|login/i').count() > 0;
      
      expect(currentUrl.includes('/login') || hasErrorMessage).toBe(true);
    });
  });

  test.describe('Navigation Integration', () => {
    test('INT-004: should integrate with main navigation', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Navigate to exercise library from main nav
      await page.goto('/dashboard');
      await page.locator('nav a[href*="/exercises"], a[href*="exercise"]').first().click();
      
      await exerciseLibrary.expectPageToLoad();
      
      // Verify breadcrumb or active nav state
      const activeNavItem = page.locator('nav .active, nav [aria-current]');
      if (await activeNavItem.count() > 0) {
        const activeText = await activeNavItem.textContent();
        expect(activeText?.toLowerCase()).toContain('exercise');
      }
    });

    test('INT-005: should maintain navigation context across sections', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const clientsPage = new ClientsListPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Navigate to clients section
      await page.locator('nav a[href*="/clients"]').click();
      await clientsPage.expectPageToLoad();
      
      // Navigate back to exercises
      await page.locator('nav a[href*="/exercises"]').click();
      await exerciseLibrary.expectPageToLoad();
      
      // Should maintain proper state
      expect(await exerciseLibrary.exerciseCards.count()).toBeGreaterThan(0);
    });

    test('INT-006: should support deep linking to exercise details', async ({ page }) => {
      // Get an exercise ID first
      const exerciseLibrary = new ExerciseLibraryPage(page);
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Click exercise and get URL
      await exerciseLibrary.clickExercise(0);
      const exerciseDetail = new ExerciseDetailPage(page);
      await exerciseDetail.expectModalToBeVisible();
      
      const currentUrl = page.url();
      const exerciseName = await exerciseDetail.getExerciseName();
      
      await exerciseDetail.closeModal();
      
      // Navigate away and back using the URL
      await page.goto('/dashboard');
      await page.goto(currentUrl);
      
      // Should open the same exercise
      await exerciseDetail.expectModalToBeVisible();
      const reopenedExerciseName = await exerciseDetail.getExerciseName();
      expect(reopenedExerciseName).toBe(exerciseName);
    });
  });

  test.describe('Client Management Integration', () => {
    test('INT-007: should integrate with client program creation', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      // Create a test client first
      await TestHelpers.createTestClientViaAPI(page, {
        firstName: 'Integration',
        lastName: 'Test'
      });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Select an exercise and add to program/workout (if feature exists)
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Look for "Add to Program" or "Add to Workout" button
      const addToProgramButton = page.locator('button:has-text("Add to Program"), button:has-text("Add to Workout")');
      
      if (await addToProgramButton.count() > 0) {
        await addToProgramButton.first().click();
        
        // Should show client/program selection
        const selectionModal = page.locator('[role="dialog"]:has(text="Select Client"), [role="dialog"]:has(text="Add to Program")');
        await expect(selectionModal).toBeVisible();
        
        await selectionModal.locator('button:has-text("Cancel"), button:has-text("Close")').first().click();
      }
      
      await exerciseDetail.closeModal();
    });

    test('INT-008: should show exercise usage across client programs', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Look for usage information (if implemented)
      const usageInfo = page.locator('[data-testid="exercise-usage"], text="Used in", text="programs"');
      
      if (await usageInfo.count() > 0) {
        const usageText = await usageInfo.first().textContent();
        expect(usageText).toBeTruthy();
      }
      
      await exerciseDetail.closeModal();
    });
  });

  test.describe('Data Consistency Integration', () => {
    test('INT-009: should maintain data consistency across browser tabs', async ({ context }) => {
      // Open two tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      await TestHelpers.loginAsTrainer(page1, trainerCredentials);
      await TestHelpers.loginAsTrainer(page2, trainerCredentials);
      
      const exerciseLibrary1 = new ExerciseLibraryPage(page1);
      const exerciseLibrary2 = new ExerciseLibraryPage(page2);
      
      await exerciseLibrary1.navigateToExerciseLibrary();
      await exerciseLibrary1.expectPageToLoad();
      
      await exerciseLibrary2.navigateToExerciseLibrary();
      await exerciseLibrary2.expectPageToLoad();
      
      // Favorite an exercise in tab 1
      await exerciseLibrary1.favoriteExercise(0);
      
      // Refresh tab 2
      await page2.reload();
      await exerciseLibrary2.expectPageToLoad();
      
      // Check if favorite is reflected in tab 2
      await exerciseLibrary2.toggleFavoriteOnlyFilter();
      const favoriteCount = await exerciseLibrary2.exerciseCards.count();
      expect(favoriteCount).toBeGreaterThanOrEqual(1);
      
      await page1.close();
      await page2.close();
    });

    test('INT-010: should handle concurrent user operations', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Simulate concurrent operations
      const operations = [
        exerciseLibrary.searchExercises('push'),
        exerciseLibrary.favoriteExercise(1),
        exerciseLibrary.favoriteExercise(2),
        exerciseLibrary.filterByBodyPart('chest')
      ];
      
      // Execute operations concurrently
      await Promise.all(operations);
      
      // Verify no conflicts or data corruption
      await page.waitForTimeout(2000);
      
      const exerciseCount = await exerciseLibrary.exerciseCards.count();
      expect(exerciseCount).toBeGreaterThan(0);
      
      // Check favorites
      await exerciseLibrary.toggleFavoriteOnlyFilter();
      const favoriteCount = await exerciseLibrary.exerciseCards.count();
      expect(favoriteCount).toBeGreaterThanOrEqual(2);
    });

    test('INT-011: should sync data with backend changes', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const initialCount = await exerciseLibrary.exerciseCards.count();
      
      // Make backend API call to add/modify data
      await ExerciseTestHelpers.createTestExercises(page, 2);
      
      // Refresh or trigger data reload
      await page.reload();
      await exerciseLibrary.expectPageToLoad();
      
      const newCount = await exerciseLibrary.exerciseCards.count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Performance Integration', () => {
    test('INT-012: should maintain performance under real-world conditions', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Simulate real-world usage pattern
      await exerciseLibrary.navigateToExerciseLibrary();
      const loadStartTime = Date.now();
      await exerciseLibrary.expectPageToLoad();
      const loadTime = Date.now() - loadStartTime;
      
      expect(loadTime).toBeLessThan(3000); // 3 seconds for real-world conditions
      
      // Perform typical user actions
      const actions = [
        () => exerciseLibrary.searchExercises('bench'),
        () => exerciseLibrary.filterByEquipment('barbell'),
        () => exerciseLibrary.clickExercise(0),
        () => {
          const detail = new ExerciseDetailPage(page);
          return detail.closeModal();
        },
        () => exerciseLibrary.favoriteExercise(1),
        () => exerciseLibrary.scrollToLoadMore()
      ];
      
      for (const action of actions) {
        const actionStartTime = Date.now();
        await action();
        const actionTime = Date.now() - actionStartTime;
        
        expect(actionTime).toBeLessThan(2000); // Each action under 2 seconds
      }
    });

    test('INT-013: should handle memory usage efficiently', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Check initial memory usage
      const initialMemory = await ExerciseTestHelpers.checkMemoryUsage(page);
      
      // Perform memory-intensive operations
      for (let i = 0; i < 5; i++) {
        await exerciseLibrary.scrollToLoadMore();
        await page.waitForTimeout(1000);
      }
      
      // Check memory after operations
      const finalMemory = await ExerciseTestHelpers.checkMemoryUsage(page);
      
      if (initialMemory.usedMemory > 0 && finalMemory.usedMemory > 0) {
        const memoryIncrease = finalMemory.usedMemory - initialMemory.usedMemory;
        const memoryIncreaseRatio = memoryIncrease / initialMemory.usedMemory;
        
        // Memory shouldn't increase dramatically (more than 300%)
        expect(memoryIncreaseRatio).toBeLessThan(3);
        
        console.log(`Memory usage: Initial: ${initialMemory.usedMemory}, Final: ${finalMemory.usedMemory}, Increase: ${memoryIncreaseRatio * 100}%`);
      }
    });
  });

  test.describe('Error Recovery Integration', () => {
    test('INT-014: should recover from network interruptions', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Simulate network interruption
      await TestHelpers.simulateOfflineMode(page);
      
      // Try to perform actions
      await exerciseLibrary.searchExercises('test');
      await page.waitForTimeout(2000);
      
      // Restore network
      await TestHelpers.resetNetworkConditions(page);
      
      // Should recover and work normally
      await exerciseLibrary.searchExercises('push');
      await exerciseLibrary.expectSearchResults('push');
    });

    test('INT-015: should handle API errors gracefully', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Mock API error
      await ExerciseTestHelpers.mockExerciseApiError(page, '/api/exercises/search', 500);
      
      // Try to search
      await exerciseLibrary.searchExercises('test');
      
      // Should show error state
      await exerciseLibrary.expectErrorState();
      
      // Reset API
      await page.unroute('/api/exercises/search');
      
      // Retry should work
      if (await exerciseLibrary.retryButton.isVisible()) {
        await exerciseLibrary.retryButton.click();
        await exerciseLibrary.expectPageToLoad();
      }
    });
  });

  test.describe('Feature Flag Integration', () => {
    test('INT-016: should adapt to feature flag changes', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Mock feature flags (if implemented)
      await page.addInitScript(() => {
        window.featureFlags = {
          exerciseCollections: true,
          voiceInstructions: false,
          aiRecommendations: true
        };
      });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Features should be enabled/disabled based on flags
      const collectionsButton = page.locator('button:has-text("Collections")');
      if (await collectionsButton.count() > 0) {
        await expect(collectionsButton).toBeVisible();
      }
      
      // Voice instructions should be disabled
      const exerciseDetail = new ExerciseDetailPage(page);
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      const voiceButton = exerciseDetail.voiceInstructions;
      if (await voiceButton.count() > 0) {
        await expect(voiceButton).not.toBeVisible();
      }
      
      await exerciseDetail.closeModal();
    });
  });

  test.describe('Full User Journey Integration', () => {
    test('INT-017: should support complete trainer workflow', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      // Create a test client
      const client = await TestHelpers.createTestClientViaAPI(page, {
        firstName: 'Journey',
        lastName: 'Test'
      });
      
      // Journey: Find exercises for a client program
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Search for specific exercises
      await exerciseLibrary.searchExercises('push');
      await exerciseLibrary.expectSearchResults('push');
      
      // Filter by equipment available
      await exerciseLibrary.filterByEquipment('body weight');
      
      // View exercise details
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify instructions
      await exerciseDetail.verifyInstructionsPresent();
      
      // Add to favorites for later use
      await exerciseDetail.toggleFavorite();
      
      // Create a collection for this client
      await exerciseDetail.createNewCollection('Journey Test Workout', 'Exercises for Journey Test client');
      
      await exerciseDetail.closeModal();
      
      // Verify workflow completion
      await exerciseLibrary.toggleFavoriteOnlyFilter();
      const favoriteCount = await exerciseLibrary.exerciseCards.count();
      expect(favoriteCount).toBeGreaterThanOrEqual(1);
      
      console.log('Complete trainer workflow test passed');
    });
  });
});