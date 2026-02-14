import { prisma } from '@/lib/db/prisma';
import {
  logActivity,
  logWorkoutCompleted,
  logProgramAssigned,
  logClientSignup,
} from '@/lib/services/activity.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    activity: {
      create: jest.fn(),
    },
  },
}));

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
    it('should create activity with all fields', async () => {
      const mockActivity = {
        id: 'act-1',
        userId: 'user-1',
        type: 'custom_event',
        title: 'Test Event',
        description: 'Test description',
        relatedId: 'rel-1',
        relatedType: 'test_type',
        metadata: { key: 'value' },
        createdAt: new Date(),
      };

      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await logActivity({
        userId: 'user-1',
        type: 'custom_event',
        title: 'Test Event',
        description: 'Test description',
        relatedId: 'rel-1',
        relatedType: 'test_type',
        metadata: { key: 'value' },
      });

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'custom_event',
          title: 'Test Event',
          description: 'Test description',
          relatedId: 'rel-1',
          relatedType: 'test_type',
          metadata: { key: 'value' },
        },
      });
    });

    it('should create activity with minimal fields', async () => {
      const mockActivity = {
        id: 'act-2',
        userId: 'user-2',
        type: 'simple_event',
        title: 'Simple',
        metadata: {},
        createdAt: new Date(),
      };

      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await logActivity({
        userId: 'user-2',
        type: 'simple_event',
        title: 'Simple',
      });

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          type: 'simple_event',
          title: 'Simple',
          description: undefined,
          relatedId: undefined,
          relatedType: undefined,
          metadata: {},
        },
      });
    });

    it('should use empty object for metadata if not provided', async () => {
      (mockPrisma.activity.create as jest.Mock).mockResolvedValue({});

      await logActivity({
        userId: 'user-3',
        type: 'test',
        title: 'Test',
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: {},
          }),
        })
      );
    });

    it('should catch errors and return null', async () => {
      (mockPrisma.activity.create as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const result = await logActivity({
        userId: 'user-4',
        type: 'test',
        title: 'Test',
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to log activity:',
        expect.any(Error)
      );
    });

    it('should not throw errors on failure (fire-and-forget)', async () => {
      (mockPrisma.activity.create as jest.Mock).mockRejectedValue(
        new Error('DB connection lost')
      );

      // Should not throw
      await expect(
        logActivity({
          userId: 'user-5',
          type: 'test',
          title: 'Test',
        })
      ).resolves.toBeNull();
    });
  });

  describe('logWorkoutCompleted', () => {
    it('should log workout completion with correct format', async () => {
      const mockActivity = {
        id: 'act-3',
        userId: 'user-1',
        type: 'workout_completed',
        title: 'Workout Completed',
        description: 'Completed "Upper Body Strength"',
        relatedId: 'session-1',
        relatedType: 'workout_session',
        createdAt: new Date(),
      };

      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await logWorkoutCompleted(
        'user-1',
        'session-1',
        'Upper Body Strength'
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'workout_completed',
          title: 'Workout Completed',
          description: 'Completed "Upper Body Strength"',
          relatedId: 'session-1',
          relatedType: 'workout_session',
          metadata: {},
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.activity.create as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const result = await logWorkoutCompleted('user-2', 'session-2', 'Cardio');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logProgramAssigned', () => {
    it('should log program assignment for both trainer and client', async () => {
      const mockTrainerActivity = {
        id: 'act-4',
        userId: 'trainer-1',
        type: 'program_assigned',
        title: 'Program Assigned',
        description: 'Assigned "Strength Builder" to a client',
        relatedId: 'program-1',
        relatedType: 'program',
        metadata: { clientId: 'client-1' },
        createdAt: new Date(),
      };

      const mockClientActivity = {
        id: 'act-5',
        userId: 'client-1',
        type: 'program_assigned',
        title: 'New Program Assigned',
        description: 'You were assigned "Strength Builder"',
        relatedId: 'program-1',
        relatedType: 'program',
        metadata: { trainerId: 'trainer-1' },
        createdAt: new Date(),
      };

      (mockPrisma.activity.create as jest.Mock)
        .mockResolvedValueOnce(mockTrainerActivity)
        .mockResolvedValueOnce(mockClientActivity);

      const result = await logProgramAssigned(
        'trainer-1',
        'client-1',
        'program-1',
        'Strength Builder'
      );

      expect(result).toEqual(mockClientActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2);

      // First call - trainer activity
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'trainer-1',
          type: 'program_assigned',
          title: 'Program Assigned',
          description: 'Assigned "Strength Builder" to a client',
          relatedId: 'program-1',
          relatedType: 'program',
          metadata: { clientId: 'client-1' },
        },
      });

      // Second call - client activity
      expect(mockPrisma.activity.create).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'client-1',
          type: 'program_assigned',
          title: 'New Program Assigned',
          description: 'You were assigned "Strength Builder"',
          relatedId: 'program-1',
          relatedType: 'program',
          metadata: { trainerId: 'trainer-1' },
        },
      });
    });

    it('should handle errors when logging trainer activity', async () => {
      (mockPrisma.activity.create as jest.Mock)
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({});

      await logProgramAssigned(
        'trainer-2',
        'client-2',
        'program-2',
        'Test Program'
      );

      // Both activities should still be attempted
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle errors when logging client activity', async () => {
      (mockPrisma.activity.create as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await logProgramAssigned(
        'trainer-3',
        'client-3',
        'program-3',
        'Test Program'
      );

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logClientSignup', () => {
    it('should log client signup with correct format', async () => {
      const mockActivity = {
        id: 'act-6',
        userId: 'user-1',
        type: 'client_signup',
        title: 'Welcome!',
        description: 'Account created for john@example.com',
        relatedType: 'user',
        createdAt: new Date(),
      };

      (mockPrisma.activity.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await logClientSignup('user-1', 'john@example.com');

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'client_signup',
          title: 'Welcome!',
          description: 'Account created for john@example.com',
          relatedId: undefined,
          relatedType: 'user',
          metadata: {},
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.activity.create as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      const result = await logClientSignup('user-2', 'jane@example.com');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
