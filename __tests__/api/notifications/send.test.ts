/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

const mockSendNotification = jest.fn().mockResolvedValue({});
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: (...args: any[]) => mockSendNotification(...args),
}));

const mockRedisGet = jest.fn();
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: mockRedisGet,
  })),
}));

import { authenticate } from '@/lib/middleware/auth';
import { POST } from '@/app/api/notifications/send/route';

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, body?: any): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const mockTrainer = { id: 'trainer-1', role: 'trainer', email: 't@test.com' };
const mockClient = { id: 'client-1', role: 'client', email: 'c@test.com' };

const validPayload = {
  userId: 'target-user-1',
  title: 'Workout Reminder',
  body: 'Time for your workout!',
  url: '/workouts',
};

const storedSubscription = JSON.stringify({
  endpoint: 'https://fcm.googleapis.com/fcm/send/test',
  keys: { p256dh: 'key1', auth: 'key2' },
});

describe('POST /api/notifications/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  it('sends notification successfully for trainer', async () => {
    const req = makeRequest('/api/notifications/send', validPayload);
    mockedAuthenticate.mockResolvedValueOnce(Object.assign(req, { user: mockTrainer }));
    mockRedisGet.mockResolvedValueOnce(storedSubscription);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendNotification).toHaveBeenCalled();
  });

  it('returns 403 for client role', async () => {
    const req = makeRequest('/api/notifications/send', validPayload);
    mockedAuthenticate.mockResolvedValueOnce(Object.assign(req, { user: mockClient }));

    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  it('returns 400 for missing title', async () => {
    const req = makeRequest('/api/notifications/send', { userId: 'u1', body: 'test' });
    mockedAuthenticate.mockResolvedValueOnce(Object.assign(req, { user: mockTrainer }));

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('returns 404 when no subscription found', async () => {
    const req = makeRequest('/api/notifications/send', validPayload);
    mockedAuthenticate.mockResolvedValueOnce(Object.assign(req, { user: mockTrainer }));
    mockRedisGet.mockResolvedValueOnce(null);

    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const req = makeRequest('/api/notifications/send', validPayload);
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false }, { status: 401 })
    );

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('handles webpush error with 500', async () => {
    const req = makeRequest('/api/notifications/send', validPayload);
    mockedAuthenticate.mockResolvedValueOnce(Object.assign(req, { user: mockTrainer }));
    mockRedisGet.mockResolvedValueOnce(storedSubscription);
    mockSendNotification.mockRejectedValueOnce(new Error('Push failed'));

    const response = await POST(req);
    expect(response.status).toBe(500);
  });

  it('returns 400 for missing userId', async () => {
    const req = makeRequest('/api/notifications/send', { title: 'Hi', body: 'test' });
    mockedAuthenticate.mockResolvedValueOnce(Object.assign(req, { user: mockTrainer }));

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
