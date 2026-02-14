/**
 * Tests for lib/middleware/admin.ts
 * Admin authorization middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/middleware/admin';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/middleware/auth');

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('authenticateAdmin', () => {
  const createMockRequest = (headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/admin/test', {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authentication fails', async () => {
    const unauthorizedResponse = NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
    mockedAuthenticate.mockResolvedValue(unauthorizedResponse);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    expect(result).toBe(unauthorizedResponse);
    expect(result.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    const trainerUser = {
      user: {
        id: 'user-123',
        email: 'trainer@test.com',
        role: 'trainer',
      },
    };
    mockedAuthenticate.mockResolvedValue(trainerUser as any);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    expect(result instanceof NextResponse).toBe(true);
    if (result instanceof NextResponse) {
      const body = await result.json();
      expect(result.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Admin access required');
    }
  });

  it('returns 403 when user is client', async () => {
    const clientUser = {
      user: {
        id: 'user-456',
        email: 'client@test.com',
        role: 'client',
      },
    };
    mockedAuthenticate.mockResolvedValue(clientUser as any);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    expect(result instanceof NextResponse).toBe(true);
    if (result instanceof NextResponse) {
      const body = await result.json();
      expect(result.status).toBe(403);
      expect(body.error).toBe('Admin access required');
    }
  });

  it('returns 403 when user role is undefined', async () => {
    const userWithoutRole = {
      user: {
        id: 'user-789',
        email: 'user@test.com',
        role: undefined,
      },
    };
    mockedAuthenticate.mockResolvedValue(userWithoutRole as any);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    expect(result instanceof NextResponse).toBe(true);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
    }
  });

  it('returns authenticated request when user is admin', async () => {
    const adminUser = {
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        role: 'admin',
      },
    };
    mockedAuthenticate.mockResolvedValue(adminUser as any);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    expect(result).toBe(adminUser);
    expect((result as any).user.role).toBe('admin');
  });

  it('passes through the original authenticated request object for admins', async () => {
    const adminRequest = {
      user: {
        id: 'admin-456',
        email: 'superadmin@test.com',
        role: 'admin',
        isActive: true,
        isVerified: true,
      },
      request: createMockRequest(),
    };
    mockedAuthenticate.mockResolvedValue(adminRequest as any);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    expect(result).toBe(adminRequest);
    expect((result as any).user.email).toBe('superadmin@test.com');
    expect((result as any).user.isActive).toBe(true);
  });

  it('handles case-sensitive role check', async () => {
    const userWithWrongCase = {
      user: {
        id: 'user-999',
        email: 'user@test.com',
        role: 'ADMIN', // uppercase
      },
    };
    mockedAuthenticate.mockResolvedValue(userWithWrongCase as any);

    const request = createMockRequest();
    const result = await authenticateAdmin(request);

    // Role check is case-sensitive, so 'ADMIN' !== 'admin'
    expect(result instanceof NextResponse).toBe(true);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
    }
  });
});
