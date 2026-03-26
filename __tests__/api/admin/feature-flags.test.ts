import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/admin', () => ({
  authenticateAdmin: jest.fn().mockImplementation((req: any) => {
    return Promise.resolve(Object.assign(req, {
      user: { id: 'admin-1', role: 'admin', email: 'admin@test.com' }
    }));
  }),
}));

jest.mock('@/lib/middleware/auth', () => ({
  AuthenticatedRequest: {},
}));

// Mock the dynamic import of @upstash/redis
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: mockRedisGet,
    set: mockRedisSet,
  })),
}));

import { authenticateAdmin } from '@/lib/middleware/admin';
import { GET, PUT } from '@/app/api/admin/feature-flags/route';

function makeGetRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/feature-flags');
}

function makePutRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/feature-flags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Feature Flags API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/admin/feature-flags', () => {
    it('returns default flags when Redis has no stored flags', async () => {
      mockRedisGet.mockResolvedValue(null);

      const response = await GET(makeGetRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.source).toBe('default');
      expect(data.data.flags).toHaveLength(2);
      expect(data.data.flags[0].id).toBe('whatsapp_messaging');
    });

    it('returns stored flags from Redis', async () => {
      const storedFlags = [
        { id: 'custom_flag', name: 'Custom', description: 'Test', enabled: true },
      ];
      mockRedisGet.mockResolvedValue(storedFlags);

      const response = await GET(makeGetRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.source).toBe('redis');
      expect(data.data.flags).toEqual(storedFlags);
    });

    it('returns default flags when Redis is unavailable (no env vars)', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const response = await GET(makeGetRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.source).toBe('default');
      expect(data.data.flags).toHaveLength(2);
    });

    it('returns 403 for non-admin user', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
        NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
      );

      const response = await GET(makeGetRequest());
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/feature-flags', () => {
    it('saves flags to Redis', async () => {
      mockRedisSet.mockResolvedValue('OK');
      const flags = [
        { id: 'test_flag', name: 'Test', description: 'Desc', enabled: true },
      ];

      const response = await PUT(makePutRequest({ flags }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.flags).toEqual(flags);
      expect(mockRedisSet).toHaveBeenCalledWith('evofit:feature-flags', flags);
    });

    it('returns 400 for invalid flags payload', async () => {
      const response = await PUT(makePutRequest({ flags: 'not-an-array' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('flags must be an array');
    });

    it('returns 503 when Redis is unavailable', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const flags = [{ id: 'test', name: 'Test', description: 'Desc', enabled: true }];
      const response = await PUT(makePutRequest({ flags }));
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
    });

    it('returns 403 for non-admin user', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
        NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
      );

      const response = await PUT(makePutRequest({ flags: [] }));
      expect(response.status).toBe(403);
    });
  });
});
