/**
 * Exercise API Tests
 * Tests for exercise library endpoints
 */

import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/exercises/route';
import { exerciseService } from '@/lib/services/exercise.service';

// Mock auth middleware to return authenticated user
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn().mockImplementation((req: any) => {
    return Promise.resolve(Object.assign(req, {
      user: { id: 'test-user-id', role: 'admin', email: 'admin@test.com' }
    }));
  }),
  AuthenticatedRequest: {},
}));

// Mock the exercise service
jest.mock('@/lib/services/exercise.service');

const mockExerciseService = exerciseService as jest.Mocked<typeof exerciseService>;

describe('/api/exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/exercises', () => {
    it('should return list of exercises with default pagination', async () => {
      const mockExercises = [
        {
          id: '1',
          exerciseId: 'ex1',
          name: 'Bench Press',
          gifUrl: 'bench-press.gif',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: ['triceps', 'front delts'],
          instructions: ['Lie on bench', 'Press bar up'],
          difficulty: 'intermediate',
          isActive: true,
          createdAt: new Date(),
          updatedAt: null,
        },
      ];

      mockExerciseService.getExercises.mockResolvedValue({
        exercises: mockExercises,
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
        filters: {
          bodyParts: ['chest'],
          equipments: ['barbell'],
          targetMuscles: ['pectorals'],
          difficulties: ['beginner', 'intermediate', 'advanced'],
        },
      });

      const request = new Request('http://localhost:3000/api/exercises');
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exercises).toHaveLength(1);
      expect(data.exercises[0].name).toBe('Bench Press');
      expect(data.pagination.total).toBe(1);
      expect(mockExerciseService.getExercises).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
        })
      );
    });

    it('should filter exercises by body part', async () => {
      mockExerciseService.getExercises.mockResolvedValue({
        exercises: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        filters: {
          bodyParts: ['back'],
          equipments: [],
          targetMuscles: [],
          difficulties: ['beginner', 'intermediate', 'advanced'],
        },
      });

      const request = new Request(
        'http://localhost:3000/api/exercises?bodyPart=back'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockExerciseService.getExercises).toHaveBeenCalledWith(
        expect.objectContaining({ bodyPart: 'back' })
      );
    });

    it('should filter exercises by difficulty', async () => {
      mockExerciseService.getExercises.mockResolvedValue({
        exercises: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        filters: {
          bodyParts: [],
          equipments: [],
          targetMuscles: [],
          difficulties: ['beginner', 'intermediate', 'advanced'],
        },
      });

      const request = new Request(
        'http://localhost:3000/api/exercises?difficulty=beginner'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockExerciseService.getExercises).toHaveBeenCalledWith(
        expect.objectContaining({ difficulty: 'beginner' })
      );
    });

    it('should search exercises by query', async () => {
      mockExerciseService.getExercises.mockResolvedValue({
        exercises: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        filters: {
          bodyParts: [],
          equipments: [],
          targetMuscles: [],
          difficulties: ['beginner', 'intermediate', 'advanced'],
        },
      });

      const request = new Request(
        'http://localhost:3000/api/exercises?search=bench'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockExerciseService.getExercises).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'bench' })
      );
    });

    it('should paginate results', async () => {
      mockExerciseService.getExercises.mockResolvedValue({
        exercises: [],
        pagination: { total: 100, page: 2, limit: 20, totalPages: 5 },
        filters: {
          bodyParts: [],
          equipments: [],
          targetMuscles: [],
          difficulties: ['beginner', 'intermediate', 'advanced'],
        },
      });

      const request = new Request(
        'http://localhost:3000/api/exercises?page=2&limit=20'
      );
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(20);
      expect(mockExerciseService.getExercises).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 20 })
      );
    });

    it('should return validation error for invalid difficulty', async () => {
      const request = new Request(
        'http://localhost:3000/api/exercises?difficulty=invalid'
      );
      const response = await GET(request);

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
    });
  });

  describe('POST /api/exercises', () => {
    it('should create new exercise', async () => {
      const newExercise = {
        id: '2',
        exerciseId: 'ex2',
        name: 'Squat',
        gifUrl: 'squat.gif',
        bodyPart: 'legs',
        equipment: 'barbell',
        targetMuscle: 'quadriceps',
        secondaryMuscles: ['glutes', 'hamstrings'],
        instructions: ['Stand with bar', 'Squat down'],
        difficulty: 'intermediate',
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      };

      mockExerciseService.createExercise.mockResolvedValue(newExercise);

      const request = new Request('http://localhost:3000/api/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Squat',
          gifUrl: 'https://example.com/squat.gif',
          bodyPart: 'legs',
          equipment: 'barbell',
          targetMuscle: 'quadriceps',
          secondaryMuscles: ['glutes', 'hamstrings'],
          instructions: ['Stand with bar', 'Squat down'],
        }),
      });

      request.json = async () => ({
        name: 'Squat',
        gifUrl: 'https://example.com/squat.gif',
        bodyPart: 'legs',
        equipment: 'barbell',
        targetMuscle: 'quadriceps',
        secondaryMuscles: ['glutes', 'hamstrings'],
        instructions: ['Stand with bar', 'Squat down'],
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockExerciseService.createExercise).toHaveBeenCalled();
    });

    it('should return validation error for missing name', async () => {
      const request = new Request('http://localhost:3000/api/exercises', {
        method: 'POST',
        body: JSON.stringify({
          gifUrl: 'https://example.com/test.gif',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          instructions: ['Do this'],
        }),
      });

      request.json = async () => ({
        gifUrl: 'https://example.com/test.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        instructions: ['Do this'],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
    });

    it('should return validation error for invalid URL', async () => {
      const request = new Request('http://localhost:3000/api/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          gifUrl: 'not-a-url',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          instructions: ['Do this'],
        }),
      });

      request.json = async () => ({
        name: 'Test',
        gifUrl: 'not-a-url',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        instructions: ['Do this'],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
    });
  });
});
