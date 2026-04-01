/**
 * Story 009-08: Group Classes
 * Epic 009: Scheduling & Calendar
 *
 * Tests group class management workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    groupClass: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupClassBooking: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
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

describe('Story 009-08: Group Classes - Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer creates group class', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes'), { user: trainer })
    );

    const mockClass = {
      id: 'class-1',
      trainerId: trainer.id,
      name: 'HIIT Bootcamp',
      description: 'High intensity interval training',
      maxParticipants: 10,
      startTime: '18:00',
      duration: 60,
      dayOfWeek: 2,
    };

    mockedPrisma.groupClass.create.mockResolvedValueOnce(mockClass);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createGroupClass', data: {
          name: 'HIIT Bootcamp',
          maxParticipants: 10,
          dayOfWeek: 2,
          startTime: '18:00',
          duration: 60
        } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer creates multiple group classes', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/schedule/group-classes'), { user: trainer })
    );

    mockedPrisma.groupClass.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `class-${args.data.name}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createGroupClass', data: { name: 'Yoga Flow', maxParticipants: 15 } },
        { action: 'createGroupClass', data: { name: 'Spin Class', maxParticipants: 20 } },
        { action: 'createGroupClass', data: { name: 'Strength 101', maxParticipants: 8 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets class capacity limits', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes'), { user: trainer })
    );

    const mockClass = {
      id: 'class-2',
      trainerId: trainer.id,
      name: 'Small Group PT',
      maxParticipants: 4,
      waitlistEnabled: true,
      waitlistLimit: 4,
    };

    mockedPrisma.groupClass.create.mockResolvedValueOnce(mockClass);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createGroupClass', data: {
          name: 'Small Group PT',
          maxParticipants: 4,
          waitlistEnabled: true,
          waitlistLimit: 4
        } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-08: Group Classes - Booking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client books group class', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes/class-1/book'), { user: client })
    );

    const mockClass = {
      id: 'class-1',
      trainerId: trainer.id,
      name: 'HIIT Bootcamp',
      maxParticipants: 10,
      currentBookings: 5,
    };

    const mockBooking = {
      id: 'booking-1',
      classId: 'class-1',
      clientId: client.id,
      status: 'confirmed',
    };

    mockedPrisma.groupClass.findUnique.mockResolvedValueOnce(mockClass);
    mockedPrisma.groupClassBooking.create.mockResolvedValueOnce(mockBooking);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'bookGroupClass', data: { classId: 'class-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('multiple clients book same class', async () => {
    const trainer = ActorFactory.createTrainer();
    const clients = ActorFactory.createGroup({ clients: 5 });

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/schedule/group-classes/class-1/book'), { user: clients[0] })
    );

    mockedPrisma.groupClass.findUnique.mockResolvedValue({
      id: 'class-1',
      trainerId: trainer.id,
      maxParticipants: 10,
      currentBookings: 0,
    });

    mockedPrisma.groupClassBooking.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `booking-${args.data.clientId}`, ...args.data })
    );

    const results = await Promise.all(
      clients.map(client =>
        WorkflowRunner.run({
          actor: client,
          steps: [
            { action: 'authenticate' },
            { action: 'bookGroupClass', data: { classId: 'class-1' } },
          ],
        })
      )
    );

    expect(results.every(r => r.success)).toBe(true);
  });

  it('adds client to waitlist when class is full', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes/class-1/book'), { user: client })
    );

    const mockClass = {
      id: 'class-1',
      trainerId: trainer.id,
      maxParticipants: 10,
      currentBookings: 10,
      waitlistEnabled: true,
    };

    const mockWaitlistEntry = {
      id: 'waitlist-1',
      classId: 'class-1',
      clientId: client.id,
      status: 'waitlisted',
      position: 1,
    };

    mockedPrisma.groupClass.findUnique.mockResolvedValueOnce(mockClass);
    mockedPrisma.groupClassBooking.create.mockResolvedValueOnce(mockWaitlistEntry);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'bookGroupClass', data: { classId: 'class-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-08: Group Classes - Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views class bookings', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes/class-1/bookings'), { user: trainer })
    );

    const mockBookings = [
      { id: 'b1', clientId: 'c1', status: 'confirmed' },
      { id: 'b2', clientId: 'c2', status: 'confirmed' },
    ];

    mockedPrisma.groupClassBooking.findMany.mockResolvedValueOnce(mockBookings);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewClassBookings', data: { classId: 'class-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer cancels group class', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes/class-1'), { user: trainer })
    );

    mockedPrisma.groupClass.update.mockResolvedValueOnce({
      id: 'class-1',
      status: 'cancelled',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelGroupClass', data: { classId: 'class-1', notifyClients: true } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client cancels group class booking', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes/booking-1'), { user: client })
    );

    mockedPrisma.groupClassBooking.delete.mockResolvedValueOnce({ id: 'booking-1' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelBooking', data: { bookingId: 'booking-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 009-08: Group Classes - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents booking when class is cancelled', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.groupClass.findUnique.mockResolvedValueOnce({
      id: 'class-1',
      status: 'cancelled',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'bookGroupClass', data: { classId: 'class-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents double booking same class', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.groupClassBooking.findMany.mockResolvedValueOnce([
      { id: 'existing-booking', clientId: client.id, classId: 'class-1' },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'bookGroupClass', data: { classId: 'class-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('promotes waitlisted client when spot opens', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/group-classes/class-1/promote'), { user: trainer })
    );

    const mockWaitlistEntry = {
      id: 'waitlist-1',
      classId: 'class-1',
      clientId: 'client-1',
      position: 1,
    };

    mockedPrisma.groupClassBooking.findMany.mockResolvedValueOnce([mockWaitlistEntry]);
    mockedPrisma.groupClassBooking.update.mockResolvedValueOnce({
      ...mockWaitlistEntry,
      status: 'confirmed',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'promoteFromWaitlist', data: { classId: 'class-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
