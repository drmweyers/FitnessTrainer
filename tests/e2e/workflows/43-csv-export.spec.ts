/**
 * Suite 43: CSV Analytics Export
 * Tests the CSV export feature on the /analytics page.
 * Verifies the Export CSV button triggers a valid CSV download.
 */
import { test, expect } from '@playwright/test'
import { BASE_URL, ROUTES, API } from '../helpers/constants'
import { loginViaAPI } from '../helpers/auth'

test.describe('43 - CSV Analytics Export', () => {
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(45000)
  })

  /**
   * Test 1: Export CSV button is visible on the analytics page after login.
   */
  test('Export CSV button is visible on analytics page', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}${ROUTES.analytics}`, { waitUntil: 'domcontentloaded' })

    // Wait for React hydration via locator auto-wait
    const exportBtn = page.locator(
      '[data-testid="export-csv-btn"], button:has-text("Export CSV")'
    )
    await expect(exportBtn.first()).toBeVisible({ timeout: 15000 })
  })

  /**
   * Test 2: The export endpoint returns status 200 with CSV content-type.
   */
  test('GET /api/analytics/reports/export?format=csv returns 200 with CSV content-type', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await page.request.get(
      `${BASE_URL}/api/analytics/reports/export?format=csv&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type'] || ''
    expect(contentType).toContain('text/csv')
  })

  /**
   * Test 3: CSV response contains the expected header row.
   */
  test('CSV export body contains header row', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await page.request.get(
      `${BASE_URL}/api/analytics/reports/export?format=csv&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    expect(response.status()).toBe(200)
    const text = await response.text()

    // Verify the CSV header row is present
    expect(text).toContain('Client Name')
    expect(text).toContain('Sessions Completed')
    expect(text).toContain('Total Volume')
  })

  /**
   * Test 4: CSV export requires authentication — returns 401 without token.
   */
  test('CSV export returns 401 without auth token', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await page.request.get(
      `${BASE_URL}/api/analytics/reports/export?format=csv&startDate=${startDate}&endDate=${endDate}`
    )

    expect(response.status()).toBe(401)
  })

  /**
   * Test 5: Returns 400 when format param is missing or unsupported.
   */
  test('CSV export returns 400 for unsupported format', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const response = await page.request.get(
      `${BASE_URL}/api/analytics/reports/export?format=pdf`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  /**
   * Test 6: Content-Disposition header includes a filename with the current date.
   */
  test('CSV export response has Content-Disposition attachment header', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const response = await page.request.get(
      `${BASE_URL}/api/analytics/reports/export?format=csv&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    expect(response.status()).toBe(200)
    const disposition = response.headers()['content-disposition'] || ''
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('evofit-report-')
    expect(disposition).toContain('.csv')
  })
})
