import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendClientInvitationEmail,
} from '@/lib/services/email';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Email Service (Mailgun)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.MAILGUN_API_KEY = 'test-mailgun-key';
    process.env.MAILGUN_DOMAIN = 'mg.evofit.io';
    process.env.EMAIL_FROM = 'EvoFit <noreply@evofit.io>';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<msg-123@mg.evofit.io>' }),
      });

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-123',
        'John Doe'
      );

      expect(result).toEqual({
        success: true,
        id: '<msg-123@mg.evofit.io>',
      });

      // Verify fetch was called with correct Mailgun URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/mg.evofit.io/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );
    });

    it('should send password reset email without name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<msg-456@mg.evofit.io>' }),
      });

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-456'
      );

      expect(result).toEqual({
        success: true,
        id: '<msg-456@mg.evofit.io>',
      });
    });

    it('should handle Mailgun API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'reset-token-789'
      );

      expect(result).toEqual({
        success: false,
        error: 'Mailgun error: 401',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle exception during send', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<welcome-123@mg.evofit.io>' }),
      });

      const result = await sendWelcomeEmail('newuser@example.com', 'Jane Smith');

      expect(result).toEqual({
        success: true,
        id: '<welcome-123@mg.evofit.io>',
      });
    });

    it('should send welcome email without name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<welcome-456@mg.evofit.io>' }),
      });

      const result = await sendWelcomeEmail('newuser@example.com');

      expect(result).toEqual({
        success: true,
        id: '<welcome-456@mg.evofit.io>',
      });
    });

    it('should handle error when sending welcome email', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendWelcomeEmail('invalid@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Mailgun error: 400',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle exception during send', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout'));

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
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<verify-123@mg.evofit.io>' }),
      });

      const result = await sendVerificationEmail(
        'verify@example.com',
        'verify-token-123',
        'Alice'
      );

      expect(result).toEqual({
        success: true,
        id: '<verify-123@mg.evofit.io>',
      });
    });

    it('should send verification email without name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<verify-456@mg.evofit.io>' }),
      });

      const result = await sendVerificationEmail(
        'verify@example.com',
        'verify-token-456'
      );

      expect(result).toEqual({
        success: true,
        id: '<verify-456@mg.evofit.io>',
      });
    });

    it('should handle error when sending verification email', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendVerificationEmail(
        'verify@example.com',
        'verify-token-789'
      );

      expect(result).toEqual({
        success: false,
        error: 'Mailgun error: 403',
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle exception during send', async () => {
      mockFetch.mockRejectedValue(new Error('Service unavailable'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendVerificationEmail('user@example.com', 'token');

      expect(result).toEqual({
        success: false,
        error: 'Failed to send email',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendClientInvitationEmail', () => {
    it('should send invitation email with custom message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<invite-123@mg.evofit.io>' }),
      });

      const result = await sendClientInvitationEmail(
        'newclient@example.com',
        'Coach Sarah',
        'http://localhost:3000/invite/abc-123',
        "Let's start your fitness journey!"
      );

      expect(result).toEqual({
        success: true,
        id: '<invite-123@mg.evofit.io>',
      });

      // Verify the body includes the trainer name in the subject
      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as URLSearchParams;
      expect(body.get('subject')).toBe('Coach Sarah invited you to join EvoFit!');
      expect(body.get('to')).toBe('newclient@example.com');
    });

    it('should send invitation email without custom message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: '<invite-456@mg.evofit.io>' }),
      });

      const result = await sendClientInvitationEmail(
        'client@example.com',
        'Coach Mike',
        'http://localhost:3000/invite/def-456'
      );

      expect(result).toEqual({
        success: true,
        id: '<invite-456@mg.evofit.io>',
      });
    });

    it('should handle error when sending invitation email', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendClientInvitationEmail(
        'client@example.com',
        'Coach',
        'http://localhost:3000/invite/xyz'
      );

      expect(result).toEqual({
        success: false,
        error: 'Mailgun error: 500',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('missing configuration', () => {
    it('should return error when MAILGUN_API_KEY is missing', async () => {
      delete process.env.MAILGUN_API_KEY;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'token'
      );

      expect(result).toEqual({
        success: false,
        error: 'Email service not configured',
      });

      expect(mockFetch).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return error when MAILGUN_DOMAIN is missing', async () => {
      delete process.env.MAILGUN_DOMAIN;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await sendWelcomeEmail('user@example.com');

      expect(result).toEqual({
        success: false,
        error: 'Email service not configured',
      });

      expect(mockFetch).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
