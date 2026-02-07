/**
 * Tests for GET/PUT/DELETE /api/programs/[id]
 */

import { NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/programs/[id]/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    program: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');

const mockAuthUser = { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'TRAINER' } };
const validId = '00000000-0000-0000-0000-000000000020';
const params = { params: { id: validId } };

describe('GET /api/programs/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest(`/api/programs/${validId}`);
    const response = await GET(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns 400 for invalid UUID format', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const request = createMockRequest('/api/programs/not-a-uuid');
    const response = await GET(request, { params: { id: 'not-a-uuid' } });
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.error).toBe('Invalid program ID format');
  });

  it('returns 404 when program not found', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${validId}`);
    const response = await GET(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(404);
    expect(body.error).toBe('Program not found');
  });

  it('returns program with full details', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = {
      id: validId,
      name: 'My Program',
      trainerId: mockTrainerUser.id,
      weeks: [],
      assignments: [],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);

    const request = createMockRequest(`/api/programs/${validId}`);
    const response = await GET(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(validId);
    expect(body.data.name).toBe('My Program');
  });

  it('filters by trainerId for ownership', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${validId}`);
    await GET(request, params);

    expect(prisma.program.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: validId, trainerId: mockTrainerUser.id },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/programs/${validId}`);
    const response = await GET(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});

describe('PUT /api/programs/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  const updateBody = {
    name: 'Updated Program',
    description: 'Updated description',
  };

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: updateBody });
    const response = await PUT(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns 404 when program not found', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: updateBody });
    const response = await PUT(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(404);
    expect(body.error).toBe('Program not found');
  });

  it('updates program successfully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const existing = { id: validId, trainerId: mockTrainerUser.id, name: 'Old Name' };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(existing);

    const updated = { ...existing, ...updateBody, weeks: [] };
    (prisma.program.update as jest.Mock).mockResolvedValue(updated);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: updateBody });
    const response = await PUT(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Program updated successfully');
    expect(body.data.name).toBe('Updated Program');
  });

  it('returns 400 for invalid programType', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const invalidBody = { programType: 'invalid' };
    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: invalidBody });
    const response = await PUT(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for durationWeeks exceeding max', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const invalidBody = { durationWeeks: 53 };
    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: invalidBody });
    const response = await PUT(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(400);
  });

  it('verifies ownership before updating', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: updateBody });
    await PUT(request, params);

    expect(prisma.program.findFirst).toHaveBeenCalledWith({
      where: { id: validId, trainerId: mockTrainerUser.id },
    });
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const existing = { id: validId, trainerId: mockTrainerUser.id };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.program.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'PUT', body: updateBody });
    const response = await PUT(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('allows partial updates with optional fields', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const existing = { id: validId, trainerId: mockTrainerUser.id };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.program.update as jest.Mock).mockResolvedValue({ ...existing, name: 'New Name' });

    const request = createMockRequest(`/api/programs/${validId}`, {
      method: 'PUT',
      body: { name: 'New Name' },
    });
    const response = await PUT(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe('DELETE /api/programs/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'DELETE' });
    const response = await DELETE(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns 404 when program not found', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'DELETE' });
    const response = await DELETE(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(404);
    expect(body.error).toBe('Program not found');
  });

  it('deletes program successfully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const existing = { id: validId, trainerId: mockTrainerUser.id };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.program.delete as jest.Mock).mockResolvedValue(existing);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'DELETE' });
    const response = await DELETE(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Program deleted successfully');
  });

  it('verifies ownership before deleting', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'DELETE' });
    await DELETE(request, params);

    expect(prisma.program.findFirst).toHaveBeenCalledWith({
      where: { id: validId, trainerId: mockTrainerUser.id },
    });
  });

  it('calls prisma.program.delete with correct id', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const existing = { id: validId, trainerId: mockTrainerUser.id };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.program.delete as jest.Mock).mockResolvedValue(existing);

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'DELETE' });
    await DELETE(request, params);

    expect(prisma.program.delete).toHaveBeenCalledWith({ where: { id: validId } });
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const existing = { id: validId, trainerId: mockTrainerUser.id };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.program.delete as jest.Mock).mockRejectedValue(new Error('FK constraint'));

    const request = createMockRequest(`/api/programs/${validId}`, { method: 'DELETE' });
    const response = await DELETE(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('FK constraint');
  });
});
