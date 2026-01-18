// Note: This test file uses the global emailService mock from setup.ts
// We unmock the emailService to get the actual implementation, but nodemailer is mocked

jest.unmock('../../src/services/emailService');

// Mock nodemailer BEFORE importing emailService
jest.mock('nodemailer');

import nodemailer from 'nodemailer';
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Import the emailService (singleton instance)
import { emailService, EmailService } from '../../src/services/emailService';

describe('EmailService', () => {
  let mockTransporter: jest.Mocked<any>;

  beforeAll(() => {
    // Set up test environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'testpass';
    process.env.EMAIL_FROM = 'noreply@evofit.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a proper mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      }),
      verify: jest.fn().mockResolvedValue(true),
    } as any;

    // Mock createTransport to return our mock transporter
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;
    delete process.env.FRONTEND_URL;
  });

  describe('constructor and initialization', () => {
    it('should create transporter with correct SMTP settings when instantiated', () => {
      // Create a new instance to test constructor
      const testService = new EmailService();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'testpass',
        },
      });
    });

    it('should use secure connection when SMTP_SECURE is true', () => {
      const originalPort = process.env.SMTP_PORT;
      const originalSecure = process.env.SMTP_SECURE;

      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURE = 'true';

      try {
        const testService = new EmailService();

        expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
          host: 'smtp.test.com',
          port: 465,
          secure: true,
          auth: {
            user: 'test@example.com',
            pass: 'testpass',
          },
        });
      } finally {
        process.env.SMTP_PORT = originalPort;
        process.env.SMTP_SECURE = originalSecure;
      }
    });

    it('should handle missing SMTP authentication', () => {
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;

      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      try {
        const testService = new EmailService();

        expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
          host: 'smtp.test.com',
          port: 587,
          secure: false,
        });
      } finally {
        process.env.SMTP_USER = originalUser;
        process.env.SMTP_PASS = originalPass;
      }
    });
  });

  describe('sendEmailVerification', () => {
    it('should send verification email successfully', async () => {
      const testService = new EmailService();
      await testService.sendEmailVerification('test@example.com', 'verification-token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'test@example.com',
        subject: 'Verify your EvoFit account',
        text: expect.stringContaining('Welcome'),
        html: expect.stringContaining('verify-email?token=verification-token'),
      });
    });

    it('should include verification link in email', async () => {
      const testService = new EmailService();
      await testService.sendEmailVerification('test@example.com', 'test-token-123');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('verify-email?token=test-token-123');
    });

    it('should handle SMTP errors', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const testService = new EmailService();
      await expect(
        testService.sendEmailVerification('test@example.com', 'verification-token')
      ).rejects.toThrow('Failed to send email');
    });

    it('should personalize email with user name', async () => {
      const testService = new EmailService();
      await testService.sendEmailVerification('test@example.com', 'token', 'John Doe');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('Hi John Doe');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      const testService = new EmailService();
      await testService.sendPasswordReset('test@example.com', 'reset-token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'test@example.com',
        subject: 'Reset your EvoFit password',
        text: expect.stringContaining('password'),
        html: expect.stringContaining('reset-password?token=reset-token'),
      });
    });

    it('should include reset link in email', async () => {
      const testService = new EmailService();
      await testService.sendPasswordReset('test@example.com', 'reset-token-456');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('reset-password?token=reset-token-456');
    });

    it('should personalize email with user name', async () => {
      const testService = new EmailService();
      await testService.sendPasswordReset('test@example.com', 'token', 'Jane Doe');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('Hi Jane Doe');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully for client', async () => {
      const testService = new EmailService();
      await testService.sendWelcomeEmail('test@example.com', 'John Doe', 'client');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'test@example.com',
        subject: expect.stringContaining('Welcome'),
        text: expect.stringContaining('John Doe'),
        html: expect.stringContaining('John Doe'),
      });
    });

    it('should send welcome email successfully for trainer', async () => {
      const testService = new EmailService();
      await testService.sendWelcomeEmail('trainer@example.com', 'Jane Smith', 'trainer');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('Jane Smith');
      expect(sendMailCall.html).toContain('Welcome');
      expect(sendMailCall.html).toContain('Train Clients');
    });

    it('should include client-specific content', async () => {
      const testService = new EmailService();
      await testService.sendWelcomeEmail('client@example.com', 'Client User', 'client');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('Transform Your Fitness');
    });
  });

  describe('sendClientInvitation', () => {
    it('should send client invitation email successfully', async () => {
      const testService = new EmailService();
      await testService.sendClientInvitation(
        'client@example.com',
        'Trainer Name',
        'trainer@example.com',
        'invitation-token-123'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'client@example.com',
        subject: expect.stringContaining('invited'),
        text: expect.stringContaining('Trainer Name'),
        html: expect.stringContaining('Trainer Name'),
      });
    });

    it('should include invitation link in email', async () => {
      const testService = new EmailService();
      await testService.sendClientInvitation(
        'client@example.com',
        'Trainer Name',
        'trainer@example.com',
        'invite-token-abc'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('accept-invitation?token=invite-token-abc');
    });

    it('should include trainer email in email', async () => {
      const testService = new EmailService();
      await testService.sendClientInvitation(
        'client@example.com',
        'Trainer Name',
        'trainer@example.com',
        'token'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('trainer@example.com');
    });
  });

  describe('sendSecurityNotification', () => {
    it('should send security notification email successfully', async () => {
      const testService = new EmailService();
      await testService.sendSecurityNotification(
        'user@example.com',
        'New login detected',
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          timestamp: new Date(),
        }
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'user@example.com',
        subject: expect.stringContaining('Security'),
        text: expect.stringContaining('New login detected'),
        html: expect.stringContaining('New login detected'),
      });
    });

    it('should include security details in email', async () => {
      const testService = new EmailService();
      const timestamp = new Date('2024-01-15T10:30:00Z');
      await testService.sendSecurityNotification(
        'user@example.com',
        'Password changed',
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Chrome',
          timestamp,
        }
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('192.168.1.1');
      expect(sendMailCall.html).toContain('Chrome');
    });
  });

  describe('verifyConnection', () => {
    it('should verify SMTP connection successfully', async () => {
      const testService = new EmailService();
      const result = await testService.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValueOnce(new Error('Connection failed'));

      const testService = new EmailService();
      const result = await testService.verifyConnection();

      expect(result).toBe(false);
    });

    it('should return false when transporter is not initialized', async () => {
      // Create a mock transporter that throws on verify (simulating no transporter)
      mockTransporter.verify.mockImplementationOnce(() => {
        throw new Error('No transporter');
      });

      const testService = new EmailService();
      const result = await testService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('email templates', () => {
    it('should use HTML and text versions for all emails', async () => {
      const testService = new EmailService();

      // Test verification email
      await testService.sendEmailVerification('test@example.com', 'token');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      let sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();

      // Test password reset email
      await testService.sendPasswordReset('test@example.com', 'token');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      sendMailCall = mockTransporter.sendMail.mock.calls[1][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();

      // Test welcome email
      await testService.sendWelcomeEmail('test@example.com', 'Test User', 'client');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      sendMailCall = mockTransporter.sendMail.mock.calls[2][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();
    });

    it('should include proper branding in emails', async () => {
      const testService = new EmailService();
      await testService.sendEmailVerification('test@example.com', 'token');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.subject).toContain('EvoFit');
      expect(sendMailCall.html).toContain('EvoFit');
    });

    it('should include responsive HTML styling', async () => {
      const testService = new EmailService();
      await testService.sendEmailVerification('test@example.com', 'token');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('style=');
      expect(sendMailCall.html).toContain('max-width');
    });
  });
});
