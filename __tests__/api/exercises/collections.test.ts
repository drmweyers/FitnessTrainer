/**
 * Tests for GET/POST /api/exercises/collections
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/exercises/collections/route';
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

describe('GET /api/exercises/collections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest('/api/exercises/collections');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns user collections with exercise count', async () => {
    mockAuth();
    const mockCollections = [
      {
        id: 'col-1',
        name: 'My Collection',
        description: 'Test',
        isPublic: false,
        _count: { exercises: 5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (prisma.exerciseCollection.findMany as jest.Mock).mockResolvedValue(mockCollections);

    const req = createMockRequest('/api/exercises/collections');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].exerciseCount).toBe(5);
    expect(body.data[0].id).toBe('col-1');
    expect(body.data[0].name).toBe('My Collection');
    expect(body.data[0].isPublic).toBe(false);
  });

  it('returns empty array when no collections', async () => {
    mockAuth();
    (prisma.exerciseCollection.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/exercises/collections');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/exercises/collections');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch collections');
  });
});

describe('POST /api/exercises/collections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockAuthFailure();

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: 'Test' },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('creates collection with name only', async () => {
    mockAuth();
    const created = {
      id: 'col-new',
      userId: mockUser.id,
      name: 'My Collection',
      description: null,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.exerciseCollection.create as jest.Mock).mockResolvedValue(created);

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: 'My Collection' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('My Collection');
    expect(prisma.exerciseCollection.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        name: 'My Collection',
        description: null,
      },
    });
  });

  it('creates collection with description', async () => {
    mockAuth();
    const created = {
      id: 'col-new',
      userId: mockUser.id,
      name: 'My Collection',
      description: 'A test collection',
    };
    (prisma.exerciseCollection.create as jest.Mock).mockResolvedValue(created);

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: 'My Collection', description: 'A test collection' },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(prisma.exerciseCollection.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        name: 'My Collection',
        description: 'A test collection',
      },
    });
  });

  it('returns 400 when name is missing', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when name is empty string', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: '' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is too long', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: 'a'.repeat(256) },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when description is too long', async () => {
    mockAuth();

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: 'Valid Name', description: 'a'.repeat(1001) },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 500 on database error', async () => {
    mockAuth();
    (prisma.exerciseCollection.create as jest.Mock).mockRejectedValue(new Error('DB fail'));

    const req = createMockRequest('/api/exercises/collections', {
      method: 'POST',
      body: { name: 'Test' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to create collection');
  });
});
