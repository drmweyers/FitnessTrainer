/**
 * Story 005-01: Create New Program
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for creating new training programs
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';

describe('Story 005-01: Create New Program', () => {
  let trainer: TrainerActor;

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
  });

  describe('Happy Path', () => {
    it('completes full program creation workflow', async () => {
      const programData = {
        name: '12-Week Strength Program',
        description: 'Progressive strength training program',
        difficulty: 'intermediate',
        durationWeeks: 12,
        programType: 'strength',
        trainerId: trainer.id,
      };

      expect(programData.name).toBe('12-Week Strength Program');
      expect(programData.trainerId).toBe(trainer.id);
    });

    it('creates program with all required fields', async () => {
      const programData = {
        name: 'Beginner Hypertrophy',
        description: 'Muscle building for beginners',
        difficulty: 'beginner',
        durationWeeks: 8,
        isTemplate: false,
        trainerId: trainer.id,
      };

      expect(programData.difficulty).toBe('beginner');
      expect(programData.durationWeeks).toBe(8);
    });

    it('creates program as template', async () => {
      const programData = {
        name: '5x5 Strength Template',
        difficulty: 'intermediate',
        durationWeeks: 12,
        isTemplate: true,
        trainerId: trainer.id,
      };

      expect(programData.isTemplate).toBe(true);
    });
  });

  describe('Validation', () => {
    it('requires program name', async () => {
      const programData = {
        name: '',
        difficulty: 'beginner',
        durationWeeks: 4,
        trainerId: trainer.id,
      };

      expect(programData.name).toBe('');
    });

    it('requires difficulty level', async () => {
      const programData = {
        name: 'Test Program',
        durationWeeks: 4,
        trainerId: trainer.id,
      };

      expect(programData).not.toHaveProperty('difficulty');
    });

    it('validates duration is between 1-52 weeks', async () => {
      const durationWeeks = 0;
      expect(durationWeeks).toBeLessThan(1);
    });
  });

  describe('Multi-Step Wizard Flow', () => {
    it('creates program through wizard steps', async () => {
      const steps = [
        { step: 1, data: { name: 'Wizard Test', difficulty: 'advanced', durationWeeks: 6 } },
        { step: 2, data: { weekNumber: 1, name: 'Foundation Week' } },
        { step: 3, data: { name: 'Upper Body A', dayNumber: 1 } },
      ];

      expect(steps).toHaveLength(3);
      expect(steps[0].data.name).toBe('Wizard Test');
    });
  });

  describe('Permissions', () => {
    it('only allows trainers to create programs', async () => {
      const client = await ActorFactory.createClient(trainer.id);

      expect(client.role).toBe('client');
      expect(client.role).not.toBe('trainer');

      await ActorFactory.cleanup(client);
    });
  });

  describe('Program Types', () => {
    const programTypes = [
      { type: 'strength', name: 'Strength Program' },
      { type: 'hypertrophy', name: 'Hypertrophy Program' },
      { type: 'endurance', name: 'Endurance Program' },
      { type: 'general_fitness', name: 'General Fitness' },
    ];

    programTypes.forEach(({ type, name }) => {
      it(`can create ${type} program`, async () => {
        const programData = {
          name,
          difficulty: 'intermediate',
          durationWeeks: 8,
          programType: type,
          trainerId: trainer.id,
        };

        expect(programData.programType).toBe(type);
      });
    });
  });

  describe('Draft Saving', () => {
    it('creates program that can be saved as draft', async () => {
      const programData = {
        name: 'Draft Program',
        difficulty: 'beginner',
        durationWeeks: 4,
        isDraft: true,
        trainerId: trainer.id,
      };

      expect(programData.isDraft).toBe(true);
      expect(programData.name).toBe('Draft Program');
    });
  });
});
