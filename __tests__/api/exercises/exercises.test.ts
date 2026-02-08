/**
 * Tests for GET /api/exercises and POST /api/exercises
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/exercises/route';

// Mock auth middleware to return authenticated user
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn().mockImplementation((req: any) => {
    return Promise.resolve(Object.assign(req, {
      user: { id: 'test-user-id', role: 'admin', email: 'admin@test.com' }
    }));
  }),
  AuthenticatedRequest: {},
}));

// Mock exerciseService
jest.mock('@/lib/services/exercise.service', () => ({
  exerciseService: {
    getExercises: jest.fn(),
    createExercise: jest.fn(),
  },
}));

import { exerciseService } from '@/lib/services/exercise.service';
import { createMockRequest, mockExercise } from '@/tests/helpers/test-utils';

describe('GET /api/exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated exercises with default params', async () => {
    const mockResult = {
      exercises: [mockExercise],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      filters: { bodyParts: ['chest'], equipments: ['barbell'], targetMuscles: ['pectorals'] },
    };
    (exerciseService.getExercises as jest.Mock).mockResolvedValue(mockResult);

    const req = createMockRequest('/api/exercises');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exercises).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
    expect(exerciseService.getExercises).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('passes query parameters to service', async () => {
    const mockResult = {
      exercises: [],
      pagination: { total: 0, page: 2, limit: 10, totalPages: 0 },
      filters: { bodyParts: [], equipments: [], targetMuscles: [] },
    };
    (exerciseService.getExercises as jest.Mock).mockResolvedValue(mockResult);

    const req = createMockRequest('/api/exercises', {
      searchParams: {
        page: '2',
        limit: '10',
        search: 'bench',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        difficulty: 'intermediate',
        sortBy: 'name',
        sortOrder: 'desc',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(exerciseService.getExercises).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 10,
        search: 'bench',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        difficulty: 'intermediate',
        sortBy: 'name',
        sortOrder: 'desc',
      })
    );
  });

  it('returns 400 for invalid difficulty value', async () => {
    const req = createMockRequest('/api/exercises', {
      searchParams: { difficulty: 'superhero' },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation Error');
  });

  it('returns 500 when service throws', async () => {
    (exerciseService.getExercises as jest.Mock).mockRejectedValue(new Error('DB down'));

    const req = createMockRequest('/api/exercises');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
    expect(body.details).toBe('DB down');
  });

  it('handles non-Error exceptions in catch block', async () => {
    (exerciseService.getExercises as jest.Mock).mockRejectedValue('string error');

    const req = createMockRequest('/api/exercises');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });

  it('includes cache headers', async () => {
    (exerciseService.getExercises as jest.Mock).mockResolvedValue({
      exercises: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      filters: { bodyParts: [], equipments: [], targetMuscles: [] },
    });

    const req = createMockRequest('/api/exercises');
    const res = await GET(req);

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300'
    );
  });
});

describe('POST /api/exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    name: 'New Exercise',
    gifUrl: 'https://example.com/exercise.gif',
    bodyPart: 'chest',
    equipment: 'barbell',
    targetMuscle: 'pectorals',
    secondaryMuscles: ['triceps'],
    instructions: ['Step 1', 'Step 2'],
  };

  it('creates exercise with valid data', async () => {
    const created = { ...mockExercise, name: 'New Exercise' };
    (exerciseService.createExercise as jest.Mock).mockResolvedValue(created);

    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe('New Exercise');
    expect(exerciseService.createExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Exercise',
        bodyPart: 'chest',
      })
    );
  });

  it('creates exercise with optional exerciseId', async () => {
    const created = { ...mockExercise };
    (exerciseService.createExercise as jest.Mock).mockResolvedValue(created);

    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: { ...validBody, exerciseId: 'custom_123' },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(exerciseService.createExercise).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseId: 'custom_123' })
    );
  });

  it('creates exercise with optional difficulty', async () => {
    const created = { ...mockExercise };
    (exerciseService.createExercise as jest.Mock).mockResolvedValue(created);

    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: { ...validBody, difficulty: 'advanced' },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('returns 400 when name is missing', async () => {
    const { name, ...bodyWithoutName } = validBody;
    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: bodyWithoutName,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation Error');
  });

  it('returns 400 when gifUrl is invalid', async () => {
    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: { ...validBody, gifUrl: 'not-a-url' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when instructions is empty', async () => {
    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: { ...validBody, instructions: [] },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid difficulty enum', async () => {
    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: { ...validBody, difficulty: 'impossible' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('defaults secondaryMuscles to empty array', async () => {
    const { secondaryMuscles, ...bodyWithout } = validBody;
    const created = { ...mockExercise };
    (exerciseService.createExercise as jest.Mock).mockResolvedValue(created);

    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: bodyWithout,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(exerciseService.createExercise).toHaveBeenCalledWith(
      expect.objectContaining({ secondaryMuscles: [] })
    );
  });

  it('returns 500 when service throws', async () => {
    (exerciseService.createExercise as jest.Mock).mockRejectedValue(new Error('Create failed'));

    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('handles non-Error exceptions in catch block', async () => {
    (exerciseService.createExercise as jest.Mock).mockRejectedValue('string error');

    const req = createMockRequest('/api/exercises', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});
