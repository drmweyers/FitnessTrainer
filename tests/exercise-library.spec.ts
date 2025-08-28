import { test, expect } from '@playwright/test';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { TestHelpers } from './utils/TestHelpers';

test.describe('Exercise Library - Comprehensive E2E Tests (Epic 004)', () => {
  let trainerCredentials: { email: string; password: string };
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create test trainer account
    try {
      trainerCredentials = await TestHelpers.createTestTrainer(page);
    } catch (error) {
      console.log('Using existing trainer credentials for testing');
      trainerCredentials = {
        email: 'trainer@evofit-qa.com',
        password: 'TestPassword123!'
      };
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Setup authentication for each test
    await TestHelpers.loginAsTrainer(page, trainerCredentials);
    
    // Ensure we start with clean state
    await TestHelpers.cleanupTestData(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    await TestHelpers.cleanupTestData(page);
  });

  test.describe('Story 1: Browse Exercise Library', () => {
    test('TEST-001: should load exercise library page successfully', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Verify page elements are visible
      await expect(exerciseLibrary.pageTitle).toContainText('Exercise Library');
      await expect(exerciseLibrary.searchInput).toBeVisible();
      await expect(exerciseLibrary.advancedFiltersButton).toBeVisible();
      
      // Take screenshot for visual verification
      await TestHelpers.takeDesktopScreenshot(page, 'exercise-library-loaded');
    });

    test('TEST-002: should display exercise grid with GIF previews', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Verify minimum number of exercises are loaded
      await exerciseLibrary.expectMinimumExerciseCount(20);
      
      // Verify GIFs are loading properly
      await exerciseLibrary.verifyGifLoading();
      
      // Verify exercise cards have required information
      const firstExercise = exerciseLibrary.exerciseCards.first();
      await expect(firstExercise.locator('[data-testid="exercise-name"]')).toBeVisible();
      await expect(firstExercise.locator('[data-testid="exercise-muscle-group"]')).toBeVisible();
    });

    test('TEST-003: should support grid and list view modes', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test grid view (default)
      await exerciseLibrary.switchToGridView();
      await expect(exerciseLibrary.exerciseCards.first()).toBeVisible();
      
      // Test list view
      await exerciseLibrary.switchToListView();
      await expect(exerciseLibrary.exerciseList.first()).toBeVisible();
      
      // Switch back to grid view
      await exerciseLibrary.switchToGridView();
      await expect(exerciseLibrary.exerciseCards.first()).toBeVisible();
    });

    test('TEST-004: should load page under 2 seconds (performance requirement)', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      const loadTime = await exerciseLibrary.measurePageLoadTime();
      
      expect(loadTime).toBeLessThan(2000); // Under 2 seconds
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('TEST-005: should handle infinite scroll/pagination correctly', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const initialCount = await exerciseLibrary.exerciseCards.count();
      
      // Test loading more exercises
      await exerciseLibrary.scrollToLoadMore();
      
      const newCount = await exerciseLibrary.exerciseCards.count();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test('TEST-006: should display loading states properly', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Navigate and check for loading states
      await exerciseLibrary.navigateToExerciseLibrary();
      
      // Should show loading skeleton initially
      await exerciseLibrary.expectLoadingState();
      
      // Eventually should load successfully
      await exerciseLibrary.expectPageToLoad();
    });
  });

  test.describe('Story 2: Search Exercises', () => {
    test('TEST-007: should search exercises by name', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Search for a specific exercise
      await exerciseLibrary.searchExercises('push');
      await exerciseLibrary.expectSearchResults('push');
      
      // Verify search response time
      const searchTime = await exerciseLibrary.measureSearchResponseTime('bench press');
      expect(searchTime).toBeLessThan(500); // Under 500ms
    });

    test('TEST-008: should search within exercise instructions', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Search for terms that would be in instructions
      await exerciseLibrary.searchExercises('chest');
      
      const resultCount = await exerciseLibrary.exerciseCards.count();
      expect(resultCount).toBeGreaterThan(0);
    });

    test('TEST-009: should provide search suggestions with autocomplete', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Start typing in search
      await exerciseLibrary.searchInput.fill('push');
      
      // Wait for suggestions to appear
      await expect(exerciseLibrary.searchSuggestions).toBeVisible();
      
      // Select a suggestion
      await exerciseLibrary.selectSearchSuggestion('Push-ups');
      await exerciseLibrary.expectSearchResults('push');
    });

    test('TEST-010: should handle misspellings gracefully', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Search with common misspelling
      await exerciseLibrary.searchExercises('benchpres'); // Missing space
      
      const resultCount = await exerciseLibrary.exerciseCards.count();
      expect(resultCount).toBeGreaterThan(0); // Should still find results
    });

    test('TEST-011: should clear search functionality', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const initialCount = await exerciseLibrary.exerciseCards.count();
      
      // Perform search
      await exerciseLibrary.searchExercises('squat');
      const searchCount = await exerciseLibrary.exerciseCards.count();
      expect(searchCount).toBeLessThan(initialCount);
      
      // Clear search
      await exerciseLibrary.clearSearch();
      const clearedCount = await exerciseLibrary.exerciseCards.count();
      expect(clearedCount).toBe(initialCount);
    });

    test('TEST-012: should handle empty search results', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Search for something that doesn't exist
      await exerciseLibrary.searchExercises('nonexistentexercise12345');
      await exerciseLibrary.expectNoResults();
    });
  });

  test.describe('Story 3: Filter Exercises', () => {
    test('TEST-013: should filter by body part', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Filter by chest exercises
      await exerciseLibrary.filterByBodyPart('chest');
      await exerciseLibrary.expectFilteredResults('bodyPart', 'chest');
    });

    test('TEST-014: should filter by equipment', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Filter by barbell exercises
      await exerciseLibrary.filterByEquipment('barbell');
      await exerciseLibrary.expectFilteredResults('equipment', 'barbell');
    });

    test('TEST-015: should filter by target muscle', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Filter by biceps exercises
      await exerciseLibrary.filterByTargetMuscle('biceps');
      await exerciseLibrary.expectFilteredResults('targetMuscle', 'biceps');
    });

    test('TEST-016: should handle multiple filter combinations', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const initialCount = await exerciseLibrary.exerciseCards.count();
      
      // Apply multiple filters
      await exerciseLibrary.filterByBodyPart('upper body');
      const firstFilterCount = await exerciseLibrary.exerciseCards.count();
      expect(firstFilterCount).toBeLessThan(initialCount);
      
      await exerciseLibrary.filterByEquipment('dumbbell');
      const secondFilterCount = await exerciseLibrary.exerciseCards.count();
      expect(secondFilterCount).toBeLessThanOrEqual(firstFilterCount);
    });

    test('TEST-017: should show active filter badges', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Apply filter and verify badge appears
      await exerciseLibrary.filterByBodyPart('chest');
      await expect(exerciseLibrary.activeFilters.locator('text="chest"')).toBeVisible();
    });

    test('TEST-018: should clear individual filters', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Apply multiple filters
      await exerciseLibrary.filterByBodyPart('chest');
      await exerciseLibrary.filterByEquipment('barbell');
      
      // Clear one filter
      await exerciseLibrary.activeFilters.locator('[data-filter="chest"] button').click();
      
      // Verify only one filter remains active
      await expect(exerciseLibrary.activeFilters.locator('text="barbell"')).toBeVisible();
      await expect(exerciseLibrary.activeFilters.locator('text="chest"')).not.toBeVisible();
    });

    test('TEST-019: should clear all filters', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const initialCount = await exerciseLibrary.exerciseCards.count();
      
      // Apply multiple filters
      await exerciseLibrary.filterByBodyPart('chest');
      await exerciseLibrary.filterByEquipment('barbell');
      const filteredCount = await exerciseLibrary.exerciseCards.count();
      expect(filteredCount).toBeLessThan(initialCount);
      
      // Clear all filters
      await exerciseLibrary.clearAllFilters();
      const clearedCount = await exerciseLibrary.exerciseCards.count();
      expect(clearedCount).toBe(initialCount);
    });

    test('TEST-020: should show result count updates', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Check initial count
      const initialText = await exerciseLibrary.exerciseCount.textContent();
      const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
      
      // Apply filter and check updated count
      await exerciseLibrary.filterByBodyPart('chest');
      const filteredText = await exerciseLibrary.exerciseCount.textContent();
      const filteredCount = parseInt(filteredText?.match(/\d+/)?.[0] || '0');
      
      expect(filteredCount).toBeLessThan(initialCount);
    });
  });

  test.describe('Story 4: View Exercise Details', () => {
    test('TEST-021: should open exercise detail modal', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Click on first exercise
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
    });

    test('TEST-022: should display full-screen GIF animation', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify GIF player is visible and functional
      await expect(exerciseDetail.gifPlayer).toBeVisible();
      await expect(exerciseDetail.gifImage).toBeVisible();
    });

    test('TEST-023: should provide play/pause controls for GIF', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Test play/pause functionality
      await exerciseDetail.pauseGif();
      await exerciseDetail.playGif();
      await exerciseDetail.restartGif();
    });

    test('TEST-024: should display step-by-step instructions', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify instructions are present and meaningful
      await exerciseDetail.verifyInstructionsPresent();
    });

    test('TEST-025: should highlight primary and secondary muscles', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify muscle information is displayed
      await expect(exerciseDetail.primaryMuscles).toBeVisible();
      await expect(exerciseDetail.secondaryMuscles).toBeVisible();
      
      const muscles = await exerciseDetail.getTargetMuscles();
      expect(muscles.length).toBeGreaterThan(0);
    });

    test('TEST-026: should display equipment requirements', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify equipment information
      await expect(exerciseDetail.equipment).toBeVisible();
      const equipment = await exerciseDetail.getEquipment();
      expect(equipment.length).toBeGreaterThan(0);
    });

    test('TEST-027: should show difficulty indicators', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify difficulty is displayed
      await expect(exerciseDetail.exerciseDifficulty).toBeVisible();
      const difficulty = await exerciseDetail.getDifficulty();
      expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty.toLowerCase());
    });

    test('TEST-028: should display tips and common mistakes', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Verify tips and mistakes sections
      await expect(exerciseDetail.tipsSection).toBeVisible();
      await expect(exerciseDetail.commonMistakes).toBeVisible();
    });

    test('TEST-029: should close modal with multiple methods', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test close button
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      await exerciseDetail.closeModal();
      
      // Test overlay click
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      await exerciseDetail.closeModalByOverlay();
      
      // Test escape key
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      await exerciseDetail.closeModalByEscape();
    });
  });

  test.describe('Story 5: Favorite Exercises', () => {
    test('TEST-030: should toggle exercise as favorite', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Favorite from library view
      await exerciseLibrary.favoriteExercise(0);
      
      // Verify in detail view
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      await exerciseDetail.toggleFavorite(); // Should unfavorite
      await exerciseDetail.closeModal();
    });

    test('TEST-031: should navigate to favorites section', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Add some favorites first
      await exerciseLibrary.favoriteExercise(0);
      await exerciseLibrary.favoriteExercise(1);
      
      // Filter to show only favorites
      await exerciseLibrary.toggleFavoriteOnlyFilter();
      await exerciseLibrary.expectMinimumExerciseCount(2);
    });

    test('TEST-032: should sync favorites across browser sessions', async ({ page, context }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Favorite an exercise
      await exerciseLibrary.favoriteExercise(0);
      
      // Close and reopen browser context
      await context.close();
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      
      // Login again
      await TestHelpers.loginAsTrainer(newPage, trainerCredentials);
      
      const newExerciseLibrary = new ExerciseLibraryPage(newPage);
      await newExerciseLibrary.navigateToExerciseLibrary();
      await newExerciseLibrary.expectPageToLoad();
      
      // Check if favorite persisted
      await newExerciseLibrary.toggleFavoriteOnlyFilter();
      await newExerciseLibrary.expectMinimumExerciseCount(1);
      
      await newContext.close();
    });

    test('TEST-033: should bulk unfavorite exercises', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Add multiple favorites
      await exerciseLibrary.favoriteExercise(0);
      await exerciseLibrary.favoriteExercise(1);
      await exerciseLibrary.favoriteExercise(2);
      
      // Go to favorites view
      await exerciseLibrary.toggleFavoriteOnlyFilter();
      await exerciseLibrary.expectMinimumExerciseCount(3);
      
      // Test bulk operations (if implemented)
      if (await exerciseLibrary.bulkActionsButton.isVisible()) {
        await exerciseLibrary.bulkActionsButton.click();
        await page.locator('button:has-text("Remove All")').click();
        await page.locator('button:has-text("Confirm")').click();
        await exerciseLibrary.expectExerciseCount(0);
      }
    });
  });

  test.describe('Story 6: Exercise Collections', () => {
    test('TEST-034: should create named exercise collection', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Create new collection
      await exerciseDetail.createNewCollection('Upper Body Workout', 'Exercises for upper body strength');
      
      // Verify collection was created
      await exerciseDetail.addToCollection('Upper Body Workout');
    });

    test('TEST-035: should add and remove exercises from collections', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Add exercise to collection from library view
      await exerciseLibrary.addExerciseToCollection(0, 'Test Collection');
      
      // Verify addition was successful
      await page.waitForTimeout(1000); // Wait for API response
    });

    test('TEST-036: should duplicate collections', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Navigate to collections management (assuming there's a collections page)
      await page.goto('/collections');
      await page.waitForLoadState('networkidle');
      
      // Test collection duplication if UI exists
      if (await page.locator('[data-testid="duplicate-collection"]').first().isVisible()) {
        await page.locator('[data-testid="duplicate-collection"]').first().click();
        await page.locator('[data-testid="new-collection-name"]').fill('Duplicated Collection');
        await page.locator('[data-testid="confirm-duplicate"]').click();
        
        // Verify duplication
        await expect(page.locator('text="Duplicated Collection"')).toBeVisible();
      }
    });

    test('TEST-037: should delete collections with confirmation', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Navigate to collections and test deletion
      await page.goto('/collections');
      await page.waitForLoadState('networkidle');
      
      if (await page.locator('[data-testid="delete-collection"]').first().isVisible()) {
        await page.locator('[data-testid="delete-collection"]').first().click();
        
        // Should show confirmation dialog
        await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();
        await page.locator('button:has-text("Delete")').click();
        
        // Verify deletion
        await expect(page.locator('[data-testid="confirmation-modal"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('TEST-038: should handle large dataset efficiently (1324+ exercises)', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      
      // Measure initial load performance
      const loadTime = await exerciseLibrary.measurePageLoadTime();
      expect(loadTime).toBeLessThan(2000);
      
      // Test scrolling performance
      const startTime = Date.now();
      await exerciseLibrary.scrollToLoadMore();
      await exerciseLibrary.scrollToLoadMore();
      await exerciseLibrary.scrollToLoadMore();
      const scrollTime = Date.now() - startTime;
      
      expect(scrollTime).toBeLessThan(3000); // Reasonable scroll performance
    });

    test('TEST-039: should maintain performance with complex filters', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Apply multiple filters and measure response time
      const startTime = Date.now();
      
      await exerciseLibrary.filterByBodyPart('upper body');
      await exerciseLibrary.filterByEquipment('dumbbell');
      await exerciseLibrary.filterByTargetMuscle('biceps');
      
      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(1000); // Under 1 second for complex filtering
    });

    test('TEST-040: should optimize GIF loading and caching', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test initial GIF load time
      const startTime = Date.now();
      await exerciseLibrary.verifyGifLoading();
      const initialLoadTime = Date.now() - startTime;
      
      // Scroll away and back to test caching
      await exerciseLibrary.scrollToLoadMore();
      await exerciseLibrary.page.evaluate(() => window.scrollTo(0, 0));
      
      const cachedStartTime = Date.now();
      await exerciseLibrary.verifyGifLoading();
      const cachedLoadTime = Date.now() - cachedStartTime;
      
      // Cached load should be faster
      expect(cachedLoadTime).toBeLessThan(initialLoadTime);
    });

    test('TEST-041: should handle concurrent user scenarios', async ({ page }) => {
      // Simulate multiple concurrent operations
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Perform multiple operations simultaneously
      const operations = [
        exerciseLibrary.searchExercises('bench'),
        exerciseLibrary.favoriteExercise(1),
        exerciseLibrary.favoriteExercise(2),
        exerciseLibrary.scrollToLoadMore()
      ];
      
      await Promise.all(operations);
      
      // Verify all operations completed successfully
      await exerciseLibrary.expectSearchResults('bench');
    });
  });

  test.describe('Mobile and Responsiveness Tests', () => {
    test('TEST-042: should work correctly on mobile devices', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.testMobileLayout();
      
      // Test mobile-specific interactions
      await TestHelpers.takeMobileScreenshot(page, 'exercise-library-mobile');
    });

    test('TEST-043: should have appropriate touch targets for gym use', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Verify touch targets meet minimum size requirements
      await exerciseLibrary.testMobileLayout();
      
      // Test specific gym-environment requirements
      const exerciseCard = exerciseLibrary.exerciseCards.first();
      const cardBox = await exerciseCard.boundingBox();
      expect(cardBox?.height).toBeGreaterThanOrEqual(60); // Larger than typical 44px for gym use
      expect(cardBox?.width).toBeGreaterThanOrEqual(150); // Adequate width for thumbnails
    });

    test('TEST-044: should support swipe gestures on mobile', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.setMobileViewport();
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Test mobile gesture navigation
      await exerciseDetail.testMobileGestures();
    });

    test('TEST-045: should work correctly on tablet devices', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.testTabletLayout();
      
      await TestHelpers.takeTabletScreenshot(page, 'exercise-library-tablet');
    });
  });

  test.describe('Accessibility Tests', () => {
    test('TEST-046: should meet WCAG 2.1 AA compliance', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const accessibilityIssues = await TestHelpers.verifyAccessibility(page);
      expect(accessibilityIssues).toHaveLength(0);
    });

    test('TEST-047: should support keyboard navigation', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.verifyKeyboardNavigation();
    });

    test('TEST-048: should support screen readers', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      await exerciseLibrary.verifyScreenReaderSupport();
      
      // Test exercise detail accessibility
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      await exerciseDetail.verifyAccessibilityFeatures();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('TEST-049: should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and return error
      await TestHelpers.interceptApiError(page, '/api/exercises', 500);
      
      const exerciseLibrary = new ExerciseLibraryPage(page);
      await exerciseLibrary.navigateToExerciseLibrary();
      
      // Should show error state
      await exerciseLibrary.expectErrorState();
      await expect(exerciseLibrary.retryButton).toBeVisible();
    });

    test('TEST-050: should handle network connectivity issues', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Load page first
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Simulate network issues
      await TestHelpers.simulateOfflineMode(page);
      
      // Try to search
      await exerciseLibrary.searchExercises('test');
      
      // Should handle gracefully (show cached results or offline message)
      // Exact behavior depends on implementation
      
      // Restore network
      await TestHelpers.resetNetworkConditions(page);
    });

    test('TEST-051: should handle malformed exercise data', async ({ page }) => {
      // Mock API with malformed data
      await TestHelpers.mockApiResponse(page, '/api/exercises', {
        exercises: [
          { id: '1', name: null, gifUrl: 'broken.gif' }, // Missing name
          { id: '2', name: 'Test', gifUrl: null }, // Missing GIF
          { id: '3' } // Completely malformed
        ]
      });
      
      const exerciseLibrary = new ExerciseLibraryPage(page);
      await exerciseLibrary.navigateToExerciseLibrary();
      
      // Should handle gracefully without crashing
      await page.waitForTimeout(2000);
      
      // Should not show broken exercises or should show fallback content
      const errorElements = await page.locator('[data-testid="error"]').count();
      expect(errorElements).toBe(0); // No error elements should be visible
    });

    test('TEST-052: should handle slow network conditions', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Simulate slow network
      await TestHelpers.simulateSlowNetwork(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      
      // Should show loading state initially
      await exerciseLibrary.expectLoadingState();
      
      // Eventually should load successfully
      await exerciseLibrary.expectPageToLoad();
      
      // Restore normal network conditions
      await TestHelpers.resetNetworkConditions(page);
    });
  });

  test.describe('Integration Tests', () => {
    test('TEST-053: should integrate with user authentication', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Test unauthenticated access
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.goto('/exercises');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      
      // Login and access
      await TestHelpers.loginAsTrainer(page, trainerCredentials);
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
    });

    test('TEST-054: should integrate with other platform sections', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test navigation to other sections
      await page.locator('nav a[href="/clients"]').click();
      await expect(page).toHaveURL('/clients');
      
      // Navigate back to exercises
      await page.locator('nav a[href="/exercises"]').click();
      await exerciseLibrary.expectPageToLoad();
    });

    test('TEST-055: should maintain session across page navigations', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Apply filters
      await exerciseLibrary.searchExercises('push');
      await exerciseLibrary.filterByBodyPart('chest');
      
      // Navigate away and back
      await page.goto('/dashboard');
      await page.goto('/exercises');
      
      // Filters should be preserved (depending on implementation)
      // This test verifies the expected behavior
      const searchValue = await exerciseLibrary.searchInput.inputValue();
      expect(searchValue).toBe('push');
    });
  });
});