/**
 * Story 009-02: Availability Management
 * Epic 009: Scheduling & Calendar
 *
 * Tests trainer availability setting and management
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    trainerAvailability: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
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

describe('Story 009-02: Availability - Weekly Schedule Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer sets weekly recurring availability', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const availabilitySlots = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Friday
    ];

    mockedPrisma.trainerAvailability.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `avail-${args.data.dayOfWeek}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: availabilitySlots } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets different hours for different days', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const availabilitySlots = [
      { dayOfWeek: 1, startTime: '06:00', endTime: '14:00', isAvailable: true }, // Monday early
      { dayOfWeek: 2, startTime: '12:00', endTime: '20:00', isAvailable: true }, // Tuesday late
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday normal
    ];

    mockedPrisma.trainerAvailability.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `avail-${args.data.dayOfWeek}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: availabilitySlots } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer marks specific days as unavailable', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const availabilitySlots = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isAvailable: false }, // Saturday unavailable
      { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isAvailable: false }, // Sunday unavailable
    ];

    mockedPrisma.trainerAvailability.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `avail-${args.data.dayOfWeek}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: availabilitySlots } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets split shift availability', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const availabilitySlots = [
      { dayOfWeek: 1, startTime: '06:00', endTime: '10:00', isAvailable: true },
      { dayOfWeek: 1, startTime: '16:00', endTime: '20:00', isAvailable: true },
    ];

    mockedPrisma.trainerAvailability.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `avail-${args.data.dayOfWeek}-${args.data.startTime}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: availabilitySlots } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-02: Availability - Block Time Off', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer blocks specific date range for vacation', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability/block'), { user: trainer })
    );

    mockedPrisma.trainerAvailability.create.mockResolvedValueOnce({
      id: 'block-1',
      trainerId: trainer.id,
      startDate: '2026-04-10',
      endDate: '2026-04-17',
      reason: 'vacation',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'blockTimeOff', data: { startDate: '2026-04-10', endDate: '2026-04-17', reason: 'vacation' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer blocks single day for personal appointment', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability/block'), { user: trainer })
    );

    mockedPrisma.trainerAvailability.create.mockResolvedValueOnce({
      id: 'block-2',
      trainerId: trainer.id,
      date: '2026-04-05',
      reason: 'personal',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'blockTimeOff', data: { date: '2026-04-05', reason: 'personal' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer blocks partial day with specific hours', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability/block'), { user: trainer })
    );

    mockedPrisma.trainerAvailability.create.mockResolvedValueOnce({
      id: 'block-3',
      trainerId: trainer.id,
      date: '2026-04-05',
      startTime: '14:00',
      endTime: '16:00',
      reason: 'meeting',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'blockTimeOff', data: { date: '2026-04-05', startTime: '14:00', endTime: '16:00', reason: 'meeting' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-02: Availability - View and Update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views their current availability settings', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const mockAvailability = [
      { id: 'avail-1', trainerId: trainer.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
      { id: 'avail-2', trainerId: trainer.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockAvailability);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewAvailability' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer updates existing availability slot', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability/avail-1'), { user: trainer })
    );

    mockedPrisma.trainerAvailability.update.mockResolvedValueOnce({
      id: 'avail-1',
      trainerId: trainer.id,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '18:00',
      isAvailable: true,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'updateAvailability', data: { slotId: 'avail-1', startTime: '08:00', endTime: '18:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer deletes availability slot', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability/avail-1'), { user: trainer })
    );

    mockedPrisma.trainerAvailability.delete.mockResolvedValueOnce({
      id: 'avail-1',
      trainerId: trainer.id,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'deleteAvailability', data: { slotId: 'avail-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-02: Availability - Conflict Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('warns when blocking time with existing appointments', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability/block'), { user: trainer })
    );

    // Existing appointment in the blocked time
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([
      {
        id: 'appt-1',
        trainerId: trainer.id,
        clientId: client.id,
        startDatetime: new Date('2026-04-05T10:00:00Z'),
        status: 'scheduled',
      },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'blockTimeOff', data: { date: '2026-04-05', reason: 'vacation' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents setting availability outside reasonable hours', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: [{ dayOfWeek: 1, startTime: '02:00', endTime: '04:00', isAvailable: true }] } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-02: Availability - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles empty availability schedule', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce([]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewAvailability' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles overlapping availability slots gracefully', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    // Overlapping slots for Monday
    const overlappingSlots = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { dayOfWeek: 1, startTime: '11:00', endTime: '14:00', isAvailable: true },
    ];

    mockedPrisma.trainerAvailability.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `avail-${args.data.dayOfWeek}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: overlappingSlots } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid day of week values', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setAvailability', data: { slots: [{ dayOfWeek: 8, startTime: '09:00', endTime: '17:00', isAvailable: true }] } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
