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
import { GET, PUT } from '@/app/api/admin/users/[id]/route';

const mockedPrisma = prisma as any;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user with stats', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 'user-1',
          email: 'user@test.com',
          role: 'trainer',
          is_active: true,
          is_verified: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-05T00:00:00Z',
          last_login_at: '2026-02-01T00:00:00Z',
          bio: 'Certified trainer',
          phone: '555-1234',
          profile_photo_url: 'https://example.com/photo.jpg'
        }
      ])
      .mockResolvedValueOnce([{ count: BigInt(5) }])   // programCount
      .mockResolvedValueOnce([{ count: BigInt(20) }])  // workoutCount
      .mockResolvedValueOnce([{ count: BigInt(10) }]); // clientCount

    const request = makeRequest('/api/admin/users/user-1');
    const response = await GET(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      id: 'user-1',
      email: 'user@test.com',
      name: 'user',
      role: 'trainer',
      isActive: true,
      isVerified: true,
      bio: 'Certified trainer',
      phone: '555-1234',
      avatarUrl: 'https://example.com/photo.jpg',
      stats: {
        programsCreated: 5,
        workoutsCompleted: 20,
        connections: 10,
      },
    });
  });

  it('returns 404 when user not found', async () => {
    mockedPrisma.$queryRaw.mockResolvedValueOnce([]);

    const request = makeRequest('/api/admin/users/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest('/api/admin/users/user-1');
    const response = await GET(request, { params: { id: 'user-1' } });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('handles user without profile data', async () => {
    mockedPrisma.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 'user-2',
          email: 'minimal@test.com',
          role: 'client',
          is_active: true,
          is_verified: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: null,
          last_login_at: null,
          bio: null,
          phone: null,
          profile_photo_url: null
        }
      ])
      .mockResolvedValueOnce([{ count: BigInt(0) }])
      .mockResolvedValueOnce([{ count: BigInt(0) }])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const request = makeRequest('/api/admin/users/user-2');
    const response = await GET(request, { params: { id: 'user-2' } });
    const data = await response.json();

    expect(data.data.name).toBe('minimal');
    expect(data.data.stats.programsCreated).toBe(0);
  });

  it('handles database error gracefully', async () => {
    mockedPrisma.$queryRaw.mockRejectedValueOnce(new Error('Database error'));

    const request = makeRequest('/api/admin/users/user-1');
    const response = await GET(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch user details');
  });
});

describe('PUT /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates user role successfully', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
    });

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
      role: 'trainer',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: null,
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ role: 'trainer' }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.role).toBe('trainer');
  });

  it('updates isActive successfully', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: false,
      isVerified: true,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: null,
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ isActive: false }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(data.data.isActive).toBe(false);
  });

  it('updates isVerified successfully', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: null,
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ isVerified: true }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(data.data.isVerified).toBe(true);
  });

  it('updates multiple fields at once', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
      role: 'trainer',
      isActive: false,
      isVerified: true,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: null,
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({
        role: 'trainer',
        isActive: false,
        isVerified: true,
      }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(data.data).toMatchObject({
      role: 'trainer',
      isActive: false,
      isVerified: true,
    });
  });

  it('returns 400 for invalid role', async () => {
    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ role: 'superadmin' }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid role. Must be trainer, client, or admin.');
  });

  it('returns 404 for nonexistent user', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce(null);

    const request = makeRequest('/api/admin/users/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ isActive: false }),
    });

    const response = await PUT(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('returns 400 for empty update body', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No valid fields to update');
  });

  it('returns 400 when only invalid fields provided', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ invalidField: 'value' }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No valid fields to update');
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ isActive: false }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });

    expect(response.status).toBe(403);
  });

  it('handles database error on update', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    mockedPrisma.user.update.mockRejectedValueOnce(new Error('Database error'));

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ isActive: false }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to update user');
  });

  it('accepts boolean false values correctly', async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
    });

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@test.com',
      role: 'client',
      isActive: false,
      isVerified: false,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: null,
    });

    const request = makeRequest('/api/admin/users/user-1', {
      method: 'PUT',
      body: JSON.stringify({ isActive: false, isVerified: false }),
    });

    const response = await PUT(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(data.data.isActive).toBe(false);
    expect(data.data.isVerified).toBe(false);
  });

  it('validates each role value separately', async () => {
    const invalidRoles = ['moderator', 'superuser', 'guest', 'user'];

    for (const role of invalidRoles) {
      jest.clearAllMocks();
      const request = makeRequest('/api/admin/users/user-1', {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });

      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid role. Must be trainer, client, or admin.');
    }
  });

  it('accepts all valid roles', async () => {
    const validRoles = ['trainer', 'client', 'admin'];

    for (const role of validRoles) {
      jest.clearAllMocks();
      mockedPrisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@test.com',
      });

      mockedPrisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@test.com',
        role,
        isActive: true,
        isVerified: true,
        createdAt: new Date('2026-01-01'),
        lastLoginAt: null,
      });

      const request = makeRequest('/api/admin/users/user-1', {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });

      const response = await PUT(request, { params: { id: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.role).toBe(role);
    }
  });
});
