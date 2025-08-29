const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Run in headed mode for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Debugging Program Builder...\n');

    // Navigate to the app
    console.log('Navigating to /programs/new...');
    await page.goto('http://localhost:3001/programs/new');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'program-builder-page.png', fullPage: true });
    console.log('Screenshot saved as program-builder-page.png');
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const pageURL = page.url();
    console.log('Current URL:', pageURL);
    
    // Check for any errors
    const errorElements = await page.locator('text=/error/i').count();
    if (errorElements > 0) {
      console.log(`Found ${errorElements} error messages on page`);
      const firstError = await page.locator('text=/error/i').first().textContent();
      console.log('First error:', firstError);
    }
    
    // Check for loading states
    const loadingElements = await page.locator('text=/loading/i').count();
    if (loadingElements > 0) {
      console.log('Page is showing loading state');
    }
    
    // Check for main content
    const mainContent = await page.locator('main').first();
    if (await mainContent.isVisible()) {
      console.log('Main content is visible');
      const mainText = await mainContent.textContent();
      console.log('Main content preview:', mainText.substring(0, 200) + '...');
    }
    
    // Check for form elements
    const forms = await page.locator('form').count();
    console.log(`Found ${forms} form(s) on page`);
    
    const inputs = await page.locator('input').count();
    console.log(`Found ${inputs} input field(s)`);
    
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} button(s)`);
    
    // List all visible buttons
    console.log('\nVisible buttons:');
    const allButtons = await page.locator('button').all();
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const button = allButtons[i];
      if (await button.isVisible()) {
        const text = await button.textContent();
        console.log(`  - "${text.trim()}"`);
      }
    }
    
    // Check for the Program Builder component specifically
    const programBuilder = await page.locator('text=/create.*program/i').first();
    if (await programBuilder.isVisible()) {
      console.log('\n✅ Program Builder title found');
    } else {
      console.log('\n❌ Program Builder component not found');
    }
    
    // Check authentication status
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (token) {
      console.log('\n✅ User is authenticated');
    } else {
      console.log('\n⚠️  No authentication token found');
    }
    
    console.log('\nKeeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await browser.close();
  }
})();