// __tests__/forge/phase2/stream-f/actors/__tests__/DailyTrainerActor.test.ts
import { DailyTrainerActor } from '../DailyTrainerActor';

describe('DailyTrainerActor', () => {
  it('should create actor with program management capabilities', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    expect(actor).toBeDefined();
    expect(typeof actor.createProgram).toBe('function');
    expect(typeof actor.reviewWorkout).toBe('function');
    expect(typeof actor.sendFeedback).toBe('function');
  });

  it('should create a program', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const program = await actor.createProgram({
      name: '14-Day Strength Program',
      duration: 14,
      workouts: []
    });

    expect(program).toBeDefined();
    expect(program.name).toBe('14-Day Strength Program');
    expect(program.id).toBeDefined();
  });

  it('should assign program to client', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    await actor.assignProgram('client-123', 'prog-456');
    const stats = actor.getStats();
    expect(stats.totalAssignments).toBe(1);
  });

  it('should review workout', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const result = await actor.reviewWorkout('ws-123', 'Great form!');
    expect(result.reviewed).toBe(true);
    expect(actor.getStats().totalReviews).toBe(1);
  });

  it('should send feedback to client', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    await actor.sendFeedback('client-123', 'feedback', 'Keep it up!');
    expect(actor.getStats().totalMessages).toBe(1);
  });

  it('should send check-in message', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    await actor.sendCheckIn('client-123', true);
    expect(actor.getStats().totalMessages).toBe(1);
  });

  it('should adjust program', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const program = await actor.createProgram({
      name: 'Test Program',
      duration: 14,
      workouts: []
    });

    await actor.adjustProgram(program.id, { volume: 'increased' });
    expect(actor.programs[0].volume).toBe('increased');
  });

  it('should review analytics', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const analytics = await actor.reviewAnalytics('client-123');
    expect(analytics.workoutFrequency).toBeDefined();
    expect(analytics.totalVolume).toBeDefined();
    expect(analytics.personalRecords).toBeDefined();
  });
});
