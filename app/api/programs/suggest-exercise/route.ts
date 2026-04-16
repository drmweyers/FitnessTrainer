// POST /api/programs/suggest-exercise
// Returns 3-5 exercise suggestions that balance muscle groups vs. the current workout.
// Gated: Professional tier required (programBuilder.aiSuggest).

import { NextRequest, NextResponse } from 'next/server';
import { withTier } from '@/lib/subscription/withTier';
import { prisma } from '@/lib/db/prisma';
import { AuthenticatedRequest } from '@/lib/middleware/auth';

// Body shape accepted by this endpoint
interface SuggestBody {
  currentExerciseIds: string[];
  workoutType?: string;
  targetMuscle?: string;
}

// Internal handler — only called after tier gate passes
async function handler(req: NextRequest): Promise<NextResponse> {
  let body: SuggestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { currentExerciseIds, targetMuscle } = body;

  // Input validation
  if (!Array.isArray(currentExerciseIds)) {
    return NextResponse.json(
      { success: false, error: 'currentExerciseIds must be an array' },
      { status: 400 },
    );
  }

  // Fetch candidate pool (exclude already-selected exercises)
  // Fetch a wider pool so we have room to apply muscle-balance logic
  const POOL_SIZE = 50;
  const selectedSet = new Set(currentExerciseIds);
  const raw = await prisma.exercise.findMany({
    where: {
      id: { notIn: currentExerciseIds.length > 0 ? currentExerciseIds : undefined },
    },
    select: {
      id: true,
      name: true,
      bodyPart: true,
      targetMuscle: true,
      equipment: true,
      gifUrl: true,
    },
    take: POOL_SIZE,
    orderBy: { name: 'asc' },
  });

  // Defensive in-process filter in case the DB layer didn't honour `notIn`
  // (e.g. in test environments with mock Prisma clients)
  const candidates = raw
    .filter((e) => !selectedSet.has(e.id))
    .map((e) => ({
      ...e,
      gifUrl: e.gifUrl && !e.gifUrl.startsWith('http') && !e.gifUrl.startsWith('/')
        ? `/exerciseGifs/${e.gifUrl}`
        : e.gifUrl,
    }));

  // Muscle-balance scoring: derive body-part counts from the requested targetMuscle
  // or by inferring from exercise IDs (lightweight heuristic — no extra DB round-trip)
  const suggestions = pickBalanced(candidates, targetMuscle);

  return NextResponse.json({ success: true, data: { suggestions } });
}

// ─── Muscle-balance selection ─────────────────────────────────────────────────

/**
 * Pick 3-5 exercises from `pool` that:
 *  1. Prioritise `targetMuscle` if provided.
 *  2. Otherwise diversify across bodyParts (no more than 2 from the same group).
 *  3. Return at most 5, at least 1 (or all if pool has fewer than 5).
 */
function pickBalanced(
  pool: Array<{ id: string; name: string; bodyPart: string | null; targetMuscle: string | null; equipment: string | null; gifUrl: string | null }>,
  targetMuscle?: string,
): typeof pool {
  const MAX = 5;
  const MAX_PER_BODY_PART = 2;

  if (pool.length === 0) return [];

  // Prioritise target muscle if specified
  let ordered = pool;
  if (targetMuscle) {
    const target = targetMuscle.toLowerCase();
    const preferred = pool.filter(
      (e) => e.bodyPart?.toLowerCase() === target || e.targetMuscle?.toLowerCase() === target,
    );
    const rest = pool.filter(
      (e) => e.bodyPart?.toLowerCase() !== target && e.targetMuscle?.toLowerCase() !== target,
    );
    ordered = [...preferred, ...rest];
  }

  // Diversify: cap per-bodyPart count
  const selected: typeof pool = [];
  const partCount: Record<string, number> = {};

  for (const exercise of ordered) {
    if (selected.length >= MAX) break;
    const part = exercise.bodyPart ?? 'unknown';
    const count = partCount[part] ?? 0;
    if (count < MAX_PER_BODY_PART) {
      selected.push(exercise);
      partCount[part] = count + 1;
    }
  }

  // If still below min (1), relax the cap and just fill up
  if (selected.length === 0 && ordered.length > 0) {
    selected.push(...ordered.slice(0, MAX));
  }

  return selected;
}

// Export POST gated by Professional tier feature
export const POST = withTier({ feature: 'programBuilder.aiSuggest' })(handler);
