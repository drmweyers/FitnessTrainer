/**
 * Tests for POST /api/programs/[id]/bulk-assign
 *
 * Covers:
 *   - Starter tier → 403
 *   - Professional tier → 403
 *   - Enterprise tier → 200, N ProgramAssignment rows created
 *   - Duplicate client IDs deduped (only one row per unique clientId)
 *   - Invalid client IDs returned as warnings, not errors
 */

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/programs/[id]/bulk-assign/route';
import { createMockRequest, mockTrainerUser, parseJsonResponse } from '@/tests/helpers/test-utils';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@/lib/db/prisma', () => {
  const p: any = {
    program: { findFirst: jest.fn() },
    trainerClient: { findFirst: jest.fn() },
    programAssignment: { findFirst: jest.fn(), create: jest.fn(), createMany: jest.fn() },
  };
  p.$transaction = jest.fn((fn: any) => fn(p));
  return { prisma: p };
});

// Grab the mock after jest.mock has been evaluated
const { prisma } = require('@/lib/db/prisma') as { prisma: any };

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

// withTier is mocked to allow us to control tier checks
jest.mock('@/lib/subscription/withTier', () => ({
  withTier: (opts: any) => (handler: any) => async (req: any, ctx: any) => {
    // Read tier from custom header injected by tests
    const tier = req.headers?.get?.('x-test-tier') ?? 'starter';
    if (opts.feature === 'programBuilder.bulkAssign') {
      if (tier !== 'enterprise') {
        return new (require('next/server').NextResponse)(
          JSON.stringify({
            success: false,
            error: {
              code: 'FEATURE_LOCKED',
              message: 'Requires enterprise tier',
              currentTier: tier,
              upgradeRequired: true,
            },
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }
    return handler(req, ctx);
  },
}));

const { authenticate } = require('@/lib/middleware/auth');

const PROGRAM_ID = '00000000-0000-0000-0000-000000000020';
const CLIENT_ID_1 = '00000000-0000-0000-0000-000000000031';
const CLIENT_ID_2 = '00000000-0000-0000-0000-000000000032';
const CLIENT_ID_INVALID = '00000000-0000-0000-0000-000000000099';

const params = { params: { id: PROGRAM_ID } };

const mockProgram = {
  id: PROGRAM_ID,
  trainerId: mockTrainerUser.id,
  name: 'Test Program',
  durationWeeks: 8,
};

function makeRequest(body: object, tier: string = 'enterprise') {
  const req = createMockRequest(`/api/programs/${PROGRAM_ID}/bulk-assign`, {
    method: 'POST',
    body,
    headers: { 'x-test-tier': tier },
  });
  return req;
}

describe('POST /api/programs/[id]/bulk-assign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: auth succeeds as trainer
    authenticate.mockResolvedValue({ user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'TRAINER' } });
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(mockProgram);
  });

  // ── Tier gating ──────────────────────────────────────────────────────────

  it('returns 403 for Starter tier', async () => {
    const req = makeRequest({ clientIds: [CLIENT_ID_1], startDate: '2024-06-01' }, 'starter');
    const res = await POST(req, params);
    expect(res.status).toBe(403);
    const { body } = await parseJsonResponse(res);
    expect(body.success).toBe(false);
    expect(body.error.upgradeRequired).toBe(true);
  });

  it('returns 403 for Professional tier', async () => {
    const req = makeRequest({ clientIds: [CLIENT_ID_1], startDate: '2024-06-01' }, 'professional');
    const res = await POST(req, params);
    expect(res.status).toBe(403);
  });

  // ── Enterprise success paths ─────────────────────────────────────────────

  it('creates N ProgramAssignment rows for N valid clients (Enterprise)', async () => {
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue({ id: 'rel-1', status: 'active' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.programAssignment.create as jest.Mock).mockImplementation(({ data }: any) => ({
      id: 'assign-' + data.clientId,
      ...data,
    }));

    const req = makeRequest({ clientIds: [CLIENT_ID_1, CLIENT_ID_2], startDate: '2024-06-01' }, 'enterprise');
    const res = await POST(req, params);

    expect(res.status).toBe(200);
    const { body } = await parseJsonResponse(res);
    expect(body.success).toBe(true);
    expect(body.data.created).toBe(2);
    expect(body.data.skipped).toBe(0);
  });

  it('deduplicates client IDs — creates only one row per unique clientId', async () => {
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue({ id: 'rel-1', status: 'active' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.programAssignment.create as jest.Mock).mockResolvedValue({ id: 'assign-1' });

    // CLIENT_ID_1 appears twice
    const req = makeRequest(
      { clientIds: [CLIENT_ID_1, CLIENT_ID_1, CLIENT_ID_2], startDate: '2024-06-01' },
      'enterprise',
    );
    const res = await POST(req, params);
    const { body } = await parseJsonResponse(res);

    // Should create 2 unique assignments, not 3
    expect(body.data.created).toBe(2);
  });

  it('returns warnings for invalid client IDs instead of failing the whole request', async () => {
    // CLIENT_ID_1 is valid, CLIENT_ID_INVALID has no trainer relationship
    (prisma.trainerClient.findFirst as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.clientId === CLIENT_ID_1) return Promise.resolve({ id: 'rel-1', status: 'active' });
      return Promise.resolve(null); // no relation for invalid client
    });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.programAssignment.create as jest.Mock).mockResolvedValue({ id: 'assign-1' });

    const req = makeRequest(
      { clientIds: [CLIENT_ID_1, CLIENT_ID_INVALID], startDate: '2024-06-01' },
      'enterprise',
    );
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    const { body } = await parseJsonResponse(res);
    expect(body.success).toBe(true);
    expect(body.data.created).toBe(1);
    expect(body.data.warnings).toHaveLength(1);
    expect(body.data.warnings[0]).toMatch(CLIENT_ID_INVALID);
  });

  it('returns 400 for missing clientIds', async () => {
    const req = makeRequest({ startDate: '2024-06-01' }, 'enterprise');
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('returns 404 when program not found for this trainer', async () => {
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);
    const req = makeRequest({ clientIds: [CLIENT_ID_1], startDate: '2024-06-01' }, 'enterprise');
    const res = await POST(req, params);
    expect(res.status).toBe(404);
  });
});
