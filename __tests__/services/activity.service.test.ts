import { logActivity, logWorkoutCompleted, logProgramAssigned, logClientSignup } from '@/lib/services/activity.service';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Activity Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('logActivity', () => {
    it('creates an activity with all fields', async () => {
      const mockCreated = {
        id: 'act-1',
        userId: 'user-1',
        type: 'custom',
        title: 'Test Activity',
        description: 'A test',
        relatedId: 'rel-1',
        relatedType: 'test',
        metadata: { key: 'value' },
        createdAt: new Date(),
      };
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await logActivity({
        userId: 'user-1',
        type: 'custom',
        title: 'Test Activity',
        description: 'A test',
        relatedId: 'rel-1',
        relatedType: 'test',
        metadata: { key: 'value' },
      });

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'custom',
          title: 'Test Activity',
          description: 'A test',
          relatedId: 'rel-1',
          relatedType: 'test',
          metadata: { key: 'value' },
        },
      });
    });

    it('defaults metadata to empty object when not provided', async () => {
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue({ id: 'act-2' });

      await logActivity({
        userId: 'user-1',
        type: 'test',
        title: 'No metadata',
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {},
        }),
      });
    });

    it('passes undefined for optional fields when not provided', async () => {
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue({ id: 'act-3' });

      await logActivity({
        userId: 'user-1',
        type: 'test',
        title: 'Minimal',
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'test',
          title: 'Minimal',
          description: undefined,
          relatedId: undefined,
          relatedType: undefined,
          metadata: {},
        },
      });
    });

    it('returns null and logs error on failure (fire-and-forget safe)', async () => {
      const error = new Error('DB connection failed');
      (mockPrisma.activity.create as jest.Mock).mockRejectedValue(error);

      const result = await logActivity({
        userId: 'user-1',
        type: 'test',
        title: 'Will fail',
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to log activity:', error);
    });
  });

  describe('logWorkoutCompleted', () => {
    it('calls logActivity with correct workout completed params', async () => {
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue({ id: 'act-wk' });

      await logWorkoutCompleted('user-1', 'session-1', 'Push Day');

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'workout_completed',
          title: 'Workout Completed',
          description: 'Completed "Push Day"',
          relatedId: 'session-1',
          relatedType: 'workout_session',
          metadata: {},
        },
      });
    });

    it('returns the created activity', async () => {
      const mockAct = { id: 'act-wk-2' };
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockAct);

      const result = await logWorkoutCompleted('user-1', 'session-2', 'Leg Day');
      expect(result).toEqual(mockAct);
    });
  });

  describe('logProgramAssigned', () => {
    it('creates two activity records - one for trainer and one for client', async () => {
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue({ id: 'act-pa' });

      await logProgramAssigned('trainer-1', 'client-1', 'prog-1', 'Strength Program');

      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2);

      // First call: trainer activity
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'trainer-1',
          type: 'program_assigned',
          title: 'Program Assigned',
          description: 'Assigned "Strength Program" to a client',
          relatedId: 'prog-1',
          relatedType: 'program',
          metadata: { clientId: 'client-1' },
        },
      });

      // Second call: client activity
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'client-1',
          type: 'program_assigned',
          title: 'New Program Assigned',
          description: 'You were assigned "Strength Program"',
          relatedId: 'prog-1',
          relatedType: 'program',
          metadata: { trainerId: 'trainer-1' },
        },
      });
    });

    it('returns the client activity (second call result)', async () => {
      (mockPrisma.activity.create as jest.Mock)
        .mockResolvedValueOnce({ id: 'trainer-act' })
        .mockResolvedValueOnce({ id: 'client-act' });

      const result = await logProgramAssigned('trainer-1', 'client-1', 'prog-1', 'Test');
      expect(result).toEqual({ id: 'client-act' });
    });
  });

  describe('logClientSignup', () => {
    it('calls logActivity with correct signup params', async () => {
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue({ id: 'act-signup' });

      await logClientSignup('user-1', 'user@example.com');

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'client_signup',
          title: 'Welcome!',
          description: 'Account created for user@example.com',
          relatedId: undefined,
          relatedType: 'user',
          metadata: {},
        },
      });
    });

    it('returns the created activity', async () => {
      const mockAct = { id: 'act-signup-2' };
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockAct);

      const result = await logClientSignup('user-2', 'another@test.com');
      expect(result).toEqual(mockAct);
    });
  });
});
