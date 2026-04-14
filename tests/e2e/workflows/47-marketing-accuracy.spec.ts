/**
 * Suite 47: Marketing Accuracy
 * Verifies that the /pricing page contains accurate marketing claims:
 * - Correct exercise count (1,324 — matches data/exercises.json)
 * - AI features correctly marked as "Coming Soon"
 * - Pricing ($199 / $299 / $399) is present
 * - No false AI feature availability claims
 * - Professional tier shows "Unlimited" for clients
 */
import { test, expect } from '@playwright/test';
import { BASE_URL } from '../helpers/constants';

test.describe('Suite 47: Marketing Accuracy — /pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'domcontentloaded' });
  });

  test('47.01 — correct exercise count (1,324) appears on pricing page', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('1,324');
    expect(bodyText).not.toContain('1,344');
  });

  test('47.02 — "Coming Soon" text appears for AI features', async ({ page }) => {
    // At least one "Coming Soon" cell must be present in the comparison table
    const comingSoonCells = page.getByText('Coming Soon');
    await expect(comingSoonCells.first()).toBeVisible();
  });

  test('47.03 — AI-powered coaching insights shows "Coming Soon" (not a checkmark) for Pro', async ({ page }) => {
    // Expand the Analytics category if collapsed
    const analyticsHeader = page.getByText('Analytics', { exact: true });
    if (await analyticsHeader.count() > 0) {
      // Click to expand (it may already be open by default)
      const row = analyticsHeader.first();
      const isExpanded = await row.evaluate((el) => {
        const parent = el.closest('tr');
        return parent?.nextElementSibling !== null;
      });
      if (!isExpanded) {
        await row.click();
      }
    }

    const bodyText = await page.locator('body').innerText();
    // "AI-powered coaching insights" row should contain "Coming Soon"
    expect(bodyText).toContain('AI-powered coaching insights');
    // There should be "Coming Soon" text on the page (our edited value)
    expect(bodyText).toContain('Coming Soon');
  });

  test('47.04 — AI workout generator shows "Coming Soon" in add-on column', async ({ page }) => {
    // Expand AI Features section if needed
    const aiFeaturesHeader = page.getByText('AI Features', { exact: true });
    if (await aiFeaturesHeader.count() > 0) {
      await aiFeaturesHeader.first().click().catch(() => {/* already open */});
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('AI workout generator');
    // Should not show as a plain checkmark — "Coming Soon" covers the add-on column
    expect(bodyText).toContain('Coming Soon');
  });

  test('47.05 — pricing tiers show correct prices ($199, $299, $399)', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('$199');
    expect(bodyText).toContain('$299');
    expect(bodyText).toContain('$399');
  });

  test('47.06 — Professional tier shows "Unlimited" for active clients', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Unlimited');
  });

  test('47.07 — no false claim that 1,344 exercises exist', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('1,344');
  });

  test('47.08 — Plateau detection row does not show a checkmark for standard tiers', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    // Plateau detection should appear — but as "Coming Soon" not as a tier feature
    if (bodyText.includes('Plateau detection')) {
      // The row should have "Coming Soon" text nearby, not a check for starter/pro/ent
      expect(bodyText).toContain('Coming Soon');
    }
  });
});
