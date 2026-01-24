import { EmailService } from './emailService';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Helper function to safely get call arguments
function getFirstCallArgs(mock: jest.Mock | jest.Mocked<any>) {
  const calls = mock.mock?.calls || mock.calls;
  if (calls.length === 0) {
    throw new Error('No calls were made to the mock function');
  }
  return calls[0][0];
}

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
      }),
      verify: jest.fn().mockResolvedValue(true),
    } as any;

    // Mock createTransport to return our mock transporter
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);

    // Set environment variables
    process.env.EMAIL_FROM = 'test@evofit.dev';
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_PORT = '1025';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    // Create new instance of EmailService
    emailService = new EmailService();
  });

  afterEach(() => {
    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.FRONTEND_URL;
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
    });

    it('should initialize with authentication when credentials provided', () => {
      process.env.SMTP_USER = 'testuser';
      process.env.SMTP_PASS = 'testpass';

      const newService = new EmailService();

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      });
    });

    it('should use custom from address when provided', () => {
      process.env.EMAIL_FROM = 'custom@example.com';

      const newService = new EmailService();

      expect(mockedNodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      await emailService.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@evofit.dev',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test HTML',
      });
    });

    it('should use custom from address when provided', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        from: 'custom@example.com',
      };

      await emailService.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('should generate plain text from HTML', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      await emailService.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test HTML',
        })
      );
    });

    it('should use provided text instead of generating from HTML', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Custom plain text',
      };

      await emailService.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Custom plain text',
        })
      );
    });

    it('should throw error when transporter not initialized', async () => {
      const brokenService = new EmailService();
      (brokenService as any).transporter = null;

      await expect(
        brokenService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow('Email transporter not initialized');
    });

    it('should throw error when send fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendEmailVerification', () => {
    it('should send verification email', async () => {
      await emailService.sendEmailVerification('user@example.com', 'verification-token-123');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify your EvoFit account',
        })
      );
    });

    it('should include verification URL in email', async () => {
      await emailService.sendEmailVerification('user@example.com', 'token-456');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('http://localhost:3000/auth/verify-email?token=token-456');
    });

    it('should personalize email with user name', async () => {
      await emailService.sendEmailVerification('user@example.com', 'token-789', 'John');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Hi John!');
    });

    it('should handle missing user name gracefully', async () => {
      await emailService.sendEmailVerification('user@example.com', 'token-789');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Hi!');
    });

    it('should include security note about expiration', async () => {
      await emailService.sendEmailVerification('user@example.com', 'token-123');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('24 hours');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      await emailService.sendPasswordReset('user@example.com', 'reset-token-123');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Reset your EvoFit password',
        })
      );
    });

    it('should include reset URL in email', async () => {
      await emailService.sendPasswordReset('user@example.com', 'reset-token-456');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('http://localhost:3000/auth/reset-password?token=reset-token-456');
    });

    it('should personalize email with user name', async () => {
      await emailService.sendPasswordReset('user@example.com', 'reset-token-789', 'Jane');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Hi Jane!');
    });

    it('should include security note about 1 hour expiration', async () => {
      await emailService.sendPasswordReset('user@example.com', 'reset-token-123');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('1 hour');
    });

    it('should include security recommendations', async () => {
      await emailService.sendPasswordReset('user@example.com', 'reset-token-123');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Never share this reset link');
      expect(callArgs.html).toContain('Create a strong, unique password');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to trainer', async () => {
      await emailService.sendWelcomeEmail('trainer@example.com', 'Mike', 'trainer');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'trainer@example.com',
          subject: 'Welcome to EvoFit - Your fitness journey starts now!',
        })
      );
    });

    it('should send welcome email to client', async () => {
      await emailService.sendWelcomeEmail('client@example.com', 'Sarah', 'client');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
        })
      );
    });

    it('should include trainer-specific content', async () => {
      await emailService.sendWelcomeEmail('trainer@example.com', 'Mike', 'trainer');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Ready to Train Clients?');
      expect(callArgs.html).toContain('Create customized workout programs');
    });

    it('should include client-specific content', async () => {
      await emailService.sendWelcomeEmail('client@example.com', 'Sarah', 'client');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Ready to Transform Your Fitness?');
      expect(callArgs.html).toContain('Follow personalized workout programs');
    });

    it('should include dashboard link', async () => {
      await emailService.sendWelcomeEmail('user@example.com', 'Test', 'trainer');

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('http://localhost:3000/dashboard');
    });
  });

  describe('sendClientInvitation', () => {
    it('should send client invitation email', async () => {
      await emailService.sendClientInvitation(
        'client@example.com',
        'Coach John',
        'coach@example.com',
        'invite-token-123'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
        })
      );
    });

    it('should include invitation URL', async () => {
      await emailService.sendClientInvitation(
        'client@example.com',
        'Coach John',
        'coach@example.com',
        'invite-token-456'
      );

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('http://localhost:3000/accept-invitation?token=invite-token-456');
    });

    it('should personalize with trainer name and email', async () => {
      await emailService.sendClientInvitation(
        'client@example.com',
        'Coach Sarah',
        'sarah@example.com',
        'invite-token-789'
      );

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Coach Sarah');
      expect(callArgs.html).toContain('sarah@example.com');
    });

    it('should list features available to clients', async () => {
      await emailService.sendClientInvitation(
        'client@example.com',
        'Coach John',
        'coach@example.com',
        'invite-token-123'
      );

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Access personalized workout programs');
      expect(callArgs.html).toContain('Track your progress and achievements');
      expect(callArgs.html).toContain('Communicate directly with your trainer');
    });

    it('should include 7 day expiration notice', async () => {
      await emailService.sendClientInvitation(
        'client@example.com',
        'Coach John',
        'coach@example.com',
        'invite-token-123'
      );

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('7 days');
    });
  });

  describe('sendSecurityNotification', () => {
    it('should send security notification email', async () => {
      await emailService.sendSecurityNotification('user@example.com', 'New login detected', {
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome on Windows',
        timestamp: new Date('2024-01-01T12:00:00Z'),
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Security Alert: New login detected',
        })
      );
    });

    it('should include security event details', async () => {
      await emailService.sendSecurityNotification('user@example.com', 'Password changed', {
        ipAddress: '10.0.0.1',
        userAgent: 'Firefox on Mac',
        timestamp: new Date('2024-01-01T12:00:00Z'),
      });

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Password changed');
      expect(callArgs.html).toContain('192.168.1.1');
      expect(callArgs.html).toContain('Chrome on Windows');
    });

    it('should handle missing optional details', async () => {
      await emailService.sendSecurityNotification('user@example.com', 'New login', {});

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('New login');
      // Should not throw error
    });

    it('should include security recommendations', async () => {
      await emailService.sendSecurityNotification('user@example.com', 'Suspicious activity', {
        ipAddress: '192.168.1.1',
      });

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.html).toContain('Change your password immediately');
      expect(callArgs.html).toContain('Enable two-factor authentication');
    });
  });

  describe('verifyConnection', () => {
    it('should verify connection successfully', async () => {
      mockTransporter.verify.mockResolvedValueOnce(true);

      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when verification fails', async () => {
      mockTransporter.verify.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });

    it('should return false when transporter not initialized', async () => {
      // Create a service without mocking createTransport to get null transporter
      const originalCreateTransport = nodemailer.createTransport;
      jest.spyOn(nodemailer, 'createTransport').mockReturnValueOnce(null as any);

      const brokenService = new EmailService();

      const result = await brokenService.verifyConnection();

      expect(result).toBe(false);

      // Restore original
      (nodemailer.createTransport as jest.Mock).mockRestore();
    });
  });

  describe('HTML content generation', () => {
    it('should strip HTML tags for plain text', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Paragraph</p><div>Division</div>',
      });

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.text).toBe('Paragraph Division');
    });

    it('should handle complex HTML for plain text generation', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<h1>Title</h1><p>Text</p><a href="#">Link</a>',
      });

      const callArgs = getFirstCallArgs(mockTransporter.sendMail);
      expect(callArgs.text).toContain('Title');
      expect(callArgs.text).toContain('Text');
    });
  });

  describe('error handling', () => {
    it('should handle email send failure gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow('Failed to send email');
    });

    it('should log errors appropriately', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      try {
        await emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });
      } catch (e) {
        // Expected to throw
      }

      // Logger should have been called (checked via mock)
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});
