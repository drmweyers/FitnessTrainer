/**
 * Mock Notification Service for FORGE Testing
 * Simulates multi-channel notification delivery with failure injection
 */

export interface NotificationPayload {
  title?: string;
  body?: string;
  [key: string]: any;
}

export interface SentNotification {
  channel: 'push' | 'email' | 'inApp';
  userId?: string;
  email?: string;
  subject?: string;
  body?: string;
  payload?: NotificationPayload;
  notification?: any;
}

export class MockNotificationService {
  static sentNotifications: SentNotification[] = [];
  static shouldFailPush = false;
  static shouldFailEmail = false;
  static shouldFailInApp = false;

  static reset() {
    this.sentNotifications = [];
    this.shouldFailPush = false;
    this.shouldFailEmail = false;
    this.shouldFailInApp = false;
  }

  static async sendPush(userId: string, payload: NotificationPayload): Promise<{ success: boolean }> {
    if (this.shouldFailPush) {
      throw new Error('Push service unavailable');
    }
    this.sentNotifications.push({ channel: 'push', userId, payload });
    return { success: true };
  }

  static async sendEmail(to: string, subject: string, body: string, userId?: string): Promise<{ success: boolean }> {
    if (this.shouldFailEmail) {
      throw new Error('Email service unavailable');
    }
    this.sentNotifications.push({ channel: 'email', email: to, subject, body, userId });
    return { success: true };
  }

  static async sendInApp(userId: string, notification: any): Promise<{ success: boolean }> {
    if (this.shouldFailInApp) {
      throw new Error('In-app service unavailable');
    }
    this.sentNotifications.push({ channel: 'inApp', userId, notification });
    return { success: true };
  }

  static getNotificationsByChannel(channel: 'push' | 'email' | 'inApp'): SentNotification[] {
    return this.sentNotifications.filter(n => n.channel === channel);
  }

  static getNotificationsForUser(userId: string): SentNotification[] {
    return this.sentNotifications.filter(n => n.userId === userId || n.userId === undefined);
  }
}
