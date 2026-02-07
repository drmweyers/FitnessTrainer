/**
 * Tests for GET/PUT/DELETE /api/exercises/[id]
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/exercises/[id]/route';

jest.mock('@/lib/services/exercise.service', () => ({
  exerciseService: {
    getExerciseById: jest.fn(),
    updateExercise: jest.fn(),
    deleteExercise: jest.fn(),
  },
}));

import { exerciseService } from '@/lib/services/exercise.service';
import { createMockRequest, mockExercise } from '@/tests/helpers/test-utils';

describe('GET /api/exercises/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns exercise when found', async () => {
    const detail = { ...mockExercise, isFavorite: false, usageCount: 0 };
    (exerciseService.getExerciseById as jest.Mock).mockResolvedValue(detail);

    const req = createMockRequest('/api/exercises/some-id');
    const res = await GET(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('Bench Press');
    expect(exerciseService.getExerciseById).toHaveBeenCalledWith('some-id');
  });

  it('returns cache headers on success', async () => {
    (exerciseService.getExerciseById as jest.Mock).mockResolvedValue(mockExercise);

    const req = createMockRequest('/api/exercises/some-id');
    const res = await GET(req, { params: { id: 'some-id' } });

    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    );
  });

  it('returns 404 when exercise not found', async () => {
    (exerciseService.getExerciseById as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/exercises/nonexistent');
    const res = await GET(req, { params: { id: 'nonexistent' } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain('nonexistent');
  });

  it('returns 500 on service error', async () => {
    (exerciseService.getExerciseById as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/exercises/some-id');
    const res = await GET(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('handles non-Error exceptions', async () => {
    (exerciseService.getExerciseById as jest.Mock).mockRejectedValue('oops');

    const req = createMockRequest('/api/exercises/some-id');
    const res = await GET(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});

describe('PUT /api/exercises/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates exercise with valid data', async () => {
    const updated = { ...mockExercise, name: 'Updated Press' };
    (exerciseService.updateExercise as jest.Mock).mockResolvedValue(updated);

    const req = createMockRequest('/api/exercises/some-id', {
      method: 'PUT',
      body: { name: 'Updated Press' },
    });
    const res = await PUT(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('Updated Press');
    expect(exerciseService.updateExercise).toHaveBeenCalledWith(
      'some-id',
      expect.objectContaining({ name: 'Updated Press' })
    );
  });

  it('updates exercise with all optional fields', async () => {
    const updated = { ...mockExercise };
    (exerciseService.updateExercise as jest.Mock).mockResolvedValue(updated);

    const req = createMockRequest('/api/exercises/some-id', {
      method: 'PUT',
      body: {
        name: 'Updated',
        gifUrl: 'https://example.com/new.gif',
        bodyPart: 'back',
        equipment: 'dumbbell',
        targetMuscle: 'lats',
        secondaryMuscles: ['biceps'],
        instructions: ['New step'],
        difficulty: 'advanced',
        isActive: false,
      },
    });
    const res = await PUT(req, { params: { id: 'some-id' } });

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid gifUrl', async () => {
    const req = createMockRequest('/api/exercises/some-id', {
      method: 'PUT',
      body: { gifUrl: 'not-a-url' },
    });
    const res = await PUT(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation Error');
  });

  it('returns 400 for invalid difficulty enum', async () => {
    const req = createMockRequest('/api/exercises/some-id', {
      method: 'PUT',
      body: { difficulty: 'superhero' },
    });
    const res = await PUT(req, { params: { id: 'some-id' } });

    expect(res.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    (exerciseService.updateExercise as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const req = createMockRequest('/api/exercises/some-id', {
      method: 'PUT',
      body: { name: 'Test' },
    });
    const res = await PUT(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('handles non-Error exceptions', async () => {
    (exerciseService.updateExercise as jest.Mock).mockRejectedValue(null);

    const req = createMockRequest('/api/exercises/some-id', {
      method: 'PUT',
      body: { name: 'Test' },
    });
    const res = await PUT(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});

describe('DELETE /api/exercises/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('soft deletes exercise successfully', async () => {
    const deleted = { ...mockExercise, isActive: false };
    (exerciseService.deleteExercise as jest.Mock).mockResolvedValue(deleted);

    const req = createMockRequest('/api/exercises/some-id', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Exercise deleted successfully');
    expect(body.exercise.isActive).toBe(false);
    expect(exerciseService.deleteExercise).toHaveBeenCalledWith('some-id');
  });

  it('returns 500 on service error', async () => {
    (exerciseService.deleteExercise as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const req = createMockRequest('/api/exercises/some-id', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
  });

  it('handles non-Error exceptions', async () => {
    (exerciseService.deleteExercise as jest.Mock).mockRejectedValue(undefined);

    const req = createMockRequest('/api/exercises/some-id', { method: 'DELETE' });
    const res = await DELETE(req, { params: { id: 'some-id' } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});
