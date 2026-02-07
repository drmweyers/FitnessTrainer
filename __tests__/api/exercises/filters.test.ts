/**
 * Tests for GET /api/exercises/filters
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/exercises/filters/route';

jest.mock('@/lib/services/exercise.service', () => ({
  exerciseService: {
    getFilterOptions: jest.fn(),
  },
}));

import { exerciseService } from '@/lib/services/exercise.service';
import { createMockRequest } from '@/tests/helpers/test-utils';

describe('GET /api/exercises/filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns filter options', async () => {
    const mockFilters = {
      bodyParts: ['chest', 'back', 'legs'],
      equipments: ['barbell', 'dumbbell'],
      targetMuscles: ['pectorals', 'lats'],
      difficulties: ['beginner', 'intermediate', 'advanced'],
    };
    (exerciseService.getFilterOptions as jest.Mock).mockResolvedValue(mockFilters);

    const req = createMockRequest('/api/exercises/filters');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bodyParts).toEqual(['chest', 'back', 'legs']);
    expect(body.equipments).toEqual(['barbell', 'dumbbell']);
    expect(body.targetMuscles).toEqual(['pectorals', 'lats']);
    expect(body.difficulties).toEqual(['beginner', 'intermediate', 'advanced']);
  });

  it('includes long cache headers (filters rarely change)', async () => {
    (exerciseService.getFilterOptions as jest.Mock).mockResolvedValue({
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      difficulties: [],
    });

    const req = createMockRequest('/api/exercises/filters');
    const res = await GET(req);

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('returns 500 when service throws Error', async () => {
    (exerciseService.getFilterOptions as jest.Mock).mockRejectedValue(
      new Error('Filter fetch failed')
    );

    const req = createMockRequest('/api/exercises/filters');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Failed to fetch exercise filters');
    expect(body.details).toBe('Filter fetch failed');
  });

  it('handles non-Error exceptions', async () => {
    (exerciseService.getFilterOptions as jest.Mock).mockRejectedValue(null);

    const req = createMockRequest('/api/exercises/filters');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});
