import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyExercises() {
  try {
    const total = await prisma.exercise.count();
    console.log(`✅ Total exercises in database: ${total}`);

    // Get sample exercises
    const sampleExercises = await prisma.exercise.findMany({
      take: 5,
      orderBy: { name: 'asc' }
    });

    console.log('\n📝 Sample exercises:');
    sampleExercises.forEach(ex => {
      console.log(`  - ${ex.name} (${ex.difficulty}) - ${ex.bodyPart}`);
    });

    // Count by difficulty
    const byDifficulty = await prisma.exercise.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true }
    });

    console.log('\n📊 By difficulty:');
    byDifficulty.forEach(d => {
      console.log(`  - ${d.difficulty}: ${d._count.difficulty}`);
    });

    // Count by body part (top 5)
    const byBodyPart = await prisma.exercise.groupBy({
      by: ['bodyPart'],
      _count: { bodyPart: true },
      orderBy: { _count: { bodyPart: 'desc' } }
    });

    console.log('\n📊 Top body parts:');
    byBodyPart.slice(0, 5).forEach(b => {
      console.log(`  - ${b.bodyPart}: ${b._count.bodyPart}`);
    });

  } catch (error) {
    console.error('❌ Error verifying exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyExercises();
