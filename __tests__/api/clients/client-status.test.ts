/**
 * Tests for app/api/clients/[id]/status/route.ts
 * PATCH /api/clients/[id]/status
 */

import { NextResponse } from 'next/server';
import { PATCH } from '@/app/api/clients/[id]/status/route';
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

describe('PATCH /api/clients/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is client role', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Trainer or admin role required');
  });

  it('returns 400 for invalid status value', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'invalid-status' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 when status is missing', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: {},
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 when client relationship not found', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerClient.findFirst.mockResolvedValue(null);

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Client relationship not found');
  });

  it('successfully updates status to active', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerClient.findFirst.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockTrainerUser.id,
      clientId: 'client-1',
      status: 'pending',
    });
    mockedPrisma.trainerClient.update.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockTrainerUser.id,
      clientId: 'client-1',
      status: 'active',
      archivedAt: null,
      client: {
        id: 'client-1',
        email: 'client@example.com',
      },
    });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('active');
    expect(body.data.status).toBe('active');
  });

  it('successfully updates status to archived with timestamp', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerClient.findFirst.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockTrainerUser.id,
      clientId: 'client-1',
      status: 'active',
    });
    const mockArchivedDate = new Date('2024-06-01');
    mockedPrisma.trainerClient.update.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockTrainerUser.id,
      clientId: 'client-1',
      status: 'archived',
      archivedAt: mockArchivedDate,
      client: {
        id: 'client-1',
        email: 'client@example.com',
      },
    });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'archived' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('archived');
    expect(mockedPrisma.trainerClient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'archived',
          archivedAt: expect.any(Date),
        }),
      })
    );
  });

  it('handles all valid status values', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    const validStatuses = ['active', 'pending', 'offline', 'need_programming', 'archived'];

    for (const status of validStatuses) {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue({
        id: 'tc-1',
        trainerId: mockTrainerUser.id,
        clientId: 'client-1',
      });
      mockedPrisma.trainerClient.update.mockResolvedValue({
        id: 'tc-1',
        status,
        client: { id: 'client-1', email: 'test@example.com' },
      });

      const request = createMockRequest('/api/clients/client-1/status', {
        method: 'PATCH',
        body: { status },
      });
      const response = await PATCH(request, { params: { id: 'client-1' } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    }
  });

  it('admin can update client status', async () => {
    mockAuthAs({ id: mockAdminUser.id, role: 'admin' });
    mockedPrisma.trainerClient.findFirst.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockAdminUser.id,
      clientId: 'client-1',
      status: 'pending',
    });
    mockedPrisma.trainerClient.update.mockResolvedValue({
      id: 'tc-1',
      trainerId: mockAdminUser.id,
      clientId: 'client-1',
      status: 'active',
      client: {
        id: 'client-1',
        email: 'client@example.com',
      },
    });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });

    expect(response.status).toBe(200);
  });

  it('verifies trainer owns the client relationship', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    await PATCH(request, { params: { id: 'client-1' } });

    expect(mockedPrisma.trainerClient.findFirst).toHaveBeenCalledWith({
      where: {
        trainerId: mockTrainerUser.id,
        clientId: 'client-1',
      },
    });
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerClient.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/clients/client-1/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });
    const response = await PATCH(request, { params: { id: 'client-1' } });

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
