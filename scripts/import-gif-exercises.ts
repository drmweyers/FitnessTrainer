/**
 * Import GIF Exercises from ExerciseDB JSON to PostgreSQL
 *
 * This script reads the exerciseDB JSON file and imports all exercises
 * with their GIF references into the database.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// JSON structure from exerciseDB
interface ExerciseDBExercise {
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
 * Map JSON exercise to database schema
 * Converts arrays to comma-separated strings where needed
 */
function mapExerciseToDb(jsonExercise: ExerciseDBExercise) {
  // Get first value from arrays for singular fields
  const bodyPart = jsonExercise.bodyParts[0] || 'other';
  const equipment = jsonExercise.equipments[0] || 'body weight';
  const targetMuscle = jsonExercise.targetMuscles[0] || 'other';

  // Determine difficulty based on exercise characteristics
  const difficulty = determineDifficulty(jsonExercise);

  return {
    exerciseId: jsonExercise.exerciseId,
    name: jsonExercise.name,
    gifUrl: `/exercises/gifs/${jsonExercise.gifUrl}`, // Path to serve GIFs
    bodyPart: bodyPart.toLowerCase(),
    equipment: equipment.toLowerCase(),
    targetMuscle: targetMuscle.toLowerCase(),
    secondaryMuscles: jsonExercise.secondaryMuscles.map(m => m.toLowerCase()),
    instructions: jsonExercise.instructions,
    difficulty: difficulty,
    isActive: true,
  };
}

/**
 * Determine exercise difficulty based on characteristics
 */
function determineDifficulty(exercise: ExerciseDBExercise): 'beginner' | 'intermediate' | 'advanced' {
  const name = exercise.name.toLowerCase();
  const equipment = exercise.equipments.join(' ').toLowerCase();

  // Advanced indicators
  if (
    name.includes('olympic') ||
    name.includes('snatch') ||
    name.includes('clean') ||
    name.includes('jerk') ||
    name.includes('plyometric') ||
    name.includes('explosive') ||
    equipment.includes('cable') ||
    equipment.includes('barbell')
  ) {
    return 'advanced';
  }

  // Beginner indicators
  if (
    name.includes('stretch') ||
    name.includes('warm') ||
    name.includes('easy') ||
    name.includes('basic') ||
    name.includes('beginner') ||
    equipment.includes('body weight')
  ) {
    return 'beginner';
  }

  // Default to intermediate
  return 'intermediate';
}

/**
 * Copy GIF files to public directory
 */
async function copyGifFiles(): Promise<void> {
  const sourceDir = path.join(process.cwd(), 'exerciseDB/ExerciseDB JSON/exercisedb/exercisedb/gifs');
  const targetDir = path.join(process.cwd(), 'public/exercises/gifs');

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✓ Created directory: ${targetDir}`);
  }

  // Copy all GIF files
  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;

  for (const file of files) {
    if (file.endsWith('.gif')) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      // Skip if already exists
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    }
  }

  console.log(`✓ Copied ${copiedCount} GIF files to public/exercises/gifs/`);
}

/**
 * Main import function
 */
async function importGifExercises() {
  console.log('🚀 Starting ExerciseDB import...\n');

  // Read JSON file
  const jsonPath = path.join(process.cwd(), 'exerciseDB/ExerciseDB JSON/exercisedb/exercisedb/exercises.json');
  console.log(`📖 Reading exercises from: ${jsonPath}`);

  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const jsonExercises: ExerciseDBExercise[] = JSON.parse(jsonData);

  console.log(`✓ Found ${jsonExercises.length} exercises in JSON file\n`);

  // Copy GIF files
  console.log('📁 Copying GIF files to public directory...');
  await copyGifFiles();
  console.log();

  // Import exercises
  console.log('💾 Importing exercises to database...');
  let createdCount = 0;
  const updatedCount = 0;
  let errorCount = 0;

  for (const jsonExercise of jsonExercises) {
    try {
      const dbExercise = mapExerciseToDb(jsonExercise);

      // Use upsert to handle duplicates
      await prisma.exercise.upsert({
        where: { exerciseId: dbExercise.exerciseId },
        update: {
          name: dbExercise.name,
          gifUrl: dbExercise.gifUrl,
          bodyPart: dbExercise.bodyPart,
          equipment: dbExercise.equipment,
          targetMuscle: dbExercise.targetMuscle,
          secondaryMuscles: dbExercise.secondaryMuscles,
          instructions: dbExercise.instructions,
          difficulty: dbExercise.difficulty,
        },
        create: dbExercise,
      });

      createdCount++;
    } catch (error) {
      errorCount++;
      console.error(`✗ Error importing exercise "${jsonExercise.name}":`, error);
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Created/Updated: ${createdCount} exercises`);
  console.log(`   Errors: ${errorCount} exercises`);
  console.log(`\n📊 Exercise Database Statistics:`);

  // Print stats
  const stats = await prisma.exercise.groupBy({
    by: ['bodyPart'],
    _count: true,
    orderBy: { _count: { bodyPart: 'desc' } },
  });

  console.log('\n   By Body Part:');
  for (const stat of stats) {
    console.log(`   - ${stat.bodyPart}: ${stat._count} exercises`);
  }

  const difficultyStats = await prisma.exercise.groupBy({
    by: ['difficulty'],
    _count: true,
  });

  console.log('\n   By Difficulty:');
  for (const stat of difficultyStats) {
    console.log(`   - ${stat.difficulty}: ${stat._count} exercises`);
  }

  const totalCount = await prisma.exercise.count();
  console.log(`\n   Total exercises in database: ${totalCount}\n`);
}

// Run import
importGifExercises()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
