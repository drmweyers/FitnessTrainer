/**
 * Tests for app/api/clients/route.ts
 * GET /api/clients
 * POST /api/clients
 */

import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/clients/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockTrainerUser, mockAdminUser, mockClientUser } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockedPrisma = prisma as any;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuthAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/clients');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is client role', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/clients');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns clients for trainer', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const mockTrainerClients = [
      {
        id: 'tc-1',
        trainerId: mockTrainerUser.id,
        clientId: mockClientUser.id,
        status: 'active',
        connectedAt: new Date('2024-01-01'),
        archivedAt: null,
        client: {
          id: mockClientUser.id,
          email: mockClientUser.email,
          isActive: true,
          lastLoginAt: new Date('2024-06-01'),
          userProfile: {
            phone: '555-1234',
            profilePhotoUrl: 'photo.jpg',
          },
          clientProfile: {
            fitnessLevel: 'intermediate',
            goals: ['lose_weight', 'build_muscle'],
          },
        },
      },
    ];

    mockedPrisma.trainerClient.findMany.mockResolvedValue(mockTrainerClients);
    mockedPrisma.trainerClient.count.mockResolvedValue(1);

    const request = createMockRequest('/api/clients');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.clients).toHaveLength(1);
    expect(body.clients[0].id).toBe(mockClientUser.id);
    expect(body.clients[0].email).toBe(mockClientUser.email);
    expect(body.clients[0].trainerClient.status).toBe('active');
    expect(body.pagination.total).toBe(1);
  });

  it('filters clients by status', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    mockedPrisma.trainerClient.findMany.mockResolvedValue([]);
    mockedPrisma.trainerClient.count.mockResolvedValue(0);

    const request = createMockRequest('/api/clients', { searchParams: { status: 'archived' } });
    await GET(request);

    expect(mockedPrisma.trainerClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'archived' }),
      })
    );
  });

  it('searches clients by email', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const mockTrainerClients = [
      {
        id: 'tc-1',
        trainerId: mockTrainerUser.id,
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
      {
        id: 'tc-2',
        trainerId: mockTrainerUser.id,
        clientId: 'client-2',
        status: 'active',
        connectedAt: new Date(),
        archivedAt: null,
        client: {
          id: 'client-2',
          email: 'jane@example.com',
          isActive: true,
          lastLoginAt: null,
          userProfile: null,
          clientProfile: null,
        },
      },
    ];

    mockedPrisma.trainerClient.findMany.mockResolvedValue(mockTrainerClients);
    mockedPrisma.trainerClient.count.mockResolvedValue(2);

    const request = createMockRequest('/api/clients', { searchParams: { search: 'john' } });
    const response = await GET(request);
    const body = await response.json();

    expect(body.clients).toHaveLength(1);
    expect(body.clients[0].email).toBe('john@example.com');
  });

  it('handles pagination', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    mockedPrisma.trainerClient.findMany.mockResolvedValue([]);
    mockedPrisma.trainerClient.count.mockResolvedValue(100);

    const request = createMockRequest('/api/clients', { searchParams: { page: '2', limit: '10' } });
    const response = await GET(request);
    const body = await response.json();

    expect(mockedPrisma.trainerClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.totalPages).toBe(10);
  });

  it('admin can see all clients', async () => {
    mockAuthAs({ id: mockAdminUser.id, role: 'admin' });

    mockedPrisma.trainerClient.findMany.mockResolvedValue([]);
    mockedPrisma.trainerClient.count.mockResolvedValue(0);

    const request = createMockRequest('/api/clients');
    await GET(request);

    expect(mockedPrisma.trainerClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });

  it('handles database errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerClient.findMany.mockRejectedValue(new Error('DB error'));
    mockedPrisma.trainerClient.count.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/clients');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('POST /api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: 'test@example.com' } });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is client role', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: 'test@example.com' } });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('returns 400 when email is missing', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/clients', { method: 'POST', body: {} });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation Error');
    expect(body.message).toContain('Email is required');
  });

  it('returns 404 when user not found', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: 'notfound@example.com' } });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain('No user found');
  });

  it('returns 409 when client relationship already exists', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: mockClientUser.id, email: mockClientUser.email });
    mockedPrisma.trainerClient.findUnique.mockResolvedValue({
      id: 'tc-existing',
      trainerId: mockTrainerUser.id,
      clientId: mockClientUser.id,
    });

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: mockClientUser.email } });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Conflict');
    expect(body.message).toContain('already in your roster');
  });

  it('successfully creates trainer-client relationship', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: mockClientUser.id, email: mockClientUser.email });
    mockedPrisma.trainerClient.findUnique.mockResolvedValue(null);
    mockedPrisma.trainerClient.create.mockResolvedValue({
      id: 'tc-new',
      trainerId: mockTrainerUser.id,
      clientId: mockClientUser.id,
      status: 'active',
      connectedAt: new Date('2024-01-01'),
      client: {
        id: mockClientUser.id,
        email: mockClientUser.email,
        userProfile: null,
        clientProfile: null,
      },
    });

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: mockClientUser.email } });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe(mockClientUser.id);
    expect(body.email).toBe(mockClientUser.email);
    expect(body.trainerClient.status).toBe('active');
  });

  it('admin can add client', async () => {
    mockAuthAs({ id: mockAdminUser.id, role: 'admin' });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: mockClientUser.id, email: mockClientUser.email });
    mockedPrisma.trainerClient.findUnique.mockResolvedValue(null);
    mockedPrisma.trainerClient.create.mockResolvedValue({
      id: 'tc-admin',
      trainerId: mockAdminUser.id,
      clientId: mockClientUser.id,
      status: 'active',
      connectedAt: new Date(),
      client: {
        id: mockClientUser.id,
        email: mockClientUser.email,
        userProfile: null,
        clientProfile: null,
      },
    });

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: mockClientUser.email } });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('handles database errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/clients', { method: 'POST', body: { email: 'test@example.com' } });
    const response = await POST(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
