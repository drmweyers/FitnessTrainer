/** @jest-environment jsdom */
import 'fake-indexeddb/auto';
import {
  cacheExercises,
  getCachedExercises,
  addToWorkoutQueue,
  getWorkoutQueue,
  clearWorkoutQueue,
  clearAllOfflineData,
} from '../indexedDB';

describe('IndexedDB offline storage', () => {
  beforeEach(async () => {
    // Clear all data before each test
    try {
      await clearAllOfflineData();
    } catch {
      // DB might not exist yet, ignore
    }
  });

  describe('cacheExercises and getCachedExercises', () => {
    it('should cache exercises and retrieve them', async () => {
      const exercises = [
        { id: 'ex-1', name: 'Squat', muscle: 'Legs' },
        { id: 'ex-2', name: 'Bench Press', muscle: 'Chest' },
      ];

      await cacheExercises(exercises);
      const cached = await getCachedExercises();

      expect(cached).toHaveLength(2);
      expect(cached[0]).toMatchObject({ id: 'ex-1', name: 'Squat' });
      expect(cached[1]).toMatchObject({ id: 'ex-2', name: 'Bench Press' });
    });

    it('should update existing exercises when caching again', async () => {
      const exercises1 = [{ id: 'ex-1', name: 'Squat', reps: 10 }];
      await cacheExercises(exercises1);

      const exercises2 = [{ id: 'ex-1', name: 'Squat', reps: 12 }];
      await cacheExercises(exercises2);

      const cached = await getCachedExercises();
      expect(cached).toHaveLength(1);
      expect(cached[0].reps).toBe(12);
    });

    it('should handle exercises with exerciseId field', async () => {
      const exercises = [{ exerciseId: 'ex-3', name: 'Deadlift' }];
      await cacheExercises(exercises);

      const cached = await getCachedExercises();
      expect(cached).toHaveLength(1);
      expect(cached[0]).toMatchObject({ exerciseId: 'ex-3', name: 'Deadlift' });
    });

    it('should return empty array when no exercises cached', async () => {
      const cached = await getCachedExercises();
      expect(cached).toEqual([]);
    });
  });

  describe('addToWorkoutQueue and getWorkoutQueue', () => {
    it('should add items to workout queue', async () => {
      await addToWorkoutQueue('workouts/log', { exerciseId: 'ex-1', sets: 3 });
      await addToWorkoutQueue('workouts/log', { exerciseId: 'ex-2', sets: 4 });

      const queue = await getWorkoutQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0]).toMatchObject({ action: 'workouts/log', data: { exerciseId: 'ex-1' } });
      expect(queue[1]).toMatchObject({ action: 'workouts/log', data: { exerciseId: 'ex-2' } });
    });

    it('should assign auto-increment IDs to queued items', async () => {
      await addToWorkoutQueue('workouts/log', { data: 'test1' });
      await addToWorkoutQueue('workouts/log', { data: 'test2' });

      const queue = await getWorkoutQueue();
      expect(queue[0].id).toBeDefined();
      expect(queue[1].id).toBeDefined();
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it('should include createdAt timestamp', async () => {
      const beforeAdd = Date.now();
      await addToWorkoutQueue('workouts/log', { test: true });
      const afterAdd = Date.now();

      const queue = await getWorkoutQueue();
      expect(queue[0].createdAt).toBeGreaterThanOrEqual(beforeAdd);
      expect(queue[0].createdAt).toBeLessThanOrEqual(afterAdd);
    });

    it('should return empty array when queue is empty', async () => {
      const queue = await getWorkoutQueue();
      expect(queue).toEqual([]);
    });
  });

  describe('clearWorkoutQueue', () => {
    it('should clear all items from workout queue', async () => {
      await addToWorkoutQueue('workouts/log', { data: 1 });
      await addToWorkoutQueue('workouts/log', { data: 2 });

      let queue = await getWorkoutQueue();
      expect(queue).toHaveLength(2);

      await clearWorkoutQueue();

      queue = await getWorkoutQueue();
      expect(queue).toEqual([]);
    });

    it('should not affect cached exercises', async () => {
      await cacheExercises([{ id: 'ex-1', name: 'Test' }]);
      await addToWorkoutQueue('workouts/log', { data: 1 });

      await clearWorkoutQueue();

      const cached = await getCachedExercises();
      expect(cached).toHaveLength(1);
    });
  });

  describe('clearAllOfflineData', () => {
    it('should clear both exercises and workout queue', async () => {
      await cacheExercises([{ id: 'ex-1', name: 'Test' }]);
      await addToWorkoutQueue('workouts/log', { data: 1 });

      await clearAllOfflineData();

      const cached = await getCachedExercises();
      const queue = await getWorkoutQueue();

      expect(cached).toEqual([]);
      expect(queue).toEqual([]);
    });
  });
});
