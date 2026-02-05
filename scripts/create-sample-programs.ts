/**
 * Create Sample Workout Programs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrCreateTrainer() {
  // Try to find existing trainer
  let trainer = await prisma.user.findFirst({
    where: { role: 'trainer' }
  });

  if (!trainer) {
    // Create a trainer user
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Trainer123!', 10);

    trainer = await prisma.user.create({
      data: {
        email: 'trainer@evofit.com',
        passwordHash: hashedPassword,
        role: 'trainer',
        isActive: true,
        isVerified: true,
      },
    });
    console.log(`✓ Created trainer user: ${trainer.email}`);
  } else {
    console.log(`✓ Using existing trainer: ${trainer.email}`);
  }

  return trainer;
}

const programs = [
  {
    name: 'Beginner Full Body',
    description: 'Perfect for beginners starting their fitness journey. Build fundamental strength with compound movements.',
    programType: 'strength' as const,
    difficultyLevel: 'beginner' as const,
    durationWeeks: 4,
    daysPerWeek: 3,
    goals: ['Build fundamental strength', 'Learn proper form', 'Establish workout routine'],
    equipmentNeeded: ['Body weight', 'Dumbbells'],
  },
  {
    name: 'Muscle Building - Hypertrophy',
    description: 'Intermediate program focused on muscle growth. Target specific muscle groups with volume and intensity.',
    programType: 'hypertrophy' as const,
    difficultyLevel: 'intermediate' as const,
    durationWeeks: 6,
    daysPerWeek: 4,
    goals: ['Increase muscle mass', 'Improve aesthetics', 'Build strength'],
    equipmentNeeded: ['Barbell', 'Dumbbells', 'Cable machine', 'Bench'],
  },
  {
    name: 'Athletic Performance',
    description: 'Advanced program for athletes. Enhance power, speed, and sport-specific performance.',
    programType: 'sport_specific' as const,
    difficultyLevel: 'advanced' as const,
    durationWeeks: 8,
    daysPerWeek: 5,
    goals: ['Increase explosive power', 'Enhance agility', 'Improve speed'],
    equipmentNeeded: ['Barbell', 'Plyometric box', 'Resistance bands', 'Cones'],
  },
];

async function createSamplePrograms() {
  console.log('Creating sample programs...');

  const trainer = await getOrCreateTrainer();

  for (const programData of programs) {
    // Create the program
    const program = await prisma.program.create({
      data: {
        trainerId: trainer.id,
        name: programData.name,
        description: programData.description,
        programType: programData.programType,
        difficultyLevel: programData.difficultyLevel,
        durationWeeks: programData.durationWeeks,
        goals: programData.goals,
        equipmentNeeded: programData.equipmentNeeded,
        isTemplate: true,
        isPublic: true,
      },
    });

    console.log(`✓ Created program: ${program.name} (ID: ${program.id})`);

    // Create weeks and workouts for the program
    for (let week = 1; week <= programData.durationWeeks; week++) {
      const programWeek = await prisma.programWeek.create({
        data: {
          programId: program.id,
          weekNumber: week,
          name: `Week ${week}`,
          description: week === programData.durationWeeks ? 'Deload week' : undefined,
          isDeload: week === programData.durationWeeks,
        },
      });

      // Create workouts for each day
      const workoutTypes = ['A', 'B', 'C', 'D', 'E'];
      for (let day = 1; day <= programData.daysPerWeek; day++) {
        const workoutName = `${workoutTypes[(day - 1) % workoutTypes.length]}-Day ${day}`;

        await prisma.programWorkout.create({
          data: {
            programWeekId: programWeek.id,
            dayNumber: day,
            name: workoutName,
            description: `${programData.name} - Day ${day}`,
            workoutType: 'strength',
            estimatedDuration: 60,
          },
        });
      }
    }

    console.log(`  ✓ Created ${programData.durationWeeks} weeks with ${programData.daysPerWeek} workouts/week`);
  }

  console.log('\n✅ Sample programs created successfully!');
}

createSamplePrograms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
