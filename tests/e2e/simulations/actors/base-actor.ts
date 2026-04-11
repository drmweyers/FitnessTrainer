/**
 * Base Actor — shared login, navigation, and assertion helpers for all roles.
 * Every simulation test uses an actor, never raw page interactions.
 */
import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

const TIMEOUTS = {
  pageLoad: 30_000,
  element: 10_000,
  apiCall: 15_000,
  animation: 2_000,
};

export interface ActorCredentials {
  email: string;
  password: string;
  role: 'trainer' | 'client' | 'admin';
}

export const SIM_ACCOUNTS = {
  trainer: { email: 'sim-trainer@evofit.io', password: 'SimTest2026!', role: 'trainer' as const },
  client1: { email: 'sim-client1@evofit.io', password: 'SimTest2026!', role: 'client' as const },
  client2: { email: 'sim-client2@evofit.io', password: 'SimTest2026!', role: 'client' as const },
  admin: { email: 'sim-admin@evofit.io', password: 'SimTest2026!', role: 'admin' as const },
};

export class BaseActor {
  protected page: Page;
  protected credentials: ActorCredentials;
  protected token: string | null = null;

  constructor(page: Page, credentials: ActorCredentials) {
    this.page = page;
    this.credentials = credentials;
  }

  /** Ensure account exists (idempotent), then login via API for speed. */
  async login(): Promise<void> {
    // Try to register (409 = already exists = fine)
    await this.apiCall('POST', '/api/auth/register', {
      email: this.credentials.email,
      password: this.credentials.password,
      role: this.credentials.role,
    }).catch(() => {});

    // Login via API to get full auth payload
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const response = await this.page.request.fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        email: this.credentials.email,
        password: this.credentials.password,
      }),
    });

    const json = await response.json();
    const data = json.data;
    this.token = data?.tokens?.accessToken || data?.accessToken;
    const refreshToken = data?.tokens?.refreshToken || data?.refreshToken;
    const user = data?.user;

    if (!this.token) throw new Error(`Login failed for ${this.credentials.email}`);

    // Inject ALL auth keys into browser localStorage (AuthContext reads these)
    await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await this.page.evaluate(
      ({ accessToken, refreshToken, user }) => {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      },
      { accessToken: this.token, refreshToken, user }
    );

    // Confirm localStorage is set
    await this.page.waitForFunction(
      () => !!localStorage.getItem('accessToken'),
      { timeout: 5000 }
    );
  }

  /** Navigate to a route and wait for it to be ready. */
  async goto(path: string): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.pageLoad,
    });
    await this.waitForPageReady();
  }

  /** Wait for loading spinners/skeletons to disappear. */
  async waitForPageReady(): Promise<void> {
    try {
      await this.page.waitForFunction(() => {
        const body = document.body.textContent || '';
        return !body.includes('Loading') || body.length > 200;
      }, { timeout: TIMEOUTS.element });
    } catch {
      // Best-effort — don't fail the test for slow hydration
    }
  }

  /** Assert an element is visible on the page. */
  async assertVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible({
      timeout: TIMEOUTS.element,
    });
  }

  /** Assert an element is NOT visible. */
  async assertNotVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: false })).not.toBeVisible({
      timeout: TIMEOUTS.animation,
    });
  }

  /** Click a button by its text label. */
  async clickButton(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).click({ timeout: TIMEOUTS.element });
  }

  /** Fill an input field by label. */
  async fillField(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /** Select a dropdown value. */
  async selectOption(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).selectOption(value);
  }

  /** Take a labeled screenshot for visual verification. */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `tests/e2e/simulations/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /** Make a direct API call (bypassing UI for data operations). */
  async apiCall(method: string, endpoint: string, body?: any): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await this.page.request.fetch(url, {
      method,
      headers,
      data: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status();
    if (status >= 400 && status !== 409) {
      const text = await response.text();
      throw new Error(`API ${method} ${endpoint} returned ${status}: ${text}`);
    }

    try {
      return await response.json();
    } catch {
      return { status };
    }
  }

  /** Get the auth token for direct API calls. */
  getToken(): string | null {
    return this.token;
  }

  get baseUrl(): string {
    return BASE_URL;
  }
}
