/**
 * Story 007-04: Performance Analytics
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to view my workout performance analytics
 * So that I can track strength gains and workout consistency
 */


import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 007-04: Performance Analytics', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('views strength progression for exercise', async () => {
      const client = await ActorFactory.createClient();

      // Create workout history with bench press data
      const workoutDates = [
        new Date('2026-01-01'),
        new Date('2026-02-01'),
        new Date('2026-03-01')
      ];

      for (let i = 0; i < workoutDates.length; i++) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: `bench-press-${i}`,
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            weight: 135 + (i * 10),
            unit: 'lbs',
            completedAt: workoutDates[i]
          }
        });
      }

      const logs = await prisma.workoutLog.findMany({
        where: {
          userId: client.id,
          exerciseName: 'Bench Press'
        },
        orderBy: { completedAt: 'asc' }
      });

      expect(logs).toHaveLength(3);
      expect(logs[0].weight).toBe(135);
      expect(logs[2].weight).toBe(155);
    });

    it('calculates one-rep max estimates', async () => {
      // Epley formula: weight * (1 + reps/30)
      const calculateOneRepMax = (weight: number, reps: number) => {
        return Math.round(weight * (1 + reps / 30));
      };

      const oneRM = calculateOneRepMax(200, 5);
      expect(oneRM).toBe(233);

      const oneRM2 = calculateOneRepMax(135, 10);
      expect(oneRM2).toBe(180);
    });

    it('tracks workout frequency', async () => {
      const client = await ActorFactory.createClient();

      // Log workouts over 4 weeks
      const workoutDays = [
        new Date('2026-03-01'), new Date('2026-03-03'), new Date('2026-03-05'),
        new Date('2026-03-08'), new Date('2026-03-10'), new Date('2026-03-12'),
        new Date('2026-03-15'), new Date('2026-03-17'), new Date('2026-03-19'),
        new Date('2026-03-22'), new Date('2026-03-24'), new Date('2026-03-26')
      ];

      for (const date of workoutDays) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'exercise-1',
            exerciseName: 'Mixed Workout',
            sets: 3,
            reps: 10,
            weight: 100,
            unit: 'lbs',
            completedAt: date
          }
        });
      }

      const logs = await prisma.workoutLog.findMany({
        where: {
          userId: client.id,
          completedAt: {
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-31')
          }
        }
      });

      expect(logs).toHaveLength(12);

      // Calculate weekly average
      const weeklyAverage = logs.length / 4;
      expect(weeklyAverage).toBe(3);
    });

    it('calculates volume progression', async () => {
      const client = await ActorFactory.createClient();

      // Week 1: 3 sets x 10 reps x 100 lbs = 3000 lbs per exercise
      // Week 4: 3 sets x 10 reps x 120 lbs = 3600 lbs per exercise

      const weeks = [
        { week: 1, weight: 100 },
        { week: 2, weight: 105 },
        { week: 3, weight: 110 },
        { week: 4, weight: 120 }
      ];

      for (const { week, weight } of weeks) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'squat',
            exerciseName: 'Squat',
            sets: 3,
            reps: 10,
            weight,
            unit: 'lbs',
            completedAt: new Date(2026, 2, week * 7)
          }
        });
      }

      const logs = await prisma.workoutLog.findMany({
        where: { userId: client.id, exerciseName: 'Squat' },
        orderBy: { completedAt: 'asc' }
      });

      const volumes = logs.map(log => log.sets * log.reps * log.weight);
      expect(volumes[0]).toBe(3000);
      expect(volumes[3]).toBe(3600);
    });
  });

  describe('Exercise Analytics', () => {
    it('finds personal records', async () => {
      const client = await ActorFactory.createClient();

      const lifts = [135, 145, 155, 150, 165, 160, 175];

      for (let i = 0; i < lifts.length; i++) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'deadlift',
            exerciseName: 'Deadlift',
            sets: 1,
            reps: 5,
            weight: lifts[i],
            unit: 'lbs',
            completedAt: new Date(2026, 2, i + 1)
          }
        });
      }

      const pr = await prisma.workoutLog.findFirst({
        where: { userId: client.id, exerciseName: 'Deadlift' },
        orderBy: { weight: 'desc' }
      });

      expect(pr?.weight).toBe(175);
    });

    it('tracks PR streaks', async () => {
      const lifts = [100, 105, 110, 115, 120];
      let prStreak = 0;
      let currentMax = 0;

      for (const lift of lifts) {
        if (lift > currentMax) {
          prStreak++;
          currentMax = lift;
        }
      }

      expect(prStreak).toBe(5);
      expect(currentMax).toBe(120);
    });

    it('calculates relative strength', () => {
      const bodyWeight = 180;
      const liftWeight = 315;

      const relativeStrength = liftWeight / bodyWeight;
      expect(relativeStrength).toBeCloseTo(1.75, 2);

      // Strength standards
      const isAdvanced = relativeStrength >= 2.0;
      const isIntermediate = relativeStrength >= 1.5;

      expect(isAdvanced).toBe(false);
      expect(isIntermediate).toBe(true);
    });

    it('compares to strength standards', () => {
      const standards = {
        benchPress: { beginner: 0.75, intermediate: 1.0, advanced: 1.5 },
        squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0 },
        deadlift: { beginner: 1.25, intermediate: 2.0, advanced: 2.5 }
      };

      const bodyWeight = 180;
      const squatWeight = 270;
      const ratio = squatWeight / bodyWeight;

      let level = 'beginner';
      if (ratio >= standards.squat.advanced) level = 'advanced';
      else if (ratio >= standards.squat.intermediate) level = 'intermediate';

      expect(ratio).toBe(1.5);
      expect(level).toBe('intermediate');
    });
  });

  describe('Consistency Metrics', () => {
    it('calculates workout streak', async () => {
      const client = await ActorFactory.createClient();

      // 5 consecutive days
      for (let i = 0; i < 5; i++) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'exercise-1',
            exerciseName: 'Workout',
            sets: 3,
            reps: 10,
            weight: 100,
            unit: 'lbs',
            completedAt: new Date(2026, 2, 1 + i)
          }
        });
      }

      const logs = await prisma.workoutLog.findMany({
        where: { userId: client.id },
        orderBy: { completedAt: 'asc' }
      });

      expect(logs).toHaveLength(5);

      // Calculate streak
      let streak = 1;
      for (let i = 1; i < logs.length; i++) {
        const prev = new Date(logs[i - 1].completedAt);
        const curr = new Date(logs[i].completedAt);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays <= 2) streak++;
        else streak = 1;
      }

      expect(streak).toBe(5);
    });

    it('calculates adherence rate', async () => {
      const client = await ActorFactory.createClient();

      // Planned: 4 workouts per week for 4 weeks = 16 workouts
      // Completed: 14 workouts
      const plannedWorkouts = 16;

      for (let i = 0; i < 14; i++) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: `exercise-${i}`,
            exerciseName: 'Workout',
            sets: 3,
            reps: 10,
            weight: 100,
            unit: 'lbs',
            completedAt: new Date(2026, 2, i + 1)
          }
        });
      }

      const completed = await prisma.workoutLog.count({
        where: { userId: client.id }
      });

      const adherenceRate = (completed / plannedWorkouts) * 100;
      expect(adherenceRate).toBeCloseTo(87.5, 1);
    });

    it('identifies missed workouts', () => {
      const plannedDays = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22];
      const completedDays = [1, 3, 5, 8, 12, 15, 17, 19, 22];

      const missed = plannedDays.filter(day => !completedDays.includes(day));

      expect(missed).toContain(10);
      expect(missed).toHaveLength(1);
    });
  });

  describe('Time-Based Analytics', () => {
    it('groups workouts by week', async () => {
      const client = await ActorFactory.createClient();

      // 12 workouts over 4 weeks
      const workoutDays = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26];

      for (const day of workoutDays) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'exercise-1',
            exerciseName: 'Workout',
            sets: 3,
            reps: 10,
            weight: 100,
            unit: 'lbs',
            completedAt: new Date(2026, 2, day)
          }
        });
      }

      const byWeek: Record<number, number> = {};
      for (const day of workoutDays) {
        const week = Math.ceil(day / 7);
        byWeek[week] = (byWeek[week] || 0) + 1;
      }

      expect(Object.keys(byWeek)).toHaveLength(4);
      expect(byWeek[1]).toBe(3);
      expect(byWeek[4]).toBe(3);
    });

    it('groups workouts by month', async () => {
      const client = await ActorFactory.createClient();

      const months = [0, 0, 1, 1, 1, 2, 2]; // Jan, Jan, Feb, Feb, Feb, Mar, Mar

      for (let i = 0; i < months.length; i++) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'exercise-1',
            exerciseName: 'Workout',
            sets: 3,
            reps: 10,
            weight: 100,
            unit: 'lbs',
            completedAt: new Date(2026, months[i], i + 1)
          }
        });
      }

      const logs = await prisma.workoutLog.findMany({
        where: { userId: client.id }
      });

      const byMonth: Record<number, number> = {};
      for (const log of logs) {
        const month = new Date(log.completedAt).getMonth();
        byMonth[month] = (byMonth[month] || 0) + 1;
      }

      expect(byMonth[0]).toBe(2); // January
      expect(byMonth[1]).toBe(3); // February
      expect(byMonth[2]).toBe(2); // March
    });
  });

  describe('Trainer Insights', () => {
    it('trainer views client performance', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      // Client has workout data
      await prisma.workoutLog.create({
        data: {
          userId: client.id,
          exerciseId: 'squat',
          exerciseName: 'Squat',
          sets: 3,
          reps: 5,
          weight: 225,
          unit: 'lbs',
          completedAt: new Date()
        }
      });

      const clientLogs = await prisma.workoutLog.findMany({
        where: { userId: client.id }
      });

      expect(clientLogs).toHaveLength(1);
      expect(clientLogs[0].weight).toBe(225);
    });

    it('identifies plateauing clients', async () => {
      const client = await ActorFactory.createClient();

      // Same weight for 4 weeks = plateau
      for (let i = 0; i < 4; i++) {
        await prisma.workoutLog.create({
          data: {
            userId: client.id,
            exerciseId: 'bench',
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            weight: 135,
            unit: 'lbs',
            completedAt: new Date(2026, 2, 1 + (i * 7))
          }
        });
      }

      const logs = await prisma.workoutLog.findMany({
        where: { userId: client.id, exerciseName: 'Bench Press' },
        orderBy: { completedAt: 'asc' }
      });

      const weights = logs.map(l => l.weight);
      const isPlateau = new Set(weights).size === 1;

      expect(isPlateau).toBe(true);
    });
  });
});
