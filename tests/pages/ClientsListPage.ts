import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClientsListPage extends BasePage {
  // Header elements
  readonly pageTitle: Locator;
  readonly clientCount: Locator;
  readonly addClientButton: Locator;
  readonly inviteClientButton: Locator;
  readonly manageTagsButton: Locator;

  // Search and filters
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly sortBySelect: Locator;
  readonly sortOrderButton: Locator;
  readonly exportButton: Locator;

  // Client list
  readonly clientCards: Locator;
  readonly loadingSkeletons: Locator;
  readonly emptyState: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;

  // Pagination
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly pageNumbers: Locator;

  // Modals
  readonly clientFormModal: Locator;
  readonly inviteFormModal: Locator;
  readonly tagManagerModal: Locator;

  constructor(page: Page) {
    super(page);
    
    // Header elements
    this.pageTitle = page.locator('h1:has-text("Client Management")');
    this.clientCount = page.locator('text=/\\d+ total clients/');
    this.addClientButton = page.locator('button:has-text("Add Client")');
    this.inviteClientButton = page.locator('button:has-text("Invite Client")');
    this.manageTagsButton = page.locator('button:has-text("Manage Tags")');

    // Search and filters
    this.searchInput = page.locator('input[placeholder*="Search clients"]');
    this.statusFilter = page.locator('select').first();
    this.sortBySelect = page.locator('select').nth(1);
    this.sortOrderButton = page.locator('button:has-text("↑"), button:has-text("↓")');
    this.exportButton = page.locator('button:has-text("Export")');

    // Client list
    this.clientCards = page.locator('[data-testid="client-card"]');
    this.loadingSkeletons = page.locator('.animate-pulse');
    this.emptyState = page.locator(':has-text("No clients found")');
    this.errorState = page.locator('[data-testid="error"], .text-red-800');
    this.retryButton = page.locator('button:has-text("Try Again")');

    // Pagination
    this.previousButton = page.locator('button:has-text("Previous")');
    this.nextButton = page.locator('button:has-text("Next")');
    this.pageNumbers = page.locator('button[class*="min-w-"]');

    // Modals
    this.clientFormModal = page.locator('[role="dialog"]:has(h2:has-text("Add Client"))');
    this.inviteFormModal = page.locator('[role="dialog"]:has(h2:has-text("Invite Client"))');
    this.tagManagerModal = page.locator('[role="dialog"]:has(h2:has-text("Manage Tags"))');
  }

  async navigateToClients() {
    await this.page.goto('/dashboard/clients');
    await this.waitForUrl('/dashboard/clients');
    await this.waitForLoadingToComplete();
  }

  async expectPageToLoad() {
    await expect(this.pageTitle).toBeVisible();
    await this.waitForLoadingToComplete();
  }

  // Search functionality
  async searchClients(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForLoadingToComplete();
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.waitForLoadingToComplete();
  }

  // Filter functionality
  async filterByStatus(status: string) {
    await this.statusFilter.selectOption({ label: status });
    await this.waitForLoadingToComplete();
  }

  async sortBy(sortBy: string) {
    await this.sortBySelect.selectOption({ label: `Sort by ${sortBy}` });
    await this.waitForLoadingToComplete();
  }

  async toggleSortOrder() {
    const currentOrder = await this.sortOrderButton.textContent();
    await this.sortOrderButton.click();
    await this.waitForLoadingToComplete();
    
    // Verify order changed
    const newOrder = await this.sortOrderButton.textContent();
    expect(newOrder).not.toBe(currentOrder);
  }

  // Client management actions
  async openAddClientForm() {
    await this.addClientButton.click();
    await expect(this.clientFormModal).toBeVisible();
  }

  async openInviteClientForm() {
    await this.inviteClientButton.click();
    await expect(this.inviteFormModal).toBeVisible();
  }

  async openTagManager() {
    await this.manageTagsButton.click();
    await expect(this.tagManagerModal).toBeVisible();
  }

  // Client card interactions
  async getClientCard(index: number) {
    return this.clientCards.nth(index);
  }

  async clickClientCard(index: number) {
    await this.clientCards.nth(index).click();
  }

  async getClientName(index: number) {
    const card = this.clientCards.nth(index);
    return await card.locator('[data-testid="client-name"]').textContent();
  }

  async getClientStatus(index: number) {
    const card = this.clientCards.nth(index);
    return await card.locator('[data-testid="client-status"]').textContent();
  }

  async changeClientStatus(index: number, newStatus: string) {
    const card = this.clientCards.nth(index);
    await card.locator('[data-testid="status-dropdown"]').click();
    await this.page.locator(`text="${newStatus}"`).click();
    await this.waitForLoadingToComplete();
  }

  async archiveClient(index: number) {
    const card = this.clientCards.nth(index);
    await card.locator('[data-testid="archive-button"]').click();
    
    // Handle confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Archive"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingToComplete();
  }

  // Pagination
  async goToNextPage() {
    await this.nextButton.click();
    await this.waitForLoadingToComplete();
  }

  async goToPreviousPage() {
    await this.previousButton.click();
    await this.waitForLoadingToComplete();
  }

  async goToPage(pageNumber: number) {
    await this.pageNumbers.nth(pageNumber - 1).click();
    await this.waitForLoadingToComplete();
  }

  // Verification helpers
  async expectClientsToBeVisible() {
    await expect(this.clientCards.first()).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
    await expect(this.clientCards).toHaveCount(0);
  }

  async expectErrorState() {
    await expect(this.errorState).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.loadingSkeletons.first()).toBeVisible();
  }

  async expectClientCount(count: number) {
    await expect(this.clientCards).toHaveCount(count);
  }

  async expectTotalClientsText(count: number) {
    await expect(this.clientCount).toContainText(`${count} total clients`);
  }

  // Search and filter verification
  async expectSearchResults(query: string) {
    // Verify that visible client names contain the search query
    const count = await this.clientCards.count();
    for (let i = 0; i < count; i++) {
      const name = await this.getClientName(i);
      expect(name?.toLowerCase()).toContain(query.toLowerCase());
    }
  }

  async expectFilteredByStatus(status: string) {
    // Verify that all visible clients have the expected status
    const count = await this.clientCards.count();
    for (let i = 0; i < count; i++) {
      const clientStatus = await this.getClientStatus(i);
      expect(clientStatus).toBe(status);
    }
  }

  // Mobile responsiveness tests
  async testMobileLayout() {
    await this.setMobileViewport();
    await this.page.reload();
    await this.waitForLoadingToComplete();
    
    // Check that buttons are properly sized for mobile
    const addButton = this.addClientButton;
    const inviteButton = this.inviteClientButton;
    
    const addButtonBox = await addButton.boundingBox();
    const inviteButtonBox = await inviteButton.boundingBox();
    
    // Buttons should be at least 44px high for touch targets
    expect(addButtonBox?.height).toBeGreaterThanOrEqual(44);
    expect(inviteButtonBox?.height).toBeGreaterThanOrEqual(44);
  }

  async testTabletLayout() {
    await this.setTabletViewport();
    await this.page.reload();
    await this.waitForLoadingToComplete();
    
    // Check that grid layout adapts properly
    await expect(this.clientCards.first()).toBeVisible();
  }

  async testDesktopLayout() {
    await this.setDesktopViewport();
    await this.page.reload();
    await this.waitForLoadingToComplete();
    
    // Check that all header elements are visible
    await expect(this.addClientButton).toBeVisible();
    await expect(this.inviteClientButton).toBeVisible();
    await expect(this.manageTagsButton).toBeVisible();
  }
}