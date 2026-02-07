/**
 * Tests for lib/middleware/rate-limit.ts
 * rateLimit(), checkRateLimit(), checkUserRateLimit(), RateLimits
 */

import { NextResponse } from 'next/server';
import { rateLimit, checkRateLimit, checkUserRateLimit, RateLimits } from '@/lib/middleware/rate-limit';

// Mock redis
jest.mock('@/lib/db/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
}));

import { redis } from '@/lib/db/redis';
const mockedRedis = redis as jest.Mocked<typeof redis>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('rateLimit', () => {
  it('allows request when count is under limit', async () => {
    mockedRedis.get.mockResolvedValue('5');
    mockedRedis.incr.mockResolvedValue(6);

    const result = await rateLimit('test-ip', 100, 900);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(94);
    expect(result.limit).toBe(100);
  });

  it('allows first request and sets expiry', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const result = await rateLimit('new-ip', 100, 900);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
    expect(mockedRedis.expire).toHaveBeenCalledWith('rate_limit:new-ip', 900);
  });

  it('does not set expiry on subsequent requests', async () => {
    mockedRedis.get.mockResolvedValue('3');
    mockedRedis.incr.mockResolvedValue(4);

    await rateLimit('existing-ip', 100, 900);

    expect(mockedRedis.expire).not.toHaveBeenCalled();
  });

  it('denies request when limit exceeded', async () => {
    mockedRedis.get.mockResolvedValue('100');

    const result = await rateLimit('spammer', 100, 900);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('fails open when Redis errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedRedis.get.mockRejectedValue(new Error('Redis down'));

    const result = await rateLimit('error-ip', 100, 900);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(100);
    consoleSpy.mockRestore();
  });
});

describe('checkRateLimit', () => {
  it('returns null when under limit', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });

    const result = await checkRateLimit(request, { limit: 100, window: 900 });
    expect(result).toBeNull();
  });

  it('returns 429 when limit exceeded', async () => {
    mockedRedis.get.mockResolvedValue('100');

    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });

    const result = await checkRateLimit(request, { limit: 100, window: 900 });

    expect(result).toBeInstanceOf(NextResponse);
    expect(result!.status).toBe(429);
    const body = await result!.json();
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('uses custom identifier when provided', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const request = new Request('http://localhost:3000/api/test');

    await checkRateLimit(request, { limit: 100, window: 900, identifier: 'custom-id' });

    expect(mockedRedis.get).toHaveBeenCalledWith('rate_limit:custom-id');
  });

  it('uses x-forwarded-for header as identifier', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
    });

    await checkRateLimit(request, { limit: 100, window: 900 });

    expect(mockedRedis.get).toHaveBeenCalledWith('rate_limit:10.0.0.1');
  });

  it('uses x-real-ip header when x-forwarded-for is absent', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-real-ip': '192.168.1.1' },
    });

    await checkRateLimit(request, { limit: 100, window: 900 });

    expect(mockedRedis.get).toHaveBeenCalledWith('rate_limit:192.168.1.1');
  });

  it('falls back to "unknown" when no IP headers', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const request = new Request('http://localhost:3000/api/test');

    await checkRateLimit(request, { limit: 100, window: 900 });

    expect(mockedRedis.get).toHaveBeenCalledWith('rate_limit:unknown');
  });
});

describe('checkUserRateLimit', () => {
  it('returns null when under limit', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    const result = await checkUserRateLimit('user-1');
    expect(result).toBeNull();
  });

  it('returns 429 when limit exceeded', async () => {
    mockedRedis.get.mockResolvedValue('100');

    const result = await checkUserRateLimit('user-1');

    expect(result).toBeInstanceOf(NextResponse);
    expect(result!.status).toBe(429);
  });

  it('uses custom limit and window', async () => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);

    await checkUserRateLimit('user-1', 50, 600);

    expect(mockedRedis.get).toHaveBeenCalledWith('rate_limit:user:user-1');
  });
});

describe('RateLimits presets', () => {
  beforeEach(() => {
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.incr.mockResolvedValue(1);
  });

  it('general has limit 100 window 900', async () => {
    const request = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const result = await RateLimits.general(request);
    expect(result).toBeNull();
  });

  it('auth has limit 5 window 900', async () => {
    const request = new Request('http://localhost:3000/api/auth', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const result = await RateLimits.auth(request);
    expect(result).toBeNull();
  });

  it('strict has limit 3 window 3600', async () => {
    const request = new Request('http://localhost:3000/api/strict', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const result = await RateLimits.strict(request);
    expect(result).toBeNull();
  });

  it('loose has limit 1000 window 3600', async () => {
    const request = new Request('http://localhost:3000/api/loose', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const result = await RateLimits.loose(request);
    expect(result).toBeNull();
  });
});
