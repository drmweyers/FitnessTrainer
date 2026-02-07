/**
 * Tests for GET/PUT/DELETE /api/exercises/collections/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/exercises/collections/[id]/route';
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

describe('GET /api/exercises/collections/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`);
    const res = await GET(req, { params: { id: collectionId } });

    expect(res.status).toBe(401);
  });

  it('returns collection with exercises', async () => {
    mockAuth();
    const mockCollection = {
      id: collectionId,
      name: 'My Collection',
      description: 'Test',
      userId: mockUser.id,
      isPublic: false,
      exercises: [
        { id: 'ce-1', exerciseId: mockExercise.id, position: 0, exercise: mockExercise },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue(mockCollection);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`);
    const res = await GET(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('My Collection');
    expect(body.data.exercises).toHaveLength(1);
    expect(prisma.exerciseCollection.findFirst).toHaveBeenCalledWith({
      where: { id: collectionId, userId: mockUser.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  });

  it('returns 404 when collection not found', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`);
    const res = await GET(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Collection not found');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`);
    const res = await GET(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch collection');
  });
});

describe('PUT /api/exercises/collections/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { name: 'Updated' },
    });
    const res = await PUT(req, { params: { id: collectionId } });

    expect(res.status).toBe(401);
  });

  it('updates collection name', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    const updated = {
      id: collectionId,
      name: 'Updated Name',
      userId: mockUser.id,
    };
    (prisma.exerciseCollection.update as jest.Mock).mockResolvedValue(updated);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { name: 'Updated Name' },
    });
    const res = await PUT(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Updated Name');
  });

  it('updates collection description', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    const updated = { id: collectionId, description: 'New desc' };
    (prisma.exerciseCollection.update as jest.Mock).mockResolvedValue(updated);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { description: 'New desc' },
    });
    const res = await PUT(req, { params: { id: collectionId } });

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid data', async () => {
    mockAuth();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { name: '' }, // min length 1
    });
    const res = await PUT(req, { params: { id: collectionId } });

    expect(res.status).toBe(400);
  });

  it('returns 400 for name too long', async () => {
    mockAuth();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { name: 'a'.repeat(256) },
    });
    const res = await PUT(req, { params: { id: collectionId } });

    expect(res.status).toBe(400);
  });

  it('returns 404 when collection not found (ownership check)', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { name: 'Updated' },
    });
    const res = await PUT(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Collection not found');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exerciseCollection.update as jest.Mock).mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'PUT',
      body: { name: 'Updated' },
    });
    const res = await PUT(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to update collection');
  });
});

describe('DELETE /api/exercises/collections/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { id: collectionId } });

    expect(res.status).toBe(401);
  });

  it('deletes collection successfully', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exerciseCollection.delete as jest.Mock).mockResolvedValue({});

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Collection deleted');
    expect(prisma.exerciseCollection.delete).toHaveBeenCalledWith({
      where: { id: collectionId },
    });
  });

  it('returns 404 when collection not found (ownership check)', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Collection not found');
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.findFirst as jest.Mock).mockResolvedValue({
      id: collectionId,
      userId: mockUser.id,
    });
    (prisma.exerciseCollection.delete as jest.Mock).mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest(`/api/exercises/collections/${collectionId}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { id: collectionId } });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to delete collection');
  });
});
