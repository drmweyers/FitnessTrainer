import { Request, Response } from 'express';
import * as exerciseController from '@/controllers/exerciseController';

// Mock Prisma Client
jest.mock('@/index', () => ({
  prisma: {
    exercise: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    exerciseFavorite: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    exerciseUsage: {
      create: jest.fn(),
    },
    exerciseCollection: {
      findMany: jest.fn(),
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

// Import mocked prisma
const mockPrisma = require('@/index').prisma;

describe('ExerciseController - Favorites', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusSpy: jest.SpyInstance;
  let jsonSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'trainer' as const,
        isActive: true,
        isVerified: true,
      },
    };

    statusSpy = jest.fn().mockReturnThis() as any;
    jsonSpy = jest.fn().mockReturnThis() as any;

    mockResponse = {
      json: jsonSpy,
      status: statusSpy.mockReturnThis(),
    } as any;
  });

  describe('addToFavorites', () => {
    it('should add exercise to favorites', async () => {
      mockRequest.params = { id: 'ex-1' };
      mockPrisma.exercise.findFirst.mockResolvedValue({
        id: 'ex-1',
        name: 'Bench Press',
      });
      mockPrisma.exerciseFavorite.upsert.mockResolvedValue({
        id: 'fav-1',
        userId: 'user-123',
        exerciseId: 'ex-1',
        favoritedAt: new Date(),
      });

      await exerciseController.addToFavorites(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPrisma.exerciseFavorite.upsert).toHaveBeenCalledWith({
        where: {
          userId_exerciseId: {
            userId: 'user-123',
            exerciseId: 'ex-1',
          },
        },
        create: {
          userId: 'user-123',
          exerciseId: 'ex-1',
        },
        update: {},
      });
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Exercise added to favorites',
        })
      );
    });

    it('should return 404 if exercise not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.exercise.findFirst.mockResolvedValue(null);

      await exerciseController.addToFavorites(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Exercise not found',
        })
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should remove exercise from favorites', async () => {
      mockRequest.params = { id: 'ex-1' };
      mockPrisma.exercise.findFirst.mockResolvedValue({
        id: 'ex-1',
        name: 'Bench Press',
      });
      mockPrisma.exerciseFavorite.deleteMany.mockResolvedValue({ count: 1 });

      await exerciseController.removeFromFavorites(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPrisma.exerciseFavorite.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          exerciseId: 'ex-1',
        },
      });
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Exercise removed from favorites',
        })
      );
    });

    it('should return 404 if exercise not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.exercise.findFirst.mockResolvedValue(null);

      await exerciseController.removeFromFavorites(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusSpy).toHaveBeenCalledWith(404);
    });
  });
});
