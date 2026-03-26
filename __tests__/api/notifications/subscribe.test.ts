/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/db/prisma');

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { POST } from '@/app/api/notifications/subscribe/route';

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const mockedPrisma = prisma as any;

function makeRequest(url: string, body?: any): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const mockUser = {
  id: 'user-abc-123',
  role: 'trainer',
  email: 'trainer@test.com',
};

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'BNtD6EFakeCryptoKey==',
    auth: 'TestAuthKey==',
  },
};

describe('POST /api/notifications/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves a new push subscription and returns 201', async () => {
    const req = makeRequest('/api/notifications/subscribe', {
      subscription: validSubscription,
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: mockUser.id,
      pushSubscription: JSON.stringify(validSubscription),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/subscribed/i);

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          pushSubscription: JSON.stringify(validSubscription),
        }),
      })
    );
  });

  it('returns 400 when subscription is missing', async () => {
    const req = makeRequest('/api/notifications/subscribe', {});

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 when subscription endpoint is missing', async () => {
    const req = makeRequest('/api/notifications/subscribe', {
      subscription: { keys: { p256dh: 'abc', auth: 'def' } },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    const req = makeRequest('/api/notifications/subscribe', {
      subscription: validSubscription,
    });

    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('handles DB error gracefully with 500', async () => {
    const req = makeRequest('/api/notifications/subscribe', {
      subscription: validSubscription,
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.user.update.mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('removes subscription when action is unsubscribe', async () => {
    const req = makeRequest('/api/notifications/subscribe', {
      subscription: validSubscription,
      action: 'unsubscribe',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.user.update.mockResolvedValueOnce({
      id: mockUser.id,
      pushSubscription: null,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          pushSubscription: null,
        }),
      })
    );
  });
});
