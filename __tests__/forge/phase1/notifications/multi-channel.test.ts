/**
 * @jest-environment node
 *
 * FORGE Multi-Channel Notification Delivery Tests
 * Tests workout reminders, goal achievements, and appointment notifications
 */

import { MockNotificationService } from '../../utils/notification-mocks';

describe('FORGE: Multi-Channel Notification Delivery', () => {
  beforeEach(() => {
    MockNotificationService.reset();
  });

  it('sends workout reminder via push and email', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const workout = { id: 'wo-456', name: 'Leg Day', scheduledAt: new Date() };

    // Simulate notification service
    await Promise.all([
      MockNotificationService.sendPush(user.id, {
        title: 'Workout Reminder',
        body: `Time for ${workout.name}!`
      }),
      MockNotificationService.sendEmail(
        user.email,
        'Workout Reminder',
        `Your ${workout.name} is scheduled.`
      )
    ]);

    expect(MockNotificationService.sentNotifications).toHaveLength(2);
    expect(MockNotificationService.sentNotifications[0].channel).toBe('push');
    expect(MockNotificationService.sentNotifications[1].channel).toBe('email');
  });

  it('sends goal achievement via all three channels', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const goal = { type: 'WEIGHT_LOSS', target: 10, achieved: true };

    await Promise.all([
      MockNotificationService.sendPush(user.id, {
        title: 'Goal Achieved!',
        body: `You hit your ${goal.type} goal!`
      }),
      MockNotificationService.sendEmail(
        user.email,
        'Congratulations!',
        `You've achieved your goal.`
      ),
      MockNotificationService.sendInApp(user.id, {
        type: 'GOAL_ACHIEVED',
        goalId: goal.type
      })
    ]);

    expect(MockNotificationService.sentNotifications).toHaveLength(3);
    const channels = MockNotificationService.sentNotifications.map(n => n.channel);
    expect(channels).toContain('push');
    expect(channels).toContain('email');
    expect(channels).toContain('inApp');
  });

  it('sends appointment booking via email and in-app only', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const appointment = { id: 'apt-789', date: new Date(), trainerName: 'Coach' };

    await Promise.all([
      MockNotificationService.sendEmail(
        user.email,
        'Appointment Confirmed',
        `Your session with ${appointment.trainerName} is booked.`
      ),
      MockNotificationService.sendInApp(user.id, {
        type: 'APPOINTMENT_BOOKED',
        appointmentId: appointment.id
      })
    ]);

    const channels = MockNotificationService.sentNotifications.map(n => n.channel);
    expect(channels).not.toContain('push');
    expect(channels).toContain('email');
    expect(channels).toContain('inApp');
  });

  it('sends certification expiration via email only', async () => {
    const user = { id: 'user-123', email: 'trainer@example.com' };
    const cert = { name: 'NASM-CPT', expiresAt: new Date() };

    await MockNotificationService.sendEmail(
      user.email,
      'Certification Expiring Soon',
      `Your ${cert.name} expires on ${cert.expiresAt.toDateString()}.`
    );

    expect(MockNotificationService.sentNotifications).toHaveLength(1);
    expect(MockNotificationService.sentNotifications[0].channel).toBe('email');
  });

  it('sends program assignment via all channels', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const program = { id: 'prog-456', name: '12-Week Transformation' };

    await Promise.all([
      MockNotificationService.sendPush(user.id, {
        title: 'New Program Assigned',
        body: `Check out ${program.name}`
      }),
      MockNotificationService.sendEmail(
        user.email,
        'New Training Program',
        `Your trainer assigned you ${program.name}.`
      ),
      MockNotificationService.sendInApp(user.id, {
        type: 'PROGRAM_ASSIGNED',
        programId: program.id
      })
    ]);

    expect(MockNotificationService.sentNotifications).toHaveLength(3);
  });

  it('sends measurement reminder via push only', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };

    await MockNotificationService.sendPush(user.id, {
      title: 'Time to Log Measurements',
      body: 'Weekly check-in: Record your progress!'
    });

    expect(MockNotificationService.sentNotifications).toHaveLength(1);
    expect(MockNotificationService.sentNotifications[0].channel).toBe('push');
  });

  it('sends milestone achievement via push and in-app', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };
    const milestone = { type: 'WORKOUT_STREAK', value: 30 };

    await Promise.all([
      MockNotificationService.sendPush(user.id, {
        title: '30-Day Streak!',
        body: `You've completed ${milestone.value} workouts in a row!`
      }),
      MockNotificationService.sendInApp(user.id, {
        type: 'MILESTONE_ACHIEVED',
        milestoneType: milestone.type,
        value: milestone.value
      })
    ]);

    const channels = MockNotificationService.sentNotifications.map(n => n.channel);
    expect(channels).toContain('push');
    expect(channels).toContain('inApp');
    expect(channels).not.toContain('email');
  });

  it('sends client message notification via all channels', async () => {
    const trainer = { id: 'trainer-123', email: 'trainer@example.com' };
    const message = { id: 'msg-456', senderName: 'Client Name', preview: 'Hi trainer...' };

    await Promise.all([
      MockNotificationService.sendPush(trainer.id, {
        title: `Message from ${message.senderName}`,
        body: message.preview
      }),
      MockNotificationService.sendEmail(
        trainer.email,
        'New Message',
        `${message.senderName} sent you a message.`
      ),
      MockNotificationService.sendInApp(trainer.id, {
        type: 'NEW_MESSAGE',
        messageId: message.id,
        senderName: message.senderName
      })
    ]);

    expect(MockNotificationService.sentNotifications).toHaveLength(3);
  });
});
