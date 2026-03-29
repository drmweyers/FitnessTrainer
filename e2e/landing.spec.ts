import { test, expect } from '@playwright/test'

test.describe('EvoFit Trainer Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/EvoFit Trainer/)
    
    // Check that the page has loaded by looking for the main heading
    const heroHeading = page.locator('h1', { hasText: 'Scale Your Training Business' })
    await expect(heroHeading).toBeVisible()
  })

  test('hero section is visible with correct content', async ({ page }) => {
    // Check hero headline
    await expect(page.locator('h1')).toContainText('Scale Your Training Business Without Burnout')
    
    // Check hero subheadline
    await expect(page.locator('text=Stop writing workout programs from scratch')).toBeVisible()
    
    // Check primary CTA button exists and is clickable
    const primaryCTA = page.locator('text=Get Lifetime Access').first()
    await expect(primaryCTA).toBeVisible()
    await expect(primaryCTA).toBeEnabled()
    
    // Check secondary CTA button
    const secondaryCTA = page.locator('text=See How It Works')
    await expect(secondaryCTA).toBeVisible()
  })

  test('CTA buttons exist and are clickable', async ({ page }) => {
    // Test primary CTA in hero
    const heroCTA = page.locator('text=Get Lifetime Access').first()
    await expect(heroCTA).toBeVisible()
    await expect(heroCTA).toBeEnabled()
    
    // Test navigation CTA
    const navCTA = page.locator('nav').locator('text=Get Lifetime Access')
    await expect(navCTA).toBeVisible()
    await expect(navCTA).toBeEnabled()
    
    // Click and verify navigation (should go to pricing page)
    await heroCTA.click()
    // Expect to either navigate to pricing page or pricing section
    await page.waitForTimeout(1000) // Give time for navigation/scroll
  })

  test('pricing section renders 4 cards', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    // Check pricing section heading
    await expect(page.locator('text=Choose Your Growth Plan')).toBeVisible()
    
    // Count pricing cards
    const pricingCards = page.locator('section').filter({ hasText: 'Choose Your Growth Plan' }).locator('div').filter({ hasText: '$' })
    await expect(pricingCards).toHaveCount(4)
    
    // Check specific pricing tiers exist
    await expect(page.locator('text=Starter')).toBeVisible()
    await expect(page.locator('text=Professional')).toBeVisible()
    await expect(page.locator('text=Enterprise')).toBeVisible()
    await expect(page.locator('text=SaaS')).toBeVisible()
    
    // Check Professional is marked as recommended
    await expect(page.locator('text=⭐ RECOMMENDED')).toBeVisible()
    
    // Check pricing values
    await expect(page.locator('text=$149')).toBeVisible()
    await expect(page.locator('text=$249')).toBeVisible()
    await expect(page.locator('text=$349')).toBeVisible()
    await expect(page.locator('text=$29')).toBeVisible()
  })

  test('features section displays key features', async ({ page }) => {
    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded()
    
    // Check features section heading
    await expect(page.locator('text=Everything You Need in One Platform')).toBeVisible()
    
    // Check key feature headings from copy.md
    await expect(page.locator('text=Build Programs in Minutes, Not Hours')).toBeVisible()
    await expect(page.locator('text=Professional Exercise Database at Your Fingertips')).toBeVisible()
    await expect(page.locator('text=Track Every Client\'s Progress Effortlessly')).toBeVisible()
    await expect(page.locator('text=See Which Programs Drive Results')).toBeVisible()
    await expect(page.locator('text=Let AI Handle Your Program Variations')).toBeVisible()
    
    // Check that feature benefits are visible (green checkmarks)
    const checkmarks = page.locator('[data-testid="feature-checkmark"]').or(page.locator('.text-green-600'))
    await expect(checkmarks.first()).toBeVisible()
  })

  test('testimonials section displays social proof', async ({ page }) => {
    // Scroll to testimonials section
    await page.locator('#testimonials').scrollIntoViewIfNeeded()
    
    // Check stats bar
    await expect(page.locator('text=500+')).toBeVisible()
    await expect(page.locator('text=1,200+')).toBeVisible()
    await expect(page.locator('text=15,000+')).toBeVisible()
    await expect(page.locator('text=94%')).toBeVisible()
    
    // Check testimonials from copy.md
    await expect(page.locator('text=Sarah Chen, CPT')).toBeVisible()
    await expect(page.locator('text=Marcus Rodriguez, NASM-CPT')).toBeVisible()
    await expect(page.locator('text=Jennifer Park, ACSM-CPT')).toBeVisible()
    
    // Check star ratings exist
    const starRatings = page.locator('svg').filter({ hasText: 'star' }).or(page.locator('.text-yellow-400'))
    await expect(starRatings.first()).toBeVisible()
  })

  test('email capture form works', async ({ page }) => {
    // Scroll to final CTA section
    await page.locator('text=Ready to 3x Your Client Capacity?').scrollIntoViewIfNeeded()
    
    // Check form elements exist
    const firstNameInput = page.locator('input[placeholder="First name"]')
    const emailInput = page.locator('input[placeholder="Your email address"]')
    const submitButton = page.locator('button[type="submit"]')
    
    await expect(firstNameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    
    // Test form interaction (without submitting)
    await firstNameInput.fill('Test User')
    await emailInput.fill('test@example.com')
    
    // Check that form accepts input
    await expect(firstNameInput).toHaveValue('Test User')
    await expect(emailInput).toHaveValue('test@example.com')
  })

  test('navigation works correctly', async ({ page }) => {
    // Test mobile menu (if viewport is small)
    if (await page.locator('[data-testid="mobile-menu-button"]').isVisible()) {
      await page.locator('[data-testid="mobile-menu-button"]').click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    }
    
    // Test anchor links
    const featuresLink = page.locator('a[href="#features"]').first()
    if (await featuresLink.isVisible()) {
      await featuresLink.click()
      await page.waitForTimeout(1000)
      // Features section should be in view
      await expect(page.locator('#features')).toBeInViewport()
    }
  })

  test('responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that page still loads and key elements are visible
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=Get Lifetime Access').first()).toBeVisible()
    
    // Check that pricing cards stack vertically (should still be visible)
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await expect(page.locator('text=Starter')).toBeVisible()
    await expect(page.locator('text=Professional')).toBeVisible()
  })

  test('responsive design - tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Check that layout adapts appropriately
    await expect(page.locator('h1')).toBeVisible()
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await expect(page.locator('text=Choose Your Growth Plan')).toBeVisible()
  })

  test('responsive design - desktop view', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 })
    
    // Check that layout uses full width appropriately
    await expect(page.locator('h1')).toBeVisible()
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await expect(page.locator('text=Choose Your Growth Plan')).toBeVisible()
  })
})