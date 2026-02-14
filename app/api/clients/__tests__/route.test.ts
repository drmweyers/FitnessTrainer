/**
 * Clients API Route Tests
 */

import { GET, POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').default;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('GET /api/clients', () => {
  const mockTrainer = {
    id: 'trainer-123',
    email: 'trainer@example.com',
    role: 'trainer',
  };

  const createMockRequest = (params?: URLSearchParams) => {
    const url = params
      ? `http://localhost/api/clients?${params.toString()}`
      : 'http://localhost/api/clients';

    return {
      url,
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trainerClient = {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    };
    mockPrisma.user = {
      findUnique: jest.fn(),
    };
  });

  it('should return clients for trainer', async () => {
    const mockTrainerClients = [
      {
        id: 'tc-1',
        trainerId: mockTrainer.id,
        clientId: 'client-1',
        status: 'active',
        connectedAt: new Date('2024-01-01'),
        archivedAt: null,
        client: {
          id: 'client-1',
          email: 'client1@example.com',
          isActive: true,
          lastLoginAt: new Date('2024-01-15'),
          userProfile: {
            phone: '555-1234',
            profilePhotoUrl: 'photo.jpg',
          },
          clientProfile: {
            fitnessLevel: 'intermediate',
            goals: ['lose_weight'],
          },
        },
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findMany.mockResolvedValue(mockTrainerClients);
    mockPrisma.trainerClient.count.mockResolvedValue(1);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clients).toHaveLength(1);
    expect(data.clients[0]).toMatchObject({
      id: 'client-1',
      email: 'client1@example.com',
    });
    expect(data.pagination).toHaveProperty('total', 1);
  });

  it('should filter by status parameter', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findMany.mockResolvedValue([]);
    mockPrisma.trainerClient.count.mockResolvedValue(0);

    const params = new URLSearchParams({ status: 'active' });
    const request = createMockRequest(params);
    await GET(request);

    expect(mockPrisma.trainerClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
        }),
      })
    );
  });

  it('should filter by search parameter', async () => {
    const mockTrainerClients = [
      {
        id: 'tc-1',
        trainerId: mockTrainer.id,
        clientId: 'client-1',
        status: 'active',
        connectedAt: new Date(),
        archivedAt: null,
        client: {
          id: 'client-1',
          email: 'john@example.com',
          isActive: true,
          lastLoginAt: null,
          userProfile: null,
          clientProfile: null,
        },
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findMany.mockResolvedValue(mockTrainerClients);
    mockPrisma.trainerClient.count.mockResolvedValue(1);

    const params = new URLSearchParams({ search: 'john' });
    const request = createMockRequest(params);
    const response = await GET(request);
    const data = await response.json();

    expect(data.clients).toHaveLength(1);
    expect(data.clients[0].email).toContain('john');
  });

  it('should support pagination', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findMany.mockResolvedValue([]);
    mockPrisma.trainerClient.count.mockResolvedValue(100);

    const params = new URLSearchParams({ page: '2', limit: '20' });
    const request = createMockRequest(params);
    await GET(request);

    expect(mockPrisma.trainerClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    );
  });

  it('should return 403 for non-trainer non-admin', async () => {
    mockAuthenticate.mockResolvedValue({
      user: { ...mockTrainer, role: 'client' },
    } as any);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('should return 401 when not authenticated', async () => {
    mockAuthenticate.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should handle database errors', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

describe('POST /api/clients', () => {
  const mockTrainer = {
    id: 'trainer-123',
    email: 'trainer@example.com',
    role: 'trainer',
  };

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trainerClient = {
      findUnique: jest.fn(),
      create: jest.fn(),
    };
    mockPrisma.user = {
      findUnique: jest.fn(),
    };
  });

  it('should add existing user as client', async () => {
    const mockClient = {
      id: 'client-1',
      email: 'client@example.com',
    };

    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue(mockClient);
    mockPrisma.trainerClient.findUnique.mockResolvedValue(null);
    mockPrisma.trainerClient.create.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockTrainer.id,
      clientId: mockClient.id,
      status: 'active',
      connectedAt: new Date(),
      client: {
        ...mockClient,
        userProfile: null,
        clientProfile: null,
      },
    });

    const request = createMockRequest({
      email: 'client@example.com',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.email).toBe('client@example.com');
  });

  it('should return 400 when email is missing', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);

    const request = createMockRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 404 when user does not exist', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = createMockRequest({
      email: 'nonexistent@example.com',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('No user found');
  });

  it('should return 409 when relationship already exists', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'client-1',
      email: 'client@example.com',
    });
    mockPrisma.trainerClient.findUnique.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockTrainer.id,
      clientId: 'client-1',
    });

    const request = createMockRequest({
      email: 'client@example.com',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.message).toContain('already in your roster');
  });

  it('should return 403 for non-trainer non-admin', async () => {
    mockAuthenticate.mockResolvedValue({
      user: { ...mockTrainer, role: 'client' },
    } as any);

    const request = createMockRequest({
      email: 'client@example.com',
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('should handle database errors', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest({
      email: 'client@example.com',
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
