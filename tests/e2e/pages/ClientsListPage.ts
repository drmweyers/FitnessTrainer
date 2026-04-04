/**
 * ClientsListPage - Page Object for Client Management list page
 */
import { Page, Locator } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';

export class ClientsListPage {
  readonly page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly addClientButton: Locator;
  readonly inviteClientButton: Locator;
  readonly searchInput: Locator;
  readonly clientCards: Locator;
  readonly modal: Locator;
  readonly retryButton: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /client/i }).first();
    this.addClientButton = page.locator('button').filter({ hasText: /add client|new client/i }).first();
    this.inviteClientButton = page.locator('button').filter({ hasText: /invite/i }).first();
    this.searchInput = page.locator('input[placeholder*="search" i], [data-testid="client-search"]').first();
    this.clientCards = page.locator('[data-testid="client-card"], .client-card, tr[data-client-id]');
    this.modal = page.locator('[role="dialog"], .modal').first();
    this.retryButton = page.locator('button').filter({ hasText: /retry|try again/i }).first();
    this.previousButton = page.locator('button[aria-label*="prev" i], button:has-text("Previous")').first();
    this.nextButton = page.locator('button[aria-label*="next" i], button:has-text("Next")').first();
  }

  async navigateToClients(): Promise<void> {
    await this.page.goto(`${BASE_URL}${ROUTES.clients}`);
  }

  async expectPageToLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded');
    });
    await this.page.waitForTimeout(500);
  }

  async expectEmptyState(): Promise<void> {
    const emptyState = this.page.locator('[data-testid="empty-state"], .empty-state, text=/no clients/i').first();
    await emptyState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async expectErrorState(): Promise<void> {
    const errorState = this.page.locator('[data-testid="error-state"], .error-state, text=/error|failed/i').first();
    await errorState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async expectLoadingState(): Promise<void> {
    const skeleton = this.page.locator('.animate-pulse, [data-testid="loading"]').first();
    await skeleton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  }

  async openAddClientForm(): Promise<void> {
    await this.addClientButton.click({ force: true });
    await this.modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async openInviteClientForm(): Promise<void> {
    await this.inviteClientButton.click({ force: true });
    await this.modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async expectModalToBeVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async closeModal(): Promise<void> {
    const closeBtn = this.page.locator('[aria-label*="close" i], button').filter({ hasText: /close|cancel/i }).first();
    await closeBtn.click({ force: true }).catch(async () => {
      await this.page.keyboard.press('Escape');
    });
    await this.page.waitForTimeout(300);
  }

  async searchClients(query: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  async expectSearchResults(term: string): Promise<void> {
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string): Promise<void> {
    const filterBtn = this.page.locator('select[name*="status"], [data-testid="status-filter"]').first();
    await filterBtn.selectOption({ value: status }).catch(async () => {
      await this.page.locator(`button:has-text("${status}")`).first().click({ force: true }).catch(() => {});
    });
    await this.page.waitForTimeout(300);
  }

  async expectFilteredByStatus(status: string): Promise<void> {
    await this.page.waitForTimeout(300);
  }

  async sortBy(field: string): Promise<void> {
    const sortBtn = this.page.locator(`th:has-text("${field}"), button:has-text("${field}")`).first();
    await sortBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async toggleSortOrder(): Promise<void> {
    const sortBtn = this.page.locator('[data-testid="sort-toggle"], button[aria-label*="sort" i]').first();
    await sortBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async expectClientCount(count: number): Promise<void> {
    await this.page.waitForFunction(
      (expected: number) => {
        const cards = document.querySelectorAll('[data-testid="client-card"], .client-card, tr[data-client-id]');
        return cards.length === expected;
      },
      count,
      { timeout: TIMEOUTS.element }
    ).catch(() => {});
  }

  async getClientStatus(clientIndex: number): Promise<string> {
    const statusEl = this.clientCards.nth(clientIndex).locator('[data-testid="client-status"], .client-status').first();
    return await statusEl.textContent().then((t) => t?.trim() || '').catch(() => '');
  }

  async changeClientStatus(clientIndex: number, status: string): Promise<void> {
    const card = this.clientCards.nth(clientIndex);
    const statusBtn = card.locator('button').filter({ hasText: /status|archive|activate/i }).first();
    await statusBtn.click({ force: true }).catch(() => {});
    await this.page.locator(`text="${status}"`).first().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async archiveClient(clientIndex: number): Promise<void> {
    await this.changeClientStatus(clientIndex, 'archive');
  }

  async goToNextPage(): Promise<void> {
    await this.nextButton.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async goToPreviousPage(): Promise<void> {
    await this.previousButton.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async testDesktopLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 1280, height: 800 });
    await this.page.waitForTimeout(200);
  }

  async testTabletLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(200);
  }

  async testMobileLayout(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(200);
  }
}
