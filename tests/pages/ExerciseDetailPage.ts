import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExerciseDetailPage extends BasePage {
  // Modal container
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly modalOverlay: Locator;

  // Header section
  readonly exerciseName: Locator;
  readonly favoriteButton: Locator;
  readonly addToCollectionButton: Locator;
  readonly shareButton: Locator;
  readonly exerciseDifficulty: Locator;
  readonly exerciseRating: Locator;

  // GIF player section
  readonly gifPlayer: Locator;
  readonly gifImage: Locator;
  readonly playPauseButton: Locator;
  readonly restartButton: Locator;
  readonly speedControlButton: Locator;
  readonly fullscreenButton: Locator;
  readonly gifLoadingSpinner: Locator;
  readonly gifErrorState: Locator;

  // Exercise information
  readonly targetMuscles: Locator;
  readonly primaryMuscles: Locator;
  readonly secondaryMuscles: Locator;
  readonly bodyParts: Locator;
  readonly equipment: Locator;
  readonly exerciseType: Locator;
  readonly forceType: Locator;
  readonly mechanicsType: Locator;

  // Instructions section
  readonly instructionsContainer: Locator;
  readonly instructionSteps: Locator;
  readonly instructionToggle: Locator;
  readonly voiceInstructions: Locator;

  // Tips and warnings
  readonly tipsSection: Locator;
  readonly commonMistakes: Locator;
  readonly safetyWarnings: Locator;
  readonly alternativeExercises: Locator;

  // Related exercises
  readonly relatedExercises: Locator;
  readonly relatedExerciseCards: Locator;
  readonly seeMoreRelated: Locator;

  // Variations section
  readonly exerciseVariations: Locator;
  readonly variationCards: Locator;
  readonly difficultyProgression: Locator;

  // Collection management
  readonly collectionDropdown: Locator;
  readonly createCollectionButton: Locator;
  readonly removeFromCollectionButton: Locator;

  // Navigation
  readonly previousExerciseButton: Locator;
  readonly nextExerciseButton: Locator;
  readonly backToLibraryButton: Locator;

  // Mobile-specific elements
  readonly mobileGestureArea: Locator;
  readonly mobileControls: Locator;
  readonly swipeIndicator: Locator;

  constructor(page: Page) {
    super(page);
    
    // Modal container
    this.modal = page.locator('[data-testid="exercise-detail-modal"]');
    this.closeButton = page.locator('[data-testid="close-modal"]');
    this.modalOverlay = page.locator('[data-testid="modal-overlay"]');

    // Header section
    this.exerciseName = page.locator('[data-testid="exercise-name"]');
    this.favoriteButton = page.locator('[data-testid="favorite-button"]');
    this.addToCollectionButton = page.locator('[data-testid="add-to-collection"]');
    this.shareButton = page.locator('[data-testid="share-button"]');
    this.exerciseDifficulty = page.locator('[data-testid="exercise-difficulty"]');
    this.exerciseRating = page.locator('[data-testid="exercise-rating"]');

    // GIF player section
    this.gifPlayer = page.locator('[data-testid="gif-player"]');
    this.gifImage = page.locator('[data-testid="gif-image"]');
    this.playPauseButton = page.locator('[data-testid="play-pause-button"]');
    this.restartButton = page.locator('[data-testid="restart-button"]');
    this.speedControlButton = page.locator('[data-testid="speed-control"]');
    this.fullscreenButton = page.locator('[data-testid="fullscreen-button"]');
    this.gifLoadingSpinner = page.locator('[data-testid="gif-loading"]');
    this.gifErrorState = page.locator('[data-testid="gif-error"]');

    // Exercise information
    this.targetMuscles = page.locator('[data-testid="target-muscles"]');
    this.primaryMuscles = page.locator('[data-testid="primary-muscles"]');
    this.secondaryMuscles = page.locator('[data-testid="secondary-muscles"]');
    this.bodyParts = page.locator('[data-testid="body-parts"]');
    this.equipment = page.locator('[data-testid="equipment"]');
    this.exerciseType = page.locator('[data-testid="exercise-type"]');
    this.forceType = page.locator('[data-testid="force-type"]');
    this.mechanicsType = page.locator('[data-testid="mechanics-type"]');

    // Instructions section
    this.instructionsContainer = page.locator('[data-testid="instructions"]');
    this.instructionSteps = page.locator('[data-testid="instruction-step"]');
    this.instructionToggle = page.locator('[data-testid="toggle-instructions"]');
    this.voiceInstructions = page.locator('[data-testid="voice-instructions"]');

    // Tips and warnings
    this.tipsSection = page.locator('[data-testid="tips-section"]');
    this.commonMistakes = page.locator('[data-testid="common-mistakes"]');
    this.safetyWarnings = page.locator('[data-testid="safety-warnings"]');
    this.alternativeExercises = page.locator('[data-testid="alternatives"]');

    // Related exercises
    this.relatedExercises = page.locator('[data-testid="related-exercises"]');
    this.relatedExerciseCards = page.locator('[data-testid="related-exercise-card"]');
    this.seeMoreRelated = page.locator('[data-testid="see-more-related"]');

    // Variations section
    this.exerciseVariations = page.locator('[data-testid="exercise-variations"]');
    this.variationCards = page.locator('[data-testid="variation-card"]');
    this.difficultyProgression = page.locator('[data-testid="difficulty-progression"]');

    // Collection management
    this.collectionDropdown = page.locator('[data-testid="collection-dropdown"]');
    this.createCollectionButton = page.locator('[data-testid="create-collection"]');
    this.removeFromCollectionButton = page.locator('[data-testid="remove-from-collection"]');

    // Navigation
    this.previousExerciseButton = page.locator('[data-testid="previous-exercise"]');
    this.nextExerciseButton = page.locator('[data-testid="next-exercise"]');
    this.backToLibraryButton = page.locator('[data-testid="back-to-library"]');

    // Mobile-specific elements
    this.mobileGestureArea = page.locator('[data-testid="mobile-gesture-area"]');
    this.mobileControls = page.locator('[data-testid="mobile-controls"]');
    this.swipeIndicator = page.locator('[data-testid="swipe-indicator"]');
  }

  // Modal management methods
  async expectModalToBeVisible() {
    await expect(this.modal).toBeVisible();
    await this.waitForLoadingToComplete();
    await this.waitForGifToLoad();
  }

  async closeModal() {
    await this.closeButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async closeModalByOverlay() {
    await this.modalOverlay.click();
    await expect(this.modal).not.toBeVisible();
  }

  async closeModalByEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.modal).not.toBeVisible();
  }

  // GIF player methods
  async waitForGifToLoad() {
    // Wait for GIF to load, with timeout handling
    try {
      await expect(this.gifImage).toBeVisible({ timeout: 10000 });
      await expect(this.gifLoadingSpinner).not.toBeVisible();
    } catch (error) {
      // Check if error state is shown
      const hasError = await this.gifErrorState.isVisible();
      if (hasError) {
        throw new Error('GIF failed to load - error state displayed');
      }
      throw error;
    }
  }

  async playGif() {
    const isPlaying = await this.isGifPlaying();
    if (!isPlaying) {
      await this.playPauseButton.click();
      await this.verifyGifIsPlaying();
    }
  }

  async pauseGif() {
    const isPlaying = await this.isGifPlaying();
    if (isPlaying) {
      await this.playPauseButton.click();
      await this.verifyGifIsPaused();
    }
  }

  async restartGif() {
    await this.restartButton.click();
    await this.verifyGifRestarted();
  }

  async changeGifSpeed(speed: 'slow' | 'normal' | 'fast') {
    await this.speedControlButton.click();
    await this.page.locator(`[data-speed="${speed}"]`).click();
    await this.verifyGifSpeed(speed);
  }

  async enterFullscreen() {
    await this.fullscreenButton.click();
    await this.verifyFullscreenMode();
  }

  async exitFullscreen() {
    await this.page.keyboard.press('Escape');
    await this.verifyNormalMode();
  }

  // Exercise information methods
  async getExerciseName(): Promise<string> {
    return await this.exerciseName.textContent() || '';
  }

  async getTargetMuscles(): Promise<string[]> {
    const muscleElements = await this.targetMuscles.locator('[data-testid="muscle"]').all();
    const muscles = [];
    for (const element of muscleElements) {
      const text = await element.textContent();
      if (text) muscles.push(text);
    }
    return muscles;
  }

  async getEquipment(): Promise<string[]> {
    const equipmentElements = await this.equipment.locator('[data-testid="equipment-item"]').all();
    const equipment = [];
    for (const element of equipmentElements) {
      const text = await element.textContent();
      if (text) equipment.push(text);
    }
    return equipment;
  }

  async getDifficulty(): Promise<string> {
    return await this.exerciseDifficulty.textContent() || '';
  }

  // Instructions methods
  async getInstructionSteps(): Promise<string[]> {
    const stepElements = await this.instructionSteps.all();
    const steps = [];
    for (const element of stepElements) {
      const text = await element.textContent();
      if (text) steps.push(text);
    }
    return steps;
  }

  async toggleInstructions() {
    await this.instructionToggle.click();
    await this.page.waitForTimeout(300); // Animation delay
  }

  async playVoiceInstructions() {
    if (await this.voiceInstructions.isVisible()) {
      await this.voiceInstructions.click();
      await this.verifyVoiceInstructionsPlaying();
    }
  }

  // Favorite and collection methods
  async toggleFavorite() {
    const isFavorited = await this.isFavorited();
    await this.favoriteButton.click();
    await this.page.waitForTimeout(500); // API call delay
    
    // Verify state changed
    const newFavoriteState = await this.isFavorited();
    expect(newFavoriteState).toBe(!isFavorited);
  }

  async addToCollection(collectionName: string) {
    await this.addToCollectionButton.click();
    await expect(this.collectionDropdown).toBeVisible();
    await this.page.locator(`text="${collectionName}"`).click();
    await expect(this.collectionDropdown).not.toBeVisible();
  }

  async createNewCollection(name: string, description?: string) {
    await this.addToCollectionButton.click();
    await this.createCollectionButton.click();
    
    const createModal = this.page.locator('[data-testid="create-collection-modal"]');
    await expect(createModal).toBeVisible();
    
    await this.page.locator('[data-testid="collection-name"]').fill(name);
    if (description) {
      await this.page.locator('[data-testid="collection-description"]').fill(description);
    }
    
    await this.page.locator('[data-testid="create-collection-submit"]').click();
    await expect(createModal).not.toBeVisible();
  }

  // Navigation methods
  async goToPreviousExercise() {
    if (await this.previousExerciseButton.isEnabled()) {
      await this.previousExerciseButton.click();
      await this.waitForLoadingToComplete();
      await this.waitForGifToLoad();
    }
  }

  async goToNextExercise() {
    if (await this.nextExerciseButton.isEnabled()) {
      await this.nextExerciseButton.click();
      await this.waitForLoadingToComplete();
      await this.waitForGifToLoad();
    }
  }

  async goBackToLibrary() {
    await this.backToLibraryButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  // Related exercises methods
  async clickRelatedExercise(index: number) {
    await this.relatedExerciseCards.nth(index).click();
    await this.waitForLoadingToComplete();
    await this.waitForGifToLoad();
  }

  async viewMoreRelatedExercises() {
    if (await this.seeMoreRelated.isVisible()) {
      await this.seeMoreRelated.click();
      await this.waitForLoadingToComplete();
    }
  }

  // Mobile-specific methods
  async testMobileGestures() {
    await this.setMobileViewport();
    
    // Test swipe gestures for navigation
    if (await this.nextExerciseButton.isEnabled()) {
      await this.mobileGestureArea.swipeLeft();
      await this.waitForLoadingToComplete();
      await this.waitForGifToLoad();
    }
    
    if (await this.previousExerciseButton.isEnabled()) {
      await this.mobileGestureArea.swipeRight();
      await this.waitForLoadingToComplete();
      await this.waitForGifToLoad();
    }
  }

  async testMobileControls() {
    await this.setMobileViewport();
    
    // Verify mobile controls are visible and properly sized
    await expect(this.mobileControls).toBeVisible();
    
    const playButton = this.playPauseButton;
    const playButtonBox = await playButton.boundingBox();
    expect(playButtonBox?.height).toBeGreaterThanOrEqual(44);
    expect(playButtonBox?.width).toBeGreaterThanOrEqual(44);
  }

  // Verification methods
  async verifyExerciseData(expectedData: any) {
    const name = await this.getExerciseName();
    expect(name).toBe(expectedData.name);
    
    const muscles = await this.getTargetMuscles();
    expect(muscles).toEqual(expect.arrayContaining(expectedData.targetMuscles));
    
    const equipment = await this.getEquipment();
    expect(equipment).toEqual(expect.arrayContaining(expectedData.equipment));
  }

  async verifyInstructionsPresent() {
    await expect(this.instructionsContainer).toBeVisible();
    const steps = await this.getInstructionSteps();
    expect(steps.length).toBeGreaterThan(0);
    
    // Verify each step has meaningful content
    steps.forEach(step => {
      expect(step.length).toBeGreaterThan(10); // Reasonable instruction length
    });
  }

  async verifyAccessibilityFeatures() {
    // Check for proper ARIA labels
    await expect(this.modal).toHaveAttribute('role', 'dialog');
    await expect(this.modal).toHaveAttribute('aria-modal', 'true');
    await expect(this.closeButton).toHaveAttribute('aria-label');
    
    // Check for keyboard navigation support
    await this.closeButton.focus();
    const focusedElement = await this.page.evaluateHandle(() => document.activeElement);
    expect(focusedElement).toBeTruthy();
  }

  async verifyLoadingStates() {
    // Verify initial loading state
    await expect(this.gifLoadingSpinner).toBeVisible();
    
    // Wait for content to load
    await this.waitForGifToLoad();
    
    // Verify loading state is gone
    await expect(this.gifLoadingSpinner).not.toBeVisible();
  }

  // Private helper methods
  private async isGifPlaying(): Promise<boolean> {
    const playButtonState = await this.playPauseButton.getAttribute('data-playing');
    return playButtonState === 'true';
  }

  private async isFavorited(): Promise<boolean> {
    const favoriteState = await this.favoriteButton.getAttribute('data-favorited');
    return favoriteState === 'true';
  }

  private async verifyGifIsPlaying() {
    await expect(this.playPauseButton).toHaveAttribute('data-playing', 'true');
  }

  private async verifyGifIsPaused() {
    await expect(this.playPauseButton).toHaveAttribute('data-playing', 'false');
  }

  private async verifyGifRestarted() {
    // Verify animation restarted (implementation-specific)
    await this.page.waitForTimeout(100);
  }

  private async verifyGifSpeed(speed: string) {
    await expect(this.gifPlayer).toHaveAttribute('data-speed', speed);
  }

  private async verifyFullscreenMode() {
    await expect(this.gifPlayer).toHaveAttribute('data-fullscreen', 'true');
  }

  private async verifyNormalMode() {
    await expect(this.gifPlayer).toHaveAttribute('data-fullscreen', 'false');
  }

  private async verifyVoiceInstructionsPlaying() {
    await expect(this.voiceInstructions).toHaveAttribute('data-playing', 'true');
  }
}