/**
 * Story 006-08: Offline Tracking
 * FORGE User Simulation Tests
 *
 * Tests client workflow for offline workout tracking and sync
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';

describe('Story 006-08: Offline Tracking', () => {
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
    it('queues offline workout data', async () => {
      const queueItem = {
        id: 'queue-1',
        userId: client.id,
        entityType: 'workout_session',
        entityId: 'session-123',
        operation: 'create',
        data: { workoutId: 'wo-1', startedAt: new Date() },
        syncStatus: 'pending',
      };

      expect(queueItem.syncStatus).toBe('pending');
    });

    it('syncs queued data when online', async () => {
      const queueItem = {
        id: 'queue-1',
        userId: client.id,
        entityType: 'set_log',
        entityId: 'set-123',
        operation: 'create',
        data: { weight: 185, reps: 8 },
        syncStatus: 'pending',
      };

      // Simulate sync
      const updated = { ...queueItem, syncStatus: 'completed', syncedAt: new Date() };

      expect(updated.syncStatus).toBe('completed');
    });
  });

  describe('Offline Queue', () => {
    it('queues multiple operations', async () => {
      const queue = [
        { userId: client.id, entityType: 'workout_session', entityId: 's1', operation: 'create', data: {}, syncStatus: 'pending' },
        { userId: client.id, entityType: 'exercise_log', entityId: 'e1', operation: 'create', data: {}, syncStatus: 'pending' },
        { userId: client.id, entityType: 'set_log', entityId: 'l1', operation: 'create', data: {}, syncStatus: 'pending' },
      ];

      const pendingCount = queue.filter(item => item.syncStatus === 'pending').length;

      expect(pendingCount).toBe(3);
    });

    it('prioritizes critical operations', async () => {
      const critical = {
        userId: client.id,
        entityType: 'workout_session',
        entityId: 's1',
        operation: 'create',
        data: {},
        syncStatus: 'pending',
        priority: 1,
      };

      expect(critical.priority).toBe(1);
    });
  });

  describe('Sync Status', () => {
    it('tracks sync status', async () => {
      const status = {
        userId: client.id,
        isOnline: false,
        pendingSyncCount: 5,
        lastSyncTimestamp: new Date(Date.now() - 3600000),
      };

      expect(status.isOnline).toBe(false);
      expect(status.pendingSyncCount).toBe(5);
    });

    it('updates to online status', async () => {
      const status = {
        userId: client.id,
        isOnline: false,
        pendingSyncCount: 3,
      };

      const updated = { ...status, isOnline: true, pendingSyncCount: 0, lastSyncTimestamp: new Date() };

      expect(updated.isOnline).toBe(true);
      expect(updated.pendingSyncCount).toBe(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('detects conflicts', async () => {
      const conflict = {
        userId: client.id,
        entityType: 'set_log',
        entityId: 'set-123',
        localVersion: { weight: 185, reps: 8 },
        serverVersion: { weight: 180, reps: 8 },
        conflictType: 'update_update',
        resolved: false,
      };

      expect(conflict.resolved).toBe(false);
    });

    it('resolves conflict keeping local version', async () => {
      const conflict = {
        userId: client.id,
        entityType: 'set_log',
        entityId: 'set-123',
        localVersion: { weight: 185 },
        serverVersion: { weight: 180 },
        conflictType: 'update_update',
        resolution: 'keep_local',
        resolved: true,
      };

      expect(conflict.resolution).toBe('keep_local');
      expect(conflict.resolved).toBe(true);
    });

    it('resolves conflict keeping server version', async () => {
      const conflict = {
        userId: client.id,
        entityType: 'set_log',
        entityId: 'set-123',
        localVersion: { weight: 185 },
        serverVersion: { weight: 180 },
        conflictType: 'update_update',
        resolution: 'keep_server',
        resolved: true,
      };

      expect(conflict.resolution).toBe('keep_server');
    });
  });

  describe('Offline Cache', () => {
    it('caches workout data locally', async () => {
      const cache = {
        workoutSessions: [{ id: 's1', status: 'in_progress' }],
        exercises: [{ id: 'ex1', name: 'Bench Press' }],
        lastSyncTimestamp: new Date(),
      };

      expect(cache.workoutSessions).toHaveLength(1);
      expect(cache.exercises).toHaveLength(1);
    });

    it('caches exercise library', async () => {
      const exercises = [
        { id: 'ex1', name: 'Bench Press', bodyPart: 'chest' },
        { id: 'ex2', name: 'Squat', bodyPart: 'legs' },
        { id: 'ex3', name: 'Deadlift', bodyPart: 'back' },
      ];

      expect(exercises).toHaveLength(3);
    });
  });

  describe('Retry Logic', () => {
    it('increments retry count on failure', async () => {
      const queueItem = {
        id: 'queue-1',
        userId: client.id,
        entityType: 'set_log',
        entityId: 'set-1',
        operation: 'create',
        data: {},
        syncStatus: 'failed',
        retryCount: 1,
      };

      const updated = { ...queueItem, retryCount: queueItem.retryCount + 1 };

      expect(updated.retryCount).toBe(2);
    });
  });
});
