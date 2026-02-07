import { NextResponse } from 'next/server';
import { POST } from '@/app/api/analytics/performance/route';
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

describe('POST /api/analytics/performance', () => {
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

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'one_rm',
        value: 100,
        unit: 'kg',
      },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: { exerciseId: '00000000-0000-0000-0000-000000000010' },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for invalid metricType', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'invalid_type',
        value: 100,
        unit: 'kg',
      },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 for invalid exerciseId (not UUID)', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: 'not-a-uuid',
        metricType: 'one_rm',
        value: 100,
        unit: 'kg',
      },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 for negative value', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'one_rm',
        value: -50,
        unit: 'kg',
      },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(400);
  });

  it('creates a performance metric successfully', async () => {
    mockAuth(clientUser);

    const mockMetric = {
      id: 'pm-1',
      userId: clientUser.id,
      exerciseId: '00000000-0000-0000-0000-000000000010',
      metricType: 'one_rm',
      value: 100,
      unit: 'kg',
      workoutSessionId: null,
      notes: null,
      recordedAt: new Date('2024-06-01'),
      exercise: { id: '00000000-0000-0000-0000-000000000010', name: 'Bench Press' },
    };

    (mockPrisma.performanceMetric.create as jest.Mock).mockResolvedValue(mockMetric);

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'one_rm',
        value: 100,
        unit: 'kg',
      },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('pm-1');
    expect(body.data.exercise.name).toBe('Bench Press');

    expect(mockPrisma.performanceMetric.create).toHaveBeenCalledWith({
      data: {
        userId: clientUser.id,
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'one_rm',
        value: 100,
        unit: 'kg',
        workoutSessionId: undefined,
        notes: undefined,
      },
      include: {
        exercise: { select: { id: true, name: true } },
      },
    });
  });

  it('creates a metric with optional fields', async () => {
    mockAuth(clientUser);

    const mockMetric = {
      id: 'pm-2',
      userId: clientUser.id,
      exerciseId: '00000000-0000-0000-0000-000000000010',
      metricType: 'volume',
      value: 5000,
      unit: 'kg',
      workoutSessionId: '00000000-0000-0000-0000-000000000030',
      notes: 'Great session',
      exercise: { id: '00000000-0000-0000-0000-000000000010', name: 'Bench Press' },
    };

    (mockPrisma.performanceMetric.create as jest.Mock).mockResolvedValue(mockMetric);

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'volume',
        value: 5000,
        unit: 'kg',
        workoutSessionId: '00000000-0000-0000-0000-000000000030',
        notes: 'Great session',
      },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(body.data.workoutSessionId).toBe('00000000-0000-0000-0000-000000000030');
    expect(body.data.notes).toBe('Great session');
  });

  it('validates all allowed metricType values', async () => {
    mockAuth(clientUser);

    const validTypes = ['one_rm', 'volume', 'endurance', 'power', 'speed', 'body_weight', 'body_fat', 'muscle_mass'];

    for (const metricType of validTypes) {
      (mockPrisma.performanceMetric.create as jest.Mock).mockResolvedValue({ id: `pm-${metricType}` });

      const req = createMockRequest('/api/analytics/performance', {
        method: 'POST',
        body: {
          exerciseId: '00000000-0000-0000-0000-000000000010',
          metricType,
          value: 100,
          unit: 'kg',
        },
      });
      const res = await POST(req);
      const { status } = await parseJsonResponse(res);
      expect(status).toBe(201);
    }
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/performance', {
      method: 'POST',
      body: {
        exerciseId: '00000000-0000-0000-0000-000000000010',
        metricType: 'one_rm',
        value: 100,
        unit: 'kg',
      },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to record performance metric');
  });
});
