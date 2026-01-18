import { PrismaClient, DifficultyLevel, ProgramType, FitnessLevel, WorkoutType, SetType } from '@prisma/client';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Creating workout test data...');

  // Get trainer and client users
  const trainer = await prisma.user.findUnique({
    where: { email: 'trainer.test@evofitmeals.com' },
  });

  const client = await prisma.user.findUnique({
    where: { email: 'customer.test@evofitmeals.com' },
  });

  if (!trainer || !client) {
    logger.error('Trainer or client user not found. Run seed first.');
    process.exit(1);
  }

  // Create sample exercises
  const benchPress = await prisma.exercise.upsert({
    where: { exerciseId: 'ex_bench_press' },
    update: {},
    create: {
      exerciseId: 'ex_bench_press',
      name: 'Barbell Bench Press',
      bodyPart: 'chest',
      equipment: 'barbell',
      targetMuscle: 'pectorals',
      secondaryMuscles: ['triceps', 'front delts'],
      instructions: ['Lie flat on bench', 'Grip bar slightly wider than shoulder width', 'Lower to chest', 'Press up'],
      difficulty: DifficultyLevel.intermediate,
      gifUrl: 'https://example.com/bench-press.gif',
    },
  });

  const bentOverRow = await prisma.exercise.upsert({
    where: { exerciseId: 'ex_bent_over_row' },
    update: {},
    create: {
      exerciseId: 'ex_bent_over_row',
      name: 'Bent Over Barbell Row',
      bodyPart: 'back',
      equipment: 'barbell',
      targetMuscle: 'latissimus dorsi',
      secondaryMuscles: ['biceps', 'rear delts'],
      instructions: ['Bend over with flat back', 'Grip bar', 'Row to lower chest'],
      difficulty: DifficultyLevel.intermediate,
      gifUrl: 'https://example.com/bent-over-row.gif',
    },
  });

  const overheadPress = await prisma.exercise.upsert({
    where: { exerciseId: 'ex_overhead_press' },
    update: {},
    create: {
      exerciseId: 'ex_overhead_press',
      name: 'Overhead Barbell Press',
      bodyPart: 'shoulders',
      equipment: 'barbell',
      targetMuscle: 'deltoids',
      secondaryMuscles: ['triceps'],
      instructions: ['Stand with bar at shoulder height', 'Press overhead until arms are extended'],
      difficulty: DifficultyLevel.intermediate,
      gifUrl: 'https://example.com/overhead-press.gif',
    },
  });

  logger.info('Created exercises');

  // Create a sample program (let DB generate UUID)
  let program = await prisma.program.findFirst({
    where: { trainerId: trainer.id, name: 'Strength Foundation' },
  });

  if (!program) {
    program = await prisma.program.create({
      data: {
        trainerId: trainer.id,
        name: 'Strength Foundation',
        description: 'A basic strength training program for beginners',
        programType: ProgramType.strength,
        difficultyLevel: FitnessLevel.beginner,
        durationWeeks: 4,
        goals: ['Build Strength', 'Muscle Growth'],
        equipmentNeeded: ['Barbell', 'Dumbbells', 'Bench'],
      },
    });
  }

  // Create week 1
  let week1 = await prisma.programWeek.findFirst({
    where: { programId: program.id, weekNumber: 1 },
  });

  if (!week1) {
    week1 = await prisma.programWeek.create({
      data: {
        programId: program.id,
        weekNumber: 1,
        name: 'Week 1',
        description: 'Foundation',
        isDeload: false,
      },
    });
  }

  // Today's workout (based on current day of week)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  let todaysWorkout = await prisma.programWorkout.findFirst({
    where: { programWeekId: week1.id, dayNumber },
  });

  if (!todaysWorkout) {
    todaysWorkout = await prisma.programWorkout.create({
      data: {
        programWeekId: week1.id,
        dayNumber,
        name: 'Upper Body Strength',
        description: 'Chest, Back, Shoulders',
        workoutType: WorkoutType.strength,
        estimatedDuration: 60,
        isRestDay: false,
      },
    });
  }

  // Helper to create workout exercise with configurations
  async function createWorkoutExercise(exerciseId: string, orderIndex: number, notes: string) {
    let workoutExercise = await prisma.workoutExercise.findFirst({
      where: { workoutId: todaysWorkout!.id, exerciseId, orderIndex },
    });

    if (!workoutExercise) {
      workoutExercise = await prisma.workoutExercise.create({
        data: {
          workoutId: todaysWorkout!.id,
          exerciseId,
          orderIndex,
          setsConfig: [{ type: 'working', count: 3 }],
          notes,
        },
      });
    }

    // Create configurations for 3 sets
    const existingConfigs = await prisma.exerciseConfiguration.findMany({
      where: { workoutExerciseId: workoutExercise.id },
    });

    if (existingConfigs.length === 0) {
      for (let setNumber = 1; setNumber <= 3; setNumber++) {
        await prisma.exerciseConfiguration.create({
          data: {
            workoutExerciseId: workoutExercise.id,
            setNumber,
            setType: SetType.working,
            reps: '8-10',
            restSeconds: 180,
          },
        });
      }
    }

    return workoutExercise;
  }

  await createWorkoutExercise(benchPress.id, 0, 'Focus on controlled tempo');
  await createWorkoutExercise(bentOverRow.id, 1, 'Keep back flat');
  await createWorkoutExercise(overheadPress.id, 2, 'Engage core');

  logger.info('Created workouts with exercises');

  // Assign the program to the client starting today
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const endDate = new Date(todayDate);
  endDate.setDate(endDate.getDate() + 28); // 4 weeks

  let assignment = await prisma.programAssignment.findFirst({
    where: { clientId: client.id, programId: program.id },
  });

  if (!assignment) {
    assignment = await prisma.programAssignment.create({
      data: {
        clientId: client.id,
        trainerId: trainer.id,
        programId: program.id,
        isActive: true,
        startDate: todayDate,
        endDate: endDate,
        customNotes: 'Initial strength program assignment',
      },
    });
  }

  logger.info('Created program assignment');
  logger.info('Test data created successfully!');
  logger.info(`Trainer: ${trainer.email}`);
  logger.info(`Client: ${client.email}`);
  logger.info(`Program: ${program.name} (ID: ${program.id})`);
  logger.info(`Today's Workout: ${todaysWorkout.name} (Day ${dayNumber}, ID: ${todaysWorkout.id})`);
  logger.info(`Assignment ID: ${assignment.id}`);
}

main()
  .catch((e) => {
    logger.error('Failed to create test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
