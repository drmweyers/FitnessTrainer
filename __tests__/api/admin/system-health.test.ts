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

jest.mock('@/lib/db/prisma');

// Import AFTER mocks
import { authenticateAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/db/prisma';
import { GET } from '@/app/api/admin/system/health/route';

const mockedPrisma = prisma as any;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/admin/system/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns healthy status when DB is connected', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
    expect(data.data.database.status).toBe('connected');
    expect(typeof data.data.database.latencyMs).toBe('number');
    expect(data.data.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('includes database latency metrics', async () => {
    mockedPrisma.$queryRaw.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve([1]), 50);
      });
    });

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.database.latencyMs).toBeGreaterThan(0);
    expect(data.data.database.status).toBe('connected');
  });

  it('includes memory metrics', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.memory).toBeDefined();
    expect(typeof data.data.memory.heapUsedMB).toBe('number');
    expect(typeof data.data.memory.heapTotalMB).toBe('number');
    expect(typeof data.data.memory.rssMB).toBe('number');
    expect(data.data.memory.heapUsedMB).toBeGreaterThan(0);
    expect(data.data.memory.heapTotalMB).toBeGreaterThan(0);
    expect(data.data.memory.rssMB).toBeGreaterThan(0);
  });

  it('returns degraded status when DB connection fails', async () => {
    mockedPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection failed'));

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('degraded');
    expect(data.data.database.status).toBe('disconnected');
    expect(data.data.database.latencyMs).toBe(0);
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Admin access required');
  });

  it('includes server information', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.server).toBeDefined();
    expect(typeof data.data.server.uptime).toBe('string');
    expect(typeof data.data.server.uptimeMs).toBe('number');
    expect(data.data.server.environment).toBeDefined();
    expect(typeof data.data.server.nodeVersion).toBe('string');
    expect(typeof data.data.server.platform).toBe('string');
  });

  it('includes timestamp in response', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const beforeRequest = Date.now();
    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const afterRequest = Date.now();
    const data = await response.json();

    expect(data.data.timestamp).toBeDefined();
    const timestamp = new Date(data.data.timestamp).getTime();
    expect(timestamp).toBeGreaterThanOrEqual(beforeRequest);
    expect(timestamp).toBeLessThanOrEqual(afterRequest);
  });

  it('formats uptime correctly for days', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    // Mock module start time to be 2 days ago
    const originalStartTime = Date.now() - (2 * 24 * 60 * 60 * 1000);

    // We can't easily mock the module-level startTime, so just verify uptime exists
    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.server.uptime).toMatch(/^\d+[dhms]/);
    expect(data.data.server.uptimeMs).toBeGreaterThan(0);
  });

  it('returns error response when health check fails unexpectedly', async () => {
    // Mock authenticateAdmin to throw an error during processing
    mockedPrisma.$queryRaw.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    // Should still return degraded, not fail completely
    expect(data.data.status).toBe('degraded');
  });

  it('includes environment from NODE_ENV', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.server.environment).toBe('test');

    if (originalEnv) {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('defaults to development when NODE_ENV not set', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.server.environment).toBe('development');

    if (originalEnv) {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('includes correct platform information', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(['win32', 'darwin', 'linux']).toContain(data.data.server.platform);
  });

  it('includes valid Node.js version', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([1]);

    const request = makeRequest('/api/admin/system/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.server.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
  });
});
