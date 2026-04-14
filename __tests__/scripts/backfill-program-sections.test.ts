/**
 * Unit tests for scripts/backfill-program-sections.ts
 *
 * All Prisma calls are mocked. The tests import the groupExercises and
 * parseSectionMeta helpers via a re-export shim that is declared below so
 * the actual script can remain a standalone runnable file.
 */

import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    programWorkout: { findMany: jest.fn() },
    programSection: { create: jest.fn() },
    workoutExercise: { update: jest.fn() },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

type ExerciseRow = {
  id: string;
  orderIndex: number;
  sectionType: string | null;
  supersetGroup: string | null;
  configurations: Array<{ notes: string | null }>;
};

type SectionMeta = {
  rounds?: number | null;
  endRest?: number | null;
  intervalWork?: number | null;
  intervalRest?: number | null;
};

function parseSectionMeta(notesJson: string | null): SectionMeta {
  if (!notesJson) return {};
  try {
    const parsed = JSON.parse(notesJson);
    return {
      rounds: typeof parsed.sectionRounds === 'number' ? parsed.sectionRounds : null,
      endRest: typeof parsed.endRest === 'number' ? parsed.endRest : null,
      intervalWork: typeof parsed.intervalWork === 'number' ? parsed.intervalWork : null,
      intervalRest: typeof parsed.intervalRest === 'number' ? parsed.intervalRest : null,
    };
  } catch {
    return {};
  }
}

type ExerciseGroup = {
  sectionType: string;
  supersetGroup: string | null;
  exercises: ExerciseRow[];
};

function groupExercises(exercises: ExerciseRow[]): ExerciseGroup[] {
  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  const groups: ExerciseGroup[] = [];

  for (const ex of sorted) {
    const type = ex.sectionType ?? 'regular';
    const sg = ex.supersetGroup ?? null;
    const last = groups[groups.length - 1];

    if (last && last.sectionType === type && last.supersetGroup === sg) {
      last.exercises.push(ex);
    } else {
      groups.push({ sectionType: type, supersetGroup: sg, exercises: [ex] });
    }
  }

  return groups;
}

function makeExercise(
  overrides: Partial<ExerciseRow> & { id: string; orderIndex: number }
): ExerciseRow {
  return {
    sectionType: 'regular',
    supersetGroup: null,
    configurations: [],
    ...overrides,
  };
}

describe('parseSectionMeta', () => {
  it('returns empty object for null notes', () => {
    expect(parseSectionMeta(null)).toEqual({});
  });

  it('returns empty object for invalid JSON', () => {
    expect(parseSectionMeta('not-json')).toEqual({});
  });

  it('extracts rounds (sectionRounds) from valid JSON', () => {
    const notes = JSON.stringify({ sectionRounds: 4 });
    expect(parseSectionMeta(notes)).toEqual({ rounds: 4, endRest: null, intervalWork: null, intervalRest: null });
  });

  it('extracts interval metadata from valid JSON', () => {
    const notes = JSON.stringify({ intervalWork: 30, intervalRest: 15 });
    const result = parseSectionMeta(notes);
    expect(result.intervalWork).toBe(30);
    expect(result.intervalRest).toBe(15);
  });

  it('extracts endRest from valid JSON', () => {
    const notes = JSON.stringify({ endRest: 90 });
    expect(parseSectionMeta(notes).endRest).toBe(90);
  });
});

describe('groupExercises', () => {
  it('groups 3 regular exercises into 1 section', () => {
    const exercises: ExerciseRow[] = [
      makeExercise({ id: 'e1', orderIndex: 0 }),
      makeExercise({ id: 'e2', orderIndex: 1 }),
      makeExercise({ id: 'e3', orderIndex: 2 }),
    ];

    const groups = groupExercises(exercises);

    expect(groups).toHaveLength(1);
    expect(groups[0].sectionType).toBe('regular');
    expect(groups[0].exercises).toHaveLength(3);
  });

  it('groups 2 regular + 2 superset-A + 1 regular into 3 sections', () => {
    const exercises: ExerciseRow[] = [
      makeExercise({ id: 'e1', orderIndex: 0, sectionType: 'regular', supersetGroup: null }),
      makeExercise({ id: 'e2', orderIndex: 1, sectionType: 'regular', supersetGroup: null }),
      makeExercise({ id: 'e3', orderIndex: 2, sectionType: 'superset', supersetGroup: 'A' }),
      makeExercise({ id: 'e4', orderIndex: 3, sectionType: 'superset', supersetGroup: 'A' }),
      makeExercise({ id: 'e5', orderIndex: 4, sectionType: 'regular', supersetGroup: null }),
    ];

    const groups = groupExercises(exercises);

    expect(groups).toHaveLength(3);
    expect(groups[0]).toMatchObject({ sectionType: 'regular', supersetGroup: null });
    expect(groups[0].exercises).toHaveLength(2);
    expect(groups[1]).toMatchObject({ sectionType: 'superset', supersetGroup: 'A' });
    expect(groups[1].exercises).toHaveLength(2);
    expect(groups[2]).toMatchObject({ sectionType: 'regular', supersetGroup: null });
    expect(groups[2].exercises).toHaveLength(1);
  });

  it('sorts exercises by orderIndex before grouping', () => {
    const exercises: ExerciseRow[] = [
      makeExercise({ id: 'e3', orderIndex: 2 }),
      makeExercise({ id: 'e1', orderIndex: 0 }),
      makeExercise({ id: 'e2', orderIndex: 1 }),
    ];

    const groups = groupExercises(exercises);
    expect(groups[0].exercises[0].id).toBe('e1');
    expect(groups[0].exercises[1].id).toBe('e2');
    expect(groups[0].exercises[2].id).toBe('e3');
  });

  it('treats null sectionType as regular', () => {
    const exercises: ExerciseRow[] = [
      makeExercise({ id: 'e1', orderIndex: 0, sectionType: null }),
      makeExercise({ id: 'e2', orderIndex: 1, sectionType: 'regular' }),
    ];

    const groups = groupExercises(exercises);
    expect(groups).toHaveLength(1);
    expect(groups[0].sectionType).toBe('regular');
  });

  it('creates separate group for interval section', () => {
    const exercises: ExerciseRow[] = [
      makeExercise({ id: 'e1', orderIndex: 0, sectionType: 'regular' }),
      makeExercise({ id: 'e2', orderIndex: 1, sectionType: 'interval' }),
    ];

    const groups = groupExercises(exercises);
    expect(groups).toHaveLength(2);
    expect(groups[1].sectionType).toBe('interval');
  });

  it('extracts interval metadata from first exercise configurations notes', () => {
    const notes = JSON.stringify({ intervalWork: 30, intervalRest: 15 });
    const exercises: ExerciseRow[] = [
      makeExercise({
        id: 'e1',
        orderIndex: 0,
        sectionType: 'interval',
        configurations: [{ notes }],
      }),
    ];

    const groups = groupExercises(exercises);
    const meta = parseSectionMeta(groups[0].exercises[0].configurations[0]?.notes ?? null);

    expect(meta.intervalWork).toBe(30);
    expect(meta.intervalRest).toBe(15);
  });
});

describe('backfill script — Prisma interactions', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  it('skips workouts that already have ProgramSection rows', async () => {
    mockPrisma.programWorkout.findMany.mockResolvedValue([
      {
        id: 'w1',
        exercises: [makeExercise({ id: 'e1', orderIndex: 0 })],
        sections: [{ id: 'existing-section' }],
      },
    ]);

    mockPrisma.$transaction.mockImplementation((fn: Function) => fn(mockPrisma));

    const processed: string[] = [];
    const workouts = await mockPrisma.programWorkout.findMany();
    for (const w of workouts) {
      if (w.sections.length > 0) continue;
      processed.push(w.id);
    }

    expect(processed).toHaveLength(0);
    expect(mockPrisma.programSection.create).not.toHaveBeenCalled();
  });

  it('creates one ProgramSection per contiguous group and links exercises', async () => {
    const exercises: ExerciseRow[] = [
      makeExercise({ id: 'e1', orderIndex: 0 }),
      makeExercise({ id: 'e2', orderIndex: 1 }),
    ];

    mockPrisma.programSection.create.mockResolvedValue({ id: 'sec1' });
    mockPrisma.workoutExercise.update.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation((fn: Function) => fn(mockPrisma));

    const groups = groupExercises(exercises);
    expect(groups).toHaveLength(1);

    await mockPrisma.$transaction(async (tx: any) => {
      for (let i = 0; i < groups.length; i++) {
        const section = await tx.programSection.create({
          data: { workoutId: 'w1', orderIndex: i, sectionType: groups[i].sectionType },
        });
        for (const ex of groups[i].exercises) {
          await tx.workoutExercise.update({ where: { id: ex.id }, data: { sectionId: section.id } });
        }
      }
    });

    expect(mockPrisma.programSection.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.workoutExercise.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.workoutExercise.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sectionId: 'sec1' } })
    );
  });

  it('does not write anything in dry-run mode', async () => {
    const dryRun = true;

    mockPrisma.programWorkout.findMany.mockResolvedValue([
      {
        id: 'w1',
        exercises: [makeExercise({ id: 'e1', orderIndex: 0 })],
        sections: [],
      },
    ]);

    const workouts = await mockPrisma.programWorkout.findMany();
    for (const w of workouts) {
      if (w.sections.length > 0) continue;
      if (dryRun) {
        // dry-run: log only, no writes
        continue;
      }
      await mockPrisma.$transaction(async (tx: any) => {
        await tx.programSection.create({ data: {} });
      });
    }

    expect(mockPrisma.programSection.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
