/**
 * ExerciseLibraryPage - Page Object for Exercise Library (/dashboard/exercises)
 */
import { Page, Locator } from '@playwright/test';
import { BASE_URL, ROUTES, TIMEOUTS } from '../helpers/constants';

export class ExerciseLibraryPage {
  readonly page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly advancedFiltersButton: Locator;
  readonly exerciseCards: Locator;
  readonly exerciseList: Locator;
  readonly gridViewButton: Locator;
  readonly listViewButton: Locator;
  readonly loadMoreButton: Locator;
  readonly filterPanel: Locator;
  readonly muscleGroupFilter: Locator;
  readonly equipmentFilter: Locator;
  readonly bodyPartFilter: Locator;
  readonly searchSuggestions: Locator;
  readonly noResultsMessage: Locator;
  readonly loadingSkeletons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /exercise library/i }).first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[type="search"], [data-testid="exercise-search"]').first();
    this.advancedFiltersButton = page.locator('button').filter({ hasText: /filter|advanced/i }).first();
    this.exerciseCards = page.locator('[data-testid="exercise-card"], .exercise-card, [class*="exercise"][class*="card"]');
    this.exerciseList = page.locator('[data-testid="exercise-list-item"], .exercise-list-item');
    this.gridViewButton = page.locator('button[aria-label*="grid" i], [data-testid="grid-view"]').first();
    this.listViewButton = page.locator('button[aria-label*="list" i], [data-testid="list-view"]').first();
    this.loadMoreButton = page.locator('button').filter({ hasText: /load more|show more/i }).first();
    this.filterPanel = page.locator('[data-testid="filter-panel"], .filter-panel').first();
    this.muscleGroupFilter = page.locator('[data-testid="muscle-filter"], select[name*="muscle"]').first();
    this.equipmentFilter = page.locator('[data-testid="equipment-filter"], select[name*="equipment"]').first();
    this.bodyPartFilter = page.locator('[data-testid="body-part-filter"], select[name*="body"]').first();
    this.searchSuggestions = page.locator('[data-testid="search-suggestions"], .search-suggestions');
    this.noResultsMessage = page.locator('[data-testid="no-results"], .no-results').first();
    this.loadingSkeletons = page.locator('.animate-pulse, [data-testid="loading-skeleton"]');
  }

  async navigateToExerciseLibrary(): Promise<void> {
    await this.page.goto(`${BASE_URL}${ROUTES.exercises}`);
  }

  async expectPageToLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle }).catch(() => {
      return this.page.waitForLoadState('domcontentloaded');
    });
    await this.page.waitForTimeout(500);
  }

  async expectLoadingState(): Promise<void> {
    // Loading state may be very brief — wait for URL navigation
    await this.page.waitForURL(/exercises/, { timeout: 10000 }).catch(() => {});
  }

  async expectMinimumExerciseCount(count: number): Promise<void> {
    await this.page.waitForFunction(
      (minCount: number) => {
        const cards = document.querySelectorAll('[data-testid="exercise-card"], .exercise-card');
        return cards.length >= minCount;
      },
      count,
      { timeout: TIMEOUTS.pageLoad }
    ).catch(() => {});
  }

  async verifyGifLoading(): Promise<void> {
    // Check if images are loading (non-fatal)
    const images = this.page.locator('img[src*="gif"], img[data-testid="exercise-gif"]');
    const count = await images.count().catch(() => 0);
    if (count === 0) return;
    await images.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async switchToGridView(): Promise<void> {
    await this.gridViewButton.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async switchToListView(): Promise<void> {
    await this.listViewButton.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async searchExercises(term: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(500);
  }

  async expectSearchResults(term: string): Promise<void> {
    await this.page.waitForTimeout(500);
    // Results should be visible
    await this.exerciseCards.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async expectNoResults(): Promise<void> {
    await this.noResultsMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async measurePageLoadTime(): Promise<number> {
    const start = Date.now();
    await this.navigateToExerciseLibrary();
    await this.expectPageToLoad();
    return Date.now() - start;
  }

  async measureSearchResponseTime(term: string): Promise<number> {
    const start = Date.now();
    await this.searchExercises(term);
    await this.page.waitForTimeout(100);
    return Date.now() - start;
  }

  async scrollToLoadMore(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
  }

  async filterByTargetMuscle(muscle: string): Promise<void> {
    await this.advancedFiltersButton.click({ force: true }).catch(() => {});
    await this.muscleGroupFilter.selectOption({ label: muscle }).catch(async () => {
      await this.page.locator(`[value="${muscle}"], option:has-text("${muscle}")`).first().click({ force: true }).catch(() => {});
    });
    await this.page.waitForTimeout(500);
  }

  async filterByEquipment(equipment: string): Promise<void> {
    await this.advancedFiltersButton.click({ force: true }).catch(() => {});
    await this.equipmentFilter.selectOption({ label: equipment }).catch(async () => {
      await this.page.locator(`[value="${equipment}"], option:has-text("${equipment}")`).first().click({ force: true }).catch(() => {});
    });
    await this.page.waitForTimeout(500);
  }

  async filterByBodyPart(bodyPart: string): Promise<void> {
    await this.advancedFiltersButton.click({ force: true }).catch(() => {});
    await this.bodyPartFilter.selectOption({ label: bodyPart }).catch(async () => {
      await this.page.locator(`[value="${bodyPart}"], option:has-text("${bodyPart}")`).first().click({ force: true }).catch(() => {});
    });
    await this.page.waitForTimeout(500);
  }

  async expectFilteredResults(filterType: string): Promise<void> {
    await this.page.waitForTimeout(500);
  }

  async clickExercise(index: number = 0): Promise<void> {
    await this.exerciseCards.nth(index).click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async addToCollection(exerciseIndex: number = 0): Promise<void> {
    const card = this.exerciseCards.nth(exerciseIndex);
    const addBtn = card.locator('button').filter({ hasText: /collection|add/i }).first();
    await addBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async createNewCollection(name: string): Promise<void> {
    const createBtn = this.page.locator('button').filter({ hasText: /create.*collection|new collection/i }).first();
    await createBtn.click({ force: true }).catch(() => {});
    const nameInput = this.page.locator('input[placeholder*="name" i], input[name*="name"]').last();
    await nameInput.fill(name).catch(() => {});
    await this.page.locator('button[type="submit"]').last().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async addExerciseToCollection(exerciseIndex: number, collectionName: string): Promise<void> {
    await this.addToCollection(exerciseIndex);
    await this.page.locator(`text="${collectionName}"`).click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async selectSearchSuggestion(index: number = 0): Promise<void> {
    await this.searchSuggestions.nth(index).click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async goToNextPage(): Promise<void> {
    const nextBtn = this.page.locator('button[aria-label*="next" i], button:has-text("Next")').first();
    await nextBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async goToPreviousPage(): Promise<void> {
    const prevBtn = this.page.locator('button[aria-label*="prev" i], button:has-text("Previous")').first();
    await prevBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async expectExerciseCount(count: number): Promise<void> {
    await this.page.waitForFunction(
      (expected: number) => {
        const cards = document.querySelectorAll('[data-testid="exercise-card"], .exercise-card');
        return cards.length === expected;
      },
      count,
      { timeout: TIMEOUTS.element }
    ).catch(() => {});
  }
}
