/**
 * Tests for GET /api/exercises/by-id/[exerciseId]
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/exercises/by-id/[exerciseId]/route';

jest.mock('@/lib/services/exercise.service', () => ({
  exerciseService: {
    getExerciseByExerciseId: jest.fn(),
  },
}));

import { exerciseService } from '@/lib/services/exercise.service';
import { createMockRequest, mockExercise } from '@/tests/helpers/test-utils';

describe('GET /api/exercises/by-id/[exerciseId]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns exercise when found', async () => {
    (exerciseService.getExerciseByExerciseId as jest.Mock).mockResolvedValue(mockExercise);

    const req = createMockRequest('/api/exercises/by-id/ex_001');
    const res = await GET(req, { params: { exerciseId: 'ex_001' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('Bench Press');
    expect(exerciseService.getExerciseByExerciseId).toHaveBeenCalledWith('ex_001');
  });

  it('includes cache headers', async () => {
    (exerciseService.getExerciseByExerciseId as jest.Mock).mockResolvedValue(mockExercise);

    const req = createMockRequest('/api/exercises/by-id/ex_001');
    const res = await GET(req, { params: { exerciseId: 'ex_001' } });

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
  });

  it('returns 404 when exercise not found', async () => {
    (exerciseService.getExerciseByExerciseId as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/exercises/by-id/nonexistent');
    const res = await GET(req, { params: { exerciseId: 'nonexistent' } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain('nonexistent');
  });

  it('returns 500 when service throws Error', async () => {
    (exerciseService.getExerciseByExerciseId as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const req = createMockRequest('/api/exercises/by-id/ex_001');
    const res = await GET(req, { params: { exerciseId: 'ex_001' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
    expect(body.details).toBe('DB error');
  });

  it('handles non-Error exceptions', async () => {
    (exerciseService.getExerciseByExerciseId as jest.Mock).mockRejectedValue(42);

    const req = createMockRequest('/api/exercises/by-id/ex_001');
    const res = await GET(req, { params: { exerciseId: 'ex_001' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});
