/**
 * @jest-environment node
 *
 * FORGE Notification Delivery Failure Handling Tests
 * Tests fallback mechanisms and retry logic
 */

import { MockNotificationService } from '../../utils/notification-mocks';

describe('FORGE: Notification Delivery Failure Handling', () => {
  beforeEach(() => {
    MockNotificationService.reset();
  });

  it('falls back to email when push subscription expired', async () => {
    MockNotificationService.shouldFailPush = true;
    const user = { id: 'user-123', email: 'test@example.com' };

    // Try push first
    try {
      await MockNotificationService.sendPush(user.id, { title: 'Test' });
    } catch (e) {
      // Fallback to email
      await MockNotificationService.sendEmail(user.email, 'Test', 'Body');
    }

    expect(MockNotificationService.sentNotifications).toHaveLength(1);
    expect(MockNotificationService.sentNotifications[0].channel).toBe('email');
  });

  it('skips push when user disabled push notifications', async () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      preferences: { pushEnabled: false, emailEnabled: true }
    };

    // Check preference before sending
    if (user.preferences.pushEnabled) {
      await MockNotificationService.sendPush(user.id, { title: 'Test' });
    }
    if (user.preferences.emailEnabled) {
      await MockNotificationService.sendEmail(user.email, 'Test', 'Body');
    }

    expect(MockNotificationService.sentNotifications).toHaveLength(1);
    expect(MockNotificationService.sentNotifications[0].channel).toBe('email');
  });

  it('queues for retry when all channels fail', async () => {
    MockNotificationService.shouldFailPush = true;
    MockNotificationService.shouldFailEmail = true;
    MockNotificationService.shouldFailInApp = true;

    const failedNotifications: any[] = [];
    const user = { id: 'user-123', email: 'test@example.com' };

    const channels = [
      { name: 'push', fn: () => MockNotificationService.sendPush(user.id, {}) },
      { name: 'email', fn: () => MockNotificationService.sendEmail(user.email, '', '') },
      { name: 'inApp', fn: () => MockNotificationService.sendInApp(user.id, {}) }
    ];

    for (const channel of channels) {
      try {
        await channel.fn();
      } catch (e) {
        failedNotifications.push({ channel: channel.name, userId: user.id });
      }
    }

    expect(failedNotifications).toHaveLength(3);
    expect(MockNotificationService.sentNotifications).toHaveLength(0);
  });

  it('logs email bounce for retry', async () => {
    MockNotificationService.shouldFailEmail = true;
    const bouncedEmails: string[] = [];

    try {
      await MockNotificationService.sendEmail('invalid@example.com', 'Test', 'Body');
    } catch (e) {
      bouncedEmails.push('invalid@example.com');
    }

    expect(bouncedEmails).toContain('invalid@example.com');
  });

  it('succeeds with in-app when push and email fail', async () => {
    MockNotificationService.shouldFailPush = true;
    MockNotificationService.shouldFailEmail = true;

    const user = { id: 'user-123', email: 'test@example.com' };
    const sentChannels: string[] = [];

    // Try all channels
    try {
      await MockNotificationService.sendPush(user.id, { title: 'Test' });
      sentChannels.push('push');
    } catch (e) {
      // Push failed
    }

    try {
      await MockNotificationService.sendEmail(user.email, 'Test', 'Body');
      sentChannels.push('email');
    } catch (e) {
      // Email failed
    }

    try {
      await MockNotificationService.sendInApp(user.id, { type: 'TEST' });
      sentChannels.push('inApp');
    } catch (e) {
      // In-app failed
    }

    expect(sentChannels).toEqual(['inApp']);
    expect(MockNotificationService.sentNotifications).toHaveLength(1);
    expect(MockNotificationService.sentNotifications[0].channel).toBe('inApp');
  });

  it('handles partial channel failure gracefully', async () => {
    MockNotificationService.shouldFailPush = true;

    const user = { id: 'user-123', email: 'test@example.com' };
    const results: { channel: string; success: boolean }[] = [];

    // Attempt multi-channel delivery
    try {
      await MockNotificationService.sendPush(user.id, { title: 'Test' });
      results.push({ channel: 'push', success: true });
    } catch (e) {
      results.push({ channel: 'push', success: false });
    }

    try {
      await MockNotificationService.sendEmail(user.email, 'Test', 'Body');
      results.push({ channel: 'email', success: true });
    } catch (e) {
      results.push({ channel: 'email', success: false });
    }

    try {
      await MockNotificationService.sendInApp(user.id, { type: 'TEST' });
      results.push({ channel: 'inApp', success: true });
    } catch (e) {
      results.push({ channel: 'inApp', success: false });
    }

    expect(results).toEqual([
      { channel: 'push', success: false },
      { channel: 'email', success: true },
      { channel: 'inApp', success: true }
    ]);
    expect(MockNotificationService.sentNotifications).toHaveLength(2);
  });

  it('respects user notification preferences per channel', async () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      preferences: {
        pushEnabled: true,
        emailEnabled: false,
        inAppEnabled: true
      }
    };

    // Only send to enabled channels
    const enabledChannels: string[] = [];

    if (user.preferences.pushEnabled) {
      await MockNotificationService.sendPush(user.id, { title: 'Test' });
      enabledChannels.push('push');
    }

    if (user.preferences.emailEnabled) {
      await MockNotificationService.sendEmail(user.email, 'Test', 'Body');
      enabledChannels.push('email');
    }

    if (user.preferences.inAppEnabled) {
      await MockNotificationService.sendInApp(user.id, { type: 'TEST' });
      enabledChannels.push('inApp');
    }

    expect(enabledChannels).toEqual(['push', 'inApp']);
    expect(MockNotificationService.sentNotifications).toHaveLength(2);
  });

  it('tracks notification delivery metrics', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };

    // Send multiple notifications
    await MockNotificationService.sendPush(user.id, { title: 'Test 1' });
    await MockNotificationService.sendEmail(user.email, 'Test', 'Body', user.id);
    await MockNotificationService.sendInApp(user.id, { type: 'TEST' });
    await MockNotificationService.sendPush(user.id, { title: 'Test 2' });

    const metrics = {
      total: MockNotificationService.sentNotifications.length,
      push: MockNotificationService.getNotificationsByChannel('push').length,
      email: MockNotificationService.getNotificationsByChannel('email').length,
      inApp: MockNotificationService.getNotificationsByChannel('inApp').length,
      forUser: MockNotificationService.getNotificationsForUser(user.id).length
    };

    expect(metrics.total).toBe(4);
    expect(metrics.push).toBe(2);
    expect(metrics.email).toBe(1);
    expect(metrics.inApp).toBe(1);
    expect(metrics.forUser).toBe(4);
  });
});
