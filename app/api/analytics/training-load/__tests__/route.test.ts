/**
 * Training Load API Route Tests
 */

import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').prisma;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('GET /api/analytics/training-load', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'TRAINER',
  };

  const createMockRequest = (params?: URLSearchParams) => {
    const url = params
      ? `http://localhost/api/analytics/training-load?${params.toString()}`
      : 'http://localhost/api/analytics/training-load';

    return {
      url,
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trainingLoad = {
      findMany: jest.fn(),
    };
  });

  it('should return training loads for authenticated user with default params', async () => {
    const mockData = [
      {
        id: 'load-1',
        userId: mockUser.id,
        weekStartDate: new Date('2024-01-01'),
        totalVolume: 10000,
        totalSets: 50,
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.trainingLoad.findMany.mockResolvedValue(mockData);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0]).toMatchObject({
      id: 'load-1',
      userId: mockUser.id,
      totalVolume: 10000,
      totalSets: 50,
    });
  });

  it('should use custom weeks parameter', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const params = new URLSearchParams({ weeks: '24' });
    const request = createMockRequest(params);
    await GET(request);

    expect(mockPrisma.trainingLoad.findMany).toHaveBeenCalled();
    const call = mockPrisma.trainingLoad.findMany.mock.calls[0][0];
    expect(call.where.userId).toBe(mockUser.id);
    expect(call.where.weekStartDate.gte).toBeInstanceOf(Date);
  });

  it('should use custom startDate parameter', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const params = new URLSearchParams({ startDate: '2024-01-01' });
    const request = createMockRequest(params);
    await GET(request);

    expect(mockPrisma.trainingLoad.findMany).toHaveBeenCalled();
    const call = mockPrisma.trainingLoad.findMany.mock.calls[0][0];
    expect(call.where.weekStartDate.gte).toBeInstanceOf(Date);
  });

  it('should return empty array when no data found', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.trainingLoad.findMany.mockResolvedValue([]);

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
    mockPrisma.trainingLoad.findMany.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch training load');
  });

  it('should order by weekStartDate ascending', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const request = createMockRequest();
    await GET(request);

    expect(mockPrisma.trainingLoad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { weekStartDate: 'asc' },
      })
    );
  });
});
