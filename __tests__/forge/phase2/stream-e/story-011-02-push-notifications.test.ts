/**
 * Story 011-02: Push Notifications
 * Epic 011: Mobile & PWA
 *
 * Tests push notification workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    pushSubscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 011-02: Push Notifications - Subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client subscribes to push notifications', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/notifications/subscribe'), { user: client })
    );

    const mockSubscription = {
      id: 'sub-1',
      userId: client.id,
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      p256dh: 'test-key',
      auth: 'auth-secret',
    };

    mockedPrisma.pushSubscription.create.mockResolvedValueOnce(mockSubscription);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'subscribePush', data: { endpoint: 'https://fcm.googleapis.com/fcm/send/test' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer subscribes to push notifications', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/notifications/subscribe'), { user: trainer })
    );

    const mockSubscription = {
      id: 'sub-2',
      userId: trainer.id,
      endpoint: 'https://fcm.googleapis.com/fcm/send/test2',
    };

    mockedPrisma.pushSubscription.create.mockResolvedValueOnce(mockSubscription);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'subscribePush', data: { endpoint: 'https://fcm.googleapis.com/fcm/send/test2' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-02: Push Notifications - Send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends workout reminder notification', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendPushNotification', data: { title: 'Workout Reminder', body: 'Time for your scheduled workout!' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends appointment reminder notification', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendPushNotification', data: { title: 'Appointment Soon', body: 'Your session starts in 1 hour' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends goal achievement notification', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendPushNotification', data: { title: 'Goal Achieved!', body: 'You reached your weight loss goal!' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends message notification', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendPushNotification', data: { title: 'New Message', body: 'Your trainer sent you a message' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-02: Push Notifications - Manage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client views notification preferences', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/notifications/preferences'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewNotificationPrefs' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client updates notification preferences', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/notifications/preferences'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'updateNotificationPrefs', data: { workoutReminders: true, appointmentReminders: false } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client unsubscribes from push notifications', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/notifications/unsubscribe'), { user: client })
    );

    mockedPrisma.pushSubscription.delete.mockResolvedValueOnce({ id: 'sub-1' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'unsubscribePush' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-02: Push Notifications - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles subscription expiration', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.pushSubscription.findMany.mockResolvedValueOnce([
      { id: 'sub-expired', expired: true },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'checkSubscriptionStatus' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles notification delivery failure', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendPushNotification', data: { title: 'Test', fallbackToEmail: true } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles permission denied', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'subscribePush', data: { permission: 'denied' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
