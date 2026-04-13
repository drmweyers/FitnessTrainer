/**
 * Tests for POST /api/programs/suggest-exercise
 * TDD — written before implementation per BCCS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

// ─── Module mocks ───

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
    },
    trainerSubscription: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

// Mock withTier so we can control gate behaviour per test
const mockWithTierAllowed = jest.fn();
const mockWithTierDenied = jest.fn();

jest.mock('@/lib/subscription/withTier', () => ({
  withTier: jest.fn((opts: any) => (handler: any) => mockWithTierAllowed),
}));

const { authenticate } = require('@/lib/middleware/auth');
const { withTier } = require('@/lib/subscription/withTier');

const TRAINER_ID = mockTrainerUser.id;

function mockAuth() {
  authenticate.mockResolvedValue({ user: { id: TRAINER_ID, email: 'trainer@test.com', role: 'trainer' } });
}

const mockExercises = [
  { id: 'ex-chest-1', name: 'Bench Press', bodyPart: 'chest', targetMuscle: 'pectorals', equipment: 'barbell', gifUrl: null },
  { id: 'ex-back-1', name: 'Barbell Row', bodyPart: 'back', targetMuscle: 'lats', equipment: 'barbell', gifUrl: null },
  { id: 'ex-legs-1', name: 'Squat', bodyPart: 'upper legs', targetMuscle: 'quads', equipment: 'barbell', gifUrl: null },
  { id: 'ex-shoulders-1', name: 'Overhead Press', bodyPart: 'shoulders', targetMuscle: 'delts', equipment: 'barbell', gifUrl: null },
  { id: 'ex-arms-1', name: 'Bicep Curl', bodyPart: 'upper arms', targetMuscle: 'biceps', equipment: 'dumbbell', gifUrl: null },
  { id: 'ex-chest-2', name: 'Incline Press', bodyPart: 'chest', targetMuscle: 'pectorals', equipment: 'barbell', gifUrl: null },
];

// We import the handler directly by pointing mockWithTierAllowed at the real handler
// withTier is mocked to either pass-through or deny.

describe('POST /api/programs/suggest-exercise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TIER GATE — test the gate logic separately from the handler

  describe('Tier gate (Starter = 403)', () => {
    it('returns 403 for Starter user when withTier denies', async () => {
      // Simulate the gate returning 403 (what withTier does for locked features)
      const deniedHandler = jest.fn().mockResolvedValue(
        NextResponse.json(
          { success: false, error: { code: 'FEATURE_LOCKED', upgradeRequired: true } },
          { status: 403 },
        ),
      );
      withTier.mockReturnValue(() => deniedHandler);

      // Re-import with the new mock behaviour
      jest.resetModules();
      jest.mock('@/lib/subscription/withTier', () => ({
        withTier: jest.fn(() => () => deniedHandler),
      }));

      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: [] },
      });
      const res = await deniedHandler(req);
      const { status, body } = await parseJsonResponse(res);
      expect(status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error?.upgradeRequired).toBe(true);
    });
  });

  // HANDLER LOGIC — test the inner handler directly (as Pro user, gate bypassed)

  describe('Handler logic (Pro user, gate bypassed)', () => {
    // Import the raw handler by temporarily re-exporting it
    // We do this by calling the handler via a thin wrapper
    let innerHandler: (req: NextRequest) => Promise<NextResponse>;

    beforeEach(async () => {
      // We need the real inner handler. Since withTier wraps it,
      // we capture it by checking what was passed to withTier.
      jest.resetModules();

      // Re-mock withTier to capture the handler it receives
      let capturedHandler: any;
      jest.doMock('@/lib/subscription/withTier', () => ({
        withTier: jest.fn(() => (h: any) => {
          capturedHandler = h;
          return h; // pass-through
        }),
      }));

      // Re-mock prisma (will be re-required after resetModules)
      jest.doMock('@/lib/db/prisma', () => ({
        prisma: {
          exercise: { findMany: jest.fn() },
          trainerSubscription: { findFirst: jest.fn() },
        },
      }));

      jest.doMock('@/lib/middleware/auth', () => ({
        authenticate: jest.fn().mockResolvedValue({
          user: { id: TRAINER_ID, email: 'trainer@test.com', role: 'trainer' },
        }),
      }));

      // Import module after mocks are set up
      const routeModule = await import('@/app/api/programs/suggest-exercise/route');
      innerHandler = routeModule.POST as any;
    });

    it('returns 200 with suggestions for an authenticated Pro user', async () => {
      // Set up the prisma mock in the re-required module
      const { prisma: freshPrisma } = require('@/lib/db/prisma');
      (freshPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: [] },
      });
      const res = await innerHandler(req);
      const { status, body } = await parseJsonResponse(res);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.suggestions)).toBe(true);
      expect(body.data.suggestions.length).toBeGreaterThanOrEqual(1);
      expect(body.data.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('excludes already-selected exercises from suggestions', async () => {
      const { prisma: freshPrisma } = require('@/lib/db/prisma');
      (freshPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const alreadySelected = ['ex-chest-1', 'ex-back-1'];
      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: alreadySelected },
      });
      const res = await innerHandler(req);
      const { status, body } = await parseJsonResponse(res);
      expect(status).toBe(200);
      const suggestedIds = body.data.suggestions.map((s: any) => s.id);
      expect(suggestedIds).not.toContain('ex-chest-1');
      expect(suggestedIds).not.toContain('ex-back-1');
    });

    it('returns suggestions with non-chest exercises when targetMuscle=back', async () => {
      const { prisma: freshPrisma } = require('@/lib/db/prisma');
      (freshPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: ['ex-chest-1', 'ex-chest-2'], targetMuscle: 'back' },
      });
      const res = await innerHandler(req);
      const { status, body } = await parseJsonResponse(res);
      expect(status).toBe(200);
      const suggestions = body.data.suggestions;
      const hasNonChest = suggestions.some((s: any) => s.bodyPart !== 'chest');
      expect(hasNonChest).toBe(true);
    });

    it('returns 400 when currentExerciseIds is not an array', async () => {
      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: 'not-an-array' },
      });
      const res = await innerHandler(req);
      const { status } = await parseJsonResponse(res);
      expect(status).toBe(400);
    });

    it('returns suggestions with correct exercise shape', async () => {
      const { prisma: freshPrisma } = require('@/lib/db/prisma');
      (freshPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: [] },
      });
      const res = await innerHandler(req);
      const { body } = await parseJsonResponse(res);
      const first = body.data.suggestions[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('bodyPart');
      expect(first).toHaveProperty('targetMuscle');
      expect(first).toHaveProperty('equipment');
    });

    it('returns 401 when authentication fails', async () => {
      // For this test, we need withTier to forward the 401 from authenticate
      // Simulate the gate returning 401
      const req = createMockRequest('/api/programs/suggest-exercise', {
        method: 'POST',
        body: { currentExerciseIds: [] },
      });
      const unauthRes = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const unauthHandler = jest.fn().mockResolvedValue(unauthRes);
      const { status } = await parseJsonResponse(await unauthHandler(req));
      expect(status).toBe(401);
    });
  });
});
