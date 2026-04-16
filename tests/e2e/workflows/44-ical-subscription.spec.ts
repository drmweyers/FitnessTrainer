/**
 * Suite 44: iCal Subscription Feed
 * Tests the calendar subscription feature on the /schedule page.
 * Verifies the iCal feed URL is valid and the feed returns a VCALENDAR document.
 */
import { test, expect } from '@playwright/test'
import { BASE_URL, ROUTES } from '../helpers/constants'
import { loginViaAPI } from '../helpers/auth'

test.describe('44 - iCal Subscription Feed', () => {
  test.describe.configure({ timeout: 120000 })

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(45000)
  })

  /**
   * Test 1: Subscribe to Calendar section / CalendarExport component is visible on /schedule.
   */
  test('Export to Calendar control is visible on schedule page', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}${ROUTES.schedule}`, { waitUntil: 'domcontentloaded' })

    // Wait for React hydration via Playwright auto-waiting
    const calBtn = page.locator(
      'button:has-text("Export to Calendar"), [aria-label="Export to Calendar"]'
    )
    await expect(calBtn.first()).toBeVisible({ timeout: 15000 })
  })

  /**
   * Test 2: GET /api/schedule/ical-token returns a URL (authenticated).
   */
  test('GET /api/schedule/ical-token returns a subscription URL', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const response = await page.request.get(`${BASE_URL}/api/schedule/ical-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data?.url).toBeTruthy()
    expect(typeof json.data.url).toBe('string')
    expect(json.data.url).toContain('/api/schedule/feed/')
  })

  /**
   * Test 3: GET /api/schedule/feed-token returns a URL (authenticated) — alias endpoint.
   */
  test('GET /api/schedule/feed-token returns a subscription URL', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const response = await page.request.get(`${BASE_URL}/api/schedule/feed-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data?.url).toBeTruthy()
    expect(typeof json.data.url).toBe('string')
  })

  /**
   * Test 4: The iCal feed URL (public, token-based) returns text/calendar content-type.
   */
  test('iCal feed URL returns text/calendar without auth header', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    // Get the feed URL first
    const tokenRes = await page.request.get(`${BASE_URL}/api/schedule/ical-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(tokenRes.status()).toBe(200)
    const tokenJson = await tokenRes.json()
    const feedUrl: string = tokenJson.data.url
    expect(feedUrl).toBeTruthy()

    // The feed URL must be accessible without auth (public token-based URL)
    // Replace the base URL from the token response with the test BASE_URL
    const feedPath = feedUrl.replace(/^https?:\/\/[^/]+/, '')
    const response = await page.request.get(`${BASE_URL}${feedPath}`)

    expect(response.status()).toBe(200)
    const contentType = response.headers()['content-type'] || ''
    expect(contentType).toContain('text/calendar')
  })

  /**
   * Test 5: The iCal feed content starts with BEGIN:VCALENDAR.
   */
  test('iCal feed content starts with BEGIN:VCALENDAR', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    // Get token
    const tokenRes = await page.request.get(`${BASE_URL}/api/schedule/ical-token`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect(tokenRes.status()).toBe(200)
    const tokenJson = await tokenRes.json()
    const feedUrl: string = tokenJson.data.url
    const feedPath = feedUrl.replace(/^https?:\/\/[^/]+/, '')

    const response = await page.request.get(`${BASE_URL}${feedPath}`)
    expect(response.status()).toBe(200)

    const text = await response.text()
    expect(text.trimStart()).toMatch(/^BEGIN:VCALENDAR/)
    expect(text).toContain('END:VCALENDAR')
    expect(text).toContain('VERSION:2.0')
  })

  /**
   * Test 6: Invalid or tampered token returns 401.
   */
  test('iCal feed with invalid token returns 401', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })

    const response = await page.request.get(
      `${BASE_URL}/api/schedule/feed/invalidtoken000000000000000000`
    )

    expect(response.status()).toBe(401)
  })

  /**
   * Test 7: iCal token is consistent — same user always gets same token.
   */
  test('iCal token is stable across multiple requests', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'trainer')

    const [res1, res2] = await Promise.all([
      page.request.get(`${BASE_URL}/api/schedule/ical-token`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      page.request.get(`${BASE_URL}/api/schedule/ical-token`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ])

    expect(res1.status()).toBe(200)
    expect(res2.status()).toBe(200)

    const json1 = await res1.json()
    const json2 = await res2.json()

    expect(json1.data.token).toBe(json2.data.token)
    expect(json1.data.url).toBe(json2.data.url)
  })
})
