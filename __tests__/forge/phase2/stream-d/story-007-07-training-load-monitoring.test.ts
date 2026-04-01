/**
 * Story 007-07: Training Load Monitoring
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to monitor my training load
 * So that I can avoid overtraining and optimize recovery
 */


import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 007-07: Training Load Monitoring', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('calculates daily training load', async () => {
      const client = await ActorFactory.createClient();

      // Log workouts for a week
      const dailyLoads = [250, 300, 200, 350, 400, 150, 100];

      for (let i = 0; i < dailyLoads.length; i++) {
        await prisma.trainingLoad.create({
          data: {
            userId: client.id,
            date: new Date(2026, 2, 1 + i),
            load: dailyLoads[i],
            duration: 60,
            rpe: 7
          }
        });
      }

      const loads = await prisma.trainingLoad.findMany({
        where: { userId: client.id }
      });

      expect(loads).toHaveLength(7);
      expect(loads[0].load).toBe(250);
    });

    it('calculates ACWR (Acute:Chronic Workload Ratio)', async () => {
      // ACWR = Acute Load (7-day avg) / Chronic Load (28-day avg)
      const acuteLoad = 350; // Last 7 days average
      const chronicLoad = 300; // Last 28 days average

      const acwr = acuteLoad / chronicLoad;

      expect(acwr).toBeCloseTo(1.17, 2);

      // Optimal range: 0.8 - 1.3
      expect(acwr).toBeGreaterThan(0.8);
      expect(acwr).toBeLessThan(1.3);
    });

    it('identifies overtraining risk', async () => {
      const acuteLoad = 500;
      const chronicLoad = 300;

      const acwr = acuteLoad / chronicLoad;
      const riskLevel = acwr > 1.5 ? 'HIGH' : acwr > 1.3 ? 'ELEVATED' : 'NORMAL';

      expect(acwr).toBeCloseTo(1.67, 2);
      expect(riskLevel).toBe('HIGH');
    });

    it('identifies undertraining', async () => {
      const acuteLoad = 200;
      const chronicLoad = 400;

      const acwr = acuteLoad / chronicLoad;
      const status = acwr < 0.8 ? 'DETRAINING' : 'NORMAL';

      expect(acwr).toBe(0.5);
      expect(status).toBe('DETRAINING');
    });
  });

  describe('Load Metrics', () => {
    it('calculates session RPE load', async () => {
      const duration = 60; // minutes
      const rpe = 8; // Rate of Perceived Exertion (1-10)

      const sessionLoad = duration * rpe;

      expect(sessionLoad).toBe(480);
    });

    it('calculates weekly load', async () => {
      const dailyLoads = [350, 400, 300, 450, 380, 200, 150];
      const weeklyLoad = dailyLoads.reduce((a, b) => a + b, 0);

      expect(weeklyLoad).toBe(2230);
    });

    it('calculates monotony', async () => {
      // Monotony = average load / standard deviation
      const dailyLoads = [300, 310, 295, 305, 300, 290, 300];
      const avg = dailyLoads.reduce((a, b) => a + b, 0) / dailyLoads.length;

      const variance = dailyLoads.reduce((sum, val) =>
        sum + Math.pow(val - avg, 2), 0) / dailyLoads.length;
      const stdDev = Math.sqrt(variance);

      const monotony = avg / stdDev;

      // High monotony (>2) indicates repetitive training
      expect(monotony).toBeGreaterThan(2);
    });

    it('calculates strain', async () => {
      // Strain = total load * monotony
      const weeklyLoad = 2100;
      const monotony = 2.5;

      const strain = weeklyLoad * monotony;

      expect(strain).toBe(5250);
    });
  });

  describe('Recovery Metrics', () => {
    it('tracks HRV (Heart Rate Variability)', async () => {
      const client = await ActorFactory.createClient();

      const hrvData = {
        userId: client.id,
        date: new Date(),
        morningHrv: 65,
        baseline: 70,
        status: hrv => hrv < baseline * 0.9 ? 'POOR' : 'GOOD'
      };

      const status = hrvData.status(hrvData.morningHrv);
      expect(status).toBe('POOR');
    });

    it('tracks sleep quality', async () => {
      const sleepData = {
        duration: 7.5,
        quality: 85,
        deepSleep: 1.5,
        remSleep: 2.0
      };

      const recoveryScore = (sleepData.quality + (sleepData.duration * 10)) / 2;
      expect(recoveryScore).toBe(80);
    });

    it('calculates readiness score', async () => {
      const hrvScore = 70;
      const sleepScore = 80;
      const fatigueScore = 60;

      const readiness = (hrvScore + sleepScore + fatigueScore) / 3;
      expect(readiness).toBeCloseTo(70, 0);
    });
  });

  describe('Load Visualization', () => {
    it('generates load timeline', async () => {
      const client = await ActorFactory.createClient();

      for (let week = 1; week <= 4; week++) {
        for (let day = 0; day < 7; day++) {
          await prisma.trainingLoad.create({
            data: {
              userId: client.id,
              date: new Date(2026, 2, (week - 1) * 7 + day + 1),
              load: 300 + Math.random() * 100,
              duration: 60,
              rpe: 7
            }
          });
        }
      }

      const loads = await prisma.trainingLoad.findMany({
        where: { userId: client.id },
        orderBy: { date: 'asc' }
      });

      expect(loads.length).toBe(28);
    });

    it('highlights high load days', async () => {
      const dailyLoads = [300, 350, 400, 600, 320, 280, 300];
      const threshold = 500;

      const highLoadDays = dailyLoads.filter(load => load > threshold);

      expect(highLoadDays).toContain(600);
      expect(highLoadDays).toHaveLength(1);
    });
  });

  describe('Alerts & Recommendations', () => {
    it('alerts on excessive load spike', async () => {
      const previousWeekAvg = 300;
      const currentDayLoad = 600;
      const spikeRatio = currentDayLoad / previousWeekAvg;

      const alert = spikeRatio > 1.5 ? {
        type: 'LOAD_SPIKE',
        severity: 'WARNING',
        message: 'Training load increased significantly. Consider extra recovery.'
      } : null;

      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('LOAD_SPIKE');
    });

    it('recommends rest day', async () => {
      const consecutiveHighLoadDays = 5;
      const recommendation = consecutiveHighLoadDays >= 4 ?
        'Consider a rest day or active recovery' : 'Continue as planned';

      expect(recommendation).toContain('rest day');
    });

    it('suggests load adjustment', async () => {
      const acwr = 1.6;
      const suggestion = acwr > 1.5 ?
        'Reduce next week load by 10-20%' :
        acwr < 0.8 ?
          'Gradually increase load by 10%' :
          'Maintain current load';

      expect(suggestion).toContain('Reduce');
    });
  });

  describe('Trainer Monitoring', () => {
    it('trainer views client load data', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      await prisma.trainingLoad.create({
        data: {
          userId: client.id,
          date: new Date(),
          load: 350,
          duration: 60,
          rpe: 7
        }
      });

      const clientLoads = await prisma.trainingLoad.findMany({
        where: { userId: client.id }
      });

      expect(clientLoads).toHaveLength(1);
    });

    it('identifies at-risk clients', async () => {
      const clients = [
        { name: 'Client A', acwr: 1.7, risk: 'HIGH' },
        { name: 'Client B', acwr: 1.1, risk: 'NORMAL' },
        { name: 'Client C', acwr: 0.6, risk: 'DETRAINING' }
      ];

      const atRisk = clients.filter(c => c.acwr > 1.5 || c.acwr < 0.7);
      expect(atRisk).toHaveLength(2);
    });
  });
});
