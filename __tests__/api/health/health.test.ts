/**
 * Tests for app/api/health/route.ts
 * GET /api/health, OPTIONS /api/health
 */

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/db/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    ping: jest.fn(),
  },
}));
jest.mock('@/lib/utils/env-check', () => ({
  getEnvironmentSummary: jest.fn(() => ({
    required: { DATABASE_URL: true, JWT_SECRET: true },
    optional: {},
    infrastructure: { UPSTASH_REDIS_REST_URL: true },
  })),
}));

import { GET, OPTIONS } from '@/app/api/health/route';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

const mockedPrisma = prisma as any;
const mockedRedis = redis as jest.Mocked<typeof redis>;

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns healthy when all services are up', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.ping.mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database.status).toBe('healthy');
    expect(body.services.cache.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
    expect(body.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('returns unhealthy when database is down', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    mockedPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    mockedRedis.ping.mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.services.database.status).toBe('unhealthy');
    expect(body.services.database.error).toBe('Connection refused');
  });

  it('returns degraded when cache ping fails', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.ping.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200); // degraded is still 200
    expect(body.status).toBe('degraded');
    expect(body.services.cache.status).toBe('unhealthy');
    expect(body.services.cache.error).toBe('Redis configured but connection failed');
  });

  it('returns cache disabled when Redis not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.REDIS_URL;
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.cache.status).toBe('disabled');
    expect(body.services.cache.configured).toBe(false);
  });

  it('includes environment info and config summary', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.ping.mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(body.environment).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.version).toBeDefined();
    expect(body.config).toBeDefined();
    expect(body.config.required).toBeDefined();
  });

  it('includes database latency', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.ping.mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(body.services.database.latency).toBeGreaterThanOrEqual(0);
  });
});

describe('OPTIONS /api/health', () => {
  it('returns 204 with CORS headers', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, Authorization'
    );
    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});
