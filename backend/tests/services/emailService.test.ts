import { emailService } from '../../src/services/emailService';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService', () => {
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
    
    // Set up test environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'testpass';
    process.env.FROM_EMAIL = 'noreply@evofit.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  describe('sendEmailVerification', () => {
    it('should send verification email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      });

      const result = await emailService.sendEmailVerification('test@example.com', 'verification-token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'test@example.com',
        subject: 'Verify your EvoFit account',
        text: expect.stringContaining('Welcome to EvoFit!'),
        html: expect.stringContaining('verification-token'),
      });

      expect(result).toEqual({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      });
    });

    it('should include verification link in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendEmailVerification('test@example.com', 'test-token-123');

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('http://localhost:3000/auth/verify?token=test-token-123');
      expect(sendMailCall.text).toContain('http://localhost:3000/auth/verify?token=test-token-123');
    });

    it('should handle SMTP errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));

      await expect(
        emailService.sendEmailVerification('test@example.com', 'verification-token')
      ).rejects.toThrow('SMTP connection failed');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      });

      const result = await emailService.sendPasswordReset('test@example.com', 'reset-token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'test@example.com',
        subject: 'Reset your EvoFit password',
        text: expect.stringContaining('password reset'),
        html: expect.stringContaining('reset-token'),
      });

      expect(result).toEqual({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      });
    });

    it('should include reset link in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendPasswordReset('test@example.com', 'reset-token-456');

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('http://localhost:3000/auth/reset-password?token=reset-token-456');
      expect(sendMailCall.text).toContain('http://localhost:3000/auth/reset-password?token=reset-token-456');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      });

      const result = await emailService.sendWelcomeEmail('test@example.com', 'John Doe', 'client');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@evofit.com',
        to: 'test@example.com',
        subject: 'Welcome to EvoFit!',
        text: expect.stringContaining('John Doe'),
        html: expect.stringContaining('John Doe'),
      });

      expect(result).toEqual({
        messageId: 'test-message-id',
        response: '250 Message accepted',
      });
    });

    it('should personalize welcome email with user name', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendWelcomeEmail('trainer@example.com', 'Jane Smith', 'trainer');

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('Jane Smith');
      expect(sendMailCall.text).toContain('Jane Smith');
      expect(sendMailCall.html).toContain('Welcome to EvoFit');
    });
  });

  describe('verifyConnection', () => {
    it('should verify SMTP connection successfully', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await expect(emailService.verifyConnection()).rejects.toThrow('Connection failed');
    });
  });

  describe('transporter configuration', () => {
    it('should create transporter with correct SMTP settings', () => {
      // Trigger transporter creation by calling a method
      emailService.sendEmailVerification('test@example.com', 'token');

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

    it('should handle missing SMTP configuration', () => {
      // Clear environment variables
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;

      // Create a new instance to test missing config
      expect(() => {
        // This should trigger transporter creation with missing config
        const { emailService: newEmailService } = require('../../src/services/emailService');
      }).not.toThrow(); // Service should handle missing config gracefully
    });

    it('should use secure connection for port 465', () => {
      process.env.SMTP_PORT = '465';
      
      // Re-require the module to pick up new env vars
      jest.resetModules();
      const { emailService: newEmailService } = require('../../src/services/emailService');
      
      newEmailService.sendEmailVerification('test@example.com', 'token');

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@example.com',
          pass: 'testpass',
        },
      });
    });
  });

  describe('email templates', () => {
    it('should use HTML and text versions for all emails', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      // Test verification email
      await emailService.sendEmailVerification('test@example.com', 'token');
      let sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();
      expect(sendMailCall.html).not.toBe(sendMailCall.text);

      // Test password reset email
      await emailService.sendPasswordReset('test@example.com', 'token');
      sendMailCall = mockTransporter.sendMail.mock.calls[1][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();
      expect(sendMailCall.html).not.toBe(sendMailCall.text);

      // Test welcome email
      await emailService.sendWelcomeEmail('test@example.com', 'Test User', 'client');
      sendMailCall = mockTransporter.sendMail.mock.calls[2][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();
      expect(sendMailCall.html).not.toBe(sendMailCall.text);
    });

    it('should include proper branding in emails', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await emailService.sendEmailVerification('test@example.com', 'token');

      const sendMailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(sendMailCall.subject).toContain('EvoFit');
      expect(sendMailCall.html).toContain('EvoFit');
      expect(sendMailCall.text).toContain('EvoFit');
    });
  });
});