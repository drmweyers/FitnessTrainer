/**
 * E2E Auth Helpers
 * Reusable login functions for all E2E tests
 */
import { Page, expect } from '@playwright/test';
import { BASE_URL, TEST_ACCOUNTS, ROUTES, TIMEOUTS, API } from './constants';

type AccountType = keyof typeof TEST_ACCOUNTS;

/**
 * Login via the UI form
 */
export async function loginViaUI(
  page: Page,
  account: AccountType = 'trainer'
): Promise<void> {
  const { email, password } = TEST_ACCOUNTS[account];

  await page.goto(ROUTES.login, { waitUntil: 'networkidle' });

  const emailInput = page.locator('input#email, input[name="email"], input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  await emailInput.fill(email);

  const passwordInput = page.locator('input#password, input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
  await passwordInput.fill(password);

  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  await page.waitForURL((url) => !url.pathname.includes('/login') && !url.pathname.includes('/auth/login'), {
    timeout: TIMEOUTS.pageLoad,
  });
}

/**
 * Login via API (faster for tests that don't need to test the login UI)
 */
export async function loginViaAPI(
  page: Page,
  account: AccountType = 'trainer'
): Promise<{ accessToken: string; user: any }> {
  const { email, password } = TEST_ACCOUNTS[account];

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const response = await page.request.post(API.login, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();

  const accessToken = body.data?.tokens?.accessToken || body.data?.accessToken || body.accessToken;
  const refreshToken = body.data?.tokens?.refreshToken || body.data?.refreshToken || body.refreshToken;
  const user = body.data?.user || body.user;

  expect(accessToken).toBeTruthy();

  await page.evaluate(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    },
    { accessToken, refreshToken, user }
  );

  return { accessToken, user };
}

/**
 * Login via API and navigate to a route
 */
export async function loginAndNavigate(
  page: Page,
  route: string,
  account: AccountType = 'trainer'
): Promise<{ accessToken: string; user: any }> {
  const result = await loginViaAPI(page, account);
  await page.goto(route, { waitUntil: 'networkidle', timeout: TIMEOUTS.pageLoad });
  return result;
}

/**
 * Get an auth token directly (for API-only tests)
 */
export async function getAuthToken(
  page: Page,
  account: AccountType = 'trainer'
): Promise<string> {
  const { email, password } = TEST_ACCOUNTS[account];

  const response = await page.request.post(API.login, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });

  const body = await response.json();
  return body.data?.tokens?.accessToken || body.data?.accessToken || body.accessToken;
}

/**
 * Take a screenshot and save to the screenshots directory
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `tests/e2e/screenshots/${name}`,
    fullPage: false,
  });
}

/**
 * Wait for loading spinners and text to disappear
 */
export async function waitForPageReady(page: Page): Promise<void> {
  const spinner = page.locator('.animate-spin');
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: TIMEOUTS.pageLoad });
  }
  const loadingText = page.locator('text=/loading/i').first();
  if (await loadingText.isVisible({ timeout: 500 }).catch(() => false)) {
    await loadingText.waitFor({ state: 'hidden', timeout: TIMEOUTS.pageLoad }).catch(() => {});
  }
}

/**
 * Ensure a QA test account exists (register if not)
 */
export async function ensureAccount(
  page: Page,
  account: AccountType
): Promise<void> {
  const { email, password, role } = TEST_ACCOUNTS[account];

  // Try login first
  const loginRes = await page.request.post(API.login, {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.ok()) return; // Account exists

  // Register new account
  const registerRes = await page.request.post(API.register, {
    data: { email, password, role },
    headers: { 'Content-Type': 'application/json' },
  });

  // 409 = already exists (password might differ), 201/200 = created
  if (!registerRes.ok() && registerRes.status() !== 409) {
    throw new Error(`Failed to ensure account ${email}: ${registerRes.status()}`);
  }
}
