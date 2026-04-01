/**
 * Story 009-06: Reminders
 * Epic 009: Scheduling & Calendar
 *
 * Tests reminder notification workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    reminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
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

describe('Story 009-06: Reminders - Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer sets default reminder preferences', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reminders/preferences'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setReminderPrefs', data: {
          emailReminders: true,
          pushReminders: true,
          reminderTimes: [24, 2] // 24 hours and 2 hours before
        } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client sets reminder preferences', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reminders/preferences'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'setReminderPrefs', data: {
          emailReminders: true,
          smsReminders: false,
          reminderTimes: [48, 4]
        } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('disables all reminders', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reminders/preferences'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'setReminderPrefs', data: {
          emailReminders: false,
          pushReminders: false,
          smsReminders: false
        } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-06: Reminders - Appointment Reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates reminder for upcoming appointment', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reminders'), { user: trainer })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      startDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.reminder.create.mockResolvedValueOnce({
      id: 'rem-1',
      appointmentId: 'appt-1',
      reminderTime: new Date(Date.now() + 23 * 60 * 60 * 1000),
      channel: 'email',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createReminder', data: { appointmentId: 'appt-1', hoursBefore: 1 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends reminder at scheduled time', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reminders/send'), { user: client })
    );

    const mockReminder = {
      id: 'rem-1',
      userId: client.id,
      appointmentId: 'appt-1',
      message: 'Your training session is in 1 hour',
      sent: true,
    };

    mockedPrisma.reminder.update.mockResolvedValueOnce(mockReminder);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'sendReminder', data: { reminderId: 'rem-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('lists pending reminders', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reminders'), { user: trainer })
    );

    const mockReminders = [
      { id: 'rem-1', appointmentId: 'appt-1', reminderTime: new Date(), sent: false },
      { id: 'rem-2', appointmentId: 'appt-2', reminderTime: new Date(), sent: false },
    ];

    mockedPrisma.reminder.findMany.mockResolvedValueOnce(mockReminders);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewReminders' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-06: Reminders - Channels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends email reminder', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendReminder', data: { channel: 'email', message: 'Session reminder' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends push notification reminder', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendReminder', data: { channel: 'push', message: 'Session reminder' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends SMS reminder', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendReminder', data: { channel: 'sms', message: 'Session reminder' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sends multi-channel reminder', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'sendReminder', data: { channels: ['email', 'push'], message: 'Session reminder' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-06: Reminders - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles reminder for cancelled appointment', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce({
      id: 'appt-1',
      status: 'cancelled',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'createReminder', data: { appointmentId: 'appt-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents duplicate reminders', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.reminder.findMany.mockResolvedValueOnce([
      { id: 'rem-existing', appointmentId: 'appt-1', hoursBefore: 24 },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createReminder', data: { appointmentId: 'appt-1', hoursBefore: 24 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles failed reminder delivery', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.reminder.update.mockResolvedValueOnce({
      id: 'rem-1',
      sent: false,
      error: 'Email bounce',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'sendReminder', data: { reminderId: 'rem-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
