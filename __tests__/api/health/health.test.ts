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
  },
}));

import { GET, OPTIONS } from '@/app/api/health/route';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

const mockedPrisma = prisma as any;
const mockedRedis = redis as jest.Mocked<typeof redis>;

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns healthy when all services are up', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.set.mockResolvedValue(undefined);
    mockedRedis.get.mockResolvedValue('ok');
    mockedRedis.del.mockResolvedValue(undefined);

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
    mockedPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    mockedRedis.set.mockResolvedValue(undefined);
    mockedRedis.get.mockResolvedValue('ok');
    mockedRedis.del.mockResolvedValue(undefined);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.services.database.status).toBe('unhealthy');
    expect(body.services.database.error).toBe('Connection refused');
  });

  it('returns degraded when cache is down', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.set.mockRejectedValue(new Error('Redis connection failed'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200); // degraded is still 200
    expect(body.status).toBe('degraded');
    expect(body.services.cache.status).toBe('unhealthy');
    expect(body.services.cache.error).toBe('Redis connection failed');
  });

  it('returns degraded when cache read/write fails', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.set.mockResolvedValue(undefined);
    mockedRedis.get.mockResolvedValue('wrong_value'); // Not 'ok'
    mockedRedis.del.mockResolvedValue(undefined);

    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe('degraded');
    expect(body.services.cache.status).toBe('unhealthy');
    expect(body.services.cache.error).toBe('Cache read/write failed');
  });

  it('includes environment info', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.set.mockResolvedValue(undefined);
    mockedRedis.get.mockResolvedValue('ok');
    mockedRedis.del.mockResolvedValue(undefined);

    const response = await GET();
    const body = await response.json();

    expect(body.environment).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(body.version).toBeDefined();
  });

  it('includes database latency', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
    mockedRedis.set.mockResolvedValue(undefined);
    mockedRedis.get.mockResolvedValue('ok');
    mockedRedis.del.mockResolvedValue(undefined);

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
