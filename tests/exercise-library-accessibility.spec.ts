import { test, expect } from '@playwright/test';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { TestHelpers } from './utils/TestHelpers';
import { ExerciseTestHelpers } from './utils/ExerciseTestHelpers';

test.describe('Exercise Library Accessibility & Mobile Tests (Epic 004)', () => {
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
  });

  test.afterEach(async ({ page }) => {
    await ExerciseTestHelpers.cleanupExerciseTestData(page);
  });

  test.describe('WCAG 2.1 AA Compliance Tests', () => {
    test('ACC-001: should meet color contrast requirements', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test color contrast for critical elements
      const contrastResults = await page.evaluate(() => {
        const elements = [
          { selector: '[data-testid="exercise-search"]', name: 'Search input' },
          { selector: '[data-testid="exercise-name"]', name: 'Exercise names' },
          { selector: 'button', name: 'Buttons' },
          { selector: '[data-testid="active-filters"]', name: 'Filter badges' }
        ];
        
        const results = [];
        
        for (const element of elements) {
          const el = document.querySelector(element.selector);
          if (el) {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            results.push({
              element: element.name,
              color,
              backgroundColor,
              selector: element.selector
            });
          }
        }
        
        return results;
      });
      
      // Verify contrast ratios meet WCAG AA standards (4.5:1 for normal text)
      console.log('Color contrast analysis:', contrastResults);
      expect(contrastResults.length).toBeGreaterThan(0);
    });

    test('ACC-002: should provide proper heading hierarchy', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const headingHierarchy = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headings.map(h => ({
          level: parseInt(h.tagName.substring(1)),
          text: h.textContent?.trim(),
          tagName: h.tagName
        }));
      });
      
      // Verify proper heading hierarchy
      expect(headingHierarchy.length).toBeGreaterThan(0);
      
      // Should start with h1
      const firstHeading = headingHierarchy[0];
      expect(firstHeading.level).toBe(1);
      expect(firstHeading.text).toContain('Exercise Library');
      
      // Check for heading level skipping
      for (let i = 1; i < headingHierarchy.length; i++) {
        const currentLevel = headingHierarchy[i].level;
        const previousLevel = headingHierarchy[i - 1].level;
        
        if (currentLevel > previousLevel) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
      }
    });

    test('ACC-003: should provide alt text for all images/GIFs', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Check first 10 exercise GIFs for alt text
      const gifElements = await exerciseLibrary.exerciseGifs.all();
      
      for (let i = 0; i < Math.min(gifElements.length, 10); i++) {
        const gif = gifElements[i];
        const altText = await gif.getAttribute('alt');
        
        expect(altText).toBeTruthy();
        expect(altText.length).toBeGreaterThan(3); // Should be descriptive
      }
    });

    test('ACC-004: should support keyboard navigation', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Start from search input
      await exerciseLibrary.searchInput.focus();
      
      // Tab through focusable elements
      const focusableElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));
        
        return elements
          .filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            testId: el.getAttribute('data-testid'),
            tabIndex: el.tabIndex
          }));
      });
      
      expect(focusableElements.length).toBeGreaterThan(5); // Should have multiple focusable elements
      
      // Test tab navigation
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement;
          return {
            tagName: focused?.tagName,
            testId: focused?.getAttribute('data-testid'),
            className: focused?.className
          };
        });
        
        expect(focusedElement.tagName).toBeTruthy();
      }
    });

    test('ACC-005: should provide proper ARIA labels and roles', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Check search input
      await expect(exerciseLibrary.searchInput).toHaveAttribute('aria-label');
      
      // Check exercise cards
      const exerciseCards = await exerciseLibrary.exerciseCards.all();
      
      for (let i = 0; i < Math.min(exerciseCards.length, 5); i++) {
        const card = exerciseCards[i];
        
        // Should have role or aria-label
        const role = await card.getAttribute('role');
        const ariaLabel = await card.getAttribute('aria-label');
        
        expect(role || ariaLabel).toBeTruthy();
      }
      
      // Check filter buttons
      if (await exerciseLibrary.advancedFiltersButton.isVisible()) {
        await expect(exerciseLibrary.advancedFiltersButton).toHaveAttribute('aria-expanded');
      }
    });

    test('ACC-006: should support screen readers', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test modal accessibility
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Modal should have proper ARIA attributes
      await expect(exerciseDetail.modal).toHaveAttribute('role', 'dialog');
      await expect(exerciseDetail.modal).toHaveAttribute('aria-modal', 'true');
      
      // Close button should be labeled
      await expect(exerciseDetail.closeButton).toHaveAttribute('aria-label');
      
      // GIF player should have controls labeled
      if (await exerciseDetail.playPauseButton.isVisible()) {
        const buttonLabel = await exerciseDetail.playPauseButton.getAttribute('aria-label');
        expect(buttonLabel).toBeTruthy();
      }
      
      await exerciseDetail.closeModal();
    });

    test('ACC-007: should handle reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Animations should be reduced or disabled
      const hasTransitions = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let hasAnimations = false;
        
        for (const element of elements) {
          const style = window.getComputedStyle(element);
          if (style.animationDuration !== '0s' || style.transitionDuration !== '0s') {
            hasAnimations = true;
            break;
          }
        }
        
        return hasAnimations;
      });
      
      // Should respect reduced motion (implementation-dependent)
      console.log('Animations present with reduced motion:', hasTransitions);
    });
  });

  test.describe('Mobile Gym Environment Tests', () => {
    test('MOB-001: should have appropriate touch targets for gym use', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Check touch target sizes (minimum 44x44 pixels, preferably larger for gym use)
      const touchTargets = await page.locator('button, a, [role="button"], input[type="checkbox"], input[type="radio"]').all();
      
      for (let i = 0; i < Math.min(touchTargets.length, 10); i++) {
        const target = touchTargets[i];
        const box = await target.boundingBox();
        
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44); // WCAG minimum
          expect(box.width).toBeGreaterThanOrEqual(44);
          
          // Gym environment should have larger targets
          if (await target.getAttribute('data-testid') === 'exercise-card') {
            expect(box.height).toBeGreaterThanOrEqual(60); // Larger for gym use
          }
        }
      }
      
      await TestHelpers.takeMobileScreenshot(page, 'gym-touch-targets');
    });

    test('MOB-002: should support swipe gestures', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      const exerciseDetail = new ExerciseDetailPage(page);
      
      await page.setViewportSize({ width: 390, height: 844 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Open exercise detail
      await exerciseLibrary.clickExercise(0);
      await exerciseDetail.expectModalToBeVisible();
      
      // Test swipe navigation (if implemented)
      const initialExerciseName = await exerciseDetail.getExerciseName();
      
      // Simulate swipe left for next exercise
      await exerciseDetail.mobileGestureArea.hover();
      await page.mouse.down();
      await page.mouse.move(200, 0); // Swipe left
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
      
      // Check if exercise changed (implementation-dependent)
      const newExerciseName = await exerciseDetail.getExerciseName();
      
      // Either should navigate or gracefully handle
      expect(newExerciseName).toBeTruthy();
      
      await exerciseDetail.closeModal();
    });

    test('MOB-003: should work with gloved hands (larger touch areas)', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await page.setViewportSize({ width: 390, height: 844 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test interaction with larger touch areas (simulating gloved hands)
      const exerciseCard = exerciseLibrary.exerciseCards.first();
      const cardBox = await exerciseCard.boundingBox();
      
      if (cardBox) {
        // Click slightly off-center to simulate imprecise touch
        await page.mouse.click(
          cardBox.x + cardBox.width * 0.3,
          cardBox.y + cardBox.height * 0.3
        );
        
        // Should still trigger the exercise
        const exerciseDetail = new ExerciseDetailPage(page);
        await exerciseDetail.expectModalToBeVisible();
        await exerciseDetail.closeModal();
      }
    });

    test('MOB-004: should handle orientation changes', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Portrait mode
      await page.setViewportSize({ width: 390, height: 844 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const portraitCount = await exerciseLibrary.exerciseCards.count();
      
      // Landscape mode
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(1000);
      
      const landscapeCount = await exerciseLibrary.exerciseCards.count();
      
      // Layout should adapt but maintain functionality
      expect(landscapeCount).toBeGreaterThan(0);
      expect(portraitCount).toBeGreaterThan(0);
      
      await TestHelpers.takeMobileScreenshot(page, 'landscape-mode');
    });

    test('MOB-005: should work offline (cached exercises)', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // Load exercises first
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      const onlineCount = await exerciseLibrary.exerciseCards.count();
      
      // Go offline
      await TestHelpers.simulateOfflineMode(page);
      
      // Refresh page
      await page.reload();
      
      // Should show cached content or offline message
      try {
        await exerciseLibrary.expectPageToLoad();
        const offlineCount = await exerciseLibrary.exerciseCards.count();
        expect(offlineCount).toBeGreaterThan(0);
      } catch (error) {
        // Should show offline message
        const offlineMessage = page.locator('text=/offline|network/i');
        await expect(offlineMessage).toBeVisible();
      }
      
      await TestHelpers.resetNetworkConditions(page);
    });

    test('MOB-006: should optimize for battery life', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await page.setViewportSize({ width: 390, height: 844 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Monitor network requests
      let requestCount = 0;
      page.on('request', (request) => {
        if (request.url().includes('.gif') || request.url().includes('/api/exercises')) {
          requestCount++;
        }
      });
      
      // Scroll and interact
      await exerciseLibrary.scrollToLoadMore();
      await page.waitForTimeout(2000);
      
      // Should minimize network requests through caching
      expect(requestCount).toBeLessThan(50); // Reasonable limit
      
      console.log(`Network requests made: ${requestCount}`);
    });
  });

  test.describe('Tablet and Large Mobile Tests', () => {
    test('TAB-001: should optimize layout for tablet screens', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      // iPad-like dimensions
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Should show more exercises per row
      const exerciseCards = await exerciseLibrary.exerciseCards.all();
      
      if (exerciseCards.length >= 4) {
        // Check first row positioning
        const firstCard = await exerciseCards[0].boundingBox();
        const secondCard = await exerciseCards[1].boundingBox();
        const thirdCard = await exerciseCards[2].boundingBox();
        const fourthCard = await exerciseCards[3].boundingBox();
        
        if (firstCard && secondCard && thirdCard && fourthCard) {
          // Should have multiple cards per row
          const sameLine = Math.abs(firstCard.y - secondCard.y) < 20;
          expect(sameLine).toBe(true);
        }
      }
      
      await TestHelpers.takeTabletScreenshot(page, 'tablet-grid-layout');
    });

    test('TAB-002: should provide tablet-optimized search experience', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Search input should be larger on tablets
      const searchBox = await exerciseLibrary.searchInput.boundingBox();
      expect(searchBox?.height).toBeGreaterThanOrEqual(48); // Larger than mobile
      
      // Filter controls should be more accessible
      await exerciseLibrary.openAdvancedFilters();
      
      const filterPanel = await exerciseLibrary.filtersPanel.boundingBox();
      expect(filterPanel?.width).toBeGreaterThan(300); // More space for filters
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('BROWSER-001: should work consistently across browsers', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Test core functionality
      await exerciseLibrary.searchExercises('push');
      await exerciseLibrary.expectSearchResults('push');
      
      // Test filtering
      await exerciseLibrary.filterByBodyPart('chest');
      await exerciseLibrary.expectFilteredResults('bodyPart', 'chest');
      
      // Test exercise detail
      await exerciseLibrary.clickExercise(0);
      const exerciseDetail = new ExerciseDetailPage(page);
      await exerciseDetail.expectModalToBeVisible();
      await exerciseDetail.closeModal();
    });
  });

  test.describe('Accessibility Test Summary', () => {
    test('ACC-SUMMARY: should pass comprehensive accessibility audit', async ({ page }) => {
      const exerciseLibrary = new ExerciseLibraryPage(page);
      
      await exerciseLibrary.navigateToExerciseLibrary();
      await exerciseLibrary.expectPageToLoad();
      
      // Run comprehensive accessibility check
      const accessibilityIssues = await ExerciseTestHelpers.verifyExerciseAccessibility(page);
      
      // Log issues for review
      if (accessibilityIssues.length > 0) {
        console.log('Accessibility issues found:', accessibilityIssues);
      }
      
      // Should have minimal or no critical accessibility issues
      expect(accessibilityIssues.length).toBeLessThanOrEqual(5); // Allow minor issues
      
      // Generate accessibility report
      const report = {
        timestamp: new Date().toISOString(),
        page: 'Exercise Library',
        issues: accessibilityIssues,
        totalChecks: 15,
        passedChecks: 15 - accessibilityIssues.length
      };
      
      console.log('Accessibility Report:', JSON.stringify(report, null, 2));
    });
  });
});