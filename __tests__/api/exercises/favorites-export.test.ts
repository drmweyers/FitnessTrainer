/**
 * Tests for GET /api/exercises/favorites/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/exercises/favorites/export/route';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

import { authenticate } from '@/lib/middleware/auth';
import { createMockRequest, mockTrainerUser } from '@/tests/helpers/test-utils';

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
    NextResponse.json({ success: false }, { status: 401 })
  );
}

const mockFavorites = [
  {
    id: 'fav-1',
    userId: mockUser.id,
    exerciseId: 'ex-1',
    favoritedAt: new Date(),
    exercise: {
      id: 'ex-1',
      name: 'Push Up',
      bodyPart: 'chest',
      equipment: 'body weight',
      target: 'pectorals',
      difficulty: 'beginner',
    },
  },
  {
    id: 'fav-2',
    userId: mockUser.id,
    exerciseId: 'ex-2',
    favoritedAt: new Date(),
    exercise: {
      id: 'ex-2',
      name: 'Pull Up',
      bodyPart: 'back',
      equipment: 'pull-up bar',
      target: 'lats',
      difficulty: 'intermediate',
    },
  },
];

describe('GET /api/exercises/favorites/export', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest('/api/exercises/favorites/export');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns CSV with correct headers and data rows', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue(mockFavorites);

    const req = createMockRequest('/api/exercises/favorites/export', {
      searchParams: { format: 'csv' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('name,bodyPart,equipment,targetMuscle,difficulty');
    expect(text).toContain('Push Up');
    expect(text).toContain('Pull Up');
    expect(text).toContain('chest');
    expect(text).toContain('back');
  });

  it('returns CSV content-type header', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue(mockFavorites);

    const req = createMockRequest('/api/exercises/favorites/export');
    const res = await GET(req);

    expect(res.headers.get('Content-Type')).toContain('text/csv');
  });

  it('returns content-disposition header for download', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue(mockFavorites);

    const req = createMockRequest('/api/exercises/favorites/export');
    const res = await GET(req);

    const disposition = res.headers.get('Content-Disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.csv');
  });

  it('returns empty CSV (headers only) when no favorites', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/exercises/favorites/export');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('name,bodyPart,equipment,targetMuscle,difficulty');
    // No data rows beyond header
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(1);
  });

  it('escapes commas in exercise names', async () => {
    mockAuth();
    const favWithComma = [
      {
        id: 'fav-3',
        userId: mockUser.id,
        exerciseId: 'ex-3',
        favoritedAt: new Date(),
        exercise: {
          id: 'ex-3',
          name: 'Curl, Hammer',
          bodyPart: 'upper arms',
          equipment: 'dumbbell',
          target: 'biceps',
          difficulty: 'beginner',
        },
      },
    ];
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue(favWithComma);

    const req = createMockRequest('/api/exercises/favorites/export');
    const res = await GET(req);

    const text = await res.text();
    expect(text).toContain('"Curl, Hammer"');
  });

  it('queries database with correct user and includes exercise', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockResolvedValue(mockFavorites);

    const req = createMockRequest('/api/exercises/favorites/export');
    await GET(req);

    expect(prisma.exerciseFavorite.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      include: { exercise: true },
      orderBy: { favoritedAt: 'desc' },
    });
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseFavorite.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/exercises/favorites/export');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to export favorites');
  });
});
