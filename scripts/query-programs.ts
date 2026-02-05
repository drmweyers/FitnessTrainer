import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      weeks: {
        include: {
          workouts: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('\n📋 Sample Programs in Database:');
  console.log('━'.repeat(70));

  for (const program of programs) {
    const totalWorkouts = program.weeks.reduce((sum, week) => sum + week.workouts.length, 0);

    console.log(`\n🏋️  ${program.name}`);
    console.log(`   Type: ${program.programType}`);
    console.log(`   Level: ${program.difficultyLevel}`);
    console.log(`   Duration: ${program.durationWeeks} weeks`);
    console.log(`   Structure: ${program.weeks.length} weeks, ${totalWorkouts} total workouts`);
  }

  console.log('\n' + '━'.repeat(70));
  console.log(`✅ Total programs: ${programs.length}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
