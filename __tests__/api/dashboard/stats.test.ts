import { NextResponse } from 'next/server';
import { GET } from '@/app/api/dashboard/stats/route';
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

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthFail();

    const req = createMockRequest('/api/dashboard/stats');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  describe('role: admin', () => {
    const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };

    it('returns admin dashboard stats with user counts and recent signups', async () => {
      mockAuth(adminUser);

      // Mock the 3 count queries + recent signups query
      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: BigInt(100) }])  // totalUsers
        .mockResolvedValueOnce([{ count: BigInt(10) }])   // totalTrainers
        .mockResolvedValueOnce([{ count: BigInt(80) }])   // totalClients
        .mockResolvedValueOnce([                           // recentSignups
          {
            id: 'u1',
            email: 'new@test.com',
            role: 'client',
            created_at: '2024-06-01',
            is_active: true,
          },
          {
            id: 'u2',
            email: 'trainer@test.com',
            role: 'trainer',
            created_at: '2024-06-01',
            is_active: false,
          },
        ]);

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('admin');
      expect(body.data.totalUsers).toBe(100);
      expect(body.data.totalTrainers).toBe(10);
      expect(body.data.totalClients).toBe(80);
      expect(body.data.recentSignups).toHaveLength(2);
      expect(body.data.recentSignups[0]).toEqual(expect.objectContaining({
        id: 'u1',
        name: 'new',
        email: 'new@test.com',
        role: 'client',
        signupDate: '2024-06-01',
      }));
      expect(body.data.recentSignups[1].name).toBe('trainer');
    });
  });

  describe('role: trainer', () => {
    const trainerUser = { id: 'trainer-1', email: 'trainer@test.com', role: 'trainer' };

    it('returns trainer dashboard with client overview and client list with streaks', async () => {
      mockAuth(trainerUser);

      // Mock count queries
      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: BigInt(5) }])   // totalClients
        .mockResolvedValueOnce([{ count: BigInt(3) }])   // activeClients
        .mockResolvedValueOnce([{ count: BigInt(1) }])   // newThisMonth
        .mockResolvedValueOnce([                          // clients list
          {
            id: 'tc-1',
            client_id: 'c-1',
            email: 'jane@test.com',
            status: 'active',
            connected_at: '2024-01-15',
          },
        ])
        .mockResolvedValueOnce([{ streak: 5 }]);         // client streak

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('trainer');
      expect(body.data.clientOverview).toEqual({
        totalClients: 5,
        activeClients: 3,
        inactiveClients: 2,
        newThisMonth: 1,
      });
      expect(body.data.clients).toHaveLength(1);
      expect(body.data.clients[0]).toEqual({
        id: 'tc-1',
        name: 'jane',
        email: 'jane@test.com',
        status: 'active',
        connectedAt: '2024-01-15',
        workoutStreak: 5,
      });
    });

    it('handles client with no name (falls back to email prefix)', async () => {
      mockAuth(trainerUser);

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([
          {
            id: 'tc-2',
            client_id: 'c-2',
            email: 'anon@test.com',
            status: 'active',
            connected_at: '2024-02-01',
          },
        ])
        .mockResolvedValueOnce([{ streak: 0 }]);

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data.clients[0].name).toBe('anon');
    });

    it('handles empty streak result', async () => {
      mockAuth(trainerUser);

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([{ count: BigInt(1) }])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([
          {
            id: 'tc-3',
            client_id: 'c-3',
            email: 'bob@test.com',
            status: 'active',
            connected_at: '2024-03-01',
          },
        ])
        .mockResolvedValueOnce([]);  // empty streak result

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data.clients[0].workoutStreak).toBe(0);
    });

    it('handles no clients', async () => {
      mockAuth(trainerUser);

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([]);  // no clients

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data.clients).toHaveLength(0);
      expect(body.data.clientOverview.totalClients).toBe(0);
    });
  });

  describe('role: client', () => {
    const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

    it('returns client progress summary with measurements and streak', async () => {
      mockAuth(clientUser);

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{                          // latestMeasurement
          weight: 82.5,
          body_fat_percentage: 18,
          measurements: { chest: 100, waist: 80 },
          measured_at: '2024-06-01',
        }])
        .mockResolvedValueOnce([{ count: BigInt(42) }])    // totalWorkouts
        .mockResolvedValueOnce([{ streak: 7 }]);           // workoutStreak

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('client');
      expect(body.data.progressSummary).toEqual({
        currentWeight: 82.5,
        measurements: { chest: 100, waist: 80 },
        totalWorkouts: 42,
        workoutStreak: 7,
      });
    });

    it('handles no measurements (null values)', async () => {
      mockAuth(clientUser);

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])                          // no measurement
        .mockResolvedValueOnce([{ count: BigInt(0) }])
        .mockResolvedValueOnce([]);                         // no streak

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data.progressSummary.currentWeight).toBeNull();
      expect(body.data.progressSummary.measurements).toBeNull();
      expect(body.data.progressSummary.totalWorkouts).toBe(0);
      expect(body.data.progressSummary.workoutStreak).toBe(0);
    });
  });

  describe('unknown role', () => {
    it('returns data with just role for unknown roles', async () => {
      mockAuth({ id: 'u-1', email: 'u@test.com', role: 'unknown' });

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.data.role).toBe('unknown');
    });
  });

  describe('error handling', () => {
    it('returns 500 with error message when database fails', async () => {
      mockAuth({ id: 'admin-1', email: 'admin@test.com', role: 'admin' });
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB timeout'));

      const req = createMockRequest('/api/dashboard/stats');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('DB timeout');
    });
  });
});
