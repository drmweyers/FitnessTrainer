import { NextResponse } from 'next/server';
import { POST } from '@/app/api/analytics/training-load/calculate/route';
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

describe('POST /api/analytics/training-load/calculate', () => {
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

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: '2024-06-03' },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns 400 for invalid date format', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: 'not-a-date' },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 for missing weekStartDate', async () => {
    mockAuth(clientUser);

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(400);
  });

  it('calculates training load correctly with workout data', async () => {
    mockAuth(clientUser);

    // Mock sessions with exercise logs and set logs
    const mockSessions = [
      {
        id: 'ws-1',
        clientId: clientUser.id,
        status: 'completed',
        scheduledDate: new Date('2024-06-03'),
        exerciseLogs: [
          {
            id: 'el-1',
            setLogs: [
              { completed: true, actualReps: 10, weight: 60 },
              { completed: true, actualReps: 8, weight: 70 },
            ],
          },
        ],
      },
      {
        id: 'ws-2',
        clientId: clientUser.id,
        status: 'completed',
        scheduledDate: new Date('2024-06-05'),
        exerciseLogs: [
          {
            id: 'el-2',
            setLogs: [
              { completed: true, actualReps: 12, weight: 50 },
              { completed: true, actualReps: null, weight: null }, // cardio set, no weight/reps
            ],
          },
        ],
      },
    ];

    (mockPrisma.workoutSession.findMany as jest.Mock).mockResolvedValue(mockSessions);

    // Mock previous loads (4-week history)
    const mockPreviousLoads = [
      { totalVolume: 5000 },
      { totalVolume: 6000 },
    ];
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue(mockPreviousLoads);

    const mockUpserted = {
      id: 'tl-1',
      userId: clientUser.id,
      weekStartDate: new Date('2024-06-03'),
      totalVolume: expect.any(Number),
      totalSets: expect.any(Number),
      totalReps: expect.any(Number),
      trainingDays: expect.any(Number),
    };
    (mockPrisma.trainingLoad.upsert as jest.Mock).mockResolvedValue(mockUpserted);

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: '2024-06-03' },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);

    // Verify the workout session query
    expect(mockPrisma.workoutSession.findMany).toHaveBeenCalledWith({
      where: {
        clientId: clientUser.id,
        status: 'completed',
        scheduledDate: {
          gte: new Date('2024-06-03'),
          lt: new Date('2024-06-10'),
        },
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              where: { completed: true },
            },
          },
        },
      },
    });

    // Verify upsert was called with computed values
    // totalSets: 4 (2 + 2)
    // totalReps: 10 + 8 + 12 = 30 (null reps not counted)
    // totalVolume: (10*60) + (8*70) + (12*50) = 600+560+600 = 1760 (null set excluded)
    // trainingDays: 2 (June 3 and June 5)
    expect(mockPrisma.trainingLoad.upsert).toHaveBeenCalledWith({
      where: {
        userId_weekStartDate: {
          userId: clientUser.id,
          weekStartDate: new Date('2024-06-03'),
        },
      },
      update: {
        totalVolume: 1760,
        totalSets: 4,
        totalReps: 30,
        trainingDays: 2,
        acuteLoad: 1760,
        chronicLoad: expect.any(Number),
        loadRatio: expect.any(Number),
      },
      create: {
        userId: clientUser.id,
        weekStartDate: new Date('2024-06-03'),
        totalVolume: 1760,
        totalSets: 4,
        totalReps: 30,
        trainingDays: 2,
        acuteLoad: 1760,
        chronicLoad: expect.any(Number),
        loadRatio: expect.any(Number),
      },
    });
  });

  it('calculates chronic load as average of previous + current volume', async () => {
    mockAuth(clientUser);

    (mockPrisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue([
      { totalVolume: 1000 },
      { totalVolume: 2000 },
      { totalVolume: 3000 },
    ]);

    const mockUpserted = { id: 'tl-x' };
    (mockPrisma.trainingLoad.upsert as jest.Mock).mockResolvedValue(mockUpserted);

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: '2024-06-03' },
    });
    await POST(req);

    // totalVolume = 0 (no sessions)
    // allVolumes = [1000, 2000, 3000, 0] (previous + current)
    // chronicLoad = (1000+2000+3000+0) / 4 = 1500
    // loadRatio = 0 / 1500 = 0
    const upsertCall = (mockPrisma.trainingLoad.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertCall.update.chronicLoad).toBe(1500);
    expect(upsertCall.update.loadRatio).toBe(0);
    expect(upsertCall.update.acuteLoad).toBe(0);
  });

  it('handles zero chronic load (avoids division by zero)', async () => {
    mockAuth(clientUser);

    (mockPrisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue([]);

    const mockUpserted = { id: 'tl-z' };
    (mockPrisma.trainingLoad.upsert as jest.Mock).mockResolvedValue(mockUpserted);

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: '2024-06-03' },
    });
    await POST(req);

    // allVolumes = [0] (only current week, which is 0)
    // chronicLoad = 0
    // loadRatio = 0 (because chronicLoad is 0)
    const upsertCall = (mockPrisma.trainingLoad.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertCall.update.loadRatio).toBe(0);
  });

  it('rounds loadRatio to 2 decimal places', async () => {
    mockAuth(clientUser);

    const mockSessions = [
      {
        id: 'ws-1',
        scheduledDate: new Date('2024-06-03'),
        exerciseLogs: [
          {
            setLogs: [
              { completed: true, actualReps: 10, weight: 100 },
            ],
          },
        ],
      },
    ];

    (mockPrisma.workoutSession.findMany as jest.Mock).mockResolvedValue(mockSessions);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue([
      { totalVolume: 700 },
    ]);

    const mockUpserted = { id: 'tl-r' };
    (mockPrisma.trainingLoad.upsert as jest.Mock).mockResolvedValue(mockUpserted);

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: '2024-06-03' },
    });
    await POST(req);

    const upsertCall = (mockPrisma.trainingLoad.upsert as jest.Mock).mock.calls[0][0];
    // totalVolume = 1000, previousLoads = [700], allVolumes = [700, 1000]
    // chronicLoad = 850, loadRatio = 1000/850 = 1.1764... → 1.18
    expect(upsertCall.update.loadRatio).toBe(Math.round((1000 / 850) * 100) / 100);
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.workoutSession.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/training-load/calculate', {
      method: 'POST',
      body: { weekStartDate: '2024-06-03' },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to calculate training load');
  });
});
