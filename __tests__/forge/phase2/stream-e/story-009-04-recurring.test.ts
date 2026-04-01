/**
 * Story 009-04: Recurring Sessions
 * Epic 009: Scheduling & Calendar
 *
 * Tests recurring session patterns and management
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    recurringSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      createMany: jest.fn(),
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

describe('Story 009-04: Recurring Sessions - Weekly Patterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer creates weekly recurring sessions', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const mockRecurringSession = {
      id: 'rec-1',
      trainerId: trainer.id,
      clientId: client.id,
      pattern: 'weekly',
      dayOfWeek: 1,
      startTime: '10:00',
      duration: 60,
      startDate: new Date('2026-04-06'),
      endDate: new Date('2026-06-06'),
    };

    mockedPrisma.recurringSession.create.mockResolvedValueOnce(mockRecurringSession);
    mockedPrisma.appointment.createMany.mockResolvedValueOnce({ count: 10 });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', dayOfWeek: 1, startDate: '2026-04-06', endDate: '2026-06-06' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer creates bi-weekly recurring sessions', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const mockRecurringSession = {
      id: 'rec-2',
      trainerId: trainer.id,
      clientId: client.id,
      pattern: 'biweekly',
      dayOfWeek: 3,
      startTime: '14:00',
      duration: 60,
    };

    mockedPrisma.recurringSession.create.mockResolvedValueOnce(mockRecurringSession);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'biweekly', dayOfWeek: 3 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer creates multiple weekly sessions per week', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const recurringSessions = [
      { id: 'rec-mon', dayOfWeek: 1, startTime: '10:00' },
      { id: 'rec-wed', dayOfWeek: 3, startTime: '10:00' },
      { id: 'rec-fri', dayOfWeek: 5, startTime: '10:00' },
    ];

    mockedPrisma.recurringSession.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `rec-${args.data.dayOfWeek}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', dayOfWeek: 1 } },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', dayOfWeek: 3 } },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', dayOfWeek: 5 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-04: Recurring Sessions - Monthly Patterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer creates monthly recurring sessions', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const mockRecurringSession = {
      id: 'rec-3',
      trainerId: trainer.id,
      clientId: client.id,
      pattern: 'monthly',
      dayOfMonth: 15,
      startTime: '10:00',
      duration: 60,
    };

    mockedPrisma.recurringSession.create.mockResolvedValueOnce(mockRecurringSession);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'monthly', dayOfMonth: 15 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-04: Recurring Sessions - Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views all recurring sessions', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const mockRecurring = [
      { id: 'rec-1', trainerId: trainer.id, pattern: 'weekly', dayOfWeek: 1 },
      { id: 'rec-2', trainerId: trainer.id, pattern: 'weekly', dayOfWeek: 3 },
    ];

    mockedPrisma.recurringSession.findMany.mockResolvedValueOnce(mockRecurring);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRecurring' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer updates recurring session time', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring/rec-1'), { user: trainer })
    );

    mockedPrisma.recurringSession.update.mockResolvedValueOnce({
      id: 'rec-1',
      trainerId: trainer.id,
      startTime: '14:00',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'updateRecurring', data: { recurringId: 'rec-1', startTime: '14:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer cancels future recurring instances', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring/rec-1'), { user: trainer })
    );

    mockedPrisma.recurringSession.update.mockResolvedValueOnce({
      id: 'rec-1',
      status: 'cancelled',
      cancelledFrom: new Date('2026-05-01'),
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelRecurring', data: { recurringId: 'rec-1', fromDate: '2026-05-01' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer deletes recurring session entirely', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring/rec-1'), { user: trainer })
    );

    mockedPrisma.recurringSession.delete.mockResolvedValueOnce({
      id: 'rec-1',
      trainerId: trainer.id,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'deleteRecurring', data: { recurringId: 'rec-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-04: Recurring Sessions - Exceptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer skips single instance of recurring session', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring/rec-1/skip'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'skipInstance', data: { recurringId: 'rec-1', date: '2026-04-13' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer reschedules single instance', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring/rec-1/reschedule'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'rescheduleInstance', data: { recurringId: 'rec-1', originalDate: '2026-04-13', newDate: '2026-04-14' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-04: Recurring Sessions - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles end date before start date', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', startDate: '2026-06-06', endDate: '2026-04-06' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles very long recurring series', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const mockRecurringSession = {
      id: 'rec-long',
      trainerId: trainer.id,
      clientId: client.id,
      pattern: 'weekly',
      startDate: new Date('2026-04-06'),
      endDate: new Date('2027-04-06'),
    };

    mockedPrisma.recurringSession.create.mockResolvedValueOnce(mockRecurringSession);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', startDate: '2026-04-06', endDate: '2027-04-06' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles recurring session with no end date', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/recurring'), { user: trainer })
    );

    const mockRecurringSession = {
      id: 'rec-ongoing',
      trainerId: trainer.id,
      clientId: client.id,
      pattern: 'weekly',
      endDate: null,
    };

    mockedPrisma.recurringSession.create.mockResolvedValueOnce(mockRecurringSession);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createRecurring', data: { clientId: client.id, pattern: 'weekly', endDate: null } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
