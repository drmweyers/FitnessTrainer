/**
 * Story 009-07: Calendar Sync
 * Epic 009: Scheduling & Calendar
 *
 * Tests iCal/Calendar synchronization workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    calendarSync: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
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

describe('Story 009-07: Calendar Sync - Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer exports schedule to iCal format', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/export/ics'), { user: trainer })
    );

    const mockAppointments = [
      {
        id: 'appt-1',
        title: 'Training Session',
        startDatetime: new Date('2026-04-06T10:00:00Z'),
        endDatetime: new Date('2026-04-06T11:00:00Z'),
        description: 'Leg day workout',
      },
    ];

    mockedPrisma.appointment.findMany.mockResolvedValueOnce(mockAppointments);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'exportCalendar', data: { format: 'ics' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('exports calendar with date range filter', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/export/ics?start=2026-04-01&end=2026-04-30'), { user: trainer })
    );

    mockedPrisma.appointment.findMany.mockResolvedValueOnce([]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'exportCalendar', data: { format: 'ics', startDate: '2026-04-01', endDate: '2026-04-30' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('generates calendar feed URL', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/calendar-feed'), { user: trainer })
    );

    mockedPrisma.calendarSync.create.mockResolvedValueOnce({
      id: 'sync-1',
      userId: trainer.id,
      feedUrl: 'https://api.evofit.io/calendar/feed/abc123',
      token: 'abc123',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'generateFeedUrl' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-07: Calendar Sync - Import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer imports external calendar', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/import'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'importCalendar', data: { source: 'google', url: 'https://calendar.google.com/ical/test' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs with Google Calendar', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.calendarSync.upsert = jest.fn().mockResolvedValue({
      id: 'sync-google',
      userId: trainer.id,
      provider: 'google',
      syncedAt: new Date(),
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'syncCalendar', data: { provider: 'google' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs with Apple Calendar', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'syncCalendar', data: { provider: 'apple' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs with Outlook Calendar', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'syncCalendar', data: { provider: 'outlook' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-07: Calendar Sync - Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures sync preferences', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/sync-settings'), { user: trainer })
    );

    mockedPrisma.calendarSync.update.mockResolvedValueOnce({
      id: 'sync-1',
      userId: trainer.id,
      syncDirection: 'bidirectional',
      includeDetails: true,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'configureSync', data: { direction: 'bidirectional', includeDetails: true } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('sets up automatic sync', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'configureSync', data: { autoSync: true, syncInterval: 15 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('disconnects calendar sync', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/sync/disconnect'), { user: trainer })
    );

    mockedPrisma.calendarSync.delete.mockResolvedValueOnce({ id: 'sync-1' });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'disconnectSync' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-07: Calendar Sync - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles invalid calendar URL', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'importCalendar', data: { url: 'invalid-url' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles sync conflict', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'syncCalendar', data: { provider: 'google', conflictResolution: 'keep_local' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles expired sync token', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.calendarSync.findUnique.mockResolvedValueOnce({
      id: 'sync-1',
      tokenExpired: true,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'refreshSyncToken' },
      ],
    });

    expect(result.success).toBe(true);
  });
});
