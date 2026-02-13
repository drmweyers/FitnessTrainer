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
import { GET } from '@/app/api/schedule/slots/route';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/schedule/slots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns available time slots for a date', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    // Monday (dayOfWeek = 1)
    const date = '2026-02-16'; // This is a Monday
    const mockAvailability = [
      {
        id: 'avail-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        isAvailable: true,
      },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([]);

    const request = makeRequest(`/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999&date=${date}&duration=60`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data[0]).toHaveProperty('startTime');
    expect(data.data[0]).toHaveProperty('endTime');
    expect(data.data[0]).toHaveProperty('available');
  });

  it('subtracts booked appointments', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    const date = '2026-02-16';
    const mockAvailability = [
      {
        id: 'avail-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        isAvailable: true,
      },
    ];

    // Existing appointment from 10:00-11:00 (use date string to match how API constructs dates)
    const mockAppointments = [
      {
        id: 'appt-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        startDatetime: new Date(date + 'T10:00:00'),
        endDatetime: new Date(date + 'T11:00:00'),
        status: 'scheduled',
      },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.findMany.mockResolvedValueOnce(mockAppointments);

    const request = makeRequest(`/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999&date=${date}&duration=60`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify that some slots exist
    expect(data.data.length).toBeGreaterThan(0);

    // Verify at least one slot is marked as unavailable (the booked one)
    const hasUnavailableSlot = data.data.some((slot: any) => slot.available === false);
    expect(hasUnavailableSlot).toBe(true);
  });

  it('returns empty when trainer not available on day', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce([]);

    const request = makeRequest('/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999&date=2026-02-16&duration=60');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.message).toBe('Trainer is not available on this day');
  });

  it('returns 400 for missing trainerId', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/slots?date=2026-02-16');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('trainerId and date are required');
  });

  it('returns 400 for missing date', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('trainerId and date are required');
  });

  it('returns 400 for invalid date', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999&date=invalid-date');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid date format');
  });

  it('generates 30-min increment slots', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    const mockAvailability = [
      {
        id: 'avail-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:00',
        isAvailable: true,
      },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.findMany.mockResolvedValueOnce([]);

    // Request 30-min slots
    const request = makeRequest('/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999&date=2026-02-16&duration=30');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Should have at least 2 slots (10:00-10:30, 10:30-11:00)
    expect(data.data.length).toBeGreaterThanOrEqual(2);

    // Verify 30-min intervals
    const firstSlot = data.data[0];
    const secondSlot = data.data[1];
    if (firstSlot && secondSlot) {
      expect(firstSlot.startTime).toBe('10:00');
      expect(firstSlot.endTime).toBe('10:30');
      expect(secondSlot.startTime).toBe('10:30');
      expect(secondSlot.endTime).toBe('11:00');
    }
  });

  it('all slots booked returns all unavailable', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/slots'), { user: mockUser })
    );

    const date = '2026-02-16';
    const mockAvailability = [
      {
        id: 'avail-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:00',
        isAvailable: true,
      },
    ];

    // Appointment covering entire availability window (use date string for consistency)
    const mockAppointments = [
      {
        id: 'appt-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        startDatetime: new Date(date + 'T10:00:00'),
        endDatetime: new Date(date + 'T11:00:00'),
        status: 'scheduled',
      },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockAvailability);
    mockedPrisma.appointment.findMany.mockResolvedValueOnce(mockAppointments);

    const request = makeRequest(`/api/schedule/slots?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999&date=${date}&duration=60`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Should have at least one slot (10:00-11:00)
    expect(data.data.length).toBeGreaterThan(0);

    // All slots should be unavailable since appointment covers the window
    const allUnavailable = data.data.every((slot: any) => slot.available === false);
    expect(allUnavailable).toBe(true);
  });
});
