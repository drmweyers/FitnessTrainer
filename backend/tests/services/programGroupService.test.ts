import { programService } from '@/services/programService';
import { prisma } from '@/index';

// Mock Prisma Client
jest.mock('@/index', () => ({
  prisma: {
    programWorkout: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    workoutExercise: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    exercise: {
      findMany: jest.fn(),
    },
    exerciseConfiguration: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the error handler
jest.mock('@/middleware/errorHandler', () => ({
  createError: jest.fn((statusCode, message) => {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    throw error;
  }),
}));

describe('ProgramService - Groups (Supersets/Circuits)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExerciseGroup', () => {
    it('should create a superset group with 2 exercises', async () => {
      const mockWorkout = {
        id: 'workout-1',
        week: {
          program: {
            id: 'prog-1',
            trainerId: 'trainer-1',
          },
        },
      };

      const mockExercises = [
        { id: 'ex-1', name: 'Bench Press' },
        { id: 'ex-2', name: 'Barbell Row' },
      ];

      mockPrisma.programWorkout.findFirst.mockResolvedValue(mockWorkout);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);
      mockPrisma.workoutExercise.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.workoutExercise.findMany.mockResolvedValue([]);

      const result = await programService.createExerciseGroup('workout-1', 'trainer-1', {
        name: 'Push Superset',
        groupType: 'superset',
        exerciseIds: ['ex-1', 'ex-2'],
        restBetweenExercises: 0,
        restBetweenSets: 90,
      });

      expect(result.groupType).toBe('superset');
      expect(result.name).toBe('Push Superset');
    });
  });

  describe('updateExerciseGroup', () => {
    it('should update group name and rest periods', async () => {
      const mockWorkout = {
        id: 'workout-1',
        week: {
          program: {
            id: 'prog-1',
            trainerId: 'trainer-1',
          },
        },
      };

      const mockGroupExercises = [
        { id: 'ex-1', exercise: { id: 'ex-1', name: 'Bench Press', bodyPart: 'chest', gifUrl: 'http://example.com' } },
        { id: 'ex-2', exercise: { id: 'ex-2', name: 'Barbell Row', bodyPart: 'back', gifUrl: 'http://example.com' } },
      ];

      mockPrisma.programWorkout.findFirst.mockResolvedValue(mockWorkout);
      mockPrisma.workoutExercise.findMany.mockResolvedValue(mockGroupExercises);

      const result = await programService.updateExerciseGroup('workout-1', 'trainer-1', 'A', {
        name: 'Updated Superset',
        restBetweenExercises: 60,
        restBetweenSets: 120,
      });

      expect(result.name).toBe('Updated Superset');
      expect(result.restBetweenExercises).toBe(60);
    });
  });

  describe('ungroupExercises', () => {
    it('should remove group from all exercises in the group', async () => {
      const mockWorkout = {
        id: 'workout-1',
        week: {
          program: {
            id: 'prog-1',
            trainerId: 'trainer-1',
          },
        },
      };

      mockPrisma.programWorkout.findFirst.mockResolvedValue(mockWorkout);
      mockPrisma.workoutExercise.updateMany.mockResolvedValue({ count: 2 });

      const result = await programService.ungroupExercises('workout-1', 'trainer-1', 'A');

      expect(result).toEqual({
        success: true,
        message: 'Exercises ungrouped successfully',
        count: 2,
      });
    });
  });
});
