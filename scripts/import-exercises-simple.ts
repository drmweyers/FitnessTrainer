/**
 * Exercise Data Import Script
 * Imports exercises from exerciseDB JSON into PostgreSQL
 */

import { PrismaClient, DifficultyLevel } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RawExerciseData {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

/**
 * Determine difficulty level from exercise name and characteristics
 */
function determineDifficulty(exercise: RawExerciseData): DifficultyLevel {
  const name = exercise.name.toLowerCase();

  // Advanced exercises
  if (
    name.includes('olympic') ||
    name.includes('explosive') ||
    name.includes('plyometric') ||
    name.includes('jump') ||
    name.includes('box jump') ||
    name.includes('muscle-up') ||
    name.includes('handstand') ||
    name.includes('planche') ||
    name.includes('front lever') ||
    name.includes('back lever')
  ) {
    return 'advanced';
  }

  // Beginner exercises
  if (
    name.includes('beginner') ||
    name.includes('basic') ||
    name.includes('easy') ||
    name.includes('wall') ||
    (exercise.equipments.includes('body weight') && name.includes('static'))
  ) {
    return 'beginner';
  }

  // Default to intermediate
  return 'intermediate';
}

/**
 * Import exercises from JSON file
 */
async function importExercisesData() {
  console.log('🚀 Starting exercise import...');

  try {
    // Read exercise data
    const jsonPath = path.join(
      process.cwd(),
      'exerciseDB',
      'ExerciseDB JSON',
      'exercisedb',
      'exercisedb',
      'exercises.json'
    );

    console.log(`📖 Reading exercises from: ${jsonPath}`);
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const exercises: RawExerciseData[] = JSON.parse(fileContent);

    console.log(`📦 Found ${exercises.length} exercises to import`);

    // Clear existing exercises (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing exercises...');
    await prisma.exercise.deleteMany({});
    console.log('✅ Existing exercises cleared');

    // Import statistics
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ exerciseId: string; error: string }> = [];

    // Batch size for bulk operations
    const batchSize = 100;
    const batches = Math.ceil(exercises.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = exercises.slice(i * batchSize, (i + 1) * batchSize);
      console.log(`\n📦 Processing batch ${i + 1}/${batches} (${batch.length} exercises)...`);

      for (const exercise of batch) {
        try {
          // Check if exercise already exists
          const existing = await prisma.exercise.findUnique({
            where: { exerciseId: exercise.exerciseId },
          });

          if (existing) {
            skipped++;
            console.log(`⏭️  Skipped: ${exercise.name} (${exercise.exerciseId})`);
            continue;
          }

          // Determine difficulty
          const difficulty = determineDifficulty(exercise);

          // Normalize data
          const bodyPart = exercise.bodyParts[0] || 'other';
          const equipment = exercise.equipments[0] || 'other';
          const targetMuscle = exercise.targetMuscles[0] || 'other';

          // Create exercise
          await prisma.exercise.create({
            data: {
              exerciseId: exercise.exerciseId,
              name: exercise.name,
              gifUrl: exercise.gifUrl,
              bodyPart,
              equipment,
              targetMuscle,
              secondaryMuscles: exercise.secondaryMuscles,
              instructions: exercise.instructions,
              difficulty,
              isActive: true,
            },
          });

          imported++;
          console.log(`✅ Imported: ${exercise.name} (${difficulty})`);
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({
            exerciseId: exercise.exerciseId,
            error: errorMessage,
          });
          console.error(`❌ Failed to import ${exercise.name}:`, errorMessage);
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total exercises:     ${exercises.length}`);
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`⏭️  Skipped:            ${skipped}`);
    console.log(`❌ Failed:             ${failed}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(({ exerciseId, error }) => {
        console.log(`  - ${exerciseId}: ${error}`);
      });
    }

    // Verify import
    const totalCount = await prisma.exercise.count();
    console.log(`\n🎉 Total exercises in database: ${totalCount}`);

    // Show distribution by body part
    const bodyPartStats = await prisma.exercise.groupBy({
      by: ['bodyPart'],
      _count: {
        bodyPart: true,
      },
    });

    console.log('\n📊 Exercises by Body Part:');
    bodyPartStats.forEach(({ bodyPart, _count }) => {
      console.log(`  - ${bodyPart}: ${_count.bodyPart}`);
    });

    // Show distribution by difficulty
    const difficultyStats = await prisma.exercise.groupBy({
      by: ['difficulty'],
      _count: {
        difficulty: true,
      },
    });

    console.log('\n📊 Exercises by Difficulty:');
    difficultyStats.forEach(({ difficulty, _count }) => {
      console.log(`  - ${difficulty}: ${_count.difficulty}`);
    });
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import if called directly
importExercisesData()
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
