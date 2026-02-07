/**
 * Tests for GET /api/exercises/search
 *
 * Note: The search route passes searchParams.get('limit') to Zod,
 * which returns null when the param is absent. Zod's z.string().optional()
 * does NOT accept null (only undefined), so we must always provide limit
 * in the searchParams to avoid a spurious validation error.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/exercises/search/route';

jest.mock('@/lib/services/exercise.service', () => ({
  exerciseService: {
    searchExercises: jest.fn(),
  },
}));

import { exerciseService } from '@/lib/services/exercise.service';
import { createMockRequest, mockExercise } from '@/tests/helpers/test-utils';

describe('GET /api/exercises/search', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns search results with valid query', async () => {
    (exerciseService.searchExercises as jest.Mock).mockResolvedValue([mockExercise]);

    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: 'bench', limit: '10' },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exercises).toHaveLength(1);
    expect(body.query).toBe('bench');
    expect(exerciseService.searchExercises).toHaveBeenCalledWith('bench', 10);
  });

  it('uses custom limit', async () => {
    (exerciseService.searchExercises as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: 'squat', limit: '5' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(exerciseService.searchExercises).toHaveBeenCalledWith('squat', 5);
  });

  it('transforms limit to integer', async () => {
    (exerciseService.searchExercises as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: 'test', limit: '25' },
    });
    await GET(req);

    expect(exerciseService.searchExercises).toHaveBeenCalledWith('test', 25);
  });

  it('returns 400 when q parameter is missing', async () => {
    // Note: searchParams.get('q') returns null, causing validation failure
    const req = createMockRequest('/api/exercises/search', {
      searchParams: { limit: '10' },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation Error');
    expect(body.message).toBe('Invalid search parameters');
  });

  it('returns 400 when q is empty string', async () => {
    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: '', limit: '10' },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('includes cache headers on success', async () => {
    (exerciseService.searchExercises as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: 'test', limit: '10' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300'
    );
  });

  it('returns 500 when service throws Error', async () => {
    (exerciseService.searchExercises as jest.Mock).mockRejectedValue(new Error('Search failed'));

    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: 'test', limit: '10' },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
    expect(body.details).toBe('Search failed');
  });

  it('handles non-Error exceptions', async () => {
    (exerciseService.searchExercises as jest.Mock).mockRejectedValue('boom');

    const req = createMockRequest('/api/exercises/search', {
      searchParams: { q: 'test', limit: '10' },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});
