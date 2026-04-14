/**
 * Backfill ProgramSection rows for existing ProgramWorkout records.
 *
 * Groups WorkoutExercise rows within each ProgramWorkout into contiguous
 * runs sharing the same (sectionType, supersetGroup) pair, then creates one
 * ProgramSection per run and links each exercise back via sectionId.
 *
 * Idempotent: workouts that already have any ProgramSection rows are skipped.
 *
 * Usage:
 *   npx tsx scripts/backfill-program-sections.ts           # live
 *   npx tsx scripts/backfill-program-sections.ts --dry-run # preview
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('  EvoFitTrainer — Backfill ProgramSection');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const workouts = await prisma.programWorkout.findMany({
    where: {
      exercises: { some: {} },
    },
    include: {
      exercises: {
        include: {
          configurations: {
            where: { setNumber: 1 },
            select: { notes: true },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
      sections: { select: { id: true } },
    },
  });

  let workoutsProcessed = 0;
  let workoutsSkipped = 0;
  let sectionsCreated = 0;
  let exercisesLinked = 0;

  for (const workout of workouts) {
    if (workout.sections.length > 0) {
      console.log(`  SKIP workout ${workout.id} — already has ${workout.sections.length} section(s)`);
      workoutsSkipped++;
      continue;
    }

    const groups = groupExercises(workout.exercises as ExerciseRow[]);

    console.log(`  Workout ${workout.id} → ${groups.length} section(s)`);

    if (dryRun) {
      groups.forEach((g, i) => {
        const firstNotes = g.exercises[0]?.configurations?.[0]?.notes ?? null;
        const meta = parseSectionMeta(firstNotes);
        console.log(`    [${i}] type=${g.sectionType} exercises=${g.exercises.length} meta=${JSON.stringify(meta)}`);
      });
      workoutsProcessed++;
      sectionsCreated += groups.length;
      exercisesLinked += workout.exercises.length;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const firstNotes = group.exercises[0]?.configurations?.[0]?.notes ?? null;
        const meta = parseSectionMeta(firstNotes);

        const section = await tx.programSection.create({
          data: {
            workoutId: workout.id,
            orderIndex: i,
            sectionType: group.sectionType,
            rounds: meta.rounds ?? null,
            endRest: meta.endRest ?? null,
            intervalWork: meta.intervalWork ?? null,
            intervalRest: meta.intervalRest ?? null,
          },
        });

        sectionsCreated++;

        for (const ex of group.exercises) {
          await tx.workoutExercise.update({
            where: { id: ex.id },
            data: { sectionId: section.id },
          });
          exercisesLinked++;
        }
      }
    });

    workoutsProcessed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Summary${dryRun ? ' (DRY RUN — no writes)' : ''}`);
  console.log('='.repeat(60));
  console.log(`  Workouts processed : ${workoutsProcessed}`);
  console.log(`  Workouts skipped   : ${workoutsSkipped}`);
  console.log(`  Sections created   : ${sectionsCreated}`);
  console.log(`  Exercises linked   : ${exercisesLinked}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Backfill failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
