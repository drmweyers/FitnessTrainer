/**
 * Tests for GET /api/programs/templates
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/programs/templates/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    programTemplate: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');

const mockAuthUser = { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'TRAINER' } };

describe('GET /api/programs/templates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest('/api/programs/templates');
    const response = await GET(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns all public templates', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const templates = [
      { id: 't1', name: 'Template 1', isPublic: true, useCount: 50, category: 'strength' },
      { id: 't2', name: 'Template 2', isPublic: true, useCount: 30, category: 'cardio' },
    ];
    (prisma.programTemplate.findMany as jest.Mock).mockResolvedValue(templates);

    const request = createMockRequest('/api/programs/templates');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it('filters by category when provided', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.programTemplate.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs/templates', {
      searchParams: { category: 'strength' },
    });
    await GET(request);

    expect(prisma.programTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublic: true,
          category: 'strength',
        }),
      })
    );
  });

  it('does not filter by category when not provided', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.programTemplate.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs/templates');
    await GET(request);

    expect(prisma.programTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
        },
      })
    );
  });

  it('includes program details with weeks, workouts, exercises', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.programTemplate.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs/templates');
    await GET(request);

    expect(prisma.programTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          program: expect.any(Object),
          creator: expect.any(Object),
        }),
      })
    );
  });

  it('orders by useCount descending', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.programTemplate.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs/templates');
    await GET(request);

    expect(prisma.programTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { useCount: 'desc' },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.programTemplate.findMany as jest.Mock).mockRejectedValue(new Error('Connection timeout'));

    const request = createMockRequest('/api/programs/templates');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Connection timeout');
  });

  it('returns empty array when no templates exist', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.programTemplate.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs/templates');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.count).toBe(0);
  });
});
