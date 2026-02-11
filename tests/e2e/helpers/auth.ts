/**
 * E2E Auth Helpers
 * Reusable login functions for all E2E tests
 */
import { Page, expect } from '@playwright/test';
import { BASE_URL, TEST_ACCOUNTS, ROUTES, TIMEOUTS } from './constants';

type AccountType = keyof typeof TEST_ACCOUNTS;

/**
 * Login via the UI form
 * Navigates to /auth/login, fills the form, submits, and waits for dashboard redirect.
 */
export async function loginViaUI(
  page: Page,
  account: AccountType = 'trainer'
): Promise<void> {
  const { email, password } = TEST_ACCOUNTS[account];

  await page.goto(`${BASE_URL}${ROUTES.login}`, { waitUntil: 'networkidle' });

  // Fill email
  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  await passwordInput.fill(password);

  // Click sign in
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login') && !url.pathname.includes('/auth/login'), {
    timeout: TIMEOUTS.pageLoad,
  });
}

/**
 * Login via API (faster for tests that don't need to test the login UI)
 * Posts credentials to /api/auth/login, stores tokens in localStorage.
 */
export async function loginViaAPI(
  page: Page,
  account: AccountType = 'trainer'
): Promise<void> {
  const { email, password } = TEST_ACCOUNTS[account];

  // Navigate to base URL first so we can set localStorage on the correct origin
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Call the login API
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  // Handle both possible response shapes
  const accessToken = body.data?.accessToken || body.accessToken;
  const refreshToken = body.data?.refreshToken || body.refreshToken;
  const user = body.data?.user || body.user;

  expect(accessToken).toBeTruthy();

  // Store tokens in localStorage so the app picks them up
  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user }
  );
}

/**
 * Ensure user is logged in (API method), then navigate to a specific page.
 * Combines loginViaAPI + page navigation for convenience.
 */
export async function loginAndNavigate(
  page: Page,
  route: string,
  account: AccountType = 'trainer'
): Promise<void> {
  await loginViaAPI(page, account);
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
}

/**
 * Take a screenshot and save to the screenshots directory.
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `tests/e2e/screenshots/${name}`,
    fullPage: false,
  });
}

/**
 * Wait for loading spinners to disappear.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for any loading spinners to disappear
  const spinner = page.locator('.animate-spin');
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.pageLoad });
  }
  // Also wait for "Loading" text to disappear
  const loadingText = page.locator('text=/loading/i').first();
  if (await loadingText.isVisible({ timeout: 500 }).catch(() => false)) {
    await loadingText.waitFor({ state: 'hidden', timeout: TIMEOUTS.pageLoad }).catch(() => {});
  }
}
