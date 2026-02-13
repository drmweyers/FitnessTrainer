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
import { GET, PUT, DELETE } from '@/app/api/schedule/appointments/[id]/route';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/schedule/appointments/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns appointment with includes', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Training Session',
      startDatetime: new Date('2026-02-15T10:00:00Z'),
      endDatetime: new Date('2026-02-15T11:00:00Z'),
      trainer: {
        id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        email: 'trainer@test.com',
        userProfile: { bio: 'Certified trainer', profilePhotoUrl: null },
      },
      client: {
        id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
        email: 'client@test.com',
        userProfile: { bio: null, profilePhotoUrl: null },
      },
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);

    const request = makeRequest('/api/schedule/appointments/appt-1');
    const response = await GET(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('appt-1');
    expect(data.data.title).toBe('Training Session');
    expect(data.data.trainer).toBeDefined();
    expect(data.data.client).toBeDefined();
  });

  it('returns 404 for nonexistent appointment', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/nonexistent'), { user: mockUser })
    );

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(null);

    const request = makeRequest('/api/schedule/appointments/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Appointment not found');
  });

  it('returns 403 for unauthorized user', async () => {
    const mockUser = { id: 'other-user', role: 'trainer', email: 'other@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockAppointment = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Training Session',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockAppointment);

    const request = makeRequest('/api/schedule/appointments/appt-1');
    const response = await GET(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Not authorized to view this appointment');
  });
});

describe('PUT /api/schedule/appointments/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates title and status', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Old Title',
      startDatetime: new Date('2026-02-15T10:00:00Z'),
      endDatetime: new Date('2026-02-15T11:00:00Z'),
      status: 'scheduled',
    };

    const mockUpdated = {
      ...mockExisting,
      title: 'New Title',
      status: 'confirmed',
      trainer: { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', email: 'trainer@test.com' },
      client: { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', email: 'client@test.com' },
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce(mockUpdated);

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'New Title',
        status: 'confirmed',
      }),
    });
    const response = await PUT(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('New Title');
    expect(data.data.status).toBe('confirmed');
  });

  it('reschedules (new datetime)', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      title: 'Training',
      startDatetime: new Date('2026-02-15T10:00:00Z'),
      endDatetime: new Date('2026-02-15T11:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(null); // No conflict
    mockedPrisma.appointment.update.mockResolvedValueOnce({
      ...mockExisting,
      startDatetime: new Date('2026-02-16T10:00:00Z'),
      endDatetime: new Date('2026-02-16T11:00:00Z'),
      durationMinutes: 60,
      trainer: { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', email: 'trainer@test.com' },
      client: { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', email: 'client@test.com' },
    });

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({
        startDatetime: '2026-02-16T10:00:00Z',
        endDatetime: '2026-02-16T11:00:00Z',
      }),
    });
    const response = await PUT(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDatetime: new Date('2026-02-16T10:00:00Z'),
          endDatetime: new Date('2026-02-16T11:00:00Z'),
          durationMinutes: 60,
        }),
      })
    );
  });

  it('returns 400 for end before start on reschedule', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: new Date('2026-02-15T10:00:00Z'),
      endDatetime: new Date('2026-02-15T11:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({
        startDatetime: '2026-02-16T11:00:00Z',
        endDatetime: '2026-02-16T10:00:00Z',
      }),
    });
    const response = await PUT(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('End time must be after start time');
  });

  it('returns 409 for conflict on reschedule', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: new Date('2026-02-15T10:00:00Z'),
      endDatetime: new Date('2026-02-15T11:00:00Z'),
    };

    const mockConflict = {
      id: 'other-appt',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      startDatetime: new Date('2026-02-16T10:00:00Z'),
      endDatetime: new Date('2026-02-16T11:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.findFirst.mockResolvedValueOnce(mockConflict);

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({
        startDatetime: '2026-02-16T10:30:00Z',
        endDatetime: '2026-02-16T11:30:00Z',
      }),
    });
    const response = await PUT(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Rescheduled time conflicts with another appointment');
  });

  it('returns 404 for nonexistent appointment', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/nonexistent'), { user: mockUser })
    );

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(null);

    const request = makeRequest('/api/schedule/appointments/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
    });
    const response = await PUT(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Appointment not found');
  });

  it('returns 403 for non-trainer', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
    });
    const response = await PUT(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Only the trainer can update this appointment');
  });
});

describe('DELETE /api/schedule/appointments/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancels appointment (sets status to cancelled)', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: new Date('2026-02-20T10:00:00Z'),
      status: 'scheduled',
    };

    const mockCancelled = {
      ...mockExisting,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'Cancelled by trainer',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce(mockCancelled);

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Appointment cancelled');
    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'cancelled',
          cancelledAt: expect.any(Date),
        }),
      })
    );
  });

  it('trainer can cancel', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: new Date('2026-02-20T10:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce({
      ...mockExisting,
      status: 'cancelled',
    });

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'appt-1' } });

    expect(response.status).toBe(200);
  });

  it('client can cancel', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: new Date('2026-02-20T10:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce({
      ...mockExisting,
      status: 'cancelled',
    });

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'appt-1' } });

    expect(response.status).toBe(200);
  });

  it('returns 404 for nonexistent appointment', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/nonexistent'), { user: mockUser })
    );

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(null);

    const request = makeRequest('/api/schedule/appointments/nonexistent', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Appointment not found');
  });

  it('returns 403 for unrelated user', async () => {
    const mockUser = { id: 'other-user', role: 'trainer', email: 'other@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Not authorized to cancel this appointment');
  });

  it('includes cancel reason', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: new Date('2026-02-20T10:00:00Z'),
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce({
      ...mockExisting,
      status: 'cancelled',
      cancelReason: 'Client emergency',
    });

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
      body: JSON.stringify({ cancelReason: 'Client emergency' }),
    });
    await DELETE(request, { params: { id: 'appt-1' } });

    expect(mockedPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cancelReason: 'Client emergency',
        }),
      })
    );
  });

  it('late cancellation flagging - within 24 hours', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    // Appointment in 12 hours
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 12);

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: futureDate,
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce({
      ...mockExisting,
      status: 'cancelled',
    });

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.lateCancellation).toBe(true);
  });

  it('late cancellation flagging - more than 24 hours', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/appointments/appt-1'), { user: mockUser })
    );

    // Appointment in 48 hours
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 48);

    const mockExisting = {
      id: 'appt-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      clientId: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b',
      startDatetime: futureDate,
    };

    mockedPrisma.appointment.findUnique.mockResolvedValueOnce(mockExisting);
    mockedPrisma.appointment.update.mockResolvedValueOnce({
      ...mockExisting,
      status: 'cancelled',
    });

    const request = makeRequest('/api/schedule/appointments/appt-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'appt-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.lateCancellation).toBeUndefined();
  });
});
