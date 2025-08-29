const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3001/programs/new');
    await page.waitForLoadState('networkidle');
    
    // Get all button text
    const buttons = await page.$$eval('button', elements => 
      elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
    );
    
    console.log('All buttons on page:');
    buttons.forEach(btn => console.log(`  - "${btn}"`));
    
    // Check for "Next" specifically
    const nextButtons = await page.$$('button');
    let foundNext = false;
    for (const button of nextButtons) {
      const text = await button.textContent();
      if (text && text.includes('Next')) {
        foundNext = true;
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        console.log(`\nFound Next button: visible=${isVisible}, enabled=${isEnabled}`);
      }
    }
    
    if (!foundNext) {
      console.log('\n❌ No Next button found on page');
      
      // Save page content for debugging
      const content = await page.content();
      require('fs').writeFileSync('page-content.html', content);
      console.log('Page content saved to page-content.html');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();