/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock auth first
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

// Mock prisma
jest.mock('@/lib/db/prisma');

// Import after mocks
import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { GET, POST } from '@/app/api/schedule/appointments/route';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/schedule/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns appointments for trainer', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    const mockAppointments = [
      {
        id: 'appt-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
        title: 'Training Session',
        startDatetime: new Date('2026-02-15T10:00:00Z'),
        endDatetime: new Date('2026-02-15T11:00:00Z'),
        status: 'scheduled',
        trainer: { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', email: 'trainer@test.com', userProfile: null },
        client: { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', email: 'client@test.com', userProfile: null },
      },
    ];

    mockedPrisma.appointment.findMany.mockResolvedValueOnce(mockAppointments);
    mockedPrisma.appointment.count.mockResolvedValueOnce(1);

    const request = makeRequest('/api/schedule/appointments');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].id).toBe('appt-1');
    expect(data.data[0].title).toBe('Training Session');
    expect(data.meta).toEqual({ total: 1, hasMore: false, limit: 100, offset: 0 });
    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999' },
      })
    );
  });

  it('returns appointments for client', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    const mockAppointments = [
      {
        id: 'appt-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
        title: 'Training Session',
        startDatetime: new Date('2026-02-15T10:00:00Z'),
        endDatetime: new Date('2026-02-15T11:00:00Z'),
        status: 'scheduled',
        trainer: { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', email: 'trainer@test.com', userProfile: null },
        client: { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', email: 'client@test.com', userProfile: null },
      },
    ];

    mockedPrisma.appointment.findMany.mockResolvedValueOnce(mockAppointments);
    mockedPrisma.appointment.count.mockResolvedValueOnce(1);

    const request = makeRequest('/api/schedule/appointments');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b' },
      })
    );
  });

  it('filters by date range', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments?startDate=2026-02-15&endDate=2026-02-20'), { user: mockUser })
    );

    mockedPrisma.appointment.findMany.mockResolvedValueOnce([]);
    mockedPrisma.appointment.count.mockResolvedValueOnce(0);

    const request = makeRequest('/api/schedule/appointments?startDate=2026-02-15&endDate=2026-02-20');
    await GET(request);

    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDatetime: {
            gte: new Date('2026-02-15'),
            lte: new Date('2026-02-20'),
          },
        }),
      })
    );
  });

  it('filters by status', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments?status=confirmed'), { user: mockUser })
    );

    mockedPrisma.appointment.findMany.mockResolvedValueOnce([]);
    mockedPrisma.appointment.count.mockResolvedValueOnce(0);

    const request = makeRequest('/api/schedule/appointments?status=confirmed');
    await GET(request);

    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'confirmed',
        }),
      })
    );
  });

  it('pagination works', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments?limit=10&offset=20'), { user: mockUser })
    );

    mockedPrisma.appointment.findMany.mockResolvedValueOnce([]);
    mockedPrisma.appointment.count.mockResolvedValueOnce(50);

    const request = makeRequest('/api/schedule/appointments?limit=10&offset=20');
    const response = await GET(request);
    const data = await response.json();

    expect(mockedPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      })
    );
    expect(data.meta).toEqual({ total: 50, hasMore: true, limit: 10, offset: 20 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = makeRequest('/api/schedule/appointments');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe('POST /api/schedule/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates appointment successfully', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    // Use Monday Feb 16, 2026 (dayOfWeek = 1)
    const appointmentData = {
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Training Session',
      appointmentType: 'one_on_one',
      startDatetime: '2026-02-16T10:00:00Z',
      endDatetime: '2026-02-16T11:00:00Z',
    };

    const mockAvailability = {
      id: 'avail-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '12:00',
      isAvailable: true,
    };

    const mockAppointment = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Training Session',
      startDatetime: new Date('2026-02-16T10:00:00Z'),
      endDatetime: new Date('2026-02-16T11:00:00Z'),
      durationMinutes: 60,
      status: 'scheduled',
      trainer: { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', email: 'trainer@test.com' },
      client: { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', email: 'client@test.com' },
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null); // No conflict
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValueOnce(mockAppointment);

    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('appt-1');
    expect(data.data.title).toBe('Training Session');
    expect(data.data.durationMinutes).toBe(60);
    expect(data.data.status).toBe('scheduled');
    expect(data.message).toBe('Appointment created');
  });

  it('returns 403 for client role', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'client-2',
        title: 'Training',
        appointmentType: 'one_on_one',
        startDatetime: '2026-02-15T10:00:00Z',
        endDatetime: '2026-02-15T11:00:00Z',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Only trainers can create appointments');
  });

  it('validates required fields (Zod)', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
        title: 'Training',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('returns 400 for end time before start', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
        title: 'Training',
        appointmentType: 'one_on_one',
        startDatetime: '2026-02-15T11:00:00Z',
        endDatetime: '2026-02-15T10:00:00Z',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('End time must be after start time');
  });

  it('returns 409 for conflicting appointment', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    const mockConflict = {
      id: 'existing-appt',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      startDatetime: new Date('2026-02-16T10:00:00Z'),
      endDatetime: new Date('2026-02-16T11:00:00Z'),
      status: 'scheduled',
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(mockConflict);

    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
        title: 'Training',
        appointmentType: 'one_on_one',
        startDatetime: '2026-02-16T10:30:00Z',
        endDatetime: '2026-02-16T11:30:00Z',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Time slot conflicts with an existing appointment');
  });

  it('returns 400 when outside availability window', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(null); // No availability

    // Try creating appointment on a day/time with no availability
    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', // Valid UUID
        title: 'Training Session',
        description: 'Test session',
        appointmentType: 'one_on_one',
        startDatetime: '2026-02-16T10:00:00Z', // Monday
        endDatetime: '2026-02-16T11:00:00Z',
        isOnline: false,
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Time is outside your availability window');
  });

  it('calculates duration correctly', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments'), { user: mockUser })
    );

    // Use Saturday Feb 21, 2026 (dayOfWeek = 6)
    const mockAvailability = {
      id: 'avail-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      dayOfWeek: 6, // Saturday
      startTime: '09:00',
      endTime: '18:00',
      isAvailable: true,
    };

    const mockCreatedAppointment = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Extended Training',
      durationMinutes: 90,
      startDatetime: new Date('2026-02-21T10:00:00Z'),
      endDatetime: new Date('2026-02-21T11:30:00Z'),
      status: 'scheduled',
      trainer: { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', email: 'trainer@test.com' },
      client: { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', email: 'client@test.com' },
    };

    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null);
    mockedPrisma.trainerAvailability.findFirst.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.create.mockResolvedValueOnce(mockCreatedAppointment);

    const request = makeRequest('/api/schedule/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', // Valid UUID
        title: 'Extended Training',
        description: '90-minute session',
        appointmentType: 'one_on_one',
        startDatetime: '2026-02-21T10:00:00Z',
        endDatetime: '2026-02-21T11:30:00Z',
        isOnline: false,
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockedPrisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          durationMinutes: 90,
        }),
      })
    );
  });
});
