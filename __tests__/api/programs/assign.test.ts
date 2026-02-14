/**
 * Tests for POST /api/programs/[id]/assign
 */

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/programs/[id]/assign/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockTrainerUser,
  mockClientUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    program: {
      findFirst: jest.fn(),
    },
    trainerClient: {
      findFirst: jest.fn(),
    },
    programAssignment: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/services/activity.service', () => ({
  logProgramAssigned: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');
const { logProgramAssigned } = require('@/lib/services/activity.service');

const mockAuthUser = { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'TRAINER' } };
const programId = '00000000-0000-0000-0000-000000000020';
const params = { params: { id: programId } };

const validBody = {
  clientId: mockClientUser.id,
  startDate: '2024-06-01',
};

describe('POST /api/programs/[id]/assign', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns 400 for validation error - missing clientId', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: { startDate: '2024-06-01' },
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for validation error - invalid clientId format', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: { clientId: 'not-a-uuid', startDate: '2024-06-01' },
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for missing startDate', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: { clientId: mockClientUser.id },
    });
    const response = await POST(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(400);
  });

  it('returns 404 when program not found', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(404);
    expect(body.error).toBe('Program not found');
  });

  it('returns 403 when client relationship not found', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test Program', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(403);
    expect(body.error).toBe('Client not found or inactive');
  });

  it('checks for active client relationship', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    await POST(request, params);

    expect(prisma.trainerClient.findFirst).toHaveBeenCalledWith({
      where: {
        trainerId: mockTrainerUser.id,
        clientId: mockClientUser.id,
        status: 'active',
      },
    });
  });

  it('creates assignment with calculated end date', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test Program', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);

    const clientRelation = { trainerId: mockTrainerUser.id, clientId: mockClientUser.id, status: 'active' };
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(clientRelation);

    const assignment = {
      id: 'assignment-1',
      programId,
      clientId: mockClientUser.id,
      trainerId: mockTrainerUser.id,
      program,
      client: { id: mockClientUser.id, email: mockClientUser.email },
    };
    (prisma.programAssignment.create as jest.Mock).mockResolvedValue(assignment);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Program assigned successfully');

    const createCall = (prisma.programAssignment.create as jest.Mock).mock.calls[0][0];
    const startDate = new Date('2024-06-01');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (4 * 7));

    expect(createCall.data.startDate).toEqual(startDate);
    expect(createCall.data.endDate).toEqual(endDate);
  });

  it('logs activity after successful assignment', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test Program', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);

    const clientRelation = { trainerId: mockTrainerUser.id, clientId: mockClientUser.id, status: 'active' };
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(clientRelation);

    const assignment = { id: 'a1', programId, clientId: mockClientUser.id };
    (prisma.programAssignment.create as jest.Mock).mockResolvedValue(assignment);

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    await POST(request, params);

    expect(logProgramAssigned).toHaveBeenCalledWith(
      mockTrainerUser.id,
      mockClientUser.id,
      programId,
      'Test Program'
    );
  });

  it('does not fail if activity logging throws', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test Program', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);

    const clientRelation = { trainerId: mockTrainerUser.id, clientId: mockClientUser.id, status: 'active' };
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(clientRelation);

    const assignment = { id: 'a1', programId, clientId: mockClientUser.id };
    (prisma.programAssignment.create as jest.Mock).mockResolvedValue(assignment);

    logProgramAssigned.mockImplementation(() => { throw new Error('Activity log failed'); });

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    // Should still return 201 even though activity logging failed
    expect(status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);

    const clientRelation = { trainerId: mockTrainerUser.id, clientId: mockClientUser.id, status: 'active' };
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(clientRelation);

    (prisma.programAssignment.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('handles errors without message property', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const program = { id: programId, trainerId: mockTrainerUser.id, name: 'Test', durationWeeks: 4 };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(program);

    const clientRelation = { trainerId: mockTrainerUser.id, clientId: mockClientUser.id, status: 'active' };
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(clientRelation);

    (prisma.programAssignment.create as jest.Mock).mockRejectedValue({ code: 'CONSTRAINT_ERROR' });

    const request = createMockRequest(`/api/programs/${programId}/assign`, {
      method: 'POST',
      body: validBody,
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to assign program');
  });
});
