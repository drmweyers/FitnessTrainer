import { NextResponse } from 'next/server';
import { POST } from '@/app/api/analytics/measurements/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, parseJsonResponse } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuth(user: { id: string; email: string; role: string }) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('POST /api/analytics/measurements', () => {
  const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthFail();

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01', weight: 80 },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns 400 for invalid request body', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: 'not-a-date' },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for negative weight', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01', weight: -10 },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 for body fat > 100', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01', bodyFatPercentage: 150 },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(400);
  });

  it('creates a measurement successfully with all fields', async () => {
    mockAuth(clientUser);

    const mockResult = [{
      id: 'm-1',
      user_id: clientUser.id,
      height: 180,
      weight: 80,
      body_fat_percentage: 15,
      muscle_mass: 35,
      measurements: { chest: 100, waist: 80 },
      recorded_at: new Date('2024-06-01T00:00:00Z'),
    }];

    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockResult);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: {
        measurementDate: '2024-06-01',
        weight: 80,
        height: 180,
        bodyFatPercentage: 15,
        muscleMass: 35,
        measurements: { chest: 100, waist: 80 },
        notes: 'Morning measurement',
      },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('m-1');
    expect(body.data.userId).toBe(clientUser.id);
    expect(body.data.weight).toBe(80);
    expect(body.data.height).toBe(180);
    expect(body.data.bodyFatPercentage).toBe(15);
    expect(body.data.muscleMass).toBe(35);
    expect(body.data.measurements).toEqual({ chest: 100, waist: 80 });
    expect(body.data.measurementDate).toBe('2024-06-01');
  });

  it('creates a measurement with minimal fields (only date)', async () => {
    mockAuth(clientUser);

    const mockResult = [{
      id: 'm-2',
      user_id: clientUser.id,
      height: null,
      weight: null,
      body_fat_percentage: null,
      muscle_mass: null,
      measurements: null,
      recorded_at: new Date('2024-06-01T00:00:00Z'),
    }];

    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockResult);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01' },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(body.data.weight).toBeUndefined();
    expect(body.data.height).toBeUndefined();
    expect(body.data.measurements).toEqual({});
  });

  it('returns 500 when insert returns empty result', async () => {
    mockAuth(clientUser);
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01', weight: 80 },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('returns 500 when insert returns null', async () => {
    mockAuth(clientUser);
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01', weight: 80 },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(500);
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/measurements', {
      method: 'POST',
      body: { measurementDate: '2024-06-01', weight: 80 },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create measurement');
  });
});
