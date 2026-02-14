import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
} from '@/lib/services/email';

const mockSend = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

describe('Email Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    mockSend.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        'John Doe'
      );

      expect(result).toEqual({
        success: true,
        id: 'email-123',
      });
    });

    it('should send password reset email without name', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-456'
      );

      expect(result).toEqual({
        success: true,
        id: 'email-456',
      });
    });

    it('should handle Resend API error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-789'
      );

      expect(result).toEqual({
        success: false,
        error: 'API rate limit exceeded',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle exception during send', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-error'
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to send email',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully with name', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'welcome-123' },
        error: null,
      });

      const result = await sendWelcomeEmail('newuser@example.com', 'Jane Smith');

      expect(result).toEqual({
        success: true,
        id: 'welcome-123',
      });
    });

    it('should send welcome email without name', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'welcome-456' },
        error: null,
      });

      const result = await sendWelcomeEmail('newuser@example.com');

      expect(result).toEqual({
        success: true,
        id: 'welcome-456',
      });
    });

    it('should handle error when sending welcome email', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid recipient' },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendWelcomeEmail('invalid@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Invalid recipient',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle exception during send', async () => {
      mockSend.mockRejectedValue(new Error('Timeout'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendWelcomeEmail('user@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Failed to send email',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully with name', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'verify-123' },
        error: null,
      });

      const result = await sendVerificationEmail(
        'verify@example.com',
        'verify-token-123',
        'Alice'
      );

      expect(result).toEqual({
        success: true,
        id: 'verify-123',
      });
    });

    it('should send verification email without name', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'verify-456' },
        error: null,
      });

      const result = await sendVerificationEmail(
        'verify@example.com',
        'verify-token-456'
      );

      expect(result).toEqual({
        success: true,
        id: 'verify-456',
      });
    });

    it('should handle error when sending verification email', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized' },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendVerificationEmail(
        'verify@example.com',
        'verify-token-789'
      );

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle exception during send', async () => {
      mockSend.mockRejectedValue(new Error('Service unavailable'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendVerificationEmail('user@example.com', 'token');

      expect(result).toEqual({
        success: false,
        error: 'Failed to send email',
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
