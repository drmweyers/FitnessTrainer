/** @jest-environment node */

import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendClientInvitationEmail,
} from '@/lib/services/email';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('email service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Set env vars for most tests
    process.env.MAILGUN_API_KEY = 'test-api-key';
    process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
    process.env.EMAIL_FROM = 'EvoFit <noreply@test.com>';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    delete process.env.MAILGUN_API_KEY;
    delete process.env.MAILGUN_DOMAIN;
  });

  describe('sendPasswordResetEmail', () => {
    it('sends password reset email successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-1' }),
      });

      const result = await sendPasswordResetEmail('user@example.com', 'reset-token-123', 'John');
      expect(result.success).toBe(true);
      expect(result.id).toBe('msg-1');
    });

    it('includes reset URL in email body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-1' }),
      });

      await sendPasswordResetEmail('user@example.com', 'abc-token', 'John');
      const callBody = mockFetch.mock.calls[0][1].body.toString();
      expect(callBody).toContain('abc-token');
    });

    it('uses name in greeting when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-1' }),
      });

      await sendPasswordResetEmail('user@example.com', 'token', 'Alice');
      const callBody = mockFetch.mock.calls[0][1].body.toString();
      expect(callBody).toContain('Alice');
    });

    it('uses generic greeting when name not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-1' }),
      });

      await sendPasswordResetEmail('user@example.com', 'token');
      // Just verifying it doesn't throw and succeeds
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns error when Mailgun not configured', async () => {
      delete process.env.MAILGUN_API_KEY;
      const result = await sendPasswordResetEmail('user@example.com', 'token');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns error when Mailgun domain missing', async () => {
      delete process.env.MAILGUN_DOMAIN;
      const result = await sendPasswordResetEmail('user@example.com', 'token');
      expect(result.success).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns error on Mailgun API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const result = await sendPasswordResetEmail('user@example.com', 'token');
      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('handles fetch throwing an exception', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const result = await sendPasswordResetEmail('user@example.com', 'token');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send email');
    });

    it('sends to correct mailgun URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-1' }),
      });

      await sendPasswordResetEmail('user@example.com', 'token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/test.mailgun.org/messages',
        expect.any(Object)
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('sends welcome email successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-2' }),
      });

      const result = await sendWelcomeEmail('user@example.com', 'Jane');
      expect(result.success).toBe(true);
    });

    it('includes name in greeting when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-2' }),
      });

      await sendWelcomeEmail('user@example.com', 'Bob');
      const callBody = mockFetch.mock.calls[0][1].body.toString();
      expect(callBody).toContain('Bob');
    });

    it('uses generic greeting when name not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-2' }),
      });

      const result = await sendWelcomeEmail('user@example.com');
      expect(result.success).toBe(true);
    });

    it('returns error when not configured', async () => {
      delete process.env.MAILGUN_API_KEY;
      const result = await sendWelcomeEmail('user@example.com');
      expect(result.success).toBe(false);
    });

    it('handles network failure gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout'));
      const result = await sendWelcomeEmail('user@example.com', 'Bob');
      expect(result.success).toBe(false);
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends verification email successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-3' }),
      });

      const result = await sendVerificationEmail('user@example.com', 'verify-token', 'Carol');
      expect(result.success).toBe(true);
    });

    it('includes verification URL in email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-3' }),
      });

      await sendVerificationEmail('user@example.com', 'verify-abc');
      const callBody = mockFetch.mock.calls[0][1].body.toString();
      expect(callBody).toContain('verify-abc');
    });

    it('uses name when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-3' }),
      });

      await sendVerificationEmail('user@example.com', 'token', 'Dave');
      const callBody = mockFetch.mock.calls[0][1].body.toString();
      expect(callBody).toContain('Dave');
    });

    it('returns error when not configured', async () => {
      delete process.env.MAILGUN_DOMAIN;
      const result = await sendVerificationEmail('user@example.com', 'token');
      expect(result.success).toBe(false);
    });

    it('handles API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await sendVerificationEmail('user@example.com', 'token');
      expect(result.success).toBe(false);
    });
  });

  describe('sendClientInvitationEmail', () => {
    it('sends invitation email successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-4' }),
      });

      const result = await sendClientInvitationEmail(
        'client@example.com',
        'John Trainer',
        'http://app.example.com/invite/token123'
      );
      expect(result.success).toBe(true);
    });

    it('includes trainer name in subject', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-4' }),
      });

      await sendClientInvitationEmail(
        'client@example.com',
        'Jane Smith',
        'http://app.example.com/invite/abc'
      );

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyStr = callArgs.body.toString();
      expect(bodyStr).toContain('Jane+Smith'); // URL-encoded in form
    });

    it('includes custom message when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-4' }),
      });

      await sendClientInvitationEmail(
        'client@example.com',
        'Trainer',
        'http://link.com',
        'Looking forward to working with you!'
      );

      const callBody = mockFetch.mock.calls[0][1].body.toString();
      expect(callBody).toContain('Looking+forward');
    });

    it('works without custom message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'msg-4' }),
      });

      const result = await sendClientInvitationEmail(
        'client@example.com',
        'Trainer',
        'http://link.com'
      );
      expect(result.success).toBe(true);
    });

    it('returns error when not configured', async () => {
      delete process.env.MAILGUN_API_KEY;
      const result = await sendClientInvitationEmail(
        'client@example.com',
        'Trainer',
        'http://link.com'
      );
      expect(result.success).toBe(false);
    });

    it('handles fetch exception', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));
      const result = await sendClientInvitationEmail(
        'client@example.com',
        'Trainer',
        'http://link.com'
      );
      expect(result.success).toBe(false);
    });
  });
});
