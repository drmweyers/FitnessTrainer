// __tests__/forge/phase2/stream-f/actors/__tests__/DailyTrainerActor.test.ts
import { DailyTrainerActor, TrainerActorConfig } from '../DailyTrainerActor';

describe('DailyTrainerActor', () => {
  let actor: DailyTrainerActor;
  const defaultConfig: TrainerActorConfig = {
    id: 'trainer-123',
    email: 'trainer@test.com',
    role: 'trainer',
    fullName: 'Test Trainer'
  };

  beforeEach(() => {
    actor = new DailyTrainerActor(defaultConfig);
  });

  describe('constructor', () => {
    it('should create actor with program management capabilities', () => {
      expect(actor).toBeDefined();
      expect(typeof actor.createProgram).toBe('function');
      expect(typeof actor.reviewWorkout).toBe('function');
      expect(typeof actor.sendFeedback).toBe('function');
      expect(typeof actor.respondToClient).toBe('function');
    });

    it('should initialize with correct properties', () => {
      expect(actor.id).toBe('trainer-123');
      expect(actor.email).toBe('trainer@test.com');
      expect(actor.role).toBe('trainer');
      expect(actor.fullName).toBe('Test Trainer');
    });
  });

  describe('createProgram', () => {
    it('should create a program', async () => {
      const program = await actor.createProgram({
        name: '14-Day Strength Program',
        duration: 14,
        workouts: []
      });

      expect(program).toBeDefined();
      expect(program.name).toBe('14-Day Strength Program');
      expect(program.id).toBeDefined();
      expect(program.duration).toBe(14);
    });

    it('should throw error for empty name', async () => {
      await expect(actor.createProgram({
        name: '',
        duration: 14,
        workouts: []
      })).rejects.toThrow('Program name must be a non-empty string');
    });

    it('should throw error for whitespace-only name', async () => {
      await expect(actor.createProgram({
        name: '   ',
        duration: 14,
        workouts: []
      })).rejects.toThrow('Program name must be a non-empty string');
    });

    it('should throw error for non-string name', async () => {
      await expect(actor.createProgram({
        name: 123 as unknown as string,
        duration: 14,
        workouts: []
      })).rejects.toThrow('Program name must be a non-empty string');
    });

    it('should throw error for zero duration', async () => {
      await expect(actor.createProgram({
        name: 'Test Program',
        duration: 0,
        workouts: []
      })).rejects.toThrow('Program duration must be a positive integer');
    });

    it('should throw error for negative duration', async () => {
      await expect(actor.createProgram({
        name: 'Test Program',
        duration: -5,
        workouts: []
      })).rejects.toThrow('Program duration must be a positive integer');
    });

    it('should throw error for non-integer duration', async () => {
      await expect(actor.createProgram({
        name: 'Test Program',
        duration: 14.5,
        workouts: []
      })).rejects.toThrow('Program duration must be a positive integer');
    });

    it('should throw error for non-number duration', async () => {
      await expect(actor.createProgram({
        name: 'Test Program',
        duration: '14' as unknown as number,
        workouts: []
      })).rejects.toThrow('Program duration must be a positive integer');
    });

    it('should trim whitespace from program name', async () => {
      const program = await actor.createProgram({
        name: '  Test Program  ',
        duration: 14,
        workouts: []
      });
      expect(program.name).toBe('Test Program');
    });
  });

  describe('assignProgram', () => {
    it('should assign program to client', async () => {
      await actor.assignProgram('client-123', 'prog-456');
      const stats = actor.getStats();
      expect(stats.totalAssignments).toBe(1);
    });

    it('should throw error for empty clientId', async () => {
      await expect(actor.assignProgram('', 'prog-456')).rejects.toThrow('Client ID must be a non-empty string');
    });

    it('should throw error for whitespace-only clientId', async () => {
      await expect(actor.assignProgram('   ', 'prog-456')).rejects.toThrow('Client ID must be a non-empty string');
    });

    it('should throw error for empty programId', async () => {
      await expect(actor.assignProgram('client-123', '')).rejects.toThrow('Program ID must be a non-empty string');
    });

    it('should throw error for whitespace-only programId', async () => {
      await expect(actor.assignProgram('client-123', '   ')).rejects.toThrow('Program ID must be a non-empty string');
    });

    it('should trim whitespace from clientId and programId', async () => {
      await actor.assignProgram('  client-123  ', '  prog-456  ');
      expect(actor.assignments[0].clientId).toBe('client-123');
      expect(actor.assignments[0].programId).toBe('prog-456');
    });
  });

  describe('reviewWorkout', () => {
    it('should review workout', async () => {
      const result = await actor.reviewWorkout('ws-123', 'Great form!');
      expect(result.reviewed).toBe(true);
      expect(actor.getStats().totalReviews).toBe(1);
    });

    it('should review workout with default feedback', async () => {
      const result = await actor.reviewWorkout('ws-123');
      expect(result.reviewed).toBe(true);
      expect(actor.reviews[0].feedback).toBe('Reviewed');
    });
  });

  describe('sendFeedback', () => {
    it('should send feedback to client', async () => {
      await actor.sendFeedback('client-123', 'feedback', 'Keep it up!');
      expect(actor.getStats().totalMessages).toBe(1);
      expect(actor.messages[0].type).toBe('feedback');
    });
  });

  describe('respondToClient', () => {
    it('should respond to client with type response', async () => {
      await actor.respondToClient('client-123', 'Great progress this week!');
      expect(actor.getStats().totalMessages).toBe(1);
      expect(actor.messages[0].to).toBe('client-123');
      expect(actor.messages[0].content).toBe('Great progress this week!');
      expect(actor.messages[0].type).toBe('response');
    });

    it('should throw error for empty clientId', async () => {
      await expect(actor.respondToClient('', 'message')).rejects.toThrow('Client ID must be a non-empty string');
    });

    it('should throw error for empty message', async () => {
      await expect(actor.respondToClient('client-123', '')).rejects.toThrow('Message must be a non-empty string');
    });

    it('should throw error for whitespace-only message', async () => {
      await expect(actor.respondToClient('client-123', '   ')).rejects.toThrow('Message must be a non-empty string');
    });

    it('should trim whitespace from clientId and message', async () => {
      await actor.respondToClient('  client-123  ', '  Great job!  ');
      expect(actor.messages[0].to).toBe('client-123');
      expect(actor.messages[0].content).toBe('Great job!');
    });
  });

  describe('sendCheckIn', () => {
    it('should send workout day check-in message', async () => {
      await actor.sendCheckIn('client-123', true);
      expect(actor.getStats().totalMessages).toBe(1);
      expect(actor.messages[0].content).toContain("today's workout");
      expect(actor.messages[0].type).toBe('checkin');
    });

    it('should send recovery day check-in message', async () => {
      await actor.sendCheckIn('client-123', false);
      expect(actor.getStats().totalMessages).toBe(1);
      expect(actor.messages[0].content).toContain('recovery');
      expect(actor.messages[0].type).toBe('checkin');
    });
  });

  describe('adjustProgram', () => {
    it('should adjust program', async () => {
      const program = await actor.createProgram({
        name: 'Test Program',
        duration: 14,
        workouts: []
      });

      await actor.adjustProgram(program.id, { name: 'Updated Program' });
      expect(actor.programs[0].name).toBe('Updated Program');
    });

    it('should throw error when program not found', async () => {
      await expect(actor.adjustProgram('non-existent-id', { name: 'Updated' }))
        .rejects.toThrow('Program with ID "non-existent-id" not found');
    });
  });

  describe('reviewAnalytics', () => {
    it('should review analytics', async () => {
      const analytics = await actor.reviewAnalytics('client-123');
      expect(analytics.workoutFrequency).toBeDefined();
      expect(analytics.totalVolume).toBeDefined();
      expect(analytics.personalRecords).toBeDefined();
    });

    it('should return expected analytics values', async () => {
      const analytics = await actor.reviewAnalytics('client-123');
      expect(analytics.workoutFrequency).toBe(4);
      expect(analytics.totalVolume).toBe(15000);
      expect(analytics.personalRecords).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return correct stats object', () => {
      const stats = actor.getStats();
      expect(stats).toHaveProperty('totalPrograms');
      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('totalReviews');
      expect(stats).toHaveProperty('totalAssignments');
    });

    it('should track multiple operations correctly', async () => {
      await actor.createProgram({ name: 'Program 1', duration: 7, workouts: [] });
      await actor.createProgram({ name: 'Program 2', duration: 14, workouts: [] });
      await actor.assignProgram('client-1', 'prog-1');
      await actor.assignProgram('client-2', 'prog-2');
      await actor.reviewWorkout('ws-1');
      await actor.sendCheckIn('client-1', true);
      await actor.respondToClient('client-1', 'Good job!');

      const stats = actor.getStats();
      expect(stats.totalPrograms).toBe(2);
      expect(stats.totalAssignments).toBe(2);
      expect(stats.totalReviews).toBe(1);
      expect(stats.totalMessages).toBe(2);
    });
  });
});
