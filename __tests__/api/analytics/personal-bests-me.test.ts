/**
 * Tests for app/api/analytics/performance/me/personal-bests/route.ts
 * GET /api/analytics/performance/me/personal-bests
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/performance/me/personal-bests/route';
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

describe('GET /api/analytics/performance/me/personal-bests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('successfully fetches personal bests', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'max_weight',
        max_value: 225,
        recorded_at: new Date('2024-06-01'),
      },
      {
        exercise_id: 'ex-2',
        exercise_name: 'Squat',
        metric_type: 'max_weight',
        max_value: 315,
        recorded_at: new Date('2024-06-02'),
      },
    ];

    mockedPrisma.$queryRaw.mockResolvedValue(mockResults);

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].exerciseId).toBe('ex-1');
    expect(body.data[0].exercise).toBe('Bench Press');
    expect(body.data[0].metric).toBe('max_weight');
    expect(body.data[0].value).toBe(225);
  });

  it('returns empty array when no personal bests', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('converts date to ISO string', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockDate = new Date('2024-06-01T10:00:00Z');
    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'max_weight',
        max_value: 225,
        recorded_at: mockDate,
      },
    ];

    mockedPrisma.$queryRaw.mockResolvedValue(mockResults);

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data[0].date).toBe(mockDate.toISOString());
  });

  it('converts value to number', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'max_weight',
        max_value: '225.5', // String from database
        recorded_at: new Date(),
      },
    ];

    mockedPrisma.$queryRaw.mockResolvedValue(mockResults);

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);
    const body = await response.json();

    expect(typeof body.data[0].value).toBe('number');
    expect(body.data[0].value).toBe(225.5);
  });

  it('handles multiple metrics for same exercise', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'max_weight',
        max_value: 225,
        recorded_at: new Date('2024-06-01'),
      },
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'max_reps',
        max_value: 10,
        recorded_at: new Date('2024-06-02'),
      },
    ];

    mockedPrisma.$queryRaw.mockResolvedValue(mockResults);

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].metric).toBe('max_weight');
    expect(body.data[1].metric).toBe('max_reps');
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/analytics/performance/me/personal-bests');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
