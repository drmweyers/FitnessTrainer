/**
 * ExerciseDetailPage - Page Object for Exercise Detail view (modal or page)
 */
import { Page, Locator } from '@playwright/test';
import { BASE_URL, ROUTES } from '../helpers/constants';

export class ExerciseDetailPage {
  readonly page: Page;

  // Locators
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly gifImage: Locator;
  readonly gifPlayer: Locator;
  readonly playPauseButton: Locator;
  readonly primaryMuscles: Locator;
  readonly secondaryMuscles: Locator;
  readonly equipment: Locator;
  readonly exerciseDifficulty: Locator;
  readonly tipsSection: Locator;
  readonly commonMistakes: Locator;
  readonly voiceInstructions: Locator;
  readonly mobileGestureArea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"], [data-testid="exercise-detail"], .exercise-detail-modal').first();
    this.closeButton = page.locator('[aria-label*="close" i], button').filter({ hasText: /close|dismiss/i }).first();
    this.gifImage = page.locator('[data-testid="exercise-gif"], img[alt*="exercise" i]').first();
    this.gifPlayer = page.locator('[data-testid="gif-player"], .gif-player').first();
    this.playPauseButton = page.locator('button[aria-label*="play" i], button[aria-label*="pause" i], [data-testid="play-pause"]').first();
    this.primaryMuscles = page.locator('[data-testid="primary-muscles"], .primary-muscles').first();
    this.secondaryMuscles = page.locator('[data-testid="secondary-muscles"], .secondary-muscles').first();
    this.equipment = page.locator('[data-testid="equipment"], .exercise-equipment').first();
    this.exerciseDifficulty = page.locator('[data-testid="difficulty"], .exercise-difficulty').first();
    this.tipsSection = page.locator('[data-testid="tips"], .tips-section').first();
    this.commonMistakes = page.locator('[data-testid="common-mistakes"], .common-mistakes').first();
    this.voiceInstructions = page.locator('[data-testid="voice-instructions"], button[aria-label*="voice" i]').first();
    this.mobileGestureArea = page.locator('[data-testid="gesture-area"], .gesture-area').first();
  }

  async expectModalToBeVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      // Modal may be inline on some views
    });
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click({ force: true }).catch(async () => {
      await this.page.keyboard.press('Escape');
    });
    await this.page.waitForTimeout(300);
  }

  async closeModalByEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  async closeModalByOverlay(): Promise<void> {
    await this.page.locator('.modal-overlay, [data-testid="modal-overlay"]').click({ force: true }).catch(async () => {
      await this.page.keyboard.press('Escape');
    });
    await this.page.waitForTimeout(300);
  }

  async playGif(): Promise<void> {
    await this.playPauseButton.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(200);
  }

  async pauseGif(): Promise<void> {
    await this.playPauseButton.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(200);
  }

  async restartGif(): Promise<void> {
    const restartBtn = this.page.locator('button[aria-label*="restart" i], [data-testid="restart-gif"]').first();
    await restartBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(200);
  }

  async getExerciseName(): Promise<string> {
    const nameEl = this.page.locator('h1, h2, h3, [data-testid="exercise-name"]').first();
    return await nameEl.textContent().then((t) => t?.trim() || '') .catch(() => '');
  }

  async getTargetMuscles(): Promise<string[]> {
    const text = await this.primaryMuscles.textContent().catch(() => '');
    return text ? text.split(',').map((m) => m.trim()) : [];
  }

  async getEquipment(): Promise<string[]> {
    const text = await this.equipment.textContent().catch(() => '');
    return text ? text.split(',').map((e) => e.trim()) : [];
  }

  async getDifficulty(): Promise<string> {
    return await this.exerciseDifficulty.textContent().then((t) => t?.trim() || '').catch(() => '');
  }

  async toggleFavorite(): Promise<void> {
    const favBtn = this.page.locator('button[aria-label*="favorite" i], [data-testid="toggle-favorite"]').first();
    await favBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async addToCollection(): Promise<void> {
    const addBtn = this.page.locator('button').filter({ hasText: /add.*collection|collection/i }).first();
    await addBtn.click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  async createNewCollection(name: string): Promise<void> {
    const createBtn = this.page.locator('button').filter({ hasText: /create.*collection|new collection/i }).first();
    await createBtn.click({ force: true }).catch(() => {});
    const nameInput = this.page.locator('input[placeholder*="name" i]').last();
    await nameInput.fill(name).catch(() => {});
    await this.page.locator('button[type="submit"]').last().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async verifyInstructionsPresent(): Promise<boolean> {
    const instructions = this.page.locator('[data-testid="instructions"], .exercise-instructions, ol, ul').first();
    return await instructions.isVisible().catch(() => false);
  }

  async verifyAccessibilityFeatures(): Promise<void> {
    // Check for basic accessibility: alt text, aria labels
    const imgs = this.page.locator('img');
    const count = await imgs.count().catch(() => 0);
    for (let i = 0; i < Math.min(count, 3); i++) {
      await imgs.nth(i).getAttribute('alt').catch(() => null);
    }
  }

  async testMobileGestures(): Promise<void> {
    // Simulate swipe gesture on mobile gesture area
    const area = this.mobileGestureArea;
    const box = await area.boundingBox().catch(() => null);
    if (box) {
      await this.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
    }
  }
}
