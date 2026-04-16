/**
 * Suite 48: Bug Reporting System
 * Tests the full bug reporting pipeline:
 * - Floating button visible to authenticated users
 * - Form validation
 * - Successful submission
 * - Admin can view and manage reports
 */
import { test, expect, Page } from '@playwright/test'
import { loginViaAPI } from '../helpers/auth'
import { BASE_URL } from '../helpers/constants'

test.describe('Suite 48: Bug Reporting System', () => {
  // ─── Helper ──────────────────────────────────────────────────────────────────

  async function waitForAuth(page: Page): Promise<void> {
    // Wait for React auth context to hydrate (reads from localStorage)
    await page.waitForFunction(
      () => {
        const token = localStorage.getItem('accessToken')
        return !!token
      },
      { timeout: 10000 },
    )
    // Give React a render cycle to update auth state via locator auto-waiting
    await expect(page.locator('[aria-label="Report a Problem"]')).toBeVisible({ timeout: 15000 })
  }

  async function openBugDialog(page: Page): Promise<void> {
    await waitForAuth(page)
    const btn = page.locator('[aria-label="Report a Problem"]')
    await btn.waitFor({ state: 'visible', timeout: 20000 })
    await btn.click()
    // Use the dialog containing "Report a Problem" text (not the mobile nav)
    await page.getByRole('dialog').filter({ hasText: 'Report a Problem' }).waitFor({ state: 'visible', timeout: 10000 })
  }

  // ─── Tests ────────────────────────────────────────────────────────────────────

  test('48.01 — floating report button is visible to authenticated trainer', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })

    const btn = page.locator('[aria-label="Report a Problem"]')
    await expect(btn).toBeVisible({ timeout: 20000 })
  })

  test('48.02 — clicking button opens the report dialog', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await openBugDialog(page)

    const dialog = page.getByRole('dialog').filter({ hasText: 'Report a Problem' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Report a Problem')).toBeVisible()
  })

  test('48.03 — form shows validation error for empty description', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await openBugDialog(page)

    const dialog = page.getByRole('dialog').filter({ hasText: 'Report a Problem' })
    // Try submitting with empty description
    const submitBtn = dialog.getByRole('button', { name: 'Submit Report' })
    await submitBtn.click()

    await expect(dialog.getByText(/at least 10 characters/i)).toBeVisible({ timeout: 5000 })
  })

  test('48.04 — successfully submits a bug report', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await openBugDialog(page)

    const dialog = page.getByRole('dialog').filter({ hasText: 'Report a Problem' })

    // Select category — shadcn/ui Select renders as native combobox in Playwright
    const categorySelect = dialog.getByRole('combobox').first()
    await categorySelect.selectOption({ label: 'UI Issue' }).catch(async () => {
      // Fallback: click the trigger and pick from listbox
      await categorySelect.click()
      await page.getByRole('option', { name: 'UI Issue' }).click()
    })

    // Fill description
    await dialog.locator('textarea').fill(
      'This is a test bug report submitted by the E2E test suite — please ignore.',
    )

    // Submit
    await dialog.getByRole('button', { name: 'Submit Report' }).click()

    // Toast should appear with success message
    await expect(page.getByText(/report submitted/i)).toBeVisible({ timeout: 20000 })
  })

  test('48.05 — screenshot attach input exists in dialog', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await openBugDialog(page)

    const dialog = page.getByRole('dialog').filter({ hasText: 'Report a Problem' })
    const screenshotInput = dialog.locator('input[type="file"][accept="image/*"]')
    await expect(screenshotInput).toBeAttached()
  })

  test('48.06 — admin can view bug reports page', async ({ page }) => {
    await loginViaAPI(page, 'admin')
    await page.goto(`${BASE_URL}/admin/bugs`, { waitUntil: 'domcontentloaded' })

    // Page should load with heading
    await expect(page.getByRole('heading', { name: 'Bug Reports' })).toBeVisible({ timeout: 20000 })

    // Wait for loading spinner to disappear
    await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})

    // Either a table or empty state must appear — assert one of them
    const table = page.locator('table')
    const emptyState = page.getByText('No bug reports found.')
    await expect(table.or(emptyState).first()).toBeVisible({ timeout: 15000 })
  })

  test('48.07 — Bug Reports link visible in admin nav', async ({ page }) => {
    await loginViaAPI(page, 'admin')
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' })

    const bugNavLink = page.locator('a[href="/admin/bugs"]')
    await expect(bugNavLink).toBeVisible({ timeout: 10000 })
    await expect(bugNavLink).toContainText('Bug Reports')
  })

  test('48.08 — cancel button closes dialog without submitting', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await openBugDialog(page)

    const dialog = page.getByRole('dialog').filter({ hasText: 'Report a Problem' })
    await dialog.locator('textarea').fill('Filling some text before cancelling')

    await dialog.getByRole('button', { name: 'Cancel' }).click()

    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })
})
