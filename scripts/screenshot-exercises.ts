import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to exercises page...');
    await page.goto('http://localhost:3000/exercises', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot
    const screenshotPath = 'C:/Users/drmwe/claude_Code_Workspace/EvoFitTrainer/exercises-page.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Get page title and some content info
    const title = await page.title();
    const url = page.url();

    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);

    // Try to get exercise count from the page
    try {
      const exerciseCount = await page.locator('div').filter({ hasText: /exercises/i }).count();
      console.log(`Found ${exerciseCount} elements with 'exercises' text`);
    } catch (e) {
      console.log('Could not count exercise elements');
    }

  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
})();
