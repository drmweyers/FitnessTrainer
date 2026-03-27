/**
 * Global Setup for E2E Tests
 * Creates QA test accounts before any tests run.
 * Accounts: qa-trainer@evofit.io, qa-client@evofit.io, qa-admin@evofit.io
 */
import { chromium } from '@playwright/test';
import { TEST_ACCOUNTS, API } from './helpers/constants';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  console.log(`[Global Setup] Creating QA accounts on ${baseURL}...`);

  for (const [key, account] of Object.entries(TEST_ACCOUNTS)) {
    // Skip legacy accounts
    if (key.startsWith('legacy')) continue;

    const { email, password, role } = account;

    // Try login first to see if account exists
    const loginRes = await page.request.post(`${baseURL}${API.login}`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginRes.ok()) {
      console.log(`  [${key}] Account exists: ${email}`);
      continue;
    }

    // Register new account
    const registerRes = await page.request.post(`${baseURL}${API.register}`, {
      data: { email, password, role },
      headers: { 'Content-Type': 'application/json' },
    });

    if (registerRes.ok()) {
      console.log(`  [${key}] Created: ${email} (${role})`);
    } else if (registerRes.status() === 409) {
      console.log(`  [${key}] Already exists: ${email}`);
    } else {
      const body = await registerRes.json().catch(() => ({}));
      console.error(`  [${key}] Failed to create ${email}: ${registerRes.status()}`, body);
    }
  }

  // Create trainer-client relationship
  console.log('[Global Setup] Setting up trainer-client relationship...');
  const trainerLogin = await page.request.post(`${baseURL}${API.login}`, {
    data: { email: TEST_ACCOUNTS.trainer.email, password: TEST_ACCOUNTS.trainer.password },
    headers: { 'Content-Type': 'application/json' },
  });

  if (trainerLogin.ok()) {
    const trainerData = await trainerLogin.json();
    const token = trainerData.data?.tokens?.accessToken;

    if (token) {
      // Try to add client to trainer's roster
      const addClientRes = await page.request.post(`${baseURL}${API.clients}`, {
        data: { email: TEST_ACCOUNTS.client.email },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (addClientRes.ok()) {
        console.log('  Trainer-client relationship created');
      } else {
        console.log('  Trainer-client relationship already exists or failed:', addClientRes.status());
      }
    }
  }

  console.log('[Global Setup] Done.\n');

  await browser.close();
}

export default globalSetup;
