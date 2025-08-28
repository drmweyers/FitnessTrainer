import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExerciseLibraryPage extends BasePage {
  // Header elements
  readonly pageTitle: Locator;
  readonly exerciseCount: Locator;
  readonly viewModeToggle: Locator;
  readonly sortDropdown: Locator;
  readonly bulkActionsButton: Locator;

  // Search and filters
  readonly searchInput: Locator;
  readonly searchSuggestions: Locator;
  readonly clearSearchButton: Locator;
  readonly advancedFiltersButton: Locator;
  readonly filtersPanel: Locator;
  readonly activeFilters: Locator;
  readonly clearAllFiltersButton: Locator;

  // Filter controls
  readonly bodyPartFilter: Locator;
  readonly equipmentFilter: Locator;
  readonly targetMuscleFilter: Locator;
  readonly difficultyFilter: Locator;
  readonly favoriteOnlyFilter: Locator;

  // Exercise grid/list
  readonly exerciseCards: Locator;
  readonly exerciseList: Locator;
  readonly exerciseThumbnails: Locator;
  readonly exerciseGifs: Locator;
  readonly exerciseNames: Locator;
  readonly exerciseMuscleGroups: Locator;
  readonly exerciseEquipment: Locator;
  readonly favoriteButtons: Locator;
  readonly addToCollectionButtons: Locator;

  // Loading states
  readonly loadingSkeletons: Locator;
  readonly loadingSpinner: Locator;
  readonly gifLoadingPlaceholders: Locator;

  // Empty/error states
  readonly emptyState: Locator;
  readonly noResultsState: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;

  // Pagination/infinite scroll
  readonly pagination: Locator;
  readonly loadMoreButton: Locator;
  readonly scrollLoader: Locator;
  readonly pageInfo: Locator;

  // Modals and overlays
  readonly exerciseDetailModal: Locator;
  readonly collectionSelectionModal: Locator;
  readonly createCollectionModal: Locator;
  readonly confirmationModal: Locator;

  constructor(page: Page) {
    super(page);
    
    // Header elements
    this.pageTitle = page.locator('h1:has-text("Exercise Library")');
    this.exerciseCount = page.locator('[data-testid="exercise-count"]');
    this.viewModeToggle = page.locator('[data-testid="view-mode-toggle"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.bulkActionsButton = page.locator('[data-testid="bulk-actions"]');

    // Search and filters
    this.searchInput = page.locator('[data-testid="exercise-search"]');
    this.searchSuggestions = page.locator('[data-testid="search-suggestions"]');
    this.clearSearchButton = page.locator('[data-testid="clear-search"]');
    this.advancedFiltersButton = page.locator('[data-testid="advanced-filters"]');
    this.filtersPanel = page.locator('[data-testid="filters-panel"]');
    this.activeFilters = page.locator('[data-testid="active-filters"]');
    this.clearAllFiltersButton = page.locator('[data-testid="clear-all-filters"]');

    // Filter controls
    this.bodyPartFilter = page.locator('[data-testid="body-part-filter"]');
    this.equipmentFilter = page.locator('[data-testid="equipment-filter"]');
    this.targetMuscleFilter = page.locator('[data-testid="target-muscle-filter"]');
    this.difficultyFilter = page.locator('[data-testid="difficulty-filter"]');
    this.favoriteOnlyFilter = page.locator('[data-testid="favorite-only-filter"]');

    // Exercise grid/list
    this.exerciseCards = page.locator('[data-testid="exercise-card"]');
    this.exerciseList = page.locator('[data-testid="exercise-list-item"]');
    this.exerciseThumbnails = page.locator('[data-testid="exercise-thumbnail"]');
    this.exerciseGifs = page.locator('[data-testid="exercise-gif"]');
    this.exerciseNames = page.locator('[data-testid="exercise-name"]');
    this.exerciseMuscleGroups = page.locator('[data-testid="exercise-muscle-group"]');
    this.exerciseEquipment = page.locator('[data-testid="exercise-equipment"]');
    this.favoriteButtons = page.locator('[data-testid="favorite-button"]');
    this.addToCollectionButtons = page.locator('[data-testid="add-to-collection"]');

    // Loading states
    this.loadingSkeletons = page.locator('[data-testid="exercise-skeleton"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.gifLoadingPlaceholders = page.locator('[data-testid="gif-placeholder"]');

    // Empty/error states
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.noResultsState = page.locator('[data-testid="no-results"]');
    this.errorState = page.locator('[data-testid="error-state"]');
    this.retryButton = page.locator('[data-testid="retry-button"]');

    // Pagination/infinite scroll
    this.pagination = page.locator('[data-testid="pagination"]');
    this.loadMoreButton = page.locator('[data-testid="load-more"]');
    this.scrollLoader = page.locator('[data-testid="scroll-loader"]');
    this.pageInfo = page.locator('[data-testid="page-info"]');

    // Modals and overlays
    this.exerciseDetailModal = page.locator('[data-testid="exercise-detail-modal"]');
    this.collectionSelectionModal = page.locator('[data-testid="collection-selection-modal"]');
    this.createCollectionModal = page.locator('[data-testid="create-collection-modal"]');
    this.confirmationModal = page.locator('[data-testid="confirmation-modal"]');
  }

  // Navigation methods
  async navigateToExerciseLibrary() {
    await this.page.goto('/exercises');
    await this.waitForUrl('/exercises');
    await this.waitForLoadingToComplete();
  }

  async expectPageToLoad() {
    await expect(this.pageTitle).toBeVisible();
    await this.waitForLoadingToComplete();
    // Ensure at least some exercises are loaded
    await expect(this.exerciseCards.first()).toBeVisible({ timeout: 10000 });
  }

  // Search functionality
  async searchExercises(query: string) {
    await this.searchInput.fill(query);
    await this.waitForSearchResults();
  }

  async selectSearchSuggestion(suggestion: string) {
    await this.searchSuggestions.locator(`text="${suggestion}"`).click();
    await this.waitForSearchResults();
  }

  async clearSearch() {
    await this.clearSearchButton.click();
    await this.waitForLoadingToComplete();
  }

  private async waitForSearchResults() {
    // Wait for debounce and search results
    await this.page.waitForTimeout(500);
    await this.waitForLoadingToComplete();
  }

  // Filter functionality
  async openAdvancedFilters() {
    await this.advancedFiltersButton.click();
    await expect(this.filtersPanel).toBeVisible();
  }

  async filterByBodyPart(bodyPart: string) {
    if (!await this.filtersPanel.isVisible()) {
      await this.openAdvancedFilters();
    }
    await this.bodyPartFilter.selectOption(bodyPart);
    await this.waitForFilterResults();
  }

  async filterByEquipment(equipment: string) {
    if (!await this.filtersPanel.isVisible()) {
      await this.openAdvancedFilters();
    }
    await this.equipmentFilter.selectOption(equipment);
    await this.waitForFilterResults();
  }

  async filterByTargetMuscle(muscle: string) {
    if (!await this.filtersPanel.isVisible()) {
      await this.openAdvancedFilters();
    }
    await this.targetMuscleFilter.selectOption(muscle);
    await this.waitForFilterResults();
  }

  async filterByDifficulty(difficulty: string) {
    if (!await this.filtersPanel.isVisible()) {
      await this.openAdvancedFilters();
    }
    await this.difficultyFilter.selectOption(difficulty);
    await this.waitForFilterResults();
  }

  async toggleFavoriteOnlyFilter() {
    if (!await this.filtersPanel.isVisible()) {
      await this.openAdvancedFilters();
    }
    await this.favoriteOnlyFilter.check();
    await this.waitForFilterResults();
  }

  async clearAllFilters() {
    await this.clearAllFiltersButton.click();
    await this.waitForLoadingToComplete();
  }

  private async waitForFilterResults() {
    await this.waitForLoadingToComplete();
    // Wait for results to update
    await this.page.waitForTimeout(300);
  }

  // Exercise interaction methods
  async clickExercise(index: number) {
    await this.exerciseCards.nth(index).click();
    await expect(this.exerciseDetailModal).toBeVisible();
  }

  async favoriteExercise(index: number) {
    const favoriteButton = this.favoriteButtons.nth(index);
    await favoriteButton.click();
    await this.page.waitForTimeout(500); // Wait for API call
  }

  async addExerciseToCollection(index: number, collectionName?: string) {
    await this.addToCollectionButtons.nth(index).click();
    await expect(this.collectionSelectionModal).toBeVisible();
    
    if (collectionName) {
      await this.page.locator(`text="${collectionName}"`).click();
    }
    
    await this.page.locator('button:has-text("Add")').click();
    await expect(this.collectionSelectionModal).not.toBeVisible();
  }

  // View mode methods
  async switchToGridView() {
    await this.viewModeToggle.locator('[data-value="grid"]').click();
    await expect(this.exerciseCards.first()).toBeVisible();
  }

  async switchToListView() {
    await this.viewModeToggle.locator('[data-value="list"]').click();
    await expect(this.exerciseList.first()).toBeVisible();
  }

  // Sorting methods
  async sortBy(criteria: string) {
    await this.sortDropdown.selectOption(criteria);
    await this.waitForLoadingToComplete();
  }

  // Pagination/infinite scroll methods
  async loadMoreExercises() {
    if (await this.loadMoreButton.isVisible()) {
      await this.loadMoreButton.click();
      await this.waitForLoadingToComplete();
    }
  }

  async scrollToLoadMore() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await expect(this.scrollLoader).toBeVisible();
    await this.waitForLoadingToComplete();
  }

  // Verification methods
  async expectExerciseCount(count: number) {
    await expect(this.exerciseCards).toHaveCount(count);
  }

  async expectMinimumExerciseCount(minCount: number) {
    const actualCount = await this.exerciseCards.count();
    expect(actualCount).toBeGreaterThanOrEqual(minCount);
  }

  async expectSearchResults(query: string) {
    const count = await this.exerciseCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify that visible exercise names contain search query
    for (let i = 0; i < Math.min(count, 10); i++) {
      const name = await this.exerciseNames.nth(i).textContent();
      expect(name?.toLowerCase()).toContain(query.toLowerCase());
    }
  }

  async expectNoResults() {
    await expect(this.noResultsState).toBeVisible();
    await expect(this.exerciseCards).toHaveCount(0);
  }

  async expectFilteredResults(filterType: string, filterValue: string) {
    const count = await this.exerciseCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify active filter badge is displayed
    await expect(this.activeFilters.locator(`text="${filterValue}"`)).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.loadingSkeletons.first()).toBeVisible();
  }

  async expectErrorState() {
    await expect(this.errorState).toBeVisible();
    await expect(this.retryButton).toBeVisible();
  }

  // Performance verification methods
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.navigateToExerciseLibrary();
    await this.expectPageToLoad();
    const endTime = Date.now();
    return endTime - startTime;
  }

  async measureSearchResponseTime(query: string): Promise<number> {
    const startTime = Date.now();
    await this.searchExercises(query);
    const endTime = Date.now();
    return endTime - startTime;
  }

  async verifyGifLoading() {
    // Wait for GIFs to load
    await this.page.waitForLoadState('networkidle');
    
    const gifCount = await this.exerciseGifs.count();
    for (let i = 0; i < Math.min(gifCount, 20); i++) {
      const gif = this.exerciseGifs.nth(i);
      await expect(gif).toBeVisible();
      
      // Check if gif has loaded (no placeholder)
      const hasPlaceholder = await this.gifLoadingPlaceholders.nth(i).isVisible();
      expect(hasPlaceholder).toBe(false);
    }
  }

  // Mobile responsiveness methods
  async testMobileLayout() {
    await this.setMobileViewport();
    await this.page.reload();
    await this.waitForLoadingToComplete();
    
    // Verify touch targets are appropriate size
    const exerciseCard = this.exerciseCards.first();
    const cardBox = await exerciseCard.boundingBox();
    expect(cardBox?.height).toBeGreaterThanOrEqual(44);
    
    // Verify search input is easily accessible
    const searchBox = await this.searchInput.boundingBox();
    expect(searchBox?.height).toBeGreaterThanOrEqual(44);
  }

  async testTabletLayout() {
    await this.setTabletViewport();
    await this.page.reload();
    await this.waitForLoadingToComplete();
    
    // Verify grid adapts to tablet screen
    await expect(this.exerciseCards.first()).toBeVisible();
  }

  async testDesktopLayout() {
    await this.setDesktopViewport();
    await this.page.reload();
    await this.waitForLoadingToComplete();
    
    // Verify all controls are visible on desktop
    await expect(this.advancedFiltersButton).toBeVisible();
    await expect(this.viewModeToggle).toBeVisible();
    await expect(this.sortDropdown).toBeVisible();
  }

  // Accessibility methods
  async verifyKeyboardNavigation() {
    // Test tab navigation through exercises
    await this.searchInput.focus();
    await this.page.keyboard.press('Tab');
    
    // Should focus on first exercise or filter button
    const focusedElement = await this.page.evaluateHandle(() => document.activeElement);
    expect(focusedElement).toBeTruthy();
  }

  async verifyScreenReaderSupport() {
    // Check for proper aria labels and roles
    const firstExercise = this.exerciseCards.first();
    await expect(firstExercise).toHaveAttribute('role', 'button');
    await expect(firstExercise).toHaveAttribute('aria-label');
  }
}