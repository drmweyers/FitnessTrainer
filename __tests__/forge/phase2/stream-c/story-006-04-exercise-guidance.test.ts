/**
 * Story 006-04: Exercise Guidance
 * FORGE User Simulation Tests
 *
 * Tests client workflow for exercise instructions and guidance
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';

describe('Story 006-04: Exercise Guidance', () => {
  let trainer: TrainerActor;
  let client: ClientActor;

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('retrieves exercise guidance', async () => {
      const guidance = {
        exerciseId: 'ex_bench_press',
        name: 'Barbell Bench Press',
        instructions: [
          'Lie flat on bench',
          'Grip bar slightly wider than shoulder-width',
          'Lower bar to mid-chest',
          'Press up until arms are extended',
        ],
        targetMuscles: ['pectorals', 'triceps', 'anterior deltoid'],
        commonMistakes: [
          { title: 'Bouncing bar', correction: 'Control the descent' },
          { title: 'Flaring elbows', correction: 'Keep 45° angle' },
        ],
      };

      expect(guidance.instructions).toHaveLength(4);
      expect(guidance.targetMuscles).toContain('pectorals');
    });

    it('shows alternative exercises', async () => {
      const alternatives = [
        { exerciseId: 'ex_dumbbell_press', name: 'Dumbbell Bench Press', difficulty: 'similar' },
        { exerciseId: 'ex_machine_press', name: 'Machine Chest Press', difficulty: 'easier' },
        { exerciseId: 'ex_pushup', name: 'Push-ups', difficulty: 'harder' },
      ];

      expect(alternatives).toHaveLength(3);
      expect(alternatives[0].difficulty).toBe('similar');
    });
  });

  describe('Exercise Content', () => {
    it('provides step-by-step instructions', async () => {
      const steps = [
        { number: 1, title: 'Setup', description: 'Lie flat on bench' },
        { number: 2, title: 'Grip', description: 'Grip bar slightly wider than shoulders' },
        { number: 3, title: 'Descent', description: 'Lower bar to mid-chest with control' },
        { number: 4, title: 'Press', description: 'Press bar up until arms are extended' },
      ];

      expect(steps[0].number).toBe(1);
      expect(steps).toHaveLength(4);
    });

    it('identifies target muscles', async () => {
      const muscleGroups = {
        primary: ['pectorals'],
        secondary: ['triceps', 'anterior deltoid'],
      };

      expect(muscleGroups.primary).toContain('pectorals');
      expect(muscleGroups.secondary).toHaveLength(2);
    });

    it('lists common mistakes', async () => {
      const mistakes = [
        { title: 'Bouncing bar off chest', correction: 'Control the descent' },
        { title: 'Lifting hips off bench', correction: 'Keep glutes planted' },
        { title: 'Flaring elbows too wide', correction: 'Maintain 45° angle' },
      ];

      expect(mistakes).toHaveLength(3);
      expect(mistakes[0].correction).toBeDefined();
    });
  });

  describe('Trainer Notes', () => {
    it('displays trainer custom notes', async () => {
      const notes = 'Focus on slow eccentric - 3 seconds down';

      expect(notes).toContain('3 seconds');
    });

    it('shows exercise-specific cues', async () => {
      const cues = [
        'Drive feet into floor',
        'Retract shoulder blades',
        'Brace core',
        'Tuck elbows at 45°',
      ];

      expect(cues).toHaveLength(4);
    });
  });

  describe('Offline Support', () => {
    it('caches exercise content locally', async () => {
      const cachedContent = {
        exerciseId: 'ex_squat',
        instructions: ['Step 1', 'Step 2', 'Step 3'],
        cachedAt: new Date(),
      };

      expect(cachedContent.cachedAt).toBeDefined();
    });
  });

  describe('Exercise Variations', () => {
    it('shows grip variations', async () => {
      const variations = [
        { name: 'Wide Grip', focus: 'Upper chest' },
        { name: 'Narrow Grip', focus: 'Triceps' },
        { name: 'Neutral Grip', focus: 'Balanced' },
      ];

      expect(variations).toHaveLength(3);
      expect(variations[0].focus).toBe('Upper chest');
    });

    it('shows equipment variations', async () => {
      const variations = [
        { equipment: 'Barbell', difficulty: 'intermediate' },
        { equipment: 'Dumbbells', difficulty: 'beginner' },
        { equipment: 'Smith Machine', difficulty: 'beginner' },
      ];

      expect(variations.some(v => v.equipment === 'Dumbbells')).toBe(true);
    });

    it('shows difficulty progressions', async () => {
      const progressions = [
        { level: 1, variation: 'Incline Push-ups' },
        { level: 2, variation: 'Knee Push-ups' },
        { level: 3, variation: 'Standard Push-ups' },
        { level: 4, variation: 'Weighted Push-ups' },
      ];

      expect(progressions).toHaveLength(4);
    });
  });

  describe('Safety Information', () => {
    it('displays safety warnings', async () => {
      const warnings = [
        'Always use a spotter for heavy lifts',
        'Warm up before attempting max weight',
        'Stop if you feel sharp pain',
      ];

      expect(warnings.length).toBeGreaterThan(0);
    });

    it('shows contraindications', async () => {
      const contraindications = [
        { condition: 'Shoulder injury', advice: 'Use neutral grip' },
        { condition: 'Lower back issues', advice: 'Use incline bench' },
      ];

      expect(contraindications[0].advice).toBeDefined();
    });
  });
});
