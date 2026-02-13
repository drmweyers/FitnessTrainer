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
import { GET } from '@/app/api/admin/dashboard/route';

const mockedPrisma = prisma as any;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/admin/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns dashboard metrics with correct structure', async () => {
    // Mock all $queryRaw calls in order
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(100) }])  // totalUsers
      .mockResolvedValueOnce([{ count: BigInt(10) }])   // totalTrainers
      .mockResolvedValueOnce([{ count: BigInt(80) }])   // totalClients
      .mockResolvedValueOnce([{ count: BigInt(5) }])    // totalAdmins
      .mockResolvedValueOnce([{ count: BigInt(3) }])    // newThisWeek
      .mockResolvedValueOnce([{ count: BigInt(12) }])   // newThisMonth
      .mockResolvedValueOnce([{ count: BigInt(8) }])    // newLastMonth
      .mockResolvedValueOnce([{ count: BigInt(50) }])   // activeUsers
      .mockResolvedValueOnce([{ count: BigInt(25) }])   // totalPrograms
      .mockResolvedValueOnce([{ count: BigInt(200) }])  // totalWorkouts
      .mockResolvedValueOnce([{ count: BigInt(40) }])   // totalConnections
      .mockResolvedValueOnce([                           // recentSignups
        {
          id: 'u1',
          email: 'user1@test.com',
          role: 'client',
          created_at: '2026-01-01T00:00:00Z',
          is_active: true,
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          id: 'u2',
          email: 'user2@test.com',
          role: 'trainer',
          created_at: '2026-01-02T00:00:00Z',
          is_active: true,
          first_name: null,
          last_name: null
        }
      ]);

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.metrics).toEqual({
      totalUsers: 100,
      totalTrainers: 10,
      totalClients: 80,
      totalAdmins: 5,
      newThisWeek: 3,
      newThisMonth: 12,
      newLastMonth: 8,
      activeUsers: 50,
      totalPrograms: 25,
      totalWorkouts: 200,
      totalConnections: 40,
    });
    expect(data.data.recentSignups).toHaveLength(2);
    expect(data.data.recentSignups[0]).toMatchObject({
      id: 'u1',
      name: 'John Doe',
      email: 'user1@test.com',
      role: 'client',
      isActive: true,
    });
  });

  it('returns recent signups with correct formatting', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(100) }])
      .mockResolvedValueOnce([{ count: BigInt(10) }])
      .mockResolvedValueOnce([{ count: BigInt(80) }])
      .mockResolvedValueOnce([{ count: BigInt(5) }])
      .mockResolvedValueOnce([{ count: BigInt(3) }])
      .mockResolvedValueOnce([{ count: BigInt(12) }])
      .mockResolvedValueOnce([{ count: BigInt(8) }])
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([{ count: BigInt(25) }])
      .mockResolvedValueOnce([{ count: BigInt(200) }])
      .mockResolvedValueOnce([{ count: BigInt(40) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'noname@test.com',
          role: 'client',
          created_at: '2026-01-01T00:00:00Z',
          is_active: true,
          first_name: null,
          last_name: null
        }
      ]);

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.recentSignups[0].name).toBe('noname');
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Admin access required');
  });

  it('handles database error gracefully', async () => {
    mockedPrisma.$queryRaw.mockRejectedValueOnce(new Error('Database connection failed'));

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch dashboard metrics');
  });

  it('converts BigInt counts to numbers correctly', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(999999) }])  // Large number
      .mockResolvedValueOnce([{ count: BigInt(0) }])       // Zero
      .mockResolvedValueOnce([{ count: BigInt(1) }])       // One
      .mockResolvedValueOnce([{ count: BigInt(5) }])
      .mockResolvedValueOnce([{ count: BigInt(3) }])
      .mockResolvedValueOnce([{ count: BigInt(12) }])
      .mockResolvedValueOnce([{ count: BigInt(8) }])
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([{ count: BigInt(25) }])
      .mockResolvedValueOnce([{ count: BigInt(200) }])
      .mockResolvedValueOnce([{ count: BigInt(40) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(typeof data.data.metrics.totalUsers).toBe('number');
    expect(data.data.metrics.totalUsers).toBe(999999);
    expect(data.data.metrics.totalTrainers).toBe(0);
    expect(data.data.metrics.totalClients).toBe(1);
  });

  it('returns empty array when no recent signups', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(100) }])
      .mockResolvedValueOnce([{ count: BigInt(10) }])
      .mockResolvedValueOnce([{ count: BigInt(80) }])
      .mockResolvedValueOnce([{ count: BigInt(5) }])
      .mockResolvedValueOnce([{ count: BigInt(3) }])
      .mockResolvedValueOnce([{ count: BigInt(12) }])
      .mockResolvedValueOnce([{ count: BigInt(8) }])
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([{ count: BigInt(25) }])
      .mockResolvedValueOnce([{ count: BigInt(200) }])
      .mockResolvedValueOnce([{ count: BigInt(40) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.recentSignups).toEqual([]);
  });

  it('handles partial name data in recent signups', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(100) }])
      .mockResolvedValueOnce([{ count: BigInt(10) }])
      .mockResolvedValueOnce([{ count: BigInt(80) }])
      .mockResolvedValueOnce([{ count: BigInt(5) }])
      .mockResolvedValueOnce([{ count: BigInt(3) }])
      .mockResolvedValueOnce([{ count: BigInt(12) }])
      .mockResolvedValueOnce([{ count: BigInt(8) }])
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([{ count: BigInt(25) }])
      .mockResolvedValueOnce([{ count: BigInt(200) }])
      .mockResolvedValueOnce([{ count: BigInt(40) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'onlyfirst@test.com',
          role: 'client',
          created_at: '2026-01-01T00:00:00Z',
          is_active: true,
          first_name: 'John',
          last_name: null
        },
        {
          id: 'u2',
          email: 'onlylast@test.com',
          role: 'trainer',
          created_at: '2026-01-02T00:00:00Z',
          is_active: true,
          first_name: null,
          last_name: 'Doe'
        }
      ]);

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.recentSignups[0].name).toBe('John');
    expect(data.data.recentSignups[1].name).toBe('Doe');
  });

  it('includes all required metric fields', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(100) }])
      .mockResolvedValueOnce([{ count: BigInt(10) }])
      .mockResolvedValueOnce([{ count: BigInt(80) }])
      .mockResolvedValueOnce([{ count: BigInt(5) }])
      .mockResolvedValueOnce([{ count: BigInt(3) }])
      .mockResolvedValueOnce([{ count: BigInt(12) }])
      .mockResolvedValueOnce([{ count: BigInt(8) }])
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([{ count: BigInt(25) }])
      .mockResolvedValueOnce([{ count: BigInt(200) }])
      .mockResolvedValueOnce([{ count: BigInt(40) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/dashboard');
    const response = await GET(request);
    const data = await response.json();

    const expectedFields = [
      'totalUsers', 'totalTrainers', 'totalClients', 'totalAdmins',
      'newThisWeek', 'newThisMonth', 'newLastMonth', 'activeUsers',
      'totalPrograms', 'totalWorkouts', 'totalConnections'
    ];

    expectedFields.forEach(field => {
      expect(data.data.metrics).toHaveProperty(field);
      expect(typeof data.data.metrics[field]).toBe('number');
    });
  });
});
