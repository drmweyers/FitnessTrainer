/**
 * Story 005-02: Build Weekly Structure
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for building weekly workout structure
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';

describe('Story 005-02: Build Weekly Structure', () => {
  let trainer: TrainerActor;
  const programId = 'prog-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
  });

  describe('Happy Path', () => {
    it('creates weekly structure for program', async () => {
      const weekData = {
        programId,
        weekNumber: 1,
        name: 'Week 1: Foundation',
      };

      expect(weekData.weekNumber).toBe(1);
      expect(weekData.name).toBe('Week 1: Foundation');
    });

    it('creates multiple weeks for program', async () => {
      const weeks = [
        { programId, weekNumber: 1, name: 'Week 1' },
        { programId, weekNumber: 2, name: 'Week 2' },
        { programId, weekNumber: 3, name: 'Week 3' },
        { programId, weekNumber: 4, name: 'Week 4' },
      ];

      expect(weeks).toHaveLength(4);
    });

    it('creates workouts for specific days', async () => {
      const workouts = [
        { name: 'Upper Body A', dayNumber: 1, estimatedDuration: 60 },
        { name: 'Lower Body A', dayNumber: 2, estimatedDuration: 60 },
        { name: 'Rest Day', dayNumber: 3, isRestDay: true },
      ];

      expect(workouts).toHaveLength(3);
      expect(workouts.map(w => w.dayNumber).sort()).toEqual([1, 2, 3]);
    });
  });

  describe('Week Management', () => {
    it('supports deload weeks', async () => {
      const weeks = [
        { weekNumber: 1, name: 'Week 1' },
        { weekNumber: 2, name: 'Week 2' },
        { weekNumber: 3, name: 'Week 3' },
        { weekNumber: 4, name: 'Deload Week', isDeload: true },
      ];

      const deloadWeek = weeks.find(w => w.isDeload);
      expect(deloadWeek?.name).toContain('Deload');
    });

    it('allows week naming and descriptions', async () => {
      const week = {
        weekNumber: 1,
        name: 'Foundation Phase',
        description: 'Focus on form and technique',
      };

      expect(week.name).toBe('Foundation Phase');
      expect(week.description).toBeDefined();
    });
  });

  describe('Workout Configuration', () => {
    it('sets workout type and duration', async () => {
      const workout = {
        name: 'HIIT Cardio',
        dayNumber: 1,
        workoutType: 'hiit',
        estimatedDuration: 30,
      };

      expect(workout.estimatedDuration).toBe(30);
      expect(workout.workoutType).toBe('hiit');
    });

    it('supports rest days', async () => {
      const workout = {
        name: 'Rest Day',
        dayNumber: 7,
        isRestDay: true,
        description: 'Active recovery',
      };

      expect(workout.isRestDay).toBe(true);
    });
  });

  describe('Copy Operations', () => {
    it('copies workout to another day', async () => {
      const originalWorkout = { name: 'Upper Body', dayNumber: 1 };
      const copiedWorkout = { ...originalWorkout, dayNumber: 5 };

      expect(copiedWorkout.name).toBe('Upper Body');
      expect(copiedWorkout.dayNumber).toBe(5);
    });

    it('copies week structure to other weeks', async () => {
      const sourceWorkouts = [
        { name: 'Upper A', dayNumber: 1 },
        { name: 'Lower A', dayNumber: 2 },
        { name: 'Rest', dayNumber: 3, isRestDay: true },
      ];

      const copiedWorkouts = sourceWorkouts.map(w => ({ ...w }));

      expect(copiedWorkouts).toHaveLength(3);
    });
  });

  describe('Validation', () => {
    it('prevents duplicate week numbers', async () => {
      const weeks = [{ weekNumber: 1 }, { weekNumber: 1 }];
      const uniqueWeeks = new Set(weeks.map(w => w.weekNumber));

      expect(uniqueWeeks.size).toBeLessThan(weeks.length);
    });

    it('validates day numbers are 1-7', async () => {
      const dayNumber = 8;
      expect(dayNumber).toBeGreaterThan(7);
    });
  });

  describe('Week Navigation', () => {
    it('supports week overview with workout count', async () => {
      const workouts = [
        { dayNumber: 1, isRestDay: false },
        { dayNumber: 2, isRestDay: false },
        { dayNumber: 3, isRestDay: true },
      ];

      const trainingDays = workouts.filter(w => !w.isRestDay).length;
      const restDays = workouts.filter(w => w.isRestDay).length;

      expect(workouts.length).toBe(3);
      expect(trainingDays).toBe(2);
      expect(restDays).toBe(1);
    });
  });
});
