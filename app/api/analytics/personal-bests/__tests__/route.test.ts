/**
 * Personal Bests API Route Tests
 */

import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').prisma;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('GET /api/analytics/personal-bests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'TRAINER',
  };

  const createMockRequest = () => {
    return {
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw = jest.fn();
  });

  it('should return personal bests for authenticated user', async () => {
    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'weight',
        max_value: 225,
        recorded_at: new Date('2024-01-15'),
      },
      {
        exercise_id: 'ex-2',
        exercise_name: 'Squat',
        metric_type: 'weight',
        max_value: 315,
        recorded_at: new Date('2024-01-10'),
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.$queryRaw.mockResolvedValue(mockResults);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toMatchObject({
      exerciseId: 'ex-1',
      exercise: 'Bench Press',
      metric: 'weight',
      value: 225,
    });
  });

  it('should return empty array when user has no personal bests', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    mockAuthenticate.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should handle database errors', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch personal bests');
  });

  it('should convert numeric values correctly', async () => {
    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'weight',
        max_value: '225.5',
        recorded_at: new Date('2024-01-15'),
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.$queryRaw.mockResolvedValue(mockResults);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.data[0].value).toBe(225.5);
    expect(typeof data.data[0].value).toBe('number');
  });
});
