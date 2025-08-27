import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClientInvitePage extends BasePage {
  // Modal elements
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly sendInviteButton: Locator;

  // Form fields
  readonly emailInput: Locator;
  readonly customMessageTextarea: Locator;

  // Error messages
  readonly emailError: Locator;
  readonly formError: Locator;
  readonly successMessage: Locator;

  // Invitation management
  readonly pendingInvitations: Locator;
  readonly resendButtons: Locator;

  constructor(page: Page) {
    super(page);
    
    // Modal structure
    this.modal = page.locator('[role="dialog"]:has(h2:has-text("Invite Client"))');
    this.modalTitle = this.modal.locator('h2');
    this.closeButton = this.modal.locator('button[aria-label="close"], button:has(svg)').first();
    this.cancelButton = this.modal.locator('button:has-text("Cancel")');
    this.sendInviteButton = this.modal.locator('button:has-text("Send Invite"), button[type="submit"]');

    // Form fields
    this.emailInput = this.modal.locator('input[name="clientEmail"], input[type="email"]');
    this.customMessageTextarea = this.modal.locator('textarea[name="customMessage"]');

    // Messages
    this.emailError = this.modal.locator('[data-testid="email-error"]');
    this.formError = this.modal.locator('[data-testid="form-error"]');
    this.successMessage = this.modal.locator('[data-testid="success-message"]');

    // Invitation management
    this.pendingInvitations = page.locator('[data-testid="pending-invitation"]');
    this.resendButtons = page.locator('button:has-text("Resend")');
  }

  async expectModalToBeVisible() {
    await expect(this.modal).toBeVisible();
    await expect(this.modalTitle).toContainText('Invite Client');
  }

  async closeModal() {
    await this.closeButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async cancelInvitation() {
    await this.cancelButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async fillInvitationForm(email: string, customMessage?: string) {
    await this.emailInput.fill(email);
    
    if (customMessage) {
      await this.customMessageTextarea.fill(customMessage);
    }
  }

  async sendInvitation() {
    await this.sendInviteButton.click();
    
    // Wait for either success message or error
    await Promise.race([
      this.successMessage.waitFor({ timeout: 10000 }),
      this.formError.waitFor({ timeout: 5000 })
    ]);
  }

  async expectInvitationSuccess() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText('Invitation sent successfully');
  }

  async expectInvitationError(message?: string) {
    await expect(this.formError).toBeVisible();
    if (message) {
      await expect(this.formError).toContainText(message);
    }
  }

  // Validation tests
  async testEmailValidation() {
    await this.emailInput.fill('invalid-email');
    await this.sendInvitation();
    
    await expect(this.emailError).toBeVisible();
    await expect(this.emailError).toContainText('valid email');
  }

  async testRequiredEmailField() {
    // Try to send invitation without email
    await this.sendInvitation();
    
    await expect(this.emailError).toBeVisible();
    await expect(this.emailError).toContainText('required');
  }

  async testDuplicateInvitationError() {
    // Send invitation to email that already has pending invitation
    await this.emailInput.fill('existing.invite@example.com');
    await this.sendInvitation();
    
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText('already invited');
  }

  async testCustomMessage() {
    const customMessage = 'Welcome to our fitness program! I\'m excited to work with you.';
    
    await this.fillInvitationForm('test@example.com', customMessage);
    await this.sendInvitation();
    
    await this.expectInvitationSuccess();
  }

  // Complete invitation flow
  async sendCompleteInvitation(email?: string) {
    const inviteEmail = email || `invite.${Date.now()}@example.com`;
    const customMessage = `Hi! I'd like to invite you to join my fitness program. Looking forward to working together!`;
    
    await this.fillInvitationForm(inviteEmail, customMessage);
    await this.sendInvitation();
    
    return inviteEmail;
  }

  // Pending invitations management
  async expectPendingInvitations() {
    await expect(this.pendingInvitations.first()).toBeVisible();
  }

  async getPendingInvitationCount() {
    return await this.pendingInvitations.count();
  }

  async resendInvitation(index: number = 0) {
    await this.resendButtons.nth(index).click();
    
    // Wait for confirmation or success message
    await Promise.race([
      this.successMessage.waitFor({ timeout: 5000 }),
      this.formError.waitFor({ timeout: 5000 })
    ]);
  }

  async expectResendSuccess() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText('Invitation resent');
  }

  // Character limits for custom message
  async testCustomMessageLimit() {
    const longMessage = 'a'.repeat(1000);
    
    await this.customMessageTextarea.fill(longMessage);
    const value = await this.customMessageTextarea.inputValue();
    
    // Should be truncated if there's a character limit
    expect(value.length).toBeLessThanOrEqual(500); // Assuming 500 char limit
  }

  // Mobile responsiveness
  async testMobileLayout() {
    await this.setMobileViewport();
    
    const modalBox = await this.modal.boundingBox();
    expect(modalBox?.width).toBeLessThanOrEqual(390);
    
    // Input fields should be properly sized for mobile
    const emailBox = await this.emailInput.boundingBox();
    const buttonBox = await this.sendInviteButton.boundingBox();
    
    expect(emailBox?.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  }

  // Email format validation edge cases
  async testEmailFormatEdgeCases() {
    const invalidEmails = [
      'plainaddress',
      '@missingprefixdomain.com',
      'missing-domain@.com',
      'missing-at-sign.com',
      'spaces in@email.com',
      'email@domain..com'
    ];
    
    for (const email of invalidEmails) {
      await this.emailInput.fill(email);
      await this.sendInvitation();
      
      await expect(this.emailError).toBeVisible();
      await this.emailInput.clear();
      
      // Clear any error state
      await this.page.waitForTimeout(100);
    }
  }

  // Form reset functionality
  async testFormReset() {
    await this.fillInvitationForm('test@example.com', 'Test message');
    await this.cancelInvitation();
    
    // Reopen modal and verify fields are cleared
    await this.page.locator('button:has-text("Invite Client")').click();
    await this.expectModalToBeVisible();
    
    await expect(this.emailInput).toHaveValue('');
    await expect(this.customMessageTextarea).toHaveValue('');
  }

  // Invitation status tracking
  async expectInvitationStatus(email: string, status: 'pending' | 'accepted' | 'expired') {
    const invitation = this.page.locator(`[data-testid="invitation-${email}"]`);
    await expect(invitation.locator(`[data-testid="status-${status}"]`)).toBeVisible();
  }

  // Network error handling
  async testNetworkError() {
    // This would simulate a network error scenario
    // In a real test, you might intercept the network request to simulate failure
    
    await this.fillInvitationForm('network.error@example.com');
    
    // Simulate network request failing
    await this.page.route('**/api/clients/invite', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });
    
    await this.sendInvitation();
    
    await expect(this.formError).toBeVisible();
    await expect(this.formError).toContainText('error');
  }
}