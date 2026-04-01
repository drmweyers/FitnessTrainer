import { DailyClientActor } from '../DailyClientActor';

describe('DailyClientActor', () => {
  it('should create actor with daily action capabilities', async () => {
    const actor = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    expect(actor).toBeDefined();
    expect(typeof actor.logSet).toBe('function');
    expect(typeof actor.logRecoveryMetrics).toBe('function');
    expect(typeof actor.recordMeasurements).toBe('function');
  });

  it('should log a workout set with all data', async () => {
    const actor = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const set = await actor.logSet({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-123',
      setNumber: 1,
      weight: 135,
      reps: 10,
      rpe: 8
    });

    expect(set).toBeDefined();
    expect(set.weight).toBe(135);
    expect(set.reps).toBe(10);
    expect(set.rpe).toBe(8);
  });
});
