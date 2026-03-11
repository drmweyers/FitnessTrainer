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

import { authenticateAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/db/prisma';
import { PUT } from '@/app/api/admin/users/bulk/route';

const mockedPrisma = prisma as any;

function makeRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/users/bulk', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/admin/users/bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('suspends users successfully', async () => {
    (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

    const request = makeRequest({ userIds: ['u1', 'u2', 'u3'], action: 'suspend' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.updated).toBe(3);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2', 'u3'] } },
      data: { isActive: false },
    });
  });

  it('activates users successfully', async () => {
    (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    const request = makeRequest({ userIds: ['u1', 'u2'], action: 'activate' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.updated).toBe(2);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
      data: { isActive: true },
    });
  });

  it('returns 400 when userIds is missing', async () => {
    const request = makeRequest({ action: 'suspend' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('userIds must be a non-empty array');
  });

  it('returns 400 for invalid action', async () => {
    const request = makeRequest({ userIds: ['u1'], action: 'delete' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('action must be "suspend" or "activate"');
  });

  it('returns 400 for empty array', async () => {
    const request = makeRequest({ userIds: [], action: 'suspend' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('userIds must be a non-empty array');
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest({ userIds: ['u1'], action: 'suspend' });
    const response = await PUT(request);

    expect(response.status).toBe(403);
  });

  it('returns 500 on database error', async () => {
    (prisma.user.updateMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest({ userIds: ['u1'], action: 'suspend' });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to update users');
  });
});
