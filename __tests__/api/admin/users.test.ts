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
import { GET } from '@/app/api/admin/users/route';

const mockedPrisma = prisma as any;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated user list with default params', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(50) }])  // count query
      .mockResolvedValueOnce([                          // users query
        {
          id: 'u1',
          email: 'user@test.com',
          role: 'client',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: 'Test',
          last_name: 'User',
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users).toHaveLength(1);
    expect(data.data.users[0]).toMatchObject({
      id: 'u1',
      email: 'user@test.com',
      name: 'Test User',
      role: 'client',
      isActive: true,
      isVerified: true,
    });
    expect(data.data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    });
  });

  it('search filter works', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(2) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'john@test.com',
          role: 'client',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: 'John',
          last_name: 'Doe',
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users?search=john');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify search parameter was used in query
    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    expect(calls[0][1]).toBe('%john%'); // Search param passed to count query
    expect(calls[1][1]).toBe('%john%'); // Search param passed to users query
  });

  it('role filter works for trainer', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(5) }])
      .mockResolvedValueOnce([
        {
          id: 't1',
          email: 'trainer@test.com',
          role: 'trainer',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: 'Coach',
          last_name: 'Smith',
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users?role=trainer');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify role parameter was used
    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    expect(calls[0][1]).toBe('trainer');
    expect(calls[1][1]).toBe('trainer');
  });

  it('role filter works for client', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(10) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?role=client');
    const response = await GET(request);

    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    expect(calls[0][1]).toBe('client');
  });

  it('role filter works for admin', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(2) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?role=admin');
    const response = await GET(request);

    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    expect(calls[0][1]).toBe('admin');
  });

  it('status filter works for active users', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(40) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'active@test.com',
          role: 'client',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: '2026-02-01T00:00:00Z',
          first_name: 'Active',
          last_name: 'User',
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users?status=active');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.users[0].isActive).toBe(true);
  });

  it('status filter works for inactive users', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(10) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'inactive@test.com',
          role: 'client',
          is_active: false,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: 'Inactive',
          last_name: 'User',
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users?status=inactive');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.users[0].isActive).toBe(false);
  });

  it('pagination params work (page 2, limit 10)', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(100) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?page=2&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 100,
      totalPages: 10,
    });

    // Verify LIMIT and OFFSET in query
    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    expect(calls[1][1]).toBe(10);  // limit
    expect(calls[1][2]).toBe(10);  // offset (page 2, limit 10 = offset 10)
  });

  it('enforces maximum limit of 100', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(200) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?limit=500');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination.limit).toBe(100);
  });

  it('enforces minimum limit of 1', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?limit=0');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination.limit).toBe(1);
  });

  it('enforces minimum page of 1', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?page=0');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination.page).toBe(1);
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest('/api/admin/users');
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Admin access required');
  });

  it('handles DB error gracefully', async () => {
    mockedPrisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('Database error'));

    const request = makeRequest('/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch users');
  });

  it('handles users without names correctly', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(1) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'noname@test.com',
          role: 'client',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: null,
          last_name: null,
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.users[0].name).toBe('noname'); // Email username
  });

  it('combines multiple filters correctly', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(3) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?search=smith&role=trainer&status=active');
    const response = await GET(request);

    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    // Should have search and role params
    expect(calls[0][1]).toBe('%smith%');
    expect(calls[0][2]).toBe('trainer');
  });

  it('includes avatarUrl when profile_photo_url is present', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(1) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'photo@test.com',
          role: 'client',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: 'Photo',
          last_name: 'User',
          profile_photo_url: 'https://example.com/photo.jpg'
        }
      ]);

    const request = makeRequest('/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.users[0].avatarUrl).toBe('https://example.com/photo.jpg');
  });

  it('sets avatarUrl to null when profile_photo_url is missing', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(1) }])
      .mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'nophoto@test.com',
          role: 'client',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: null,
          first_name: 'No',
          last_name: 'Photo',
          profile_photo_url: null
        }
      ]);

    const request = makeRequest('/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.users[0].avatarUrl).toBeNull();
  });

  it('ignores invalid role filter values', async () => {
    mockedPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: BigInt(50) }])
      .mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users?role=invalid');
    const response = await GET(request);

    // Should not include role in parameters (only search params should be present if any)
    const calls = mockedPrisma.$queryRawUnsafe.mock.calls;
    // First call is count, second is users - both should only have limit/offset params
    expect(calls[1].length).toBe(3); // query + limit + offset, no role param
  });
});
