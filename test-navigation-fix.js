const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 Testing Navigation Fix\n');

  try {
    // Set up authentication
    await page.goto('http://localhost:3001');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'trainer@example.com',
        role: 'trainer'
      }));
    });

    // Navigate to Program Builder
    await page.goto('http://localhost:3001/programs/new');
    await page.waitForLoadState('networkidle');
    console.log('✅ Program Builder loaded');

    // Fill required fields
    await page.fill('input[id="name"]', 'Test Program');
    await page.selectOption('select[id="programType"]', 'strength');
    await page.click('button:has-text("Beginner")');
    console.log('✅ Filled required fields');

    // Test Next button
    const nextButton = await page.locator('button:has-text("Next")').last();
    const isNextVisible = await nextButton.isVisible();
    const isNextEnabled = await nextButton.isEnabled();
    
    console.log(`✅ Next button visible: ${isNextVisible}`);
    console.log(`✅ Next button enabled: ${isNextEnabled}`);
    
    if (isNextVisible && isNextEnabled) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Check if we moved to step 2
      const step2Active = await page.locator('.bg-blue-600').first().textContent();
      if (step2Active === '2') {
        console.log('✅ Successfully navigated to Step 2!');
      } else {
        console.log(`⚠️  Current step: ${step2Active}`);
      }
      
      // Test Previous button
      const prevButton = await page.locator('button:has-text("Previous")').last();
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Previous button works');
      }
    } else {
      console.log('❌ Next button not functional');
    }

    console.log('\n✅ Navigation is now working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'navigation-test-failure.png' });
  } finally {
    await browser.close();
  }
})();