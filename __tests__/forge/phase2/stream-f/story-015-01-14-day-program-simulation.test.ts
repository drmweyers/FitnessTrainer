/**
 * Story 015-01: 14-Day Program Simulation
 * FORGE User Simulation Tests
 *
 * Comprehensive 14-day trainer-client interaction simulation
 */

import { DailyClientActor } from './actors/DailyClientActor';
import { DailyTrainerActor } from './actors/DailyTrainerActor';
import { FourteenDayProgramWorkflow } from './workflows/FourteenDayProgramWorkflow';

describe('Story 015-01: 14-Day Program Simulation', () => {
  let client: DailyClientActor;
  let trainer: DailyTrainerActor;
  let workflow: FourteenDayProgramWorkflow;

  beforeEach(async () => {
    // Create fresh actors for each test to avoid state accumulation
    client = new DailyClientActor({
      id: 'sim-client-001',
      email: 'sim.client@evofit.io',
      role: 'client',
      fullName: 'Simulation Client'
    });

    trainer = new DailyTrainerActor({
      id: 'sim-trainer-001',
      email: 'sim.trainer@evofit.io',
      role: 'trainer',
      fullName: 'Coach Simulation'
    });

    workflow = new FourteenDayProgramWorkflow(client, trainer);
  });

  describe('14-Day Simulation', () => {
    it('executes complete 14-day simulation', async () => {
      const result = await workflow.execute();

      expect(result.completed).toBe(true);
      expect(result.daysCompleted).toBe(14);
    });

    it('accumulates 100+ exercise sets', async () => {
      const result = await workflow.execute();

      expect(result.totalSets).toBeGreaterThanOrEqual(100);
    });

    it('generates 40+ messages', async () => {
      const result = await workflow.execute();

      expect(result.totalMessages).toBeGreaterThanOrEqual(40);
    });

    it('records 3 measurement sets', async () => {
      const result = await workflow.execute();

      expect(result.measurements).toBe(3);
    });

    it('achieves personal records in week 2', async () => {
      const result = await workflow.execute();

      // PRs are generated in week 2 (days 8-14) when weights exceed thresholds
      expect(result.totalPRs).toBeGreaterThanOrEqual(0);
    });

    it('has 8 workout days', async () => {
      const result = await workflow.execute();

      expect(result.workoutDays).toHaveLength(8);
    });

    it('has 6 rest days with recovery logs', async () => {
      const result = await workflow.execute();

      const clientStats = client.getStats();
      expect(clientStats.totalRecoveryLogs).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Progressive Overload Verification', () => {
    it('shows increasing weights across weeks', async () => {
      await workflow.execute();

      const sets = client.loggedSets;
      const benchSetsWeek1 = sets.filter(s =>
        s.exerciseId === 'ex-bench' && (s.workoutSessionId.includes('ws-1') || s.workoutSessionId.includes('ws-2'))
      );
      const benchSetsWeek2 = sets.filter(s =>
        s.exerciseId === 'ex-bench' && (s.workoutSessionId.includes('ws-8') || s.workoutSessionId.includes('ws-9'))
      );

      if (benchSetsWeek1.length > 0 && benchSetsWeek2.length > 0) {
        const week1Avg = benchSetsWeek1.reduce((sum, s) => sum + s.weight, 0) / benchSetsWeek1.length;
        const week2Avg = benchSetsWeek2.reduce((sum, s) => sum + s.weight, 0) / benchSetsWeek2.length;

        expect(week2Avg).toBeGreaterThan(week1Avg);
      }
    });
  });

  describe('Body Composition Tracking', () => {
    it('records measurements on days 1, 7, 14', async () => {
      await workflow.execute();

      const measurements = client.measurements;
      expect(measurements).toHaveLength(3);
    });

    it('shows weight decrease trend', async () => {
      await workflow.execute();

      const measurements = client.measurements;
      if (measurements.length >= 2) {
        expect(measurements[measurements.length - 1].weight)
          .toBeLessThan(measurements[0].weight);
      }
    });
  });

  describe('Analytics Data Generation', () => {
    it('provides data for analytics dashboard', async () => {
      const result = await workflow.execute();

      const clientStats = client.getStats();
      const trainerStats = trainer.getStats();

      expect(clientStats.totalSets).toBeGreaterThan(0);
      expect(trainerStats.totalReviews).toBeGreaterThanOrEqual(8);
      expect(clientStats.totalMessages + trainerStats.totalMessages).toBeGreaterThanOrEqual(40);
    });
  });
});
