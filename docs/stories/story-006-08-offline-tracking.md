# Story 006-08: Offline Tracking

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-08
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 7

## User Story
**As a** client
**I want to** track workouts offline
**So that I** can train without internet

## Acceptance Criteria
- [ ] Automatic offline mode detection
- [ ] Local data storage using IndexedDB
- [ ] Automatic sync when connection restored
- [ ] No data loss during offline period
- [ ] Full functionality available offline
- [ ] Visual offline indicator in UI
- [ ] Sync status display (pending, syncing, complete)
- [ ] Conflict resolution for concurrent edits
- [ ] Offline data capacity for 30 days
- [ ] Graceful degradation of online features

## Technical Implementation

### Frontend Tasks
1. **Create OfflineManager Component**
   - Monitor network status (online/offline)
   - Display offline indicator
   - Show sync status
   - Queue offline operations

2. **Implement IndexedDB Storage**
   - Create offline database schema
   - Store workout sessions locally
   - Cache exercise library
   - Cache user program data
   - Queue sync operations

3. **Create SyncQueue Component**
   - Queue create/update/delete operations
   - Prioritize critical operations
   - Display pending sync count
   - Handle sync failures gracefully

4. **Create ConflictResolution Component**
   - Detect conflicts between offline and server data
   - Present conflict resolution UI
   - Allow user to choose which version to keep
   - Support merge operations

5. **Implement Offline-First Architecture**
   - All reads from local cache first
   - Write to local cache immediately
   - Background sync when online
   - Optimistic UI updates

### Backend Tasks
1. **Create Sync Endpoints**
   ```typescript
   POST /api/sync/pull - Get server changes since last sync
   POST /api/sync/push - Push local changes to server
   POST /api/sync/resolve - Resolve conflicts
   GET /api/sync/status - Get sync status
   ```

2. **Implement SyncService**
   ```typescript
   class SyncService {
     async pullChanges(clientId: string, lastSyncTimestamp: Date)
     async pushChanges(clientId: string, changes: SyncChanges[])
     async detectConflicts(localChanges: SyncChanges[], serverChanges: SyncChanges[])
     async resolveConflict(conflictId: string, resolution: ConflictResolution)
     async getSyncStatus(clientId: string)
   }
   ```

3. **Database Operations**
   - Update sync_status in offline_sync_queue
   - Merge offline changes with server data
   - Handle conflict resolution
   - Update sync timestamps

### Data Models
```typescript
interface OfflineSyncQueue {
  id: string;
  clientId: string;
  entityType: 'workout_session' | 'set_log' | 'exercise_log' | 'modification';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any; // JSONB
  createdAt: Date;
  syncedAt?: Date;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  conflictId?: string;
  retryCount: number;
}

interface SyncChanges {
  entityType: string;
  entityId: string;
  operation: string;
  data: any;
  clientTimestamp: Date;
}

interface SyncStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTimestamp: Date;
  syncInProgress: boolean;
  conflicts: Conflict[];
}

interface Conflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  conflictType: 'update_update' | 'update_delete' | 'delete_update';
  resolved: boolean;
}

interface ConflictResolution {
  conflictId: string;
  resolution: 'keep_local' | 'keep_server' | 'merge';
  mergedData?: any;
}

interface OfflineCache {
  workoutSessions: WorkoutSession[];
  exercises: Exercise[];
  userPrograms: Program[];
  syncQueue: OfflineSyncQueue[];
  lastSyncTimestamp: Date;
}
```

## Test Cases
1. **Happy Path**
   - User goes offline during workout
   - Offline indicator appears
   - User completes workout, logs sets
   - Data saved locally
   - User goes back online
   - Auto-sync triggers
   - All data syncs successfully

2. **Edge Cases**
   - Offline for extended period (days/weeks)
   - Device runs out of storage
   - App killed during offline workout
   - Sync failure due to server error
   - Concurrent edits on same data
   - Delete-update conflict
   - Very large offline dataset

3. **Performance Tests**
   - Offline data load time
   - Sync speed for 30 days of data
   - IndexedDB query performance
   - Memory usage with large cache

4. **Conflict Resolution Tests**
   - Both local and server updated same record
   - Local updated, server deleted
   - Local deleted, server updated
   - Merge operation works correctly

## UI/UX Mockups
```
+------------------------------------------+
|  Upper Body Power                        |
|  ⚠️ Offline Mode                         |
+------------------------------------------+
|                                           |
|  You're currently offline. Workout data   |
|  will be saved locally and synced when    |
|  you reconnect.                           |
|                                           |
|  Barbell Bench Press                      |
|  Set 3 of 4                               |
|                                           |
|  [Set logging works normally...]          |
|                                           |
|  💾 5 changes pending sync                |
+------------------------------------------+
```

**Sync Status Indicator:**
```
+------------------------------------------+
|  Sync Status                    [✕]      |
+------------------------------------------+
|                                           |
|  ✅ All data synced                       |
|  Last sync: Just now                      |
|                                           |
|  Pending: 0 items                         |
|  Conflicts: 0 items                       |
|                                           |
|  [Sync Now]                               |
+------------------------------------------+
```

**Conflict Resolution Modal:**
```
+------------------------------------------+
|  Resolve Conflict                         |
+------------------------------------------+
|                                           |
|  Both you and another device updated      |
|  "Upper Body Power" workout. Which        |
|  version do you want to keep?             |
|                                           |
|  Your version (Oct 20, 2:30 PM):          |
|  ┌─────────────────────────────────────┐  |
|  │ • Completed 7/8 exercises           │  |
|  │ • Total volume: 12,450 lbs          │  |
|  │ • Added notes: "Felt great!"        │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Server version (Oct 20, 2:35 PM):        |
|  ┌─────────────────────────────────────┐  |
|  │ • Completed 8/8 exercises           │  |
|  │ • Total volume: 14,200 lbs          │  |
│  │ • No notes                          │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  [Keep My Version]  [Keep Server]  [Merge]|
+------------------------------------------+
```

## Dependencies
- IndexedDB or similar local storage
- Network monitoring APIs
- Background sync capabilities
- All previous Epic 006 stories
- Sync conflict resolution strategy

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for offline/online transitions
- [ ] Manual testing in airplane mode
- [ ] Sync testing with various scenarios
- [ ] Conflict resolution tested
- [ ] 30-day offline capacity verified
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Offline support is critical for gym environments with poor WiFi
- IndexedDB has ~50MB limit - compress data if needed
- Sync should be incremental, not full data dump
- Conflict resolution should be user-friendly
- Consider showing "last synced" time prominently
- Test extensively - data loss is unacceptable
- Background sync should work even if app is closed (Service Workers)
- Check implementation status: ❌ Not Started
