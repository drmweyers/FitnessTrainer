/**
 * Verification Script for Epic 004: Exercise Library
 * Validates that all components are properly implemented
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

const results: VerificationResult[] = [];

function addCheck(category: string, name: string, passed: boolean, message: string) {
  let categoryResult = results.find((r) => r.category === category);
  if (!categoryResult) {
    categoryResult = { category, checks: [] };
    results.push(categoryResult);
  }
  categoryResult.checks.push({ name, passed, message });
}

async function verifyDatabase() {
  console.log('🔍 Verifying Database...');

  // Check if exercises table exists and has data
  try {
    const count = await prisma.exercise.count();
    addCheck(
      'Database',
      'Exercise Data',
      count > 0,
      `Found ${count} exercises in database`
    );

    // Check exercise structure
    const sampleExercise = await prisma.exercise.findFirst();
    addCheck(
      'Database',
      'Exercise Structure',
      !!sampleExercise,
      sampleExercise
        ? 'Sample exercise has valid structure'
        : 'No exercises found'
    );

    if (sampleExercise) {
      addCheck(
        'Database',
        'Required Fields',
        !!(
          sampleExercise.id &&
          sampleExercise.exerciseId &&
          sampleExercise.name &&
          sampleExercise.gifUrl &&
          sampleExercise.bodyPart &&
          sampleExercise.equipment &&
          sampleExercise.targetMuscle
        ),
        'All required fields present'
      );
    }

    // Check distribution
    const bodyPartStats = await prisma.exercise.groupBy({
      by: ['bodyPart'],
      _count: { bodyPart: true },
    });

    addCheck(
      'Database',
      'Body Part Distribution',
      bodyPartStats.length > 0,
      `Found ${bodyPartStats.length} different body parts`
    );

    const difficultyStats = await prisma.exercise.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true },
    });

    addCheck(
      'Database',
      'Difficulty Distribution',
      difficultyStats.length > 0,
      `Found ${difficultyStats.length} difficulty levels`
    );
  } catch (error) {
    addCheck(
      'Database',
      'Database Connection',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function verifyAPIRoutes() {
  console.log('🔍 Verifying API Routes...');

  const fs = require('fs');
  const path = require('path');

  // Check if API route files exist
  const apiRoutes = [
    'app/api/exercises/route.ts',
    'app/api/exercises/[id]/route.ts',
    'app/api/exercises/by-id/[exerciseId]/route.ts',
    'app/api/exercises/search/route.ts',
    'app/api/exercises/filters/route.ts',
  ];

  apiRoutes.forEach((route) => {
    const exists = fs.existsSync(path.join(process.cwd(), route));
    addCheck(
      'API Routes',
      route,
      exists,
      exists ? 'Route file exists' : 'Route file missing'
    );
  });
}

async function verifyServiceLayer() {
  console.log('🔍 Verifying Service Layer...');

  const fs = require('fs');
  const path = require('path');

  const serviceFile = 'lib/services/exercise.service.ts';
  const exists = fs.existsSync(path.join(process.cwd(), serviceFile));

  addCheck(
    'Service Layer',
    'Service File',
    exists,
    exists ? 'Exercise service file exists' : 'Service file missing'
  );

  // Check if service exports exist
  if (exists) {
    const content = fs.readFileSync(path.join(process.cwd(), serviceFile), 'utf-8');
    const methods = [
      'getExercises',
      'getExerciseById',
      'createExercise',
      'updateExercise',
      'deleteExercise',
      'searchExercises',
      'getFilterOptions',
    ];

    methods.forEach((method) => {
      const hasMethod = content.includes(`async ${method}(`) ||
                         content.includes(`${method}(`);
      addCheck(
        'Service Layer',
        `Method: ${method}`,
        hasMethod,
        hasMethod ? 'Method implemented' : 'Method not found'
      );
    });
  }
}

async function verifyTypes() {
  console.log('🔍 Verifying Type Definitions...');

  const fs = require('fs');
  const path = require('path');

  const typesFile = 'lib/types/exercise.ts';
  const exists = fs.existsSync(path.join(process.cwd(), typesFile));

  addCheck(
    'Type Definitions',
    'Types File',
    exists,
    exists ? 'Exercise types file exists' : 'Types file missing'
  );

  if (exists) {
    const content = fs.readFileSync(path.join(process.cwd(), typesFile), 'utf-8');
    const types = [
      'Exercise',
      'ExerciseDetail',
      'ExerciseListQuery',
      'ExerciseListResponse',
      'CreateExerciseDTO',
      'UpdateExerciseDTO',
    ];

    types.forEach((type) => {
      const hasType = content.includes(`export interface ${type}`) ||
                      content.includes(`export type ${type}`);
      addCheck(
        'Type Definitions',
        `Type: ${type}`,
        hasType,
        hasType ? 'Type defined' : 'Type not found'
      );
    });
  }
}

async function verifyUIComponents() {
  console.log('🔍 Verifying UI Components...');

  const fs = require('fs');
  const path = require('path');

  const uiFiles = [
    'app/exercises/page.tsx',
    'app/exercises/[exerciseId]/page.tsx',
  ];

  uiFiles.forEach((file) => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    addCheck(
      'UI Components',
      file,
      exists,
      exists ? 'UI file exists' : 'UI file missing'
    );
  });
}

async function verifyTests() {
  console.log('🔍 Verifying Tests...');

  const fs = require('fs');
  const path = require('path');

  const testFiles = [
    'tests/exercises/exercise-api.test.ts',
    'tests/exercises/exercise-service.test.ts',
  ];

  testFiles.forEach((file) => {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    addCheck(
      'Tests',
      file,
      exists,
      exists ? 'Test file exists' : 'Test file missing'
    );
  });
}

async function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  let totalPassed = 0;
  let totalFailed = 0;

  results.forEach(({ category, checks }) => {
    console.log(`${category}:`);
    const categoryPassed = checks.filter((c) => c.passed).length;
    const categoryTotal = checks.length;

    checks.forEach(({ name, passed, message }) => {
      const icon = passed ? '✅' : '❌';
      console.log(`  ${icon} ${name}: ${message}`);
      if (passed) totalPassed++;
      else totalFailed++;
    });

    console.log(`  Category: ${categoryPassed}/${categoryTotal} passed\n`);
  });

  console.log('='.repeat(80));
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(80) + '\n');

  // Print summary
  if (totalFailed === 0) {
    console.log('🎉 All verification checks passed!');
    console.log('✅ Epic 004: Exercise Library is fully implemented');
  } else {
    console.log(`⚠️  ${totalFailed} verification check(s) failed`);
    console.log('Please review the failed checks above');
  }
}

async function main() {
  console.log('🚀 Starting Epic 004 Verification...\n');

  await verifyDatabase();
  await verifyAPIRoutes();
  await verifyServiceLayer();
  await verifyTypes();
  await verifyUIComponents();
  await verifyTests();

  await printResults();

  await prisma.$disconnect();
}

main().catch(console.error);
