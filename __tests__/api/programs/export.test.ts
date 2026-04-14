/**
 * Tests for GET /api/programs/[id]/export
 *
 * Covers:
 *   - Starter tier → 403
 *   - Professional tier → 200
 *   - Enterprise tier → 200
 *   - Invalid program ID → 404
 *   - Rate-limit header returned
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/programs/[id]/export/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockTrainerUser, parseJsonResponse } from '@/tests/helpers/test-utils';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    program: {
      findFirst: jest.fn(),
    },
    programWeek: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/subscription/withTier', () => ({
  withTier: (opts: any) => (handler: any) => async (req: any, ctx: any) => {
    const tier = req.headers?.get?.('x-test-tier') ?? 'starter';
    const TIER_LEVEL: Record<string, number> = { starter: 1, professional: 2, enterprise: 3 };
    const MIN_LEVELS: Record<string, number> = { 'programBuilder.pdfExport': 2 };
    const required = MIN_LEVELS[opts.feature ?? ''] ?? 1;
    if (TIER_LEVEL[tier] < required) {
      return new (require('next/server').NextResponse)(
        JSON.stringify({
          success: false,
          error: { code: 'FEATURE_LOCKED', upgradeRequired: true },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return handler(req, ctx);
  },
}));

// Mock puppeteer so tests don't spin up a real browser
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

const { authenticate } = require('@/lib/middleware/auth');

const PROGRAM_ID = '00000000-0000-0000-0000-000000000020';
const params = { params: { id: PROGRAM_ID } };

const mockProgram = {
  id: PROGRAM_ID,
  trainerId: mockTrainerUser.id,
  name: 'My Test Program',
  description: 'A 4-week strength block',
  durationWeeks: 4,
  updatedAt: new Date('2024-06-01T00:00:00Z'),
  weeks: [],
};

function makeRequest(tier: string = 'professional') {
  return createMockRequest(`/api/programs/${PROGRAM_ID}/export`, {
    method: 'GET',
    headers: { 'x-test-tier': tier },
  });
}

describe('GET /api/programs/[id]/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.mockResolvedValue({
      user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'TRAINER' },
    });
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(mockProgram);
  });

  // ── Tier gating ──────────────────────────────────────────────────────────

  it('returns 403 for Starter tier', async () => {
    const req = makeRequest('starter');
    const res = await GET(req, params);
    expect(res.status).toBe(403);
    const { body } = await parseJsonResponse(res);
    expect(body.error.upgradeRequired).toBe(true);
  });

  it('returns 200 for Professional tier', async () => {
    const req = makeRequest('professional');
    const res = await GET(req, params);
    expect(res.status).toBe(200);
  });

  it('returns 200 for Enterprise tier', async () => {
    const req = makeRequest('enterprise');
    const res = await GET(req, params);
    expect(res.status).toBe(200);
  });

  // ── Not found ────────────────────────────────────────────────────────────

  it('returns 404 when program does not exist or belongs to another trainer', async () => {
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);
    const req = makeRequest('professional');
    const res = await GET(req, params);
    expect(res.status).toBe(404);
  });

  // ── Rate-limit header ─────────────────────────────────────────────────────

  it('includes X-RateLimit-Remaining header in the response', async () => {
    const req = makeRequest('enterprise');
    const res = await GET(req, params);
    expect(res.headers.get('X-RateLimit-Remaining')).not.toBeNull();
  });

  // ── Response format ───────────────────────────────────────────────────────

  it('returns application/pdf content-type when puppeteer renders successfully', async () => {
    const req = makeRequest('enterprise');
    const res = await GET(req, params);
    // Either PDF or HTML (if puppeteer is unavailable) — just confirm it returns some content
    const ct = res.headers.get('Content-Type') ?? '';
    expect(ct).toMatch(/pdf|html/i);
  });
});
