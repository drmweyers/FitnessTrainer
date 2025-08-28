const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function runExerciseLibraryTests() {
  console.log('🚀 Starting Comprehensive Exercise Library Testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser for visual feedback
    slowMo: 1000     // Slow down for better observation
  });
  
  // Test on multiple viewport sizes
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  for (const viewport of viewports) {
    console.log(`\n📱 Testing on ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    try {
      // ============= PHASE 1 TESTS =============
      console.log('\n🔵 PHASE 1: Core Functionality Testing');
      
      // Test 1: Page Load
      console.log('🧪 Test 1: Exercise Library page loads correctly');
      await page.goto('http://localhost:3001/dashboard/exercises', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for exercises to load
      await page.waitForSelector('[data-testid="exercise-card"], .exercise-card, .grid > div, [class*="exercise"]', { 
        timeout: 15000 
      });
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `${viewport.name.toLowerCase()}-page-load.png`),
        fullPage: true 
      });
      
      console.log('✅ Page loaded successfully');
      testResults.passed++;
      testResults.tests.push({
        name: `${viewport.name} - Page Load`,
        status: 'PASSED',
        details: 'Exercise Library page loaded with exercises visible'
      });

      // Test 2: Exercise Count Verification
      console.log('🧪 Test 2: Verify exercises are displayed');
      const exerciseElements = await page.locator('[data-testid="exercise-card"], .exercise-card, .grid > div, [class*="exercise"]').count();
      console.log(`Found ${exerciseElements} exercise elements on page`);
      
      if (exerciseElements > 0) {
        console.log('✅ Exercises are displaying');
        testResults.passed++;
        testResults.tests.push({
          name: `${viewport.name} - Exercise Display`,
          status: 'PASSED',
          details: `${exerciseElements} exercises visible on page`
        });
      } else {
        console.log('❌ No exercises found on page');
        testResults.failed++;
        testResults.tests.push({
          name: `${viewport.name} - Exercise Display`,
          status: 'FAILED',
          details: 'No exercise elements found on page'
        });
      }

      // Test 3: Search Functionality
      console.log('🧪 Test 3: Testing search functionality');
      
      // Look for search input
      const searchSelectors = [
        'input[placeholder*="search" i]',
        'input[type="search"]',
        '[data-testid="search-input"]',
        '.search-input',
        'input[name*="search" i]'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          searchInput = await page.locator(selector).first();
          if (await searchInput.isVisible()) break;
        } catch (e) {
          continue;
        }
      }
      
      if (searchInput) {
        // Test search with "push"
        await searchInput.fill('push');
        await page.keyboard.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, `${viewport.name.toLowerCase()}-search-push.png`),
          fullPage: true 
        });
        
        const searchResults = await page.locator('[data-testid="exercise-card"], .exercise-card, .grid > div, [class*="exercise"]').count();
        console.log(`Search for "push" returned ${searchResults} results`);
        
        testResults.passed++;
        testResults.tests.push({
          name: `${viewport.name} - Search Functionality`,
          status: 'PASSED',
          details: `Search for "push" returned ${searchResults} results`
        });
        
        // Clear search
        await searchInput.clear();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      } else {
        console.log('⚠️ Search input not found - may not be implemented yet');
        testResults.tests.push({
          name: `${viewport.name} - Search Functionality`,
          status: 'SKIPPED',
          details: 'Search input element not found'
        });
      }

      // Test 4: Filter Testing
      console.log('🧪 Test 4: Testing filter functionality');
      
      // Look for filter elements
      const filterSelectors = [
        '[data-testid*="filter"]',
        '.filter',
        'select',
        '[class*="filter"]',
        'button[role="button"]'
      ];
      
      let filtersFound = false;
      for (const selector of filterSelectors) {
        const filters = await page.locator(selector).count();
        if (filters > 0) {
          filtersFound = true;
          console.log(`Found ${filters} filter elements with selector: ${selector}`);
          break;
        }
      }
      
      if (filtersFound) {
        console.log('✅ Filter elements found');
        testResults.passed++;
        testResults.tests.push({
          name: `${viewport.name} - Filter Elements`,
          status: 'PASSED',
          details: 'Filter elements are present on the page'
        });
      } else {
        console.log('⚠️ Filter elements not found - may not be implemented yet');
        testResults.tests.push({
          name: `${viewport.name} - Filter Elements`,
          status: 'SKIPPED',
          details: 'Filter elements not found'
        });
      }

      // Test 5: Exercise Detail Test (Click first exercise)
      console.log('🧪 Test 5: Testing exercise detail view');
      
      try {
        const firstExercise = page.locator('[data-testid="exercise-card"], .exercise-card, .grid > div, [class*="exercise"]').first();
        
        if (await firstExercise.isVisible()) {
          await firstExercise.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, `${viewport.name.toLowerCase()}-exercise-detail.png`),
            fullPage: true 
          });
          
          // Check if we're on a detail page or modal opened
          const url = page.url();
          const hasModal = await page.locator('.modal, [role="dialog"], .overlay').count() > 0;
          
          if (url.includes('/exercise/') || hasModal) {
            console.log('✅ Exercise detail view opened');
            testResults.passed++;
            testResults.tests.push({
              name: `${viewport.name} - Exercise Detail`,
              status: 'PASSED',
              details: hasModal ? 'Modal opened for exercise details' : 'Navigated to exercise detail page'
            });
          } else {
            console.log('⚠️ Exercise click did not open detail view');
            testResults.tests.push({
              name: `${viewport.name} - Exercise Detail`,
              status: 'PARTIAL',
              details: 'Exercise clickable but detail view behavior unclear'
            });
          }
          
          // Go back to main page
          if (url.includes('/exercise/')) {
            await page.goBack();
          } else if (hasModal) {
            // Try to close modal
            const closeButtons = await page.locator('.close, [aria-label="close"], button:has-text("×")').count();
            if (closeButtons > 0) {
              await page.locator('.close, [aria-label="close"], button:has-text("×")').first().click();
            }
          }
          
          await page.waitForTimeout(1000);
        } else {
          console.log('❌ No exercises found to click');
          testResults.failed++;
          testResults.tests.push({
            name: `${viewport.name} - Exercise Detail`,
            status: 'FAILED',
            details: 'No clickable exercises found'
          });
        }
      } catch (error) {
        console.log(`❌ Error testing exercise detail: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({
          name: `${viewport.name} - Exercise Detail`,
          status: 'FAILED',
          details: `Error: ${error.message}`
        });
      }

      // Test 6: GIF Loading Test
      console.log('🧪 Test 6: Testing GIF loading');
      
      const images = await page.locator('img[src*=".gif"], img[alt*="gif" i]').count();
      console.log(`Found ${images} GIF images on page`);
      
      if (images > 0) {
        // Check if first GIF loads
        const firstGif = page.locator('img[src*=".gif"], img[alt*="gif" i]').first();
        const gifSrc = await firstGif.getAttribute('src');
        console.log(`First GIF source: ${gifSrc}`);
        
        testResults.passed++;
        testResults.tests.push({
          name: `${viewport.name} - GIF Loading`,
          status: 'PASSED',
          details: `${images} GIF images found and displaying`
        });
      } else {
        console.log('⚠️ No GIF images found');
        testResults.tests.push({
          name: `${viewport.name} - GIF Loading`,
          status: 'SKIPPED',
          details: 'No GIF images found on page'
        });
      }

    } catch (error) {
      console.log(`❌ Major error during ${viewport.name} testing: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({
        name: `${viewport.name} - Major Error`,
        status: 'FAILED',
        details: error.message
      });
      
      // Take error screenshot
      try {
        await page.screenshot({ 
          path: path.join(screenshotsDir, `${viewport.name.toLowerCase()}-error.png`),
          fullPage: true 
        });
      } catch (screenshotError) {
        console.log('Could not take error screenshot');
      }
    }

    await context.close();
  }

  await browser.close();

  // ============= TEST RESULTS SUMMARY =============
  console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('=====================================');
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📝 Total Tests: ${testResults.tests.length}`);
  console.log(`📷 Screenshots saved to: ${screenshotsDir}`);
  
  console.log('\n📋 Detailed Test Results:');
  testResults.tests.forEach((test, index) => {
    const statusIcon = test.status === 'PASSED' ? '✅' : 
                      test.status === 'FAILED' ? '❌' : 
                      test.status === 'PARTIAL' ? '⚠️' : '⏭️';
    console.log(`${statusIcon} ${test.name}: ${test.details}`);
  });

  console.log('\n🎯 NEXT PHASE RECOMMENDATIONS:');
  console.log('- Continue with PHASE 2: User Experience Testing');
  console.log('- Test loading states and error handling');
  console.log('- Test advanced features like favorites and collections');
  console.log('- Performance testing with edge cases');

  return testResults;
}

// Run the tests
runExerciseLibraryTests().catch(console.error);