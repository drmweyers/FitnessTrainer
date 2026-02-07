/**
 * Tests for GET/POST/DELETE /api/exercises/favorites
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/exercises/favorites/route';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

import { authenticate } from '@/lib/middleware/auth';
import {
  createMockRequest,
  mockTrainerUser,
  mockExercise,
} from '@/tests/helpers/test-utils';

const mockUser = {
  id: mockTrainerUser.id,
  email: mockTrainerUser.email,
  role: 'trainer',
  isActive: true,
  isVerified: true,
};

function mockAuth(user = mockUser) {
  const req = { user } as any;
  (authenticate as jest.Mock).mockResolvedValue(req);
}

function mockAuthFailure() {
  (authenticate as jest.Mock).mockResolvedValue(
    NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/exercises/favorites', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest('/api/exercises/favorites');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns user favorites', async () => {
    mockAuth();
    const mockFavorites = [
      {
        id: 'fav-1',
        userId: mockUser.id,
        exerciseId: mockExercise.id,
        favoritedAt: new Date(),
        exercise: mockExercise,
      },
    ];
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue(mockFavorites);

    const req = createMockRequest('/api/exercises/favorites');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(prisma.exerciseFavorite.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      include: { exercise: true },
      orderBy: { favoritedAt: 'desc' },
    });
  });

  it('returns empty array when no favorites', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/exercises/favorites');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/exercises/favorites');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch favorites');
  });
});

describe('POST /api/exercises/favorites', () => {
  beforeEach(() => jest.clearAllMocks());

  const validExerciseId = '00000000-0000-0000-0000-000000000099';

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('adds exercise to favorites', async () => {
    mockAuth();
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.exerciseFavorite.findUnique as jest.Mock).mockResolvedValue(null);
    const createdFav = {
      id: 'fav-new',
      userId: mockUser.id,
      exerciseId: validExerciseId,
      exercise: mockExercise,
    };
    (prisma.exerciseFavorite.create as jest.Mock).mockResolvedValue(createdFav);

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('fav-new');
  });

  it('returns 400 for invalid exerciseId (not UUID)', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: { exerciseId: 'not-a-uuid' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when exerciseId is missing', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 404 when exercise does not exist', async () => {
    mockAuth();
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Exercise not found');
  });

  it('returns 409 when exercise is already favorited', async () => {
    mockAuth();
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.exerciseFavorite.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-fav',
    });

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Exercise is already favorited');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.exerciseFavorite.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.exerciseFavorite.create as jest.Mock).mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to add favorite');
  });
});

describe('DELETE /api/exercises/favorites', () => {
  beforeEach(() => jest.clearAllMocks());

  const validExerciseId = '00000000-0000-0000-0000-000000000099';

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
  });

  it('removes favorite successfully', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findUnique as jest.Mock).mockResolvedValue({
      id: 'fav-1',
      userId: mockUser.id,
      exerciseId: validExerciseId,
    });
    (prisma.exerciseFavorite.delete as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Favorite removed');
    expect(prisma.exerciseFavorite.delete).toHaveBeenCalledWith({
      where: { id: 'fav-1' },
    });
  });

  it('returns 400 for invalid exerciseId', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'DELETE',
      body: { exerciseId: 'not-a-uuid' },
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 404 when favorite not found', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Favorite not found');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findUnique as jest.Mock).mockResolvedValue({
      id: 'fav-1',
    });
    (prisma.exerciseFavorite.delete as jest.Mock).mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest('/api/exercises/favorites', {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to remove favorite');
  });
});
