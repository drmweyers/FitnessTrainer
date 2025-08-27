import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClientFormPage extends BasePage {
  // Form elements
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  // Basic info fields
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly fitnessLevelSelect: Locator;

  // Goals section
  readonly primaryGoalInput: Locator;
  readonly targetWeightInput: Locator;
  readonly targetBodyFatInput: Locator;
  readonly timeframeInput: Locator;
  readonly additionalNotesTextarea: Locator;

  // Preferences section
  readonly workoutDaysCheckboxes: Locator;
  readonly sessionDurationInput: Locator;
  readonly equipmentAccessCheckboxes: Locator;
  readonly specialRequestsTextarea: Locator;

  // Emergency contact section
  readonly emergencyNameInput: Locator;
  readonly emergencyPhoneInput: Locator;
  readonly emergencyRelationshipInput: Locator;

  // Medical information
  readonly medicalConditionsInput: Locator;
  readonly medicationsInput: Locator;
  readonly allergiesInput: Locator;

  // Validation error messages
  readonly emailError: Locator;
  readonly requiredFieldErrors: Locator;
  readonly formError: Locator;

  constructor(page: Page) {
    super(page);
    
    // Modal structure
    this.modal = page.locator('[role="dialog"]:has(h2:has-text("Add Client"))');
    this.modalTitle = this.modal.locator('h2');
    this.closeButton = this.modal.locator('button[aria-label="close"], button:has(svg)').first();
    this.cancelButton = this.modal.locator('button:has-text("Cancel")');
    this.submitButton = this.modal.locator('button:has-text("Add Client"), button[type="submit"]');

    // Form fields
    this.emailInput = this.modal.locator('input[name="email"], input[type="email"]');
    this.firstNameInput = this.modal.locator('input[name="firstName"]');
    this.lastNameInput = this.modal.locator('input[name="lastName"]');
    this.fitnessLevelSelect = this.modal.locator('select[name="fitnessLevel"]');

    // Goals section
    this.primaryGoalInput = this.modal.locator('input[name="primaryGoal"]');
    this.targetWeightInput = this.modal.locator('input[name="targetWeight"]');
    this.targetBodyFatInput = this.modal.locator('input[name="targetBodyFat"]');
    this.timeframeInput = this.modal.locator('input[name="timeframe"]');
    this.additionalNotesTextarea = this.modal.locator('textarea[name="additionalNotes"]');

    // Preferences section
    this.workoutDaysCheckboxes = this.modal.locator('input[name="workoutDays"]');
    this.sessionDurationInput = this.modal.locator('input[name="sessionDuration"]');
    this.equipmentAccessCheckboxes = this.modal.locator('input[name="equipmentAccess"]');
    this.specialRequestsTextarea = this.modal.locator('textarea[name="specialRequests"]');

    // Emergency contact
    this.emergencyNameInput = this.modal.locator('input[name="emergencyName"]');
    this.emergencyPhoneInput = this.modal.locator('input[name="emergencyPhone"]');
    this.emergencyRelationshipInput = this.modal.locator('input[name="emergencyRelationship"]');

    // Medical information
    this.medicalConditionsInput = this.modal.locator('input[name="medicalConditions"]');
    this.medicationsInput = this.modal.locator('input[name="medications"]');
    this.allergiesInput = this.modal.locator('input[name="allergies"]');

    // Error messages
    this.emailError = this.modal.locator('[data-testid="email-error"]');
    this.requiredFieldErrors = this.modal.locator('[data-testid*="error"], .text-red-500');
    this.formError = this.modal.locator('[data-testid="form-error"]');
  }

  async expectModalToBeVisible() {
    await expect(this.modal).toBeVisible();
    await expect(this.modalTitle).toContainText('Add Client');
  }

  async closeModal() {
    await this.closeButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async cancelForm() {
    await this.cancelButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  // Fill form sections
  async fillBasicInfo(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    fitnessLevel?: string;
  }) {
    await this.emailInput.fill(data.email);
    
    if (data.firstName) {
      await this.firstNameInput.fill(data.firstName);
    }
    
    if (data.lastName) {
      await this.lastNameInput.fill(data.lastName);
    }
    
    if (data.fitnessLevel) {
      await this.fitnessLevelSelect.selectOption(data.fitnessLevel);
    }
  }

  async fillGoals(data: {
    primaryGoal?: string;
    targetWeight?: string;
    targetBodyFat?: string;
    timeframe?: string;
    additionalNotes?: string;
  }) {
    if (data.primaryGoal) {
      await this.primaryGoalInput.fill(data.primaryGoal);
    }
    
    if (data.targetWeight) {
      await this.targetWeightInput.fill(data.targetWeight);
    }
    
    if (data.targetBodyFat) {
      await this.targetBodyFatInput.fill(data.targetBodyFat);
    }
    
    if (data.timeframe) {
      await this.timeframeInput.fill(data.timeframe);
    }
    
    if (data.additionalNotes) {
      await this.additionalNotesTextarea.fill(data.additionalNotes);
    }
  }

  async fillPreferences(data: {
    workoutDays?: string[];
    sessionDuration?: string;
    equipmentAccess?: string[];
    specialRequests?: string;
  }) {
    if (data.workoutDays) {
      for (const day of data.workoutDays) {
        await this.modal.locator(`input[value="${day}"]`).check();
      }
    }
    
    if (data.sessionDuration) {
      await this.sessionDurationInput.fill(data.sessionDuration);
    }
    
    if (data.equipmentAccess) {
      for (const equipment of data.equipmentAccess) {
        await this.modal.locator(`input[value="${equipment}"]`).check();
      }
    }
    
    if (data.specialRequests) {
      await this.specialRequestsTextarea.fill(data.specialRequests);
    }
  }

  async fillEmergencyContact(data: {
    name: string;
    phone: string;
    relationship: string;
  }) {
    await this.emergencyNameInput.fill(data.name);
    await this.emergencyPhoneInput.fill(data.phone);
    await this.emergencyRelationshipInput.fill(data.relationship);
  }

  async fillMedicalInfo(data: {
    medicalConditions?: string;
    medications?: string;
    allergies?: string;
  }) {
    if (data.medicalConditions) {
      await this.medicalConditionsInput.fill(data.medicalConditions);
    }
    
    if (data.medications) {
      await this.medicationsInput.fill(data.medications);
    }
    
    if (data.allergies) {
      await this.allergiesInput.fill(data.allergies);
    }
  }

  // Submit form
  async submitForm() {
    await this.submitButton.click();
    
    // Wait for either success (modal closes) or error
    await Promise.race([
      this.modal.waitFor({ state: 'hidden', timeout: 10000 }),
      this.formError.waitFor({ timeout: 5000 })
    ]);
  }

  async expectSubmissionSuccess() {
    await expect(this.modal).not.toBeVisible({ timeout: 10000 });
  }

  async expectSubmissionError(message?: string) {
    await expect(this.formError).toBeVisible();
    if (message) {
      await expect(this.formError).toContainText(message);
    }
  }

  // Validation tests
  async testRequiredFieldValidation() {
    // Try to submit empty form
    await this.submitForm();
    
    // Should show email required error
    await expect(this.emailError).toBeVisible();
    await expect(this.modal).toBeVisible(); // Modal should still be open
  }

  async testEmailValidation() {
    await this.emailInput.fill('invalid-email');
    await this.submitForm();
    
    // Should show email format error
    await expect(this.emailError).toBeVisible();
    await expect(this.emailError).toContainText('valid email');
  }

  async testDuplicateEmailError() {
    // This would be called with an email that already exists
    await this.emailInput.fill('existing@example.com');
    await this.submitForm();
    
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText('already exists');
  }

  // Complete form submission test
  async fillAndSubmitCompleteForm() {
    const testData = {
      basic: {
        email: `test.client.${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Client',
        fitnessLevel: 'beginner'
      },
      goals: {
        primaryGoal: 'Weight Loss',
        targetWeight: '150',
        targetBodyFat: '15',
        timeframe: '6 months',
        additionalNotes: 'Wants to focus on cardio and strength training'
      },
      preferences: {
        workoutDays: ['monday', 'wednesday', 'friday'],
        sessionDuration: '60',
        equipmentAccess: ['dumbbells', 'treadmill'],
        specialRequests: 'Prefer morning sessions'
      },
      emergency: {
        name: 'John Doe',
        phone: '555-0123',
        relationship: 'Spouse'
      },
      medical: {
        medicalConditions: 'None',
        medications: 'None',
        allergies: 'Peanuts'
      }
    };

    await this.fillBasicInfo(testData.basic);
    await this.fillGoals(testData.goals);
    await this.fillPreferences(testData.preferences);
    await this.fillEmergencyContact(testData.emergency);
    await this.fillMedicalInfo(testData.medical);
    
    await this.submitForm();
    return testData.basic.email;
  }

  // Mobile responsiveness test
  async testMobileLayout() {
    await this.setMobileViewport();
    
    // Modal should adapt to mobile viewport
    const modalBox = await this.modal.boundingBox();
    expect(modalBox?.width).toBeLessThanOrEqual(390); // Should fit mobile width
    
    // Form inputs should be properly sized
    const emailBox = await this.emailInput.boundingBox();
    expect(emailBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
  }

  async testFormResetAfterCancel() {
    // Fill some fields
    await this.emailInput.fill('test@example.com');
    await this.firstNameInput.fill('Test');
    
    // Cancel form
    await this.cancelForm();
    
    // Reopen form and verify it's empty
    await this.page.locator('button:has-text("Add Client")').click();
    await this.expectModalToBeVisible();
    
    await expect(this.emailInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
  }

  async testCharacterLimits() {
    const longText = 'a'.repeat(1000);
    
    // Test textarea character limits
    await this.additionalNotesTextarea.fill(longText);
    const value = await this.additionalNotesTextarea.inputValue();
    
    // Should be truncated if there's a limit
    expect(value.length).toBeLessThanOrEqual(500); // Assuming 500 char limit
  }
}