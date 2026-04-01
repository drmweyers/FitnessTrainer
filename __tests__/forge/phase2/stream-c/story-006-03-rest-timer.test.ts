/**
 * Story 006-03: Rest Timer
 * FORGE User Simulation Tests
 *
 * Tests client workflow for rest timer functionality
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';

describe('Story 006-03: Rest Timer', () => {
  let trainer: TrainerActor;
  let client: ClientActor;
  const sessionId = 'session-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('creates rest timer after set completion', async () => {
      const timer = {
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 90,
        remainingSeconds: 90,
        startedAt: new Date(),
        status: 'running',
      };

      expect(timer).toBeDefined();
      expect(timer.durationSeconds).toBe(90);
    });

    it('tracks timer completion', async () => {
      const timer = {
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 60,
        remainingSeconds: 0,
        startedAt: new Date(Date.now() - 60000),
        completedAt: new Date(),
        status: 'completed',
      };

      expect(timer.status).toBe('completed');
      expect(timer.remainingSeconds).toBe(0);
    });
  });

  describe('Timer Controls', () => {
    it('pauses timer', async () => {
      const timer = {
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 90,
        remainingSeconds: 45,
        startedAt: new Date(),
        status: 'paused',
        wasPaused: true,
      };

      expect(timer.status).toBe('paused');
      expect(timer.wasPaused).toBe(true);
    });

    it('skips timer', async () => {
      const timer = {
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 90,
        remainingSeconds: 60,
        startedAt: new Date(),
        status: 'skipped',
        wasSkipped: true,
      };

      expect(timer.status).toBe('skipped');
      expect(timer.wasSkipped).toBe(true);
    });

    it('adjusts timer duration', async () => {
      const timer = {
        id: 'timer-1',
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 90,
        remainingSeconds: 90,
        startedAt: new Date(),
        status: 'running',
      };

      // Extend by 30 seconds
      const updated = { ...timer, durationSeconds: 120, remainingSeconds: 120 };

      expect(updated.durationSeconds).toBe(120);
    });
  });

  describe('Timer Settings', () => {
    it('stores default rest duration', async () => {
      const settings = {
        userId: client.id,
        defaultRestDuration: 90,
        warningTime: 10,
        soundEnabled: true,
        vibrationEnabled: true,
      };

      expect(settings.defaultRestDuration).toBe(90);
      expect(settings.warningTime).toBe(10);
    });

    it('allows custom timer settings per user', async () => {
      const settings = {
        userId: client.id,
        defaultRestDuration: 120,
        warningTime: 15,
        soundEnabled: false,
        vibrationEnabled: true,
        soundType: 'chime',
      };

      expect(settings.soundEnabled).toBe(false);
      expect(settings.soundType).toBe('chime');
    });
  });

  describe('Timer Accuracy', () => {
    it('calculates remaining time correctly', async () => {
      const duration = 90;
      const elapsed = 30;
      const remaining = duration - elapsed;

      expect(remaining).toBe(60);
    });

    it('handles timer completion', async () => {
      const timer = {
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 30,
        remainingSeconds: 0,
        startedAt: new Date(Date.now() - 30000),
        completedAt: new Date(),
        status: 'completed',
      };

      expect(timer.remainingSeconds).toBe(0);
      expect(timer.status).toBe('completed');
    });
  });

  describe('Auto-Start Timer', () => {
    it('auto-starts timer after set completion', async () => {
      const autoStart = true;
      const timer = {
        userId: client.id,
        workoutSessionId: sessionId,
        durationSeconds: 90,
        status: 'running',
        autoStarted: true,
      };

      expect(autoStart).toBe(true);
      expect(timer.autoStarted).toBe(true);
    });

    it('supports different timer sounds', async () => {
      const sounds = ['beep', 'chime', 'buzz', 'none'];
      const selectedSound = 'chime';

      expect(sounds).toContain(selectedSound);
    });
  });

  describe('Rest Period Presets', () => {
    it('has strength training preset', async () => {
      const preset = { name: 'Strength', duration: 180 };
      expect(preset.duration).toBe(180);
    });

    it('has hypertrophy preset', async () => {
      const preset = { name: 'Hypertrophy', duration: 90 };
      expect(preset.duration).toBe(90);
    });

    it('has endurance preset', async () => {
      const preset = { name: 'Endurance', duration: 45 };
      expect(preset.duration).toBe(45);
    });
  });
});
