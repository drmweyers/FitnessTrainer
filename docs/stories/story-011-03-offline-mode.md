# Story 011-03: Offline Mode

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-03
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 11

## User Story
**As a** user
**I want to** use the app offline
**So that I** can train without internet connectivity

## Acceptance Criteria
- [ ] Full workout tracking functionality available offline
- [ ] View assigned workout programs offline
- [ ] Access complete exercise library offline
- [ ] Queue messages for sending when online
- [ ] Track workout progress locally
- [ ] Automatic sync when connection restored
- [ ] Conflict resolution for synced data
- [ ] Data integrity maintained during sync
- [ ] Visual indicator showing online/offline status
- [ ] Sync progress indicator
- [ ] Offline data storage limits managed
- [ ] Background sync when connection available

## Technical Implementation

### Frontend Tasks
1. **OfflineManager Service**
   - Detect online/offline status using navigator.onLine
   - Manage IndexedDB for local storage
   - Implement data sync orchestration
   - Handle sync conflicts
   - Queue outgoing API requests

2. **IndexedDB Wrapper**
   - Create simple API for IndexedDB operations
   - Implement data versioning
   - Handle storage quota exceeded
   - Provide query capabilities
   - Manage data expiration

3. **SyncIndicator Component**
   - Display online/offline status badge
   - Show sync progress when syncing
   - Indicate pending changes count
   - Display sync errors
   - Provide manual sync trigger

4. **OfflineAware Components**
   - WorkoutTracker - fully functional offline
   - ExerciseLibrary - cached and accessible offline
   - MessageComposer - queue messages offline
   - ProgressView - display cached progress

### Backend Tasks
1. **Sync Endpoints**
   ```typescript
   POST /api/sync/pull - Get server changes since last sync
   POST /api/sync/push - Upload local changes to server
   POST /api/sync/resolve - Resolve sync conflicts
   GET /api/sync/status - Get sync status and statistics
   ```

2. **Conflict Resolution Service**
   ```typescript
   class SyncConflictResolver {
     async resolveConflict(
       localChange: any,
       serverChange: any,
       entityType: string
     ): Promise<any>

     async mergeChanges(local: any, server: any): Promise<any>
     async determineWinner(local: any, server: any): Promise<'local' | 'server'>
   }
   ```

3. **Delta Calculation**
   - Implement server-side change tracking
   - Use timestamps or versioning for change detection
   - Calculate delta since last sync
   - Batch large sync operations

### Data Models
```typescript
interface OfflineStore {
  workouts: StoredWorkout[];
  exercises: StoredExercise[];
  programs: StoredProgram[];
  messages: QueuedMessage[];
  progress: LocalProgress[];
  syncMetadata: SyncMetadata;
}

interface StoredWorkout {
  id: string;
  data: any;
  version: number;
  lastModified: Date;
  syncStatus: 'synced' | 'modified' | 'conflict';
}

interface QueuedMessage {
  id: string;
  tempId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
  retryCount: number;
}

interface LocalProgress {
  workoutId: string;
  exerciseId: string;
  sets: CompletedSet[];
  completedAt: Date;
  synced: boolean;
}

interface SyncMetadata {
  lastSyncAt: Date;
  lastPullSyncToken: string;
  lastPushSyncToken: string;
  pendingChangesCount: number;
  conflictCount: number;
}

interface SyncResult {
  pulled: number;
  pushed: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
  syncToken: string;
}
```

### IndexedDB Schema
```typescript
// Database: EvoFitOfflineDB (Version 1)
const dbSchema = {
  workouts: {
    keyPath: 'id',
    indexes: {
      syncStatus: 'syncStatus',
      lastModified: 'lastModified'
    }
  },
  exercises: {
    keyPath: 'id',
    indexes: {
      category: 'category',
      equipment: 'equipment'
    }
  },
  programs: {
    keyPath: 'id',
    indexes: {
      clientId: 'clientId'
    }
  },
  messages: {
    keyPath: 'id',
    indexes: {
      recipientId: 'recipientId',
      createdAt: 'createdAt'
    }
  },
  progress: {
    keyPath: 'workoutId',
    indexes: {
      completedAt: 'completedAt',
      synced: 'synced'
    }
  },
  syncQueue: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: {
      endpoint: 'endpoint',
      retryCount: 'retryCount'
    }
  }
};
```

### Sync Algorithm
```typescript
class OfflineSyncService {
  async performSync(): Promise<SyncResult> {
    // 1. Check connection
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    // 2. Pull server changes
    const pullResult = await this.pullChanges();

    // 3. Push local changes
    const pushResult = await this.pushChanges();

    // 4. Resolve conflicts
    const conflicts = await this.detectConflicts();
    const resolvedConflicts = await this.resolveConflicts(conflicts);

    // 5. Update sync metadata
    await this.updateSyncMetadata();

    return {
      pulled: pullResult.count,
      pushed: pushResult.count,
      conflicts: resolvedConflicts,
      errors: [],
      syncToken: pullResult.syncToken
    };
  }

  private async pullChanges(): Promise<any> {
    const lastSyncToken = await this.getLastSyncToken();
    const response = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ since: lastSyncToken })
    });

    const changes = await response.json();

    // Apply changes to IndexedDB
    for (const change of changes) {
      await this.storeChange(change);
    }

    return changes;
  }

  private async pushChanges(): Promise<any> {
    const queue = await this.getSyncQueue();
    const grouped = this.groupByEndpoint(queue);

    let pushedCount = 0;

    for (const [endpoint, items] of Object.entries(grouped)) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items.map(i => i.payload))
        });

        if (response.ok) {
          await this.removeFromQueue(items);
          pushedCount += items.length;
        }
      } catch (error) {
        await this.incrementRetryCount(items);
      }
    }

    return { count: pushedCount };
  }
}
```

## Test Cases
1. **Offline Workout Tracking**
   - Open app with internet
   - Load workout data
   - Enable airplane mode
   - Complete full workout offline
   - Verify data saved locally
   - Disable airplane mode
   - Verify sync completes

2. **Offline Exercise Library Access**
   - Sync exercise library while online
   - Enable airplane mode
   - Search exercises offline
   - Filter by category offline
   - View exercise details offline
   - All functionality works

3. **Offline Messaging**
   - Enable airplane mode
   - Compose message
   - Send message
   - Verify queued locally
   - Disable airplane mode
   - Verify message sent automatically

4. **Sync Conflict Resolution**
   - Modify workout on device while offline
   - Modify same workout on web
   - Bring device online
   - Detect conflict
   - Present resolution options
   - Apply resolution
   - Verify data integrity

5. **Storage Limits**
   - Sync large amount of data
   - Approach IndexedDB quota
   - Implement data cleanup
   - Prioritize important data
   - Handle quota exceeded gracefully

6. **Network Interruption During Sync**
   - Start sync operation
   - Disable network mid-sync
   - Verify sync pauses
   - Re-enable network
   - Verify sync resumes
   - No data corruption

7. **Online/Offline Status Indicator**
   - Connect to network → show "Online"
   - Disconnect → show "Offline" immediately
   - Show pending changes count
   - Display sync progress
   - Manual sync button works

8. **Background Sync**
   - Enable background sync API
   - Go offline, make changes
   - Close app
   - Re-open app when online
   - Verify automatic sync

## UI/UX Mockups
```
Online/Offline Status Indicator

Online:
+----------------------------------+
|  ☑ You're online                |
|  Last sync: Just now            |
|  All data up to date            |
+----------------------------------+

Offline:
+----------------------------------+
|  ⚠️ You're offline               |
|  Changes saved locally          |
|  3 changes pending sync         |
|  [Sync Now]                      |
+----------------------------------+

Syncing:
+----------------------------------+
|  🔄 Syncing...                   |
|  Uploading 3 changes             |
|  ████████░░░░ 75%               |
+----------------------------------+
```

```
Sync Conflict Resolution Modal

+----------------------------------+
|  ⚠️ Sync Conflict                |
+----------------------------------+
|  Workout "Leg Day" was modified  |
|  on both this device and the    |
|  server. Which version should    |
|  we keep?                        |
|                                  |
|  +----------------------------+  |
|  |  Local Version             |  |
|  |  Modified: 2 min ago       |  |
|  |  Sets: 4 → 5               |  |
|  |  [Keep Local]              |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |  Server Version            |  |
|  |  Modified: 5 min ago       |  |
|  |  Sets: 4 → 3               |  |
|  |  [Keep Server]             |  |
|  +----------------------------+  |
|                                  |
|  [Merge] [Keep Both] [Cancel]    |
+----------------------------------+
```

```
Offline Data Management

+----------------------------------+
|  ← Back  Offline Data            |
+----------------------------------+
|  Storage Used                    |
|  ─────────────────────────────   |
|  Workouts: 12.5 MB               |
|  Exercises: 8.2 MB               |
|  Programs: 5.1 MB                |
|  Messages: 2.3 MB                |
|  Total: 28.1 MB / 50 MB          |
|                                  |
|  Sync Status                     |
|  ─────────────────────────────   |
|  Last sync: 5 minutes ago        |
|  Pending changes: 3              |
|  Conflicts: 0                    |
|                                  |
|  [Sync Now]  [Clear Old Data]    |
+----------------------------------+
```

## Dependencies
- IndexedDB support in browser
- Service worker for caching
- Authentication tokens with offline capability
- Conflict resolution strategy
- Server-side change tracking

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Offline workout tracking fully functional
- [ ] Exercise library accessible offline
- [ ] Message queuing working
- [ ] Auto-sync on reconnection
- [ ] Conflict resolution implemented
- [ ] Data integrity maintained
- [ ] Online/offline indicator working
- [ ] Storage limits managed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for sync scenarios
- [ ] Manual testing with network toggling
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Performance Targets
- Initial data sync: < 30 seconds for 1000 exercises
- Incremental sync: < 5 seconds
- Offline read operations: < 100ms
- IndexedDB queries: < 50ms
- Storage overhead: < 50MB for typical user

## Browser Compatibility
- Chrome/Edge: Full IndexedDB support
- Firefox: Full IndexedDB support
- Safari: Full IndexedDB support (iOS 10+)
- Samsung Internet: Full support

## Security Considerations
- Encrypt sensitive offline data
- Secure authentication token storage
- Clear sensitive data on logout
- Verify data integrity during sync
- Handle man-in-the-middle attacks

## Offline Data Strategy
1. **Essential Data** (Always cached):
   - User's current workout programs
   - Exercise library
   - User profile

2. **Recent Data** (Cached for 30 days):
   - Completed workouts
   - Message history
   - Progress data

3. **On-Demand Data** (Cached when accessed):
   - Other programs
   - Historical data beyond 30 days

4. **Cleanup Strategy**:
   - Remove completed workouts older than 30 days
   - Clear read messages older than 60 days
   - Compress old progress data

## Error Handling
- Network timeout: Queue for retry
- Sync failure: Display error, retry option
- Storage quota exceeded: Clear old data, notify user
- Corruption: Detect and recover from backup
- Conflict: Prompt user for resolution

## Notes
- Start with essential data offline
- Gradually increase offline capabilities
- Monitor sync success rates
- Optimize data payloads for mobile
- Provide user control over offline data
- Consider sync over WiFi only option
- Test on slow networks (3G)
- Handle timezone changes in sync
- Implement delta sync to reduce bandwidth
