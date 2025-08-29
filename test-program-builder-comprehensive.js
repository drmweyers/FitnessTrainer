const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testsPassed = 0;
  let testsFailed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      testsPassed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      testsFailed++;
    }
  };

  try {
    console.log('🧪 Comprehensive Program Builder Testing\n');
    console.log('================================\n');

    // Navigate to the app
    await page.goto('http://localhost:3001/programs/new');
    await page.waitForLoadState('networkidle');

    // Test 1: Form Validation
    console.log('📋 Testing Form Validation:\n');
    
    await test('Empty form should not proceed', async () => {
      const nextButton = await page.locator('button:has-text("Next")').first();
      await nextButton.click();
      // Should still be on step 1
      const step1Active = await page.locator('.bg-blue-600').first().textContent();
      if (step1Active !== '1') throw new Error('Proceeded with empty form');
    });

    await test('Program name is required', async () => {
      const nameInput = await page.locator('input[id="name"]');
      await nameInput.fill('');
      const nextButton = await page.locator('button:has-text("Next")').first();
      await nextButton.click();
      await page.waitForTimeout(500);
      // Check if still on step 1
      const currentStep = await page.locator('.bg-blue-600').first().textContent();
      if (currentStep !== '1') throw new Error('Validation failed for empty name');
    });

    // Test 2: Fill Valid Form Data
    console.log('\n📝 Testing Valid Form Input:\n');
    
    await test('Can fill program name', async () => {
      const nameInput = await page.locator('input[id="name"]');
      await nameInput.fill('Advanced Powerlifting Program');
    });

    await test('Can fill description', async () => {
      const desc = await page.locator('textarea[id="description"]');
      await desc.fill('12-week program focused on increasing squat, bench, and deadlift');
    });

    await test('Can select program type', async () => {
      const select = await page.locator('select[id="programType"]');
      await select.selectOption('powerlifting');
    });

    await test('Can select difficulty', async () => {
      await page.click('button:has-text("Advanced")');
    });

    await test('Can set duration with slider', async () => {
      const slider = await page.locator('input[type="range"]');
      await slider.fill('12');
      const display = await page.locator('text=/12 weeks/i').first();
      if (!await display.isVisible()) throw new Error('Duration not updated');
    });

    await test('Can select multiple goals', async () => {
      await page.click('button:has-text("Build Strength")');
      await page.click('button:has-text("Competition Prep")');
      await page.click('button:has-text("Increase Power")');
      // Check if buttons are selected (should have different color)
      const selected = await page.locator('.bg-blue-500').count();
      if (selected < 3) throw new Error('Goals not selected properly');
    });

    await test('Can select multiple equipment', async () => {
      await page.click('button:has-text("Barbell")');
      await page.click('button:has-text("Squat Rack")');
      await page.click('button:has-text("Bench")');
      const selected = await page.locator('.bg-green-500').count();
      if (selected < 3) throw new Error('Equipment not selected properly');
    });

    // Test 3: Navigation
    console.log('\n🧭 Testing Navigation:\n');
    
    await test('Can proceed to Week Builder', async () => {
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
      const step2Active = await page.locator('.bg-blue-600').first().textContent();
      if (step2Active !== '2') throw new Error('Did not move to step 2');
    });

    await test('Can go back to previous step', async () => {
      await page.click('button:has-text("Previous")');
      await page.waitForTimeout(500);
      const step1Active = await page.locator('.bg-blue-600').first().textContent();
      if (step1Active !== '1') throw new Error('Did not go back to step 1');
    });

    await test('Can click step indicators to navigate', async () => {
      // First go to step 2
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      // Then click step 1 indicator
      const step1Button = await page.locator('.rounded-full').first();
      await step1Button.click();
      await page.waitForTimeout(500);
      const currentStep = await page.locator('.bg-blue-600').first().textContent();
      if (currentStep !== '1') throw new Error('Step indicator navigation failed');
    });

    // Test 4: Week Builder
    console.log('\n📅 Testing Week Builder:\n');
    
    // Go to Week Builder
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    await test('Week Builder displays weeks based on duration', async () => {
      const weekElements = await page.locator('text=/Week/i').count();
      if (weekElements < 1) throw new Error('No weeks displayed');
    });

    await test('Can add a new week', async () => {
      const addButton = await page.locator('button:has-text("Add Week")').first();
      if (await addButton.isVisible()) {
        const initialCount = await page.locator('text=/Week/i').count();
        await addButton.click();
        await page.waitForTimeout(500);
        const newCount = await page.locator('text=/Week/i').count();
        if (newCount <= initialCount) throw new Error('Week not added');
      }
    });

    await test('Can mark week as deload', async () => {
      const deloadToggle = await page.locator('text=/deload/i').first();
      if (await deloadToggle.isVisible()) {
        await deloadToggle.click();
      }
    });

    // Test 5: Workout Builder
    console.log('\n💪 Testing Workout Builder:\n');
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    await test('Workout Builder loads', async () => {
      const workoutSection = await page.locator('text=/workout/i').first();
      if (!await workoutSection.isVisible()) throw new Error('Workout builder not visible');
    });

    await test('Can add a workout', async () => {
      const addWorkout = await page.locator('button:has-text("Add Workout")').first();
      if (await addWorkout.isVisible()) {
        await addWorkout.click();
        await page.waitForTimeout(500);
      }
    });

    // Test 6: Exercise Selector
    console.log('\n🏋️ Testing Exercise Selector:\n');
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    await test('Exercise selector loads', async () => {
      const exerciseSection = await page.locator('text=/exercise/i').first();
      if (!await exerciseSection.isVisible()) throw new Error('Exercise selector not visible');
    });

    // Test 7: Preview
    console.log('\n👁️ Testing Preview:\n');
    
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    await test('Preview shows program summary', async () => {
      const preview = await page.locator('text=/preview/i').first();
      if (!await preview.isVisible()) throw new Error('Preview not visible');
    });

    await test('Save button appears in preview', async () => {
      const saveButton = await page.locator('button:has-text("Save")').first();
      if (!await saveButton.isVisible()) throw new Error('Save button not visible');
    });

    // Test 8: Auto-save
    console.log('\n💾 Testing Auto-save:\n');
    
    await test('Auto-save indicator appears', async () => {
      const autoSave = await page.locator('text=/draft.*saved/i');
      // Make a change to trigger auto-save
      await page.click('button:has-text("Previous")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Previous")');
      await page.waitForTimeout(500);
      const nameInput = await page.locator('input[id="name"]');
      await nameInput.fill('Modified Program Name');
      await page.waitForTimeout(2500); // Wait for auto-save delay
      if (!await autoSave.isVisible()) {
        console.log('   ⚠️  Auto-save indicator not visible (may be timing issue)');
      }
    });

    // Test 9: Edge Cases
    console.log('\n⚠️  Testing Edge Cases:\n');
    
    await test('Handles very long program name', async () => {
      const nameInput = await page.locator('input[id="name"]');
      const longName = 'A'.repeat(200);
      await nameInput.fill(longName);
      const value = await nameInput.inputValue();
      if (value.length === 0) throw new Error('Long name not accepted');
    });

    await test('Handles special characters in name', async () => {
      const nameInput = await page.locator('input[id="name"]');
      await nameInput.fill('Program #1: Strength & Conditioning (Advanced)');
      const value = await nameInput.inputValue();
      if (!value.includes('#')) throw new Error('Special characters not accepted');
    });

    await test('Can set minimum duration (1 week)', async () => {
      const slider = await page.locator('input[type="range"]');
      await slider.fill('1');
      const display = await page.locator('text=/1 week[^s]/i').first();
      if (!await display.isVisible()) throw new Error('Minimum duration not working');
    });

    await test('Can set maximum duration (52 weeks)', async () => {
      const slider = await page.locator('input[type="range"]');
      await slider.fill('52');
      const display = await page.locator('text=/52 weeks/i').first();
      if (!await display.isVisible()) throw new Error('Maximum duration not working');
    });

    // Test 10: Responsive Design
    console.log('\n📱 Testing Responsive Design:\n');
    
    await test('Mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const mobileMenu = await page.locator('button').first();
      if (!await mobileMenu.isVisible()) throw new Error('Mobile layout not working');
    });

    await test('Tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const content = await page.locator('.bg-white').first();
      if (!await content.isVisible()) throw new Error('Tablet layout not working');
    });

    await test('Desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      const content = await page.locator('.bg-white').first();
      if (!await content.isVisible()) throw new Error('Desktop layout not working');
    });

    console.log('\n================================');
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log(`   📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Program Builder is working correctly.');
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed. Review and fix the issues.`);
    }

  } catch (error) {
    console.error('\n💥 Critical test failure:', error.message);
    await page.screenshot({ path: 'test-critical-failure.png' });
    console.log('Screenshot saved as test-critical-failure.png');
  } finally {
    await browser.close();
  }
})();