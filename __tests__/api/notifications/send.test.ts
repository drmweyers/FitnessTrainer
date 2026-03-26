/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/db/prisma');

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import webpush from 'web-push';
import { POST } from '@/app/api/notifications/send/route';

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const mockedPrisma = prisma as any;
const mockedWebpush = webpush as jest.Mocked<typeof webpush>;

function makeRequest(url: string, body?: any): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const mockAdminUser = {
  id: 'admin-user-id',
  role: 'admin',
  email: 'admin@test.com',
};

const mockTrainerUser = {
  id: 'trainer-user-id',
  role: 'trainer',
  email: 'trainer@test.com',
};

const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'BNtD6EFakeCryptoKey==',
    auth: 'TestAuthKey==',
  },
};

describe('POST /api/notifications/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends notification to user with valid subscription (admin)', async () => {
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-user-id',
      title: 'Workout Reminder',
      body: 'Time to train!',
      url: '/workouts',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockAdminUser })
    );

    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'target-user-id',
      pushSubscription: JSON.stringify(mockSubscription),
    });

    (mockedWebpush.sendNotification as jest.Mock).mockResolvedValueOnce({ statusCode: 201 });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockedWebpush.sendNotification).toHaveBeenCalledWith(
      mockSubscription,
      expect.stringContaining('Workout Reminder')
    );
  });

  it('returns 404 when target user has no subscription', async () => {
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-user-id',
      title: 'Test',
      body: 'Test body',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockAdminUser })
    );

    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'target-user-id',
      pushSubscription: null,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/no subscription/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-user-id',
      // missing title and body
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockAdminUser })
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-user-id',
      title: 'Test',
      body: 'Body',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('returns 403 when non-admin/trainer tries to send', async () => {
    const clientUser = { ...mockTrainerUser, role: 'client' };
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-user-id',
      title: 'Test',
      body: 'Body',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: clientUser })
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('handles web-push send failure gracefully', async () => {
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-user-id',
      title: 'Test',
      body: 'Test body',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockAdminUser })
    );

    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'target-user-id',
      pushSubscription: JSON.stringify(mockSubscription),
    });

    (mockedWebpush.sendNotification as jest.Mock).mockRejectedValueOnce(
      new Error('Push service unreachable')
    );

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('trainer can send notification to their own client', async () => {
    const req = makeRequest('/api/notifications/send', {
      userId: 'target-client-id',
      title: 'Workout Reminder',
      body: 'Your session is ready!',
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockTrainerUser })
    );

    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'target-client-id',
      pushSubscription: JSON.stringify(mockSubscription),
    });

    (mockedWebpush.sendNotification as jest.Mock).mockResolvedValueOnce({ statusCode: 201 });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
