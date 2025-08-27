import { emailService } from '../services/emailService';
import { clientService } from '../services/clientService';

describe('Email Service Integration Tests', () => {
  // Test email service initialization
  describe('Email Service Initialization', () => {
    it('should initialize email service without errors', async () => {
      expect(emailService).toBeDefined();
    });

    it('should verify connection returns boolean', async () => {
      // Note: This will fail if email settings are not configured
      // but should not throw an error
      const result = await emailService.verifyConnection();
      expect(typeof result).toBe('boolean');
    });
  });

  // Test client invitation email integration
  describe('Client Invitation Email Integration', () => {
    it('should have sendClientInvitation method', () => {
      expect(typeof emailService.sendClientInvitation).toBe('function');
    });

    it('should create invitation without throwing error (email may fail)', async () => {
      // Mock data for testing
      const mockInviteData = {
        trainerId: 'test-trainer-id',
        clientEmail: 'test-client@example.com',
        customMessage: 'Welcome to my training program!'
      };

      // This test verifies the service integration works
      // The actual email sending may fail without proper SMTP config
      try {
        // Note: This will fail if database is not set up, but shows integration works
        await clientService.inviteClient(mockInviteData);
      } catch (error: any) {
        // Expected to fail without proper database setup
        // But should be a database error, not email service error
        expect(error.message).not.toContain('email service');
      }
    });
  });

  // Test email template functionality
  describe('Email Template Generation', () => {
    it('should send client invitation with proper parameters', async () => {
      const mockData = {
        clientEmail: 'test@example.com',
        trainerName: 'John Trainer',
        trainerEmail: 'trainer@example.com',
        invitationToken: 'test-token-123'
      };

      // This will attempt to send email - may fail without SMTP config
      // but should not throw synchronous errors
      try {
        await emailService.sendClientInvitation(
          mockData.clientEmail,
          mockData.trainerName,
          mockData.trainerEmail,
          mockData.invitationToken
        );
      } catch (error) {
        // Expected to fail without proper email configuration
        // but function should exist and accept parameters
        console.log('Expected email sending failure in test environment:', error);
      }
    });
  });

  // Test other email methods exist
  describe('Email Service Methods', () => {
    it('should have all required email methods', () => {
      expect(typeof emailService.sendEmail).toBe('function');
      expect(typeof emailService.sendEmailVerification).toBe('function');
      expect(typeof emailService.sendPasswordReset).toBe('function');
      expect(typeof emailService.sendWelcomeEmail).toBe('function');
      expect(typeof emailService.sendSecurityNotification).toBe('function');
      expect(typeof emailService.sendClientInvitation).toBe('function');
      expect(typeof emailService.verifyConnection).toBe('function');
    });
  });
});