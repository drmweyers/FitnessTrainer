/**
 * Tests for app/api/analytics/measurements/[id]/route.ts
 * PUT /api/analytics/measurements/[id]
 * DELETE /api/analytics/measurements/[id]
 */

import { NextResponse } from 'next/server';
import { PUT, DELETE } from '@/app/api/analytics/measurements/[id]/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockClientUser } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockedPrisma = prisma as any;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuthAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('PUT /api/analytics/measurements/[id]', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: 75 },
    });
    const response = await PUT(request, { params: { id: validId } });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid UUID format', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/measurements/invalid-id', {
      method: 'PUT',
      body: { weight: 75 },
    });
    const response = await PUT(request, { params: { id: 'invalid-id' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid measurement ID');
  });

  it('returns 400 for invalid request body', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([{ id: validId, user_id: mockClientUser.id }]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: -10 }, // Negative weight is invalid
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 404 when measurement not found', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: 75 },
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Measurement not found');
  });

  it('returns 400 when no fields to update', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([{ id: validId, user_id: mockClientUser.id }]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: {},
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('No fields to update');
  });

  it('successfully updates weight field', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValueOnce([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: validId,
        user_id: mockClientUser.id,
        weight: 75,
        height: null,
        body_fat_percentage: null,
        muscle_mass: null,
        measurements: null,
        recorded_at: new Date('2024-01-01'),
      },
    ]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: 75 },
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.weight).toBe(75);
  });

  it('successfully updates multiple fields', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValueOnce([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: validId,
        user_id: mockClientUser.id,
        weight: 75,
        height: 180,
        body_fat_percentage: 15,
        muscle_mass: 35,
        measurements: { chest: 100, waist: 80 },
        recorded_at: new Date('2024-01-01'),
      },
    ]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: {
        weight: 75,
        height: 180,
        bodyFatPercentage: 15,
        muscleMass: 35,
        measurements: { chest: 100, waist: 80 },
      },
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.weight).toBe(75);
    expect(body.data.height).toBe(180);
    expect(body.data.bodyFatPercentage).toBe(15);
    expect(body.data.muscleMass).toBe(35);
  });

  it('updates measurementDate field', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValueOnce([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: validId,
        user_id: mockClientUser.id,
        weight: null,
        height: null,
        body_fat_percentage: null,
        muscle_mass: null,
        measurements: null,
        recorded_at: new Date('2024-06-01'),
      },
    ]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { measurementDate: '2024-06-01' },
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.measurementDate).toBe('2024-06-01');
  });

  it('handles null values correctly', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValueOnce([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: validId,
        user_id: mockClientUser.id,
        weight: null,
        height: null,
        body_fat_percentage: null,
        muscle_mass: null,
        measurements: null,
        recorded_at: new Date('2024-01-01'),
      },
    ]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: null, measurements: null },
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('validates bodyFatPercentage range', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { bodyFatPercentage: 150 }, // Over 100%
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 500 when update query returns no rows', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValueOnce([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: 75 },
    });
    const response = await PUT(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to update measurement');
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'PUT',
      body: { weight: 75 },
    });
    const response = await PUT(request, { params: { id: validId } });

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/analytics/measurements/[id]', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: validId } });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid UUID format', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/measurements/invalid-id', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'invalid-id' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid measurement ID');
  });

  it('returns 404 when measurement not found', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([]);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Measurement not found');
  });

  it('successfully deletes measurement', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$executeRaw.mockResolvedValue(1);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: validId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Measurement deleted');
  });

  it('verifies user owns the measurement', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([{ id: validId, user_id: mockClientUser.id }]);
    mockedPrisma.$executeRaw.mockResolvedValue(1);

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'DELETE',
    });
    await DELETE(request, { params: { id: validId } });

    expect(mockedPrisma.$queryRaw).toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/analytics/measurements/${validId}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: validId } });

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
