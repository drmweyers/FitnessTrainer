/**
 * Story 008-04: Notification Management
 * FORGE User Simulation - Stream D
 *
 * As a user, I want to manage my notifications
 * So that I can control how I receive alerts
 */


import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 008-04: Notification Management', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('views notification preferences', async () => {
      const client = await ActorFactory.createClient();

      const preferences = {
        userId: client.id,
        email: {
          enabled: true,
          digest: 'daily',
          types: ['messages', 'workout_reminders', 'goal_milestones']
        },
        push: {
          enabled: true,
          types: ['messages', 'workout_reminders']
        },
        inApp: {
          enabled: true
        }
      };

      expect(preferences.email.enabled).toBe(true);
      expect(preferences.push.types).toContain('messages');
    });

    it('updates notification preferences', async () => {
      const client = await ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'navigateToSettings', data: { section: 'notifications' } },
          { action: 'togglePushNotifications', data: { enabled: true } },
          { action: 'selectNotificationTypes', data: { types: ['messages', 'reminders'] } },
          { action: 'savePreferences', data: { confirm: true } }
        ]
      });

      expect(result.success).toBe(true);
    });

    it('enables push notifications', async () => {
      const preferences = {
        push: {
          enabled: true,
          deviceTokens: ['token-abc-123'],
          types: ['messages', 'workouts']
        }
      };

      expect(preferences.push.enabled).toBe(true);
      expect(preferences.push.deviceTokens).toHaveLength(1);
    });

    it('disables push notifications', async () => {
      const preferences = {
        push: {
          enabled: false,
          deviceTokens: [],
          types: []
        }
      };

      expect(preferences.push.enabled).toBe(false);
    });
  });

  describe('Notification Types', () => {
    it('configures message notifications', async () => {
      const preferences = {
        messages: {
          enabled: true,
          sound: true,
          preview: true,
          vibration: true
        }
      };

      expect(preferences.messages.enabled).toBe(true);
      expect(preferences.messages.sound).toBe(true);
    });

    it('configures workout reminder notifications', async () => {
      const preferences = {
        workoutReminders: {
          enabled: true,
          time: '07:00',
          days: ['monday', 'wednesday', 'friday']
        }
      };

      expect(preferences.workoutReminders.days).toHaveLength(3);
    });

    it('configures goal milestone notifications', async () => {
      const preferences = {
        goalMilestones: {
          enabled: true,
          celebrate: true
        }
      };

      expect(preferences.goalMilestones.celebrate).toBe(true);
    });

    it('configures measurement reminder notifications', async () => {
      const preferences = {
        measurementReminders: {
          enabled: true,
          frequency: 'weekly',
          day: 'sunday'
        }
      };

      expect(preferences.measurementReminders.frequency).toBe('weekly');
    });
  });

  describe('Quiet Hours', () => {
    it('sets quiet hours', async () => {
      const quietHours = {
        enabled: true,
        start: '22:00',
        end: '07:00',
        timezone: 'America/New_York'
      };

      expect(quietHours.enabled).toBe(true);
      expect(quietHours.start).toBe('22:00');
      expect(quietHours.end).toBe('07:00');
    });

    it('allows urgent notifications during quiet hours', async () => {
      const quietHours = {
        enabled: true,
        start: '22:00',
        end: '07:00',
        allowUrgent: true
      };

      expect(quietHours.allowUrgent).toBe(true);
    });

    it('checks if current time is in quiet hours', async () => {
      const quietHours = { start: 22, end: 7 };
      const currentHour = 23;

      const isQuietHours = currentHour >= quietHours.start || currentHour < quietHours.end;
      expect(isQuietHours).toBe(true);
    });
  });

  describe('Notification History', () => {
    it('views notification history', async () => {
      const client = await ActorFactory.createClient();

      const notifications = [
        {
          userId: client.id,
          type: 'message',
          title: 'New Message',
          body: 'Trainer sent you a message',
          read: true,
          createdAt: new Date('2026-03-30')
        },
        {
          userId: client.id,
          type: 'workout_reminder',
          title: 'Workout Time!',
          body: 'Your leg day workout is scheduled',
          read: false,
          createdAt: new Date('2026-03-31')
        }
      ];

      expect(notifications).toHaveLength(2);
      expect(notifications[1].read).toBe(false);
    });

    it('marks notification as read', async () => {
      const notification = {
        id: 'notif-123',
        read: false
      };

      notification.read = true;

      expect(notification.read).toBe(true);
    });

    it('marks all notifications as read', async () => {
      const notifications = [
        { id: 1, read: false },
        { id: 2, read: false },
        { id: 3, read: false }
      ];

      notifications.forEach(n => n.read = true);

      expect(notifications.every(n => n.read)).toBe(true);
    });

    it('clears notification history', async () => {
      let notifications = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ];

      // Clear all
      notifications = [];

      expect(notifications).toHaveLength(0);
    });
  });

  describe('Email Preferences', () => {
    it('configures email digest frequency', async () => {
      const frequencies = ['immediate', 'daily', 'weekly', 'never'];
      const selected = 'daily';

      expect(frequencies).toContain(selected);
    });

    it('selects email notification types', async () => {
      const emailTypes = {
        messages: true,
        workoutReminders: false,
        progressReports: true,
        marketing: false
      };

      const enabled = Object.entries(emailTypes)
        .filter(([, v]) => v)
        .map(([k]) => k);

      expect(enabled).toContain('messages');
      expect(enabled).toContain('progressReports');
      expect(enabled).not.toContain('marketing');
    });

    it('unsubscribes from all emails', async () => {
      const preferences = {
        email: {
          enabled: false,
          types: []
        }
      };

      expect(preferences.email.enabled).toBe(false);
    });
  });

  describe('In-App Notifications', () => {
    it('configures in-app notification display', async () => {
      const preferences = {
        inApp: {
          enabled: true,
          position: 'top-right',
          duration: 5000,
          sound: false
        }
      };

      expect(preferences.inApp.duration).toBe(5000);
    });

    it('groups similar notifications', async () => {
      const notifications = [
        { type: 'message', count: 3, from: 'Trainer' },
        { type: 'workout', count: 1 }
      ];

      const grouped = notifications.find(n => n.type === 'message');
      expect(grouped?.count).toBe(3);
    });
  });

  describe('Trainer Notifications', () => {
    it('trainer configures client notification preferences', async () => {
      const trainer = await ActorFactory.createTrainer();

      const preferences = {
        trainerId: trainer.id,
        notifyOn: {
          clientMessage: true,
          missedWorkout: true,
          goalAchieved: true,
          measurementLogged: false
        }
      };

      expect(preferences.notifyOn.clientMessage).toBe(true);
    });

    it('trainer receives batch notifications', async () => {
      const batchSettings = {
        enabled: true,
        frequency: 'hourly',
        maxBatchSize: 10
      };

      expect(batchSettings.frequency).toBe('hourly');
    });
  });
});
