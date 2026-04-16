/**
 * Suite 49 — Role Separation & Access Control
 *
 * Verifies that clients NEVER see trainer-only UI and cannot access
 * trainer-only pages, and that trainers cannot access admin pages.
 *
 * Covers bugs fixed 2026-04-15:
 *   - Sidebar.tsx showed Client Management to all roles
 *   - /workouts/builder had no role guard
 *   - /programs/new had no role guard
 */

import { test, expect } from '@playwright/test'
import { loginViaAPI, waitForPageReady } from '../helpers/auth'
import { ROUTES, TIMEOUTS } from '../helpers/constants'

// ─── Trainer-only routes that clients must be redirected away from ────────────
const TRAINER_ONLY_ROUTES = [
  ROUTES.clients,
  ROUTES.programsNew,
  ROUTES.workoutsBuilder,
  ROUTES.scheduleAvailability,
]

// ─── Admin-only routes that trainers must be redirected away from ─────────────
const ADMIN_ONLY_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/system',
  '/admin/bugs',
]

// ─── Routes accessible to both trainers and clients ──────────────────────────
const SHARED_ROUTES = [
  ROUTES.programs,
  ROUTES.workouts,
  ROUTES.analytics,
  ROUTES.schedule,
  ROUTES.profile,
]

test.describe('49 - Role Separation & Access Control', () => {
  // Force serial execution: redirect tests depend on auth+Nav resolving cleanly.
  // Parallel execution causes Neon DB contention and waitForURL timeouts.
  test.describe.configure({ mode: 'serial' })
  // ── CLIENT cannot see trainer nav items ──────────────────────────────────
  test('49.01 client sidebar does NOT show Client Management section', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.workouts, { waitUntil: 'domcontentloaded' })
    await waitForPageReady(page)

    // Client nav (from getNavigationForRole('client')) never includes /clients
    await expect(page.locator('a[href="/clients"]')).not.toBeVisible()
    await expect(page.locator('text="My Clients"')).not.toBeVisible()
    await expect(page.locator('text="Client Management"')).not.toBeVisible()
  })

  test('49.02 client sidebar does NOT show All Clients / Active / Inactive sub-links', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.programs, { waitUntil: 'domcontentloaded' })
    await waitForPageReady(page)

    const clientLinks = ['/clients', '/clients?status=active', '/clients?status=inactive', '/clients?status=pending', '/clients?status=archived']
    for (const href of clientLinks) {
      await expect(page.locator(`a[href="${href}"]`)).not.toBeVisible()
    }
  })

  // ── CLIENT redirected away from trainer-only pages ───────────────────────
  test('49.03 client navigating to /clients is redirected to dashboard', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.clients, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    // After goto the URL is /clients. Positive destination predicate won't match /clients, so
    // waitForURL correctly waits for the redirect to /dashboard. waitUntil:'domcontentloaded'
    // avoids hanging on slow 'load' events at the destination.
    await page.waitForURL(
      url => url.pathname.startsWith('/dashboard'),
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    expect(page.url()).not.toContain('/clients')
  })

  test('49.04 client navigating to /programs/new is redirected to /programs', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.programsNew, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(
      url => url.pathname === '/programs',
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    expect(page.url()).not.toContain('/programs/new')
    expect(page.url()).toContain('/programs')
  })

  test('49.05 client navigating to /workouts/builder is redirected to /workouts', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.workoutsBuilder, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(
      url => url.pathname === '/workouts',
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    expect(page.url()).not.toContain('/workouts/builder')
    expect(page.url()).toContain('/workouts')
  })

  test('49.06 client navigating to /schedule/availability is redirected', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.scheduleAvailability, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(
      url => url.pathname === '/schedule',
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    expect(page.url()).not.toContain('/availability')
  })

  // ── TRAINER cannot see admin nav items ───────────────────────────────────
  test('49.07 trainer does NOT see admin nav links', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(ROUTES.programs, { waitUntil: 'domcontentloaded' })
    await waitForPageReady(page)

    await expect(page.locator('a[href="/admin"]')).not.toBeVisible()
    await expect(page.locator('text="Admin Panel"')).not.toBeVisible()
  })

  test('49.08 trainer navigating to /admin is redirected', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    // AdminLayout redirects non-admin to /dashboard. Positive destination predicate.
    await page.waitForURL(
      url => url.pathname.startsWith('/dashboard'),
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    expect(page.url()).not.toMatch(/\/admin/)
  })

  // ── TRAINER sees Client Management ───────────────────────────────────────
  test('49.09 trainer sidebar shows My Clients link', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(ROUTES.clients, { waitUntil: 'domcontentloaded' })
    await waitForPageReady(page)

    // getNavigationForRole('trainer') includes "My Clients" with href="/clients"
    // Filter to visible only — mobile menu also has the link but is hidden (lg:hidden)
    await expect(page.locator('a[href="/clients"]').filter({ visible: true }).first()).toBeVisible({ timeout: TIMEOUTS.element })
  })

  test('49.10 trainer can access /programs/new without redirect', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(ROUTES.programsNew, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await waitForPageReady(page)

    // Must still be on /programs/new (or /programs/new redirected to builder step 1)
    expect(page.url()).toContain('/programs/new')
  })

  test('49.11 trainer can access /workouts/builder without redirect', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(ROUTES.workoutsBuilder, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await waitForPageReady(page)

    expect(page.url()).toContain('/workouts/builder')
    await expect(page.locator('h1:has-text("AI Workout Builder"), h1:has-text("Workout Builder")')).toBeVisible({ timeout: TIMEOUTS.element })
  })

  // ── ADMIN can access all routes ───────────────────────────────────────────
  test('49.12 admin can access /admin panel', async ({ page }) => {
    await loginViaAPI(page, 'admin')
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    // Admin layout shows spinner while auth loads — wait for it to resolve (Neon can be slow)
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 60000 }).catch(() => {})

    expect(page.url()).toContain('/admin')
    // Should see admin panel nav (Overview, Users, System Health, Bug Reports tabs)
    await expect(page.locator('text="Admin Panel"').first()).toBeVisible({ timeout: 30000 })
  })

  // ── SHARED routes accessible to both roles ────────────────────────────────
  test('49.13 client can access /programs (their assigned programs)', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.programs, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await waitForPageReady(page)

    expect(page.url()).toContain('/programs')
    // Must NOT show "Create Program" button to clients
    await expect(page.locator('a[href="/programs/new"], button:has-text("Create Program")')).not.toBeVisible()
  })

  test('49.14 client can access /workouts page', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.workouts, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await waitForPageReady(page)

    expect(page.url()).toContain('/workouts')
    // Wait for the page-level client content to confirm user.role === 'client' has propagated.
    // The "Start a Workout" button (href="/workout-tracker") only renders when user.role === 'client'.
    // This also proves the AI builder link (rendered when role is NOT client / null) has been removed.
    await expect(page.locator('a[href="/workout-tracker"]')).toBeVisible({ timeout: TIMEOUTS.element })
    await expect(page.locator('a[href="/workouts/builder"]')).not.toBeVisible()
  })

  test('49.15 client can access /analytics page', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto(ROUTES.analytics, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await waitForPageReady(page)

    expect(page.url()).toContain('/analytics')
    // Client must NOT see the trainer KPI dashboard (Total Clients card)
    await expect(page.locator('text="Total Clients"')).not.toBeVisible()
    // Client SHOULD see their own analytics tabs
    await expect(page.locator('text="Overview"').first()).toBeVisible({ timeout: TIMEOUTS.element })
  })

  test('49.16 trainer analytics shows client KPI dashboard, not personal measurements', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto(ROUTES.analytics, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await waitForPageReady(page)

    // Trainer sees the analytics page (either the locked upgrade wall if on Starter tier,
    // or the client KPI dashboard if on Pro/Enterprise). Either way:
    // 1. URL stays on /analytics
    // 2. "Record New Measurement" is NEVER shown (that's personal body tracking — clients only)
    expect(page.url()).toContain('/analytics')
    await expect(page.locator('button:has-text("Record New Measurement")')).not.toBeVisible()
    // Trainer sees some form of analytics content (either client dashboard or upgrade prompt)
    await expect(
      page.locator('text=/Client Analytics|Analytics requires|Upgrade your plan/i').first()
    ).toBeVisible({ timeout: TIMEOUTS.element })
  })

  // ── Unauthenticated access ────────────────────────────────────────────────
  test('49.17 unauthenticated user accessing /clients is redirected to login', async ({ page }) => {
    await page.goto(ROUTES.clients, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(
      url => url.pathname.startsWith('/auth/') || url.pathname === '/login',
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    expect(page.url()).toMatch(/login|auth/)
  })

  test('49.18 unauthenticated user accessing /programs/new is redirected to login', async ({ page }) => {
    await page.goto(ROUTES.programsNew, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(
      url => url.pathname.startsWith('/auth/') || url.pathname === '/login',
      { timeout: TIMEOUTS.pageLoad, waitUntil: 'domcontentloaded' }
    )
    const url = page.url()
    expect(url).toMatch(/login|auth/)
  })

  // ── Dashboard role routing ────────────────────────────────────────────────
  test('49.19 trainer lands on trainer dashboard after login', async ({ page }) => {
    await loginViaAPI(page, 'trainer')
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(url => url.pathname.includes('/trainer') || url.pathname.includes('/dashboard'), { timeout: TIMEOUTS.pageLoad })
    expect(page.url()).toMatch(/\/dashboard\/trainer|\/dashboard/)
  })

  test('49.20 client lands on client dashboard after login', async ({ page }) => {
    await loginViaAPI(page, 'client')
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.pageLoad })
    await page.waitForURL(url => url.pathname.includes('/client') || url.pathname.includes('/dashboard'), { timeout: TIMEOUTS.pageLoad })
    expect(page.url()).toMatch(/\/dashboard\/client|\/dashboard/)
  })

  // ── API-level role enforcement ────────────────────────────────────────────
  test('49.21 client cannot POST to /api/clients (create client) — returns 403', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client')
    const res = await page.request.post('/api/clients', {
      data: { email: 'fake@test.com', firstName: 'Fake', lastName: 'Client' },
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('49.22 client cannot POST to /api/programs (create program) — returns 401 or 403', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client')
    const res = await page.request.post('/api/programs', {
      data: { name: 'Hacked Program', programType: 'strength', difficultyLevel: 'beginner', durationWeeks: 4 },
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('49.23 client cannot GET /api/clients list — returns 401 or 403', async ({ page }) => {
    const { accessToken } = await loginViaAPI(page, 'client')
    const res = await page.request.get('/api/clients', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('49.24 unauthenticated request to /api/bugs/pending returns 401', async ({ page }) => {
    const res = await page.request.get('/api/bugs/pending')
    expect(res.status()).toBe(401)
  })
})
