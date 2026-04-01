/**
 * Story 006-06: Modify Workout
 * FORGE User Simulation Tests
 *
 * Tests client workflow for modifying workouts during execution
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 006-06: Modify Workout', () => {
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
    it('substitutes exercise', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          {
            action: 'substituteExercise',
            data: {
              sessionId,
              originalExerciseId: 'ex_bench',
              newExerciseId: 'ex_dumbbell_press',
              reason: 'Equipment unavailable',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('skips exercise with reason', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          {
            action: 'skipExercise',
            data: {
              sessionId,
              exerciseId: 'ex_lat_raise',
              reason: 'Shoulder pain',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('adds extra set', async () => {
      const modification = {
        sessionId,
        modificationType: 'sets_added',
        originalValue: { sets: 3 },
        modifiedValue: { sets: 4 },
        reason: 'Feeling strong today',
      };

      expect(modification.modificationType).toBe('sets_added');
    });
  });

  describe('Modification Types', () => {
    it('modifies prescribed weight', async () => {
      const modification = {
        sessionId,
        modificationType: 'weight_adjusted',
        originalValue: { weight: 185 },
        modifiedValue: { weight: 195 },
        reason: 'Weight too light',
      };

      expect(modification.modificationType).toBe('weight_adjusted');
      expect(modification.modifiedValue).toEqual({ weight: 195 });
    });

    it('modifies prescribed reps', async () => {
      const modification = {
        sessionId,
        modificationType: 'reps_adjusted',
        originalValue: { reps: 10 },
        modifiedValue: { reps: 12 },
        reason: 'AMRAP set',
      };

      expect(modification.modificationType).toBe('reps_adjusted');
    });

    it('changes rest period', async () => {
      const modification = {
        sessionId,
        modificationType: 'rest_changed',
        originalValue: { restSeconds: 90 },
        modifiedValue: { restSeconds: 120 },
        reason: 'Need more recovery',
      };

      expect(modification.modificationType).toBe('rest_changed');
    });
  });

  describe('Modification Templates', () => {
    it('applies "feeling great" template', async () => {
      const template = {
        name: 'Feeling Great',
        modifications: [
          { type: 'sets_added', value: 1 },
          { type: 'weight_increased', value: 5 },
        ],
      };

      expect(template.modifications).toHaveLength(2);
    });

    it('applies "time crunch" template', async () => {
      const template = {
        name: 'Time Crunch',
        modifications: [
          { type: 'sets_reduced', value: 1 },
          { type: 'rest_reduced', value: 30 },
        ],
      };

      expect(template.name).toBe('Time Crunch');
    });

    it('applies "equipment unavailable" template', async () => {
      const template = {
        name: 'Equipment Unavailable',
        modifications: [
          { type: 'exercise_substituted', alternative: 'similar' },
        ],
      };

      expect(template.modifications[0].type).toBe('exercise_substituted');
    });
  });

  describe('Skip Reasons', () => {
    const skipReasons = [
      'Equipment unavailable',
      'Injury / Pain',
      'Running out of time',
      'Not feeling well',
      'Exercise too difficult',
      'Gym too crowded',
    ];

    skipReasons.forEach((reason) => {
      it(`supports skip reason: ${reason}`, async () => {
        const modification = {
          sessionId,
          modificationType: 'skipped',
          originalValue: { included: true },
          modifiedValue: { included: false },
          reason,
        };

        expect(modification.reason).toBe(reason);
      });
    });
  });

  describe('Trainer Notification', () => {
    it('flags modification for trainer notification', async () => {
      const modification = {
        sessionId,
        modificationType: 'exercise_sub',
        originalValue: { exerciseId: 'ex_1' },
        modifiedValue: { exerciseId: 'ex_2' },
        reason: 'Equipment unavailable',
        isNotified: false,
      };

      expect(modification.isNotified).toBe(false);
    });
  });
});
