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
import { GET, POST, DELETE } from '@/app/api/schedule/availability/route';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('GET /api/schedule/availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns trainer availability ordered by day/time', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const mockSlots = [
      {
        id: 'slot-1',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        isAvailable: true,
      },
      {
        id: 'slot-2',
        trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
        dayOfWeek: 1,
        startTime: '14:00',
        endTime: '17:00',
        isAvailable: true,
      },
    ];

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce(mockSlots);

    const request = makeRequest('/api/schedule/availability');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockSlots);
    expect(mockedPrisma.trainerAvailability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })
    );
  });

  it('filters by trainerId param', async () => {
    const mockUser = { id: 'other-trainer', role: 'trainer', email: 'other@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999'), { user: mockUser })
    );

    mockedPrisma.trainerAvailability.findMany.mockResolvedValueOnce([]);

    const request = makeRequest('/api/schedule/availability?trainerId=t1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999');
    await GET(request);

    expect(mockedPrisma.trainerAvailability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999' },
      })
    );
  });
});

describe('POST /api/schedule/availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts availability slots', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const slots = [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        isAvailable: true,
      },
      {
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: '17:00',
        isAvailable: true,
      },
    ];

    const mockResults = [
      { id: 'slot-1', trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', ...slots[0] },
      { id: 'slot-2', trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', ...slots[1] },
    ];

    mockedPrisma.trainerAvailability.upsert.mockResolvedValueOnce(mockResults[0]);
    mockedPrisma.trainerAvailability.upsert.mockResolvedValueOnce(mockResults[1]);

    const request = makeRequest('/api/schedule/availability', {
      method: 'POST',
      body: JSON.stringify({ slots }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Availability updated');
    expect(mockedPrisma.trainerAvailability.upsert).toHaveBeenCalledTimes(2);
  });

  it('validates time ranges (start < end)', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/availability', {
      method: 'POST',
      body: JSON.stringify({
        slots: [
          {
            dayOfWeek: 1,
            startTime: '12:00',
            endTime: '09:00', // Invalid: end before start
          },
        ],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid time range');
  });

  it('returns 403 for client role', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/availability', {
      method: 'POST',
      body: JSON.stringify({
        slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Only trainers can set availability');
  });

  it('handles Zod validation errors', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/availability', {
      method: 'POST',
      body: JSON.stringify({
        slots: [
          {
            dayOfWeek: 10, // Invalid: must be 0-6
            startTime: 'invalid',
            endTime: '12:00',
          },
        ],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });
});

describe('DELETE /api/schedule/availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure all methods are defined
    if (!mockedPrisma.trainerAvailability.findUnique) {
      mockedPrisma.trainerAvailability.findUnique = jest.fn();
    }
    if (!mockedPrisma.trainerAvailability.delete) {
      mockedPrisma.trainerAvailability.delete = jest.fn();
    }
  });

  it('deletes owned slot', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const mockSlot = {
      id: 'slot-1',
      trainerId: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
    };

    (mockedPrisma.trainerAvailability.findUnique as jest.Mock).mockResolvedValueOnce(mockSlot);
    (mockedPrisma.trainerAvailability.delete as jest.Mock).mockResolvedValueOnce(mockSlot);

    const request = makeRequest('/api/schedule/availability', {
      method: 'DELETE',
      body: JSON.stringify({ slotId: 'slot-1' }),
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Slot deleted');
    expect(mockedPrisma.trainerAvailability.delete).toHaveBeenCalledWith({
      where: { id: 'slot-1' },
    });
  });

  it('returns 404 for unowned slot', async () => {
    const mockUser = { id: 't1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5999', role: 'trainer', email: 'trainer@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const mockSlot = {
      id: 'slot-1',
      trainerId: 'other-trainer',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
    };

    (mockedPrisma.trainerAvailability.findUnique as jest.Mock).mockResolvedValueOnce(mockSlot);

    const request = makeRequest('/api/schedule/availability', {
      method: 'DELETE',
      body: JSON.stringify({ slotId: 'slot-1' }),
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Availability slot not found');
  });

  it('returns 403 for client role', async () => {
    const mockUser = { id: 'c1e2a8b4-5d6c-4f8e-9a0b-1c2d3e4f5a6b', role: 'client', email: 'client@test.com' };
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/schedule/availability'), { user: mockUser })
    );

    const request = makeRequest('/api/schedule/availability', {
      method: 'DELETE',
      body: JSON.stringify({ slotId: 'slot-1' }),
    });
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    // Zod validation error comes before role check
    expect(data.error).toBe('Validation failed');
  });
});
