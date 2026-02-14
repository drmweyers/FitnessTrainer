import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProgramWithCounts {
  id: string;
  name: string;
  trainerId: string;
  createdAt: Date;
  workoutCount: number;
  assignmentCount: number;
}

interface CollectionWithCount {
  id: string;
  name: string;
  userId: string;
  exerciseCount: number;
}

async function listProgramsWithCounts(): Promise<ProgramWithCounts[]> {
  const programs = await prisma.program.findMany({
    include: {
      weeks: {
        include: {
          workouts: true,
        },
      },
      assignments: true,
    },
  });

  return programs.map((p) => ({
    id: p.id,
    name: p.name,
    trainerId: p.trainerId,
    createdAt: p.createdAt,
    workoutCount: p.weeks.reduce((sum, week) => sum + week.workouts.length, 0),
    assignmentCount: p.assignments.length,
  }));
}

async function listCollectionsWithCounts(): Promise<CollectionWithCount[]> {
  const collections = await prisma.exerciseCollection.findMany({
    include: {
      exercises: true,
    },
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    userId: c.userId,
    exerciseCount: c.exercises.length,
  }));
}

async function cleanupDuplicatePrograms(dryRun: boolean): Promise<void> {
  console.log('\n=== PROGRAM CLEANUP ===\n');

  const programs = await listProgramsWithCounts();

  console.log(`Total programs found: ${programs.length}\n`);

  // Group programs by name
  const programsByName = programs.reduce((acc, program) => {
    if (!acc[program.name]) {
      acc[program.name] = [];
    }
    acc[program.name].push(program);
    return acc;
  }, {} as Record<string, ProgramWithCounts[]>);

  let totalDeleted = 0;
  let totalReassigned = 0;

  for (const [name, duplicates] of Object.entries(programsByName)) {
    if (duplicates.length === 1) {
      console.log(`✓ "${name}" - 1 copy (no duplicates)`);
      continue;
    }

    console.log(`\n⚠ "${name}" - ${duplicates.length} copies found:`);

    // Sort by: most workouts, then most assignments, then earliest created
    const sorted = duplicates.sort((a, b) => {
      if (b.workoutCount !== a.workoutCount) return b.workoutCount - a.workoutCount;
      if (b.assignmentCount !== a.assignmentCount) return b.assignmentCount - a.assignmentCount;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const keeper = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`  KEEP: ${keeper.id.slice(0, 8)}... (${keeper.workoutCount} workouts, ${keeper.assignmentCount} assignments)`);

    for (const dup of toDelete) {
      console.log(`  DELETE: ${dup.id.slice(0, 8)}... (${dup.workoutCount} workouts, ${dup.assignmentCount} assignments)`);

      if (dup.assignmentCount > 0) {
        console.log(`    → Will delete ${dup.assignmentCount} duplicate assignment(s) (client already assigned to keeper)`);
        totalReassigned += dup.assignmentCount;

        if (!dryRun) {
          // Delete duplicate assignments (client should already have assignment to keeper)
          await prisma.programAssignment.deleteMany({
            where: { programId: dup.id },
          });
        }
      }

      if (!dryRun) {
        // Get all workout IDs in this duplicate program
        const dupWorkouts = await prisma.programWorkout.findMany({
          where: { week: { programId: dup.id } },
          select: { id: true },
        });
        const dupWorkoutIds = dupWorkouts.map(w => w.id);

        if (dupWorkoutIds.length > 0) {
          // Delete workout exercise logs first (they reference workout sessions)
          await prisma.workoutExerciseLog.deleteMany({
            where: { workoutSessionId: { in: (await prisma.workoutSession.findMany({
              where: { workoutId: { in: dupWorkoutIds } },
              select: { id: true },
            })).map(s => s.id) } },
          });
          // Delete workout sessions that reference these workouts
          await prisma.workoutSession.deleteMany({
            where: { workoutId: { in: dupWorkoutIds } },
          });
        }

        // Now safe to delete the program (cascade handles weeks/workouts)
        await prisma.program.delete({
          where: { id: dup.id },
        });
      }

      totalDeleted++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Programs to delete: ${totalDeleted}`);
  console.log(`  Assignments to reassign: ${totalReassigned}`);

  if (dryRun) {
    console.log(`\n[DRY RUN] No changes were made.`);
  } else {
    console.log(`\n✓ Programs cleaned up successfully.`);
  }
}

async function cleanupEmptyCollections(dryRun: boolean): Promise<void> {
  console.log('\n\n=== EXERCISE COLLECTION CLEANUP ===\n');

  const collections = await listCollectionsWithCounts();

  console.log(`Total collections found: ${collections.length}\n`);

  const emptyCollections = collections.filter((c) => c.exerciseCount === 0);
  const nonEmptyCollections = collections.filter((c) => c.exerciseCount > 0);

  console.log(`Collections with exercises (KEEP):`);
  for (const c of nonEmptyCollections) {
    console.log(`  ✓ "${c.name}" - ${c.exerciseCount} exercises`);
  }

  console.log(`\nEmpty collections (DELETE):`);
  for (const c of emptyCollections) {
    console.log(`  ✗ "${c.name}" - 0 exercises (ID: ${c.id.slice(0, 8)}...)`);

    if (!dryRun) {
      await prisma.exerciseCollection.delete({
        where: { id: c.id },
      });
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Collections to delete: ${emptyCollections.length}`);
  console.log(`  Collections to keep: ${nonEmptyCollections.length}`);

  if (dryRun) {
    console.log(`\n[DRY RUN] No changes were made.`);
  } else {
    console.log(`\n✓ Collections cleaned up successfully.`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('  EvoFitTrainer Production Data Cleanup');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('\n⚠️  LIVE MODE - Changes will be committed to database\n');
  }

  try {
    await cleanupDuplicatePrograms(dryRun);
    await cleanupEmptyCollections(dryRun);

    console.log('\n' + '='.repeat(60));
    console.log('  Cleanup Complete');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
