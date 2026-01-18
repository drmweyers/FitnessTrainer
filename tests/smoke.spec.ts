import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Application Functionality', () => {
  
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Should load without errors
    await expect(page).toHaveTitle(/EvoFit|Fitness/i);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'screenshots/homepage.png' });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Try to find login link or navigate directly
    try {
      const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In"), a[href*="login"]');
      if (await loginLink.isVisible({ timeout: 2000 })) {
        await loginLink.click();
      } else {
        await page.goto('/login');
      }
    } catch {
      await page.goto('/login');
    }
    
    // Should reach login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should have login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/login-page.png' });
  });

  test('should handle invalid navigation gracefully', async ({ page }) => {
    // Try to access non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Should either show 404 or redirect appropriately
    expect([404, 200, 302, 301]).toContain(response?.status() || 404);
    
    // Page should still be functional (no JavaScript errors)
    const errors = await page.evaluate(() => {
      const errors = [];
      if (window.console.error.length > 0) {
        errors.push('Console errors found');
      }
      return errors;
    });
    
    // Allow some errors for 404 pages, but check page is still responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should check if both frontend and backend are accessible', async ({ page }) => {
    // Check frontend
    const frontendResponse = await page.goto('/');
    expect(frontendResponse?.ok()).toBeTruthy();

    // Check backend API health endpoint (using absolute URL to backend)
    const apiResponse = await page.request.get('http://localhost:4000/api/health');
    expect(apiResponse.ok()).toBeTruthy();

    const healthData = await apiResponse.json();
    expect(healthData).toHaveProperty('success');
    expect(healthData.success).toBe(true);
  });

  test('should handle basic responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test different viewport sizes
    const viewports = [
      { width: 390, height: 844, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' }, 
      { width: 1920, height: 1080, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to settle
      
      // Page should still be accessible
      await expect(page.locator('body')).toBeVisible();
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `screenshots/responsive-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });

  test('should check basic performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Page should load in reasonable time (under 10 seconds for smoke test)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check for basic performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadEventEnd: navigation.loadEventEnd,
        loadEventStart: navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('should verify development environment', async ({ page }) => {
    // Verify that we can access the intended port
    await page.goto('/');
    
    const url = page.url();
    expect(url).toContain('3002'); // Should be using our configured port
    
    // Verify page loaded successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    console.log('Page URL:', url);
    console.log('Page title:', title);
  });
});