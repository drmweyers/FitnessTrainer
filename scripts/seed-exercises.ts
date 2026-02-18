/**
 * Production Exercise Seed Script
 * Seeds the exercise database from data/exercises.json using upsert pattern
 *
 * Usage:
 *   npx tsx scripts/seed-exercises.ts                    # Default path
 *   npx tsx scripts/seed-exercises.ts /path/to/data.json # Custom path
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const BATCH_SIZE = 50;

interface RawExerciseData {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

interface MappedExerciseData {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
}

interface SeedResult {
  total: number;
  succeeded: number;
  failed: number;
}

/**
 * Determine difficulty level from exercise name and characteristics
 */
function determineDifficulty(exercise: RawExerciseData): 'beginner' | 'intermediate' | 'advanced' {
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
  const equipments = exercise.equipments || [];
  if (
    name.includes('beginner') ||
    name.includes('basic') ||
    name.includes('easy') ||
    name.includes('wall') ||
    (equipments.includes('body weight') && name.includes('static'))
  ) {
    return 'beginner';
  }

  // Default to intermediate
  return 'intermediate';
}

/**
 * Map raw exercise JSON data to Prisma model fields
 */
function mapExerciseData(raw: RawExerciseData): MappedExerciseData {
  const bodyParts = raw.bodyParts || [];
  const equipments = raw.equipments || [];
  const targetMuscles = raw.targetMuscles || [];
  const secondaryMuscles = raw.secondaryMuscles || [];
  const instructions = raw.instructions || [];

  return {
    exerciseId: raw.exerciseId,
    name: raw.name,
    gifUrl: raw.gifUrl,
    bodyPart: bodyParts[0] || 'other',
    equipment: equipments[0] || 'other',
    targetMuscle: targetMuscles[0] || 'other',
    secondaryMuscles,
    instructions,
    difficulty: determineDifficulty(raw),
    isActive: true,
  };
}

/**
 * Seed exercises from a JSON file into the database using upsert pattern
 */
async function seedExercises(dataPath?: string): Promise<SeedResult> {
  const filePath = dataPath || path.join(process.cwd(), 'data', 'exercises.json');

  try {
    console.log(`Reading exercises from: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const exercises: RawExerciseData[] = JSON.parse(fileContent);

    console.log(`Found ${exercises.length} exercises to process`);

    let succeeded = 0;
    let failed = 0;

    const totalBatches = Math.ceil(exercises.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batch = exercises.slice(batchStart, batchStart + BATCH_SIZE);
      console.log(`Processing batch ${i + 1}/${totalBatches} (${batch.length} exercises)`);

      for (const raw of batch) {
        try {
          const mapped = mapExerciseData(raw);

          await prisma.exercise.upsert({
            where: { exerciseId: mapped.exerciseId },
            create: {
              exerciseId: mapped.exerciseId,
              name: mapped.name,
              gifUrl: mapped.gifUrl,
              bodyPart: mapped.bodyPart,
              equipment: mapped.equipment,
              targetMuscle: mapped.targetMuscle,
              secondaryMuscles: mapped.secondaryMuscles,
              instructions: mapped.instructions,
              difficulty: mapped.difficulty,
              isActive: mapped.isActive,
            },
            update: {
              name: mapped.name,
              gifUrl: mapped.gifUrl,
              bodyPart: mapped.bodyPart,
              equipment: mapped.equipment,
              targetMuscle: mapped.targetMuscle,
              secondaryMuscles: mapped.secondaryMuscles,
              instructions: mapped.instructions,
              difficulty: mapped.difficulty,
              isActive: mapped.isActive,
            },
          });

          succeeded++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to upsert exercise ${raw.exerciseId} (${raw.name}): ${errorMessage}`);
        }
      }
    }

    console.log('='.repeat(50));
    console.log('SEED SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total exercises:  ${exercises.length}`);
    console.log(`Succeeded:        ${succeeded}`);
    console.log(`Failed:           ${failed}`);
    console.log('='.repeat(50));

    return { total: exercises.length, succeeded, failed };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  const customPath = process.argv[2];
  seedExercises(customPath)
    .then((result) => {
      console.log(`\nSeed completed: ${result.succeeded}/${result.total} exercises processed`);
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { mapExerciseData, determineDifficulty, seedExercises };
export type { RawExerciseData, MappedExerciseData, SeedResult };
