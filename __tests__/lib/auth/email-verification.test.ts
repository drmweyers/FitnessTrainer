/**
 * Tests for lib/auth/email-verification.ts
 * createVerificationToken, consumeVerificationToken, sendVerificationEmail
 */

jest.mock('@/lib/db/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock node crypto so we get a predictable token
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('a'.repeat(32))),
}));

// Mock global fetch for Mailgun calls
global.fetch = jest.fn();

import { redis } from '@/lib/db/redis';
import {
  createVerificationToken,
  consumeVerificationToken,
  sendVerificationEmail,
} from '@/lib/auth/email-verification';

const mockedRedis = redis as jest.Mocked<typeof redis>;
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const FAKE_TOKEN = 'a'.repeat(64); // 32 bytes → 64 hex chars

describe('createVerificationToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores the userId in Redis with 24h TTL', async () => {
    mockedRedis.set.mockResolvedValue(undefined);

    const token = await createVerificationToken('user-123');

    expect(mockedRedis.set).toHaveBeenCalledWith(
      `email-verify:${token}`,
      'user-123',
      24 * 60 * 60
    );
  });

  it('returns a 64-character hex token', async () => {
    mockedRedis.set.mockResolvedValue(undefined);

    const token = await createVerificationToken('user-123');

    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });
});

describe('consumeVerificationToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when token not found in Redis', async () => {
    mockedRedis.get.mockResolvedValue(null);

    const result = await consumeVerificationToken('bad-token');

    expect(result).toBeNull();
    expect(mockedRedis.del).not.toHaveBeenCalled();
  });

  it('returns userId and deletes the token when found', async () => {
    mockedRedis.get.mockResolvedValue('user-456');
    mockedRedis.del.mockResolvedValue(undefined);

    const result = await consumeVerificationToken(FAKE_TOKEN);

    expect(result).toBe('user-456');
    expect(mockedRedis.del).toHaveBeenCalledWith(`email-verify:${FAKE_TOKEN}`);
  });

  it('deletes token immediately to enforce single-use', async () => {
    mockedRedis.get.mockResolvedValue('user-789');
    mockedRedis.del.mockResolvedValue(undefined);

    await consumeVerificationToken(FAKE_TOKEN);

    // del must be called exactly once
    expect(mockedRedis.del).toHaveBeenCalledTimes(1);
  });
});

describe('sendVerificationEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      MAILGUN_DOMAIN: 'mg.evofit.io',
      MAILGUN_API_KEY: 'key-test-12345',
      EMAIL_FROM: 'noreply@evofit.io',
      NEXT_PUBLIC_APP_URL: 'https://trainer.evofit.io',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('calls Mailgun API with correct URL and basic auth', async () => {
    mockedFetch.mockResolvedValue({ ok: true } as Response);

    await sendVerificationEmail('user@example.com', FAKE_TOKEN);

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://api.mailgun.net/v3/mg.evofit.io/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
    );
  });

  it('includes the verification URL in the request body', async () => {
    mockedFetch.mockResolvedValue({ ok: true } as Response);

    await sendVerificationEmail('user@example.com', FAKE_TOKEN);

    const callArgs = mockedFetch.mock.calls[0][1] as RequestInit;
    const body = callArgs.body as string;

    expect(body).toContain(encodeURIComponent(`/api/auth/verify-email?token=${FAKE_TOKEN}`));
    expect(body).toContain(encodeURIComponent('user@example.com'));
  });

  it('does not throw when Mailgun is not configured', async () => {
    delete process.env.MAILGUN_DOMAIN;
    delete process.env.MAILGUN_API_KEY;

    await expect(
      sendVerificationEmail('user@example.com', FAKE_TOKEN)
    ).resolves.not.toThrow();

    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('does not throw when Mailgun returns an error status', async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    await expect(
      sendVerificationEmail('user@example.com', FAKE_TOKEN)
    ).resolves.not.toThrow();
  });
});
