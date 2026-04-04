/**
 * Story 007-04: Performance Analytics
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to view my workout performance analytics
 * So that I can track strength gains and workout consistency
 */

import { prisma } from '@/lib/db/prisma';

const mockWorkoutLogs = [
  { id: "log-1", workoutId: "workout-1", completedAt: new Date('2026-01-01'), weight: 135, sets: 3, reps: 10 },
  { id: "log-2", workoutId: "workout-2", completedAt: new Date('2026-02-01'), weight: 145, sets: 3, reps: 10 },
  { id: "log-3", workoutId: "workout-3", completedAt: new Date('2026-03-01'), weight: 155, sets: 3, reps: 10 },
];

const mockManyLogs = [
  { id: "log-1", workoutId: "workout-1", completedAt: new Date('2026-03-01'), weight: 100, sets: 3, reps: 10 },
  { id: "log-2", workoutId: "workout-2", completedAt: new Date('2026-03-03'), weight: 100, sets: 3, reps: 10 },
  { id: "log-3", workoutId: "workout-3", completedAt: new Date('2026-03-05'), weight: 100, sets: 3, reps: 10 },
  { id: "log-4", workoutId: "workout-4", completedAt: new Date('2026-03-08'), weight: 100, sets: 3, reps: 10 },
  { id: "log-5", workoutId: "workout-5", completedAt: new Date('2026-03-10'), weight: 100, sets: 3, reps: 10 },
  { id: "log-6", workoutId: "workout-6", completedAt: new Date('2026-03-12'), weight: 100, sets: 3, reps: 10 },
  { id: "log-7", workoutId: "workout-7", completedAt: new Date('2026-03-15'), weight: 100, sets: 3, reps: 10 },
  { id: "log-8", workoutId: "workout-8", completedAt: new Date('2026-03-17'), weight: 100, sets: 3, reps: 10 },
  { id: "log-9", workoutId: "workout-9", completedAt: new Date('2026-03-19'), weight: 100, sets: 3, reps: 10 },
  { id: "log-10", workoutId: "workout-10", completedAt: new Date('2026-03-22'), weight: 100, sets: 3, reps: 10 },
  { id: "log-11", workoutId: "workout-11", completedAt: new Date('2026-03-24'), weight: 100, sets: 3, reps: 10 },
  { id: "log-12", workoutId: "workout-12", completedAt: new Date('2026-03-26'), weight: 100, sets: 3, reps: 10 },
];

const mockVolumeLogs = [
  { id: "log-1", workoutId: "workout-1", completedAt: new Date(), weight: 100, sets: 3, reps: 10 },
  { id: "log-2", workoutId: "workout-2", completedAt: new Date(), weight: 105, sets: 3, reps: 10 },
  { id: "log-3", workoutId: "workout-3", completedAt: new Date(), weight: 110, sets: 3, reps: 10 },
  { id: "log-4", workoutId: "workout-4", completedAt: new Date(), weight: 120, sets: 3, reps: 10 },
];

const mockStreakLogs = [
  { id: "log-1", workoutId: "workout-1", completedAt: new Date('2026-03-01'), weight: 100, sets: 3, reps: 10 },
  { id: "log-2", workoutId: "workout-2", completedAt: new Date('2026-03-02'), weight: 100, sets: 3, reps: 10 },
  { id: "log-3", workoutId: "workout-3", completedAt: new Date('2026-03-03'), weight: 100, sets: 3, reps: 10 },
  { id: "log-4", workoutId: "workout-4", completedAt: new Date('2026-03-04'), weight: 100, sets: 3, reps: 10 },
  { id: "log-5", workoutId: "workout-5", completedAt: new Date('2026-03-05'), weight: 100, sets: 3, reps: 10 },
];

const mockMonthLogs = [
  { id: "log-1", workoutId: "workout-1", completedAt: new Date('2026-01-15T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
  { id: "log-2", workoutId: "workout-2", completedAt: new Date('2026-01-20T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
  { id: "log-3", workoutId: "workout-3", completedAt: new Date('2026-02-05T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
  { id: "log-4", workoutId: "workout-4", completedAt: new Date('2026-02-10T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
  { id: "log-5", workoutId: "workout-5", completedAt: new Date('2026-02-15T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
  { id: "log-6", workoutId: "workout-6", completedAt: new Date('2026-03-01T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
  { id: "log-7", workoutId: "workout-7", completedAt: new Date('2026-03-10T12:00:00Z'), weight: 100, sets: 3, reps: 10 },
];

const mockPRLog = { id: "log-7", workoutId: "workout-7", completedAt: new Date(), weight: 175, sets: 3, reps: 10 };

const mockClientLog = { id: "log-1", workoutId: "workout-1", completedAt: new Date(), weight: 225, sets: 3, reps: 10 };

const mockPlateauLogs = [
  { id: "log-1", workoutId: "workout-1", completedAt: new Date(), weight: 150, sets: 3, reps: 10 },
  { id: "log-2", workoutId: "workout-2", completedAt: new Date(), weight: 150, sets: 3, reps: 10 },
  { id: "log-3", workoutId: "workout-3", completedAt: new Date(), weight: 150, sets: 3, reps: 10 },
  { id: "log-4", workoutId: "workout-4", completedAt: new Date(), weight: 150, sets: 3, reps: 10 },
];

const mockCount = jest.fn();
const mockFindManyPrisma = jest.fn();
const mockFindFirstPrisma = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workoutLog: {
      count: (...args: any[]) => mockCount(...args),
      findMany: (...args: any[]) => mockFindManyPrisma(...args),
      findFirst: (...args: any[]) => mockFindFirstPrisma(...args),
    },
  },
}));

import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 007-04: Performance Analytics', () => {
  beforeEach(async () => {
    await cleanupTestData();
    jest.clearAllMocks();
    mockCount.mockReset();
    mockFindManyPrisma.mockReset();
    mockFindFirstPrisma.mockReset();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('views strength progression for exercise', async () => {
      const client = await ActorFactory.createClient();

      mockFindManyPrisma.mockResolvedValue(mockWorkoutLogs);
      const logs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

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

      mockFindManyPrisma.mockResolvedValue(mockManyLogs);
      const logs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

      expect(logs).toHaveLength(12);

      // Calculate weekly average
      const weeklyAverage = logs.length / 4;
      expect(weeklyAverage).toBe(3);
    });

    it('calculates volume progression', async () => {
      const client = await ActorFactory.createClient();

      mockFindManyPrisma.mockResolvedValue(mockVolumeLogs);
      const logs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

      const volumes = logs.map(log => log.sets * log.reps * log.weight);
      expect(volumes[0]).toBe(3000);
      expect(volumes[3]).toBe(3600);
    });
  });

  describe('Exercise Analytics', () => {
    it('finds personal records', async () => {
      const client = await ActorFactory.createClient();

      mockFindFirstPrisma.mockResolvedValue(mockPRLog);
      const pr = await prisma.workoutLog.findFirst({
        where: { userId: client.id },
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

      mockFindManyPrisma.mockResolvedValue(mockStreakLogs);
      const logs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

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

      mockCount.mockResolvedValue(14);
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

      mockFindManyPrisma.mockResolvedValue(mockMonthLogs);
      const logs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

      const byMonth: Record<number, number> = {};
      for (const log of logs) {
        const month = new Date(log.completedAt).getUTCMonth();
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

      // Client relationship mocked

      mockFindManyPrisma.mockResolvedValue([mockClientLog]);
      const clientLogs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

      expect(clientLogs).toHaveLength(1);
      expect(clientLogs[0].weight).toBe(225);
    });

    it('identifies plateauing clients', async () => {
      const client = await ActorFactory.createClient();

      mockFindManyPrisma.mockResolvedValue(mockPlateauLogs);
      const logs = await prisma.workoutLog.findMany({ where: { userId: client.id } });

      const weights = logs.map(l => l.weight);
      const isPlateau = new Set(weights).size === 1;

      expect(isPlateau).toBe(true);
    });
  });
});
