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

  describe('startWorkout', () => {
    it('should return workout session with id and status', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const session = await actor.startWorkout('workout-123');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.status).toBe('in_progress');
    });

    it('should track workout in state', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.startWorkout('workout-123');

      expect(actor.workouts.length).toBe(1);
      expect(actor.workouts[0].status).toBe('in_progress');
    });
  });

  describe('completeWorkout', () => {
    it('should update workout status to completed', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const session = await actor.startWorkout('workout-123');
      await actor.completeWorkout(session.id);

      expect(actor.workouts[0].status).toBe('completed');
    });

    it('should store feedback when provided', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const session = await actor.startWorkout('workout-123');
      const feedback = 'Great workout, felt strong!';
      await actor.completeWorkout(session.id, feedback);

      expect(actor.workouts[0].feedback).toBe(feedback);
    });

    it('should work without feedback', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const session = await actor.startWorkout('workout-123');
      await actor.completeWorkout(session.id);

      expect(actor.workouts[0].status).toBe('completed');
      expect(actor.workouts[0].feedback).toBeUndefined();
    });
  });

  describe('logRecoveryMetrics', () => {
    it('should auto-add date to metrics', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const metrics = await actor.logRecoveryMetrics({
        sleep: 8,
        soreness: 3,
        energy: 8
      });

      expect(metrics.date).toBeDefined();
      expect(metrics.date instanceof Date).toBe(true);
    });

    it('should store metrics in state', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.logRecoveryMetrics({
        sleep: 7,
        soreness: 4,
        energy: 7
      });

      expect(actor.recoveryLogs.length).toBe(1);
      expect(actor.recoveryLogs[0].sleep).toBe(7);
      expect(actor.recoveryLogs[0].soreness).toBe(4);
      expect(actor.recoveryLogs[0].energy).toBe(7);
    });
  });

  describe('recordMeasurements', () => {
    it('should store measurements in state', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const measurement = {
        date: new Date(),
        weight: 180,
        bodyFat: 15,
        chest: 42,
        waist: 32,
        hips: 38,
        arms: 15,
        thighs: 24
      };

      const result = await actor.recordMeasurements(measurement);

      expect(result).toEqual(measurement);
      expect(actor.measurements.length).toBe(1);
      expect(actor.measurements[0].weight).toBe(180);
    });
  });

  describe('sendMessage', () => {
    it('should store message with correct recipient', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.sendMessage('trainer-456', 'Hello trainer!');

      expect(actor.messages.length).toBe(1);
      expect(actor.messages[0].to).toBe('trainer-456');
      expect(actor.messages[0].content).toBe('Hello trainer!');
      expect(actor.messages[0].date).toBeDefined();
    });

    it('should store multiple messages', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.sendMessage('trainer-456', 'Message 1');
      await actor.sendMessage('trainer-456', 'Message 2');

      expect(actor.messages.length).toBe(2);
    });
  });

  describe('readMessages', () => {
    it('should return stored messages', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      actor.receivedMessages.push({
        from: 'trainer-456',
        content: 'Great job today!',
        date: new Date()
      });

      const messages = await actor.readMessages();

      expect(messages.length).toBe(1);
      expect(messages[0].from).toBe('trainer-456');
      expect(messages[0].content).toBe('Great job today!');
    });

    it('should return empty array when no messages', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const messages = await actor.readMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('uploadProgressPhoto', () => {
    it('should track uploaded photos', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.uploadProgressPhoto('front');

      expect(actor.photos.length).toBe(1);
      expect(actor.photos[0].type).toBe('front');
      expect(actor.photos[0].uploadedAt).toBeDefined();
    });

    it('should track multiple photo types', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.uploadProgressPhoto('front');
      await actor.uploadProgressPhoto('back');
      await actor.uploadProgressPhoto('side');

      expect(actor.photos.length).toBe(3);
      expect(actor.photos.map(p => p.type)).toContain('front');
      expect(actor.photos.map(p => p.type)).toContain('back');
      expect(actor.photos.map(p => p.type)).toContain('side');
    });
  });

  describe('getStats', () => {
    it('should track total sets', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.logSet({
        exerciseId: 'ex-1',
        workoutSessionId: 'ws-1',
        setNumber: 1,
        weight: 100,
        reps: 10,
        rpe: 8
      });

      const stats = actor.getStats();
      expect(stats.totalSets).toBe(1);
    });

    it('should track total recovery logs', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.logRecoveryMetrics({ sleep: 8, soreness: 3, energy: 8 });

      const stats = actor.getStats();
      expect(stats.totalRecoveryLogs).toBe(1);
    });

    it('should track total measurements', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.recordMeasurements({ date: new Date(), weight: 180 });

      const stats = actor.getStats();
      expect(stats.totalMeasurements).toBe(1);
    });

    it('should track total messages', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.sendMessage('trainer-456', 'Hello!');

      const stats = actor.getStats();
      expect(stats.totalMessages).toBe(1);
    });

    it('should track workout count', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      await actor.startWorkout('workout-1');
      await actor.startWorkout('workout-2');

      const stats = actor.getStats();
      expect(stats.totalWorkouts).toBe(2);
    });

    it('should track completed workout count', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      const session1 = await actor.startWorkout('workout-1');
      await actor.startWorkout('workout-2');
      await actor.completeWorkout(session1.id);

      const stats = actor.getStats();
      expect(stats.totalWorkouts).toBe(2);
      expect(stats.completedWorkouts).toBe(1);
    });

    it('should return all stats correctly', async () => {
      const actor = new DailyClientActor({
        id: 'client-123',
        email: 'client@test.com',
        role: 'client',
        fullName: 'Test Client'
      });

      // Add data across all categories
      await actor.logSet({
        exerciseId: 'ex-1',
        workoutSessionId: 'ws-1',
        setNumber: 1,
        weight: 100,
        reps: 10,
        rpe: 8
      });
      await actor.logRecoveryMetrics({ sleep: 8, soreness: 3, energy: 8 });
      await actor.recordMeasurements({ date: new Date(), weight: 180 });
      await actor.sendMessage('trainer-456', 'Hello!');
      const session = await actor.startWorkout('workout-1');
      await actor.completeWorkout(session.id);

      const stats = actor.getStats();

      expect(stats.totalSets).toBe(1);
      expect(stats.totalRecoveryLogs).toBe(1);
      expect(stats.totalMeasurements).toBe(1);
      expect(stats.totalMessages).toBe(1);
      expect(stats.totalWorkouts).toBe(1);
      expect(stats.completedWorkouts).toBe(1);
    });
  });
});
