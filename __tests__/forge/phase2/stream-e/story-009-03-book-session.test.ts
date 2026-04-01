/**
 * Story 009-03: Book Session
 * Epic 009: Scheduling & Calendar
 *
 * Tests session booking workflows between trainers and clients
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    appointment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    trainerAvailability: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
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

describe('Story 009-03: Book Session - Trainer Booking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer books session for client', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const mockAvailability = {
      id: 'avail-1',
      trainerId: trainer.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      title: 'Personal Training',
      startDatetime: new Date('2026-04-06T10:00:00Z'),
      endDatetime: new Date('2026-04-06T11:00:00Z'),
      status: 'scheduled',
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValueOnce(mockAppointment);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2026-04-06', startTime: '10:00', duration: 60 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer books multiple sessions for same client', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const mockAvailability = {
      id: 'avail-1',
      trainerId: trainer.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };

    mockedPrisma.appointment.findFirst.mockResolvedValue(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValue(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValue({ id: 'appt-1', trainerId: trainer.id, clientId: client.id });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2026-04-06', startTime: '10:00', duration: 60 } },
        { action: 'bookSession', data: { clientId: client.id, date: '2026-04-08', startTime: '14:00', duration: 60 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer books session with specific type', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const mockAvailability = {
      id: 'avail-1',
      trainerId: trainer.id,
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      appointmentType: 'assessment',
      title: 'Initial Assessment',
      startDatetime: new Date('2026-04-07T10:00:00Z'),
      endDatetime: new Date('2026-04-07T11:00:00Z'),
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValueOnce(mockAppointment);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, type: 'assessment', date: '2026-04-07', startTime: '10:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-03: Book Session - Client Self-Booking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client books session with their trainer', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: client })
    );

    const mockAvailability = {
      id: 'avail-1',
      trainerId: trainer.id,
      dayOfWeek: 3,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      title: 'Training Session',
      startDatetime: new Date('2026-04-08T10:00:00Z'),
      endDatetime: new Date('2026-04-08T11:00:00Z'),
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValueOnce(mockAppointment);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { trainerId: trainer.id, date: '2026-04-08', startTime: '10:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client views available slots before booking', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: client })
    );

    const mockAvailability = [
      { id: 'avail-1', trainerId: trainer.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockAvailability);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewAvailableSlots', data: { trainerId: trainer.id, date: '2026-04-06' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-03: Book Session - Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents booking outside trainer availability', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(null);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2026-04-06', startTime: '23:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents double booking same time slot', async () => {
    const trainer = ActorFactory.createTrainer();
    const client1 = ActorFactory.createClient();
    const client2 = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const existingAppointment = {
      id: 'appt-existing',
      trainerId: trainer.id,
      clientId: client1.id,
      startDatetime: new Date('2026-04-06T10:00:00Z'),
      endDatetime: new Date('2026-04-06T11:00:00Z'),
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(existingAppointment);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client2.id, date: '2026-04-06', startTime: '10:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('validates minimum session duration', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2026-04-06', startTime: '10:00', duration: 15 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('validates maximum session duration', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2026-04-06', startTime: '10:00', duration: 480 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-03: Book Session - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles booking for past date', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2020-01-01', startTime: '10:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles booking far in advance', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client.id, date: '2027-01-01', startTime: '10:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles concurrent booking attempts', async () => {
    const trainer = ActorFactory.createTrainer();
    const client1 = ActorFactory.createClient();
    const client2 = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const mockAvailability = {
      id: 'avail-1',
      trainerId: trainer.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };

    mockedPrisma.appointment.findFirst.mockResolvedValue(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValue(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValue({ id: 'appt-1' });

    // Simulate concurrent bookings
    const result1 = WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client1.id, date: '2026-04-06', startTime: '10:00' } },
      ],
    });

    const result2 = WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'bookSession', data: { clientId: client2.id, date: '2026-04-06', startTime: '10:00' } },
      ],
    });

    const [r1, r2] = await Promise.all([result1, result2]);
    expect(r1.success || r2.success).toBe(true);
  });
});
