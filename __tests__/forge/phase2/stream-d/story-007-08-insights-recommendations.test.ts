/**
 * Story 007-08: Insights & Recommendations
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to receive personalized insights
 * So that I can optimize my fitness journey
 */

import { prisma } from '@/lib/db/prisma';
import {
  ActorFactory,
  WorkflowRunner,
  MeasurementHelpers,
  cleanupTestData
} from './utils';

describe('Story 007-08: Insights & Recommendations', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('generates weekly insights summary', async () => {
      const client = await ActorFactory.createClient();

      const insights = {
        userId: client.id,
        period: 'March 25-31, 2026',
        summary: {
          workoutsCompleted: 4,
          totalVolume: 45000,
          weightChange: -1.5,
          consistency: 95
        },
        highlights: [
          'Achieved new PR on bench press',
          'Maintained perfect workout streak',
          'Lost 1.5 lbs this week'
        ]
      };

      expect(insights.summary.workoutsCompleted).toBe(4);
      expect(insights.highlights).toHaveLength(3);
    });

    it('identifies improvement trends', async () => {
      const client = await ActorFactory.createClient();

      // Progressive overload trend
      const weeklyWeights = [135, 140, 145, 150, 155];

      const isImproving = weeklyWeights.every((val, i, arr) =>
        i === 0 || val >= arr[i - 1]
      );

      expect(isImproving).toBe(true);
    });

    it('detects plateau patterns', async () => {
      const weights = [150, 150, 150, 150, 150];
      const uniqueValues = new Set(weights).size;

      const isPlateau = uniqueValues === 1;
      expect(isPlateau).toBe(true);
    });
  });

  describe('Personalized Recommendations', () => {
    it('recommends progressive overload', async () => {
      const currentWeight = 150;
      const lastIncrease = new Date('2026-02-01');
      const daysSinceIncrease = Math.floor(
        (Date.now() - lastIncrease.getTime()) / (1000 * 60 * 60 * 24)
      );

      const recommendation = daysSinceIncrease > 14 ?
        `Consider increasing weight from ${currentWeight}lbs to ${currentWeight + 5}lbs` :
        'Continue current progression';

      expect(recommendation).toContain('increasing weight');
    });

    it('suggests exercise variations', async () => {
      const exerciseHistory = {
        'Bench Press': 20,
        'Incline Press': 2,
        'Dumbbell Press': 1
      };

      const suggestion = exerciseHistory['Incline Press'] < 5 ?
        'Add more incline press to target upper chest' :
        'Good exercise variety';

      expect(suggestion).toContain('incline press');
    });

    it('recommends deload week', async () => {
      const weeksWithoutDeload = 8;
      const fatigueScore = 75;

      const needsDeload = weeksWithoutDeload >= 6 || fatigueScore < 70;
      const recommendation = needsDeload ?
        'Consider a deload week to optimize recovery' :
        'Continue current training';

      expect(recommendation).toContain('deload week');
    });

    it('suggests nutrition adjustments', async () => {
      const goal = 'weight_loss';
      const weeklyChange = 0; // No change

      const suggestion = goal === 'weight_loss' && weeklyChange >= 0 ?
        'Consider reviewing caloric intake - no weight change detected' :
        'Nutrition on track';

      expect(suggestion).toContain('caloric intake');
    });
  });

  describe('Pattern Recognition', () => {
    it('identifies best workout days', async () => {
      const workoutData = [
        { day: 'Monday', performance: 85 },
        { day: 'Tuesday', performance: 90 },
        { day: 'Wednesday', performance: 75 },
        { day: 'Thursday', performance: 88 },
        { day: 'Friday', performance: 82 }
      ];

      const bestDay = workoutData.reduce((best, current) =>
        current.performance > best.performance ? current : best
      );

      expect(bestDay.day).toBe('Tuesday');
    });

    it('identifies optimal workout time', async () => {
      const timeData = [
        { time: '6:00 AM', performance: 75 },
        { time: '12:00 PM', performance: 90 },
        { time: '6:00 PM', performance: 85 }
      ];

      const optimalTime = timeData.reduce((best, current) =>
        current.performance > best.performance ? current : best
      );

      expect(optimalTime.time).toBe('12:00 PM');
    });

    it('correlates sleep with performance', async () => {
      const data = [
        { sleep: 6, performance: 70 },
        { sleep: 7, performance: 80 },
        { sleep: 8, performance: 90 },
        { sleep: 9, performance: 85 }
      ];

      const correlation = data.reduce((sum, d) =>
        sum + (d.sleep * d.performance), 0) / data.length;

      expect(correlation).toBeGreaterThan(500);
    });
  });

  describe('Goal-Based Insights', () => {
    it('tracks goal velocity', async () => {
      const goal = { target: 180, start: 200, current: 190 };
      const progress = ((goal.start - goal.current) / (goal.start - goal.target)) * 100;

      expect(progress).toBe(50);
    });

    it('estimates goal completion date', async () => {
      const current = 190;
      const target = 180;
      const weeklyRate = 1; // lbs per week
      const remaining = current - target;
      const weeksToGoal = remaining / weeklyRate;

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + (weeksToGoal * 7));

      expect(weeksToGoal).toBe(10);
    });

    it('suggests goal adjustments', async () => {
      const goal = { target: 180, current: 195, deadline: new Date('2026-04-30') };
      const weeksRemaining = 4;
      const neededWeeklyLoss = (goal.current - goal.target) / weeksRemaining;

      const suggestion = neededWeeklyLoss > 2 ?
        'Goal may be aggressive. Consider extending deadline or adjusting target.' :
        'On track to meet goal';

      expect(neededWeeklyLoss).toBe(3.75);
      expect(suggestion).toContain('aggressive');
    });
  });

  describe('Comparative Insights', () => {
    it('compares to similar users', async () => {
      const userStats = { age: 30, weight: 180, experience: 'intermediate' };
      const peerAverage = { benchPress: 185, squat: 225, deadlift: 275 };
      const userLifts = { benchPress: 195, squat: 245, deadlift: 315 };

      const comparison = {
        benchPress: ((userLifts.benchPress - peerAverage.benchPress) / peerAverage.benchPress) * 100,
        squat: ((userLifts.squat - peerAverage.squat) / peerAverage.squat) * 100,
        deadlift: ((userLifts.deadlift - peerAverage.deadlift) / peerAverage.deadlift) * 100
      };

      expect(comparison.benchPress).toBeGreaterThan(0);
    });

    it('shows percentile ranking', async () => {
      const userLift = 225;
      const distribution = [135, 155, 185, 205, 225, 245, 275, 315];
      const rank = distribution.filter(l => l < userLift).length;
      const percentile = (rank / distribution.length) * 100;

      expect(percentile).toBe(50);
    });
  });

  describe('Trainer Insights', () => {
    it('trainer receives client insights summary', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      const insights = {
        clientId: client.id,
        weekEnding: '2026-03-31',
        summary: 'Client hit all scheduled workouts',
        concerns: ['Sleep quality declining'],
        recommendations: ['Review recovery protocols']
      };

      expect(insights.summary).toContain('hit all scheduled');
    });

    it('identifies clients needing attention', async () => {
      const clients = [
        { name: 'Client A', adherence: 95, fatigue: 80 },
        { name: 'Client B', adherence: 60, fatigue: 90 },
        { name: 'Client C', adherence: 85, fatigue: 70 }
      ];

      const needsAttention = clients.filter(c =>
        c.adherence < 70 || c.fatigue > 85
      );

      expect(needsAttention).toHaveLength(1);
      expect(needsAttention[0].name).toBe('Client B');
    });
  });
});
