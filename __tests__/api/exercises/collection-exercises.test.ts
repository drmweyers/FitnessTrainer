/**
 * Tests for POST/DELETE /api/exercises/collections/[id]/exercises
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE } from '@/app/api/exercises/collections/[id]/exercises/route';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

import { authenticate } from '@/lib/middleware/auth';
import { createMockRequest, mockTrainerUser, mockExercise } from '@/tests/helpers/test-utils';

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

const collectionId = 'col-123';
const validExerciseId = '00000000-0000-0000-0000-000000000099';

// Add aggregate to the mock since it's used but not in the global mock
beforeAll(() => {
  (prisma.collectionExercise as any).aggregate = jest.fn();
  (prisma.collectionExercise as any).findUnique = jest.fn();
});

describe('POST /api/exercises/collections/[id]/exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });

    expect(res.status).toBe(401);
  });

  it('adds exercise to collection', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.collectionExercise as any).findUnique.mockResolvedValue(null);
    (prisma.collectionExercise as any).aggregate.mockResolvedValue({
      _max: { position: 2 },
    });
    const entry = {
      id: 'ce-new',
      collectionId,
      exerciseId: validExerciseId,
      position: 3,
      exercise: mockExercise,
    };
    (prisma.collectionExercise.create as jest.Mock).mockResolvedValue(entry);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.position).toBe(3);
  });

  it('sets position to 0 when collection is empty', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.collectionExercise as any).findUnique.mockResolvedValue(null);
    (prisma.collectionExercise as any).aggregate.mockResolvedValue({
      _max: { position: null },
    });
    (prisma.collectionExercise.create as jest.Mock).mockResolvedValue({
      id: 'ce-new',
      position: 0,
    });

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });

    expect(res.status).toBe(201);
    expect(prisma.collectionExercise.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 0 }),
      })
    );
  });

  it('returns 400 for invalid exerciseId', async () => {
    mockAuth();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: 'not-a-uuid' },
    });
    const res = await POST(req, { params: { id: collectionId } });

    expect(res.status).toBe(400);
  });

  it('returns 404 when collection not found', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Collection not found');
  });

  it('returns 404 when exercise not found', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Exercise not found');
  });

  it('returns 409 when exercise already in collection', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.collectionExercise as any).findUnique.mockResolvedValue({
      id: 'existing',
    });

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Exercise already in collection');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exercise.findUnique as jest.Mock).mockResolvedValue(mockExercise);
    (prisma.collectionExercise as any).findUnique.mockResolvedValue(null);
    (prisma.collectionExercise as any).aggregate.mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'POST',
      body: { exerciseId: validExerciseId },
    });
    const res = await POST(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to add exercise to collection');
  });
});

describe('DELETE /api/exercises/collections/[id]/exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req, { params: { id: collectionId } });

    expect(res.status).toBe(401);
  });

  it('removes exercise from collection', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.collectionExercise as any).findUnique.mockResolvedValue({
      id: 'ce-1',
      collectionId,
      exerciseId: validExerciseId,
    });
    (prisma.collectionExercise.delete as jest.Mock).mockResolvedValue({});

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Exercise removed');
  });

  it('returns 400 for invalid exerciseId', async () => {
    mockAuth();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'DELETE',
      body: { exerciseId: 'not-a-uuid' },
    });
    const res = await DELETE(req, { params: { id: collectionId } });

    expect(res.status).toBe(400);
  });

  it('returns 404 when collection not found', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Collection not found');
  });

  it('returns 404 when exercise not in collection', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.collectionExercise as any).findUnique.mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Exercise not in collection');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.collectionExercise as any).findUnique.mockResolvedValue({
      id: 'ce-1',
    });
    (prisma.collectionExercise.delete as jest.Mock).mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest(`/api/exercises/collections/${collectionId}/exercises`, {
      method: 'DELETE',
      body: { exerciseId: validExerciseId },
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to remove exercise');
  });
});
