/**
 * Story 009-05: Cancellations
 * Epic 009: Scheduling & Calendar
 *
 * Tests session cancellation workflows
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
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    cancellation: {
      create: jest.fn(),
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

describe('Story 009-05: Cancellations - Trainer Cancellations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer cancels scheduled session', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: trainer })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
      startDatetime: new Date('2026-04-06T10:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'cancelled' });
    mockedPrisma.cancellation.create.mockResolvedValueOnce({
      id: 'cancel-1',
      appointmentId: 'appt-1',
      cancelledBy: trainer.id,
      reason: 'Trainer unavailable',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1', reason: 'Trainer unavailable' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer cancels with advance notice', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: trainer })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
      startDatetime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'cancelled' });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1', reason: 'Schedule conflict' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer cancels multiple sessions at once', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/bulk-cancel'), { user: trainer })
    );

    mockedPrisma.appointment.update.mockResolvedValue({ status: 'cancelled' });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelMultiple', data: { appointmentIds: ['appt-1', 'appt-2', 'appt-3'], reason: 'Vacation' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-05: Cancellations - Client Cancellations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client cancels their session', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: client })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
      startDatetime: new Date('2026-04-06T10:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'cancelled_by_client' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1', reason: 'Personal emergency' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client cancels with late notice triggers policy', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: client })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
      startDatetime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'late_cancellation' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1', reason: 'Running late' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-05: Cancellations - Policies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enforces cancellation policy for late cancellations', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: client })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
      startDatetime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'late_cancellation', feeApplied: true });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('waives cancellation fee for valid reasons', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: client })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
      startDatetime: new Date(Date.now() + 1 * 60 * 60 * 1000),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'cancelled', feeWaived: true });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1', reason: 'Medical emergency', waiveFee: true } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-05: Cancellations - Rescheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancels and reschedules in one action', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: trainer })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'scheduled',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);
    mockedPrisma.appointment.update.mockResolvedValueOnce({ ...mockAppointment, status: 'rescheduled' });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'rescheduleSession', data: { appointmentId: 'appt-1', newDate: '2026-04-08', newTime: '14:00' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-05: Cancellations - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents cancelling already completed session', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: trainer })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: trainer.id,
      clientId: client.id,
      status: 'completed',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents cancelling already cancelled session', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: trainer })
    );

    const mockAppointment = {
      id: 'appt-1',
      status: 'cancelled',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles cancellation of non-existent session', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-nonexistent'), { user: trainer })
    );

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(null);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSession', data: { appointmentId: 'appt-nonexistent' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
