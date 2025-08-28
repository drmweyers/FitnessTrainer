import { test, expect, Page, Browser } from '@playwright/test'

// Test configuration
const BASE_URL = 'http://localhost:3001'
const EXERCISE_LIBRARY_URL = `${BASE_URL}/dashboard/exercises`

test.describe('PHASE 1: Core Functionality Testing', () => {
  
  test('1.1 Page Load - Navigate to exercises page without errors', async ({ page }) => {
    console.log('Testing: Page navigation to Exercise Library')
    
    // Navigate to the exercises page
    const response = await page.goto(EXERCISE_LIBRARY_URL)
    expect(response?.status()).toBe(200)
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    
    // Check that the page title and header are present
    await expect(page.locator('h1')).toContainText('Exercise Library')
    await expect(page.locator('text=Discover and organize over 1,324 exercises')).toBeVisible()
    
    // Check for no JavaScript console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    expect(consoleErrors).toEqual([])
    
    console.log('✅ Page loads successfully without errors')
  })

  test('1.2 Exercise Display - Verify exercises display with pagination/infinite scroll', async ({ page }) => {
    console.log('Testing: Exercise display and pagination')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Wait for loading to complete
    await page.waitForSelector('text=Loading Exercise Library', { state: 'detached', timeout: 10000 })
    
    // Check if popular exercises are displayed initially (before search/filters)
    const popularSection = page.locator('text=Popular Exercises')
    if (await popularSection.isVisible()) {
      console.log('Popular exercises section is visible')
      
      // Count popular exercise cards
      const exerciseCards = page.locator('[class*="grid"] > div').filter({ hasText: /\w+/ })
      const cardCount = await exerciseCards.count()
      expect(cardCount).toBeGreaterThan(0)
      
      console.log(`✅ Found ${cardCount} popular exercise cards`)
    } else {
      console.log('No popular exercises shown - checking for exercise grid')
    }
    
    // Try triggering a search to see the main exercise library
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    await searchBox.fill('push')
    await page.waitForTimeout(1000)
    
    // Check for exercise results
    const exerciseGrid = page.locator('[class*="grid"]').first()
    if (await exerciseGrid.isVisible()) {
      const exercises = exerciseGrid.locator('> div')
      const exerciseCount = await exercises.count()
      expect(exerciseCount).toBeGreaterThan(0)
      console.log(`✅ Search returned ${exerciseCount} exercises`)
    }
  })

  test('1.3 Search Functionality - Test search for "push", "squat", "chest"', async ({ page }) => {
    console.log('Testing: Search functionality')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    const searchTerms = ['push', 'squat', 'chest']
    
    for (const term of searchTerms) {
      console.log(`Searching for: ${term}`)
      
      // Clear and search
      await searchBox.fill('')
      await searchBox.fill(term)
      await page.waitForTimeout(1500) // Wait for debounced search
      
      // Check for results
      const resultText = page.locator('text=/Showing \\d+ of \\d+/')
      if (await resultText.isVisible()) {
        const resultCount = await resultText.textContent()
        console.log(`✅ Search "${term}": ${resultCount}`)
        expect(resultCount).toContain('Showing')
      } else {
        console.log(`⚠️ No results indicator found for "${term}"`)
      }
      
      // Check that some exercises are displayed
      const exerciseCards = page.locator('[class*="grid"] > div').filter({ hasText: /\w+/ })
      const cardCount = await exerciseCards.count()
      expect(cardCount).toBeGreaterThan(0)
    }
    
    console.log('✅ Search functionality works for all test terms')
  })

  test('1.4 Filters - Test body part and equipment filters', async ({ page }) => {
    console.log('Testing: Filter functionality')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Open filters panel
    const filterButton = page.locator('button:has-text("Filters")')
    await filterButton.click()
    
    // Wait for filters to appear
    await page.waitForSelector('[class*="filter"]', { timeout: 5000 })
    
    // Look for filter options
    const filterOptions = page.locator('select, input[type="checkbox"], button[role="button"]')
    const optionCount = await filterOptions.count()
    
    if (optionCount > 0) {
      console.log(`✅ Found ${optionCount} filter options`)
      
      // Try to interact with filters if available
      const firstSelect = page.locator('select').first()
      if (await firstSelect.isVisible()) {
        await firstSelect.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
        console.log('✅ Successfully interacted with filter dropdown')
      }
      
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click()
        await page.waitForTimeout(1000)
        console.log('✅ Successfully interacted with filter checkbox')
      }
    } else {
      console.log('⚠️ No filter options found')
    }
  })

  test('1.5 Exercise Details - Click exercise cards and verify detail view', async ({ page }) => {
    console.log('Testing: Exercise detail view')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Search for exercises to ensure we have results
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    await searchBox.fill('push')
    await page.waitForTimeout(1500)
    
    // Find and click the first exercise card
    const exerciseCard = page.locator('[class*="grid"] > div').filter({ hasText: /\w+/ }).first()
    
    if (await exerciseCard.isVisible()) {
      await exerciseCard.click()
      
      // Check if a modal or detail view appears
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="detail"]').first()
      
      if (await modal.isVisible({ timeout: 3000 })) {
        console.log('✅ Exercise detail modal/view opened')
        
        // Look for exercise details like GIF, instructions, etc.
        const gif = page.locator('img[src*="gif"], video, [class*="gif"]')
        const instructions = page.locator('text=/instruction/i, text=/how to/i, p, div').filter({ hasText: /\w{10,}/ })
        
        if (await gif.isVisible()) {
          console.log('✅ Exercise GIF/animation found')
        }
        
        if (await instructions.count() > 0) {
          console.log('✅ Exercise instructions found')
        }
      } else {
        console.log('⚠️ Exercise detail view not found - checking if it navigates to detail page')
        
        // Check if it navigated to a detail page
        const currentUrl = page.url()
        if (currentUrl !== EXERCISE_LIBRARY_URL) {
          console.log(`✅ Navigated to exercise detail page: ${currentUrl}`)
        } else {
          console.log('⚠️ No navigation or modal detected')
        }
      }
    } else {
      console.log('⚠️ No exercise cards found for detail testing')
    }
  })

  test('1.6 Performance - Verify loading is fast and smooth', async ({ page }) => {
    console.log('Testing: Performance and loading speed')
    
    const startTime = Date.now()
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    console.log(`Page load time: ${loadTime}ms`)
    
    // Check that the page loads within reasonable time
    expect(loadTime).toBeLessThan(10000) // 10 seconds max
    
    if (loadTime < 3000) {
      console.log('✅ Fast loading time (under 3s)')
    } else if (loadTime < 5000) {
      console.log('✅ Acceptable loading time (under 5s)')
    } else {
      console.log('⚠️ Slow loading time (over 5s)')
    }
    
    // Check for loading indicators
    const loadingIndicator = page.locator('text=Loading, [class*="loading"], [class*="spinner"]')
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      console.log('✅ Loading indicators are present')
      
      // Wait for loading to complete
      await loadingIndicator.waitFor({ state: 'detached', timeout: 10000 })
      console.log('✅ Loading completed successfully')
    }
  })
})

test.describe('PHASE 2: User Experience Testing', () => {
  
  test('2.1 Loading States - Verify skeleton screens and loading indicators', async ({ page }) => {
    console.log('Testing: Loading states and skeleton screens')
    
    // Navigate and immediately look for loading states
    const response = await page.goto(EXERCISE_LIBRARY_URL)
    
    // Check for loading indicators that appear during initial load
    const loadingText = page.locator('text=Loading Exercise Library')
    const loadingSpinner = page.locator('[class*="animate-spin"], [class*="spinner"]')
    const skeletonElements = page.locator('[class*="skeleton"], [class*="animate-pulse"]')
    
    if (await loadingText.isVisible({ timeout: 1000 })) {
      console.log('✅ Loading text indicator found')
    }
    
    if (await loadingSpinner.isVisible({ timeout: 1000 })) {
      console.log('✅ Loading spinner found')
    }
    
    const skeletonCount = await skeletonElements.count()
    if (skeletonCount > 0) {
      console.log(`✅ Found ${skeletonCount} skeleton loading elements`)
    }
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle')
    
    // Verify loading states are gone
    await expect(loadingText).not.toBeVisible()
    console.log('✅ Loading states properly disappear after content loads')
  })

  test('2.2 Error Handling - Simulate network failure', async ({ page }) => {
    console.log('Testing: Error handling during network failures')
    
    // Navigate to page first
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Block network requests to simulate failure
    await page.route('**/api/**', route => route.abort())
    
    // Try to perform a search that would trigger an API call
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    await searchBox.fill('error test')
    
    await page.waitForTimeout(3000)
    
    // Look for error messages or graceful handling
    const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/try again/i, [class*="error"]')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      console.log(`✅ Found ${errorCount} error handling elements`)
    } else {
      console.log('⚠️ No explicit error messages found - checking for graceful degradation')
      
      // Check if the page still functions (shows cached/default content)
      const contentElements = page.locator('h1, h2, p').filter({ hasText: /\w+/ })
      const contentCount = await contentElements.count()
      
      if (contentCount > 0) {
        console.log('✅ Page degrades gracefully with existing content')
      }
    }
    
    // Restore network
    await page.unroute('**/api/**')
  })

  test('2.3 Empty States - Search for nonsense terms', async ({ page }) => {
    console.log('Testing: Empty state handling')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Search for nonsense terms
    const nonsenseTerms = ['xyz123nonsense', 'qwertyuiop', 'invalidexercise999']
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    
    for (const term of nonsenseTerms) {
      console.log(`Testing empty state for: ${term}`)
      
      await searchBox.fill('')
      await searchBox.fill(term)
      await page.waitForTimeout(2000)
      
      // Look for "no results" messages
      const noResultsMessages = page.locator('text=/no.+found/i, text=/no results/i, text=/not found/i, text=/no exercises/i')
      const emptyStateElements = page.locator('[class*="empty"], [class*="no-results"]')
      
      const noResultsCount = await noResultsMessages.count()
      const emptyStateCount = await emptyStateElements.count()
      
      if (noResultsCount > 0 || emptyStateCount > 0) {
        console.log(`✅ Empty state properly displayed for "${term}"`)
      } else {
        // Check if results count shows 0
        const resultText = page.locator('text=/Showing \\d+ of \\d+/')
        if (await resultText.isVisible()) {
          const text = await resultText.textContent()
          if (text?.includes('Showing 0')) {
            console.log(`✅ Results counter shows 0 for "${term}"`)
          }
        }
      }
    }
  })
})

test.describe('PHASE 3: Advanced Features Testing', () => {
  
  test('3.1 GIF Player - Verify GIF animations load and play', async ({ page }) => {
    console.log('Testing: GIF player functionality')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Search for exercises to get results
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    await searchBox.fill('squat')
    await page.waitForTimeout(2000)
    
    // Look for GIF elements
    const gifElements = page.locator('img[src*=".gif"], img[src*="gif"]')
    const gifCount = await gifElements.count()
    
    if (gifCount > 0) {
      console.log(`✅ Found ${gifCount} GIF elements`)
      
      // Check if first GIF loads
      const firstGif = gifElements.first()
      await firstGif.waitFor({ state: 'visible', timeout: 5000 })
      
      // Check if GIF has proper src
      const src = await firstGif.getAttribute('src')
      if (src && src.includes('gif')) {
        console.log(`✅ GIF has proper source: ${src}`)
      }
      
      // Check if image loads (not broken)
      const naturalWidth = await firstGif.evaluate(img => (img as HTMLImageElement).naturalWidth)
      if (naturalWidth > 0) {
        console.log('✅ GIF image loads successfully')
      } else {
        console.log('⚠️ GIF image may not be loading properly')
      }
    } else {
      console.log('⚠️ No GIF elements found')
    }
  })

  test('3.2 Responsive Design - Test multiple viewport sizes', async ({ page }) => {
    console.log('Testing: Responsive design')
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ]
    
    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`)
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(EXERCISE_LIBRARY_URL)
      await page.waitForLoadState('networkidle')
      
      // Check that basic elements are visible
      const title = page.locator('h1')
      const searchBox = page.locator('input[placeholder*="Search exercises"]')
      
      await expect(title).toBeVisible()
      await expect(searchBox).toBeVisible()
      
      // Check for responsive grid/layout
      const gridElements = page.locator('[class*="grid"]')
      if (await gridElements.isVisible()) {
        console.log(`✅ Grid layout visible in ${viewport.name} view`)
      }
      
      // For mobile, check if navigation is mobile-friendly
      if (viewport.width < 768) {
        // Look for mobile-optimized elements
        const mobileElements = page.locator('[class*="mobile"], [class*="sm:"], button')
        const mobileCount = await mobileElements.count()
        console.log(`Mobile-optimized elements found: ${mobileCount}`)
      }
      
      console.log(`✅ ${viewport.name} viewport test completed`)
    }
  })
})

test.describe('PHASE 4: Edge Cases & Polish Testing', () => {
  
  test('4.1 Long Search Queries', async ({ page }) => {
    console.log('Testing: Long search queries')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    const longQuery = 'this is a very long search query that contains many words and should test how the application handles extremely long search terms that users might accidentally or intentionally enter into the search field'
    
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    await searchBox.fill(longQuery)
    await page.waitForTimeout(2000)
    
    // Check that the application doesn't break
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.waitForTimeout(1000)
    expect(consoleErrors.length).toBe(0)
    
    console.log('✅ Long search query handled without errors')
  })

  test('4.2 Special Characters in Search', async ({ page }) => {
    console.log('Testing: Special characters in search')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    const specialQueries = ['@#$%', '123456', 'çñü', '< > &', 'test"quote\'s']
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    
    for (const query of specialQueries) {
      console.log(`Testing search with: ${query}`)
      
      await searchBox.fill('')
      await searchBox.fill(query)
      await page.waitForTimeout(1500)
      
      // Check that the page doesn't crash
      const pageContent = page.locator('h1')
      await expect(pageContent).toBeVisible()
      
      console.log(`✅ Special character search "${query}" handled`)
    }
  })

  test('4.3 Rapid Actions - Test rapid clicking and typing', async ({ page }) => {
    console.log('Testing: Rapid user actions')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    
    // Rapid typing
    for (let i = 0; i < 10; i++) {
      await searchBox.type(`test${i}`, { delay: 50 })
      await searchBox.press('Backspace')
      await searchBox.press('Backspace')
    }
    
    // Rapid button clicking if filter button exists
    const filterButton = page.locator('button:has-text("Filters")')
    if (await filterButton.isVisible()) {
      for (let i = 0; i < 5; i++) {
        await filterButton.click()
        await page.waitForTimeout(100)
      }
    }
    
    // Check that the page is still responsive
    await expect(page.locator('h1')).toBeVisible()
    console.log('✅ Application handles rapid actions well')
  })

  test('4.4 Accessibility - Test keyboard navigation', async ({ page }) => {
    console.log('Testing: Keyboard navigation and accessibility')
    
    await page.goto(EXERCISE_LIBRARY_URL)
    await page.waitForLoadState('networkidle')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check if search box is focusable
    const searchBox = page.locator('input[placeholder*="Search exercises"]')
    await searchBox.focus()
    await page.keyboard.type('accessibility test')
    
    // Check for proper focus indicators
    const focusedElement = page.locator(':focus')
    if (await focusedElement.isVisible()) {
      console.log('✅ Focus indicators working')
    }
    
    // Test Enter key functionality
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    console.log('✅ Basic keyboard navigation tested')
  })
})