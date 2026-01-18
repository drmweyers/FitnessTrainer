# Story 011-05: Health App Integration

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-05
**Priority**: P2 (Medium)
**Story Points**: 8
**Sprint**: Sprint 12

## User Story
**As a** user
**I want to** sync with health apps (Apple Health, Google Fit)
**So that** all my fitness data is connected in one place

## Acceptance Criteria
- [ ] Write workout data to Apple Health (iOS)
- [ ] Write workout data to Google Fit (Android)
- [ ] Read health metrics from health apps (steps, weight, etc.)
- [ ] Two-way sync option available
- [ ] Select which data types to sync
- [ ] Permission handling for health data
- [ ] Background sync functionality
- [ ] Historical data import option
- [ ] Privacy controls and data deletion
- [ ] Sync status indicators
- [ ] Conflict resolution for health data

## Technical Implementation

### Frontend Tasks
1. **HealthKit Integration (iOS)**
   - Request HealthKit authorization
   - Write workout data to HealthKit
   - Read health metrics from HealthKit
   - Handle health data types

2. **Google Fit Integration (Android)**
   - Use Google Fit REST API
   - Authenticate with OAuth
   - Write workout data to Google Fit
   - Read fitness data from Google Fit

3. **HealthSync Component**
   - Display sync settings
   - Show connected health apps
   - Configure data type preferences
   - Display sync history
   - Handle permissions

4. **HealthDataDisplay Component**
   - Display synced health metrics
   - Show steps, weight, heart rate
   - Visualize health trends
   - Link to health apps

### Backend Tasks
1. **Health Integration Service**
   ```typescript
   class HealthIntegrationService {
     async syncWorkoutToHealthKit(workoutId: string, userId: string)
     async syncWorkoutToGoogleFit(workoutId: string, userId: string)
     async importFromHealthKit(userId: string, dateRange: DateRange)
     async importFromGoogleFit(userId: string, dateRange: DateRange)
     async getHealthMetrics(userId: string, types: string[])
   }
   ```

2. **Health Data Endpoints**
   ```typescript
   POST /api/health/sync/workout - Sync workout to health app
   POST /api/health/import - Import data from health app
   GET /api/health/metrics - Get health metrics
   PUT /api/health/settings - Update sync preferences
   GET /api/health/settings - Get sync preferences
   ```

### Data Models
```typescript
interface HealthIntegrationSettings {
  userId: string;
  appleHealthConnected: boolean;
  googleFitConnected: boolean;
  syncWorkouts: boolean;
  syncSteps: boolean;
  syncWeight: boolean;
  syncHeartRate: boolean;
  syncCalories: boolean;
  twoWaySync: boolean;
  lastSyncAt: Date;
  permissions: HealthPermission[];
}

interface HealthPermission {
  type: 'workouts' | 'steps' | 'weight' | 'heart_rate' | 'calories';
  read: boolean;
  write: boolean;
}

interface HealthWorkoutData {
  id: string;
  userId: string;
  workoutId: string;
  type: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  calories?: number;
  heartRate?: {
    average?: number;
    max?: number;
    min?: number;
    samples?: HeartRateSample[];
  };
  distance?: number;
  steps?: number;
}

interface HeartRateSample {
  timestamp: Date;
  value: number;
}

interface HealthMetric {
  userId: string;
  type: string;
  value: number;
  unit: string;
  date: Date;
  source: 'apple_health' | 'google_fit' | 'manual';
}
```

### Apple HealthKit Implementation (Web/PWA)
```typescript
// Note: Full HealthKit integration requires native app
// For PWA, use Web Share Target or HealthKit via iOS native bridge

class AppleHealthService {
  // Check if running in iOS native app wrapper
  isNativeIOS(): boolean {
    return window.webkit?.messageHandlers?.healthKit !== undefined;
  }

  async requestAuthorization(types: string[]): Promise<boolean> {
    if (this.isNativeIOS()) {
      return new Promise((resolve) => {
        window.webkit.messageHandlers.healthKit.postMessage({
          action: 'requestAuthorization',
          types
        });
      });
    }
    throw new Error('HealthKit only available in native app');
  }

  async saveWorkout(workout: HealthWorkoutData): Promise<boolean> {
    if (this.isNativeIOS()) {
      return new Promise((resolve) => {
        window.webkit.messageHandlers.healthKit.postMessage({
          action: 'saveWorkout',
          workout
        });
      });
    }
    throw new Error('HealthKit only available in native app');
  }
}
```

### Google Fit Implementation (Web)
```typescript
// Use Google Fit REST API for web applications

class GoogleFitService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async saveWorkout(workout: HealthWorkoutData): Promise<boolean> {
    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataSources`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataStreamId: `raw:com.google.activity:${workout.type}:${Date.now()}`,
          type: 'raw',
          application: {
            name: 'EvoFit',
            version: '1.0'
          },
          dataType: {
            name: 'com.google.activity.segment'
          }
        })
      }
    );

    return response.ok;
  }

  async getSteps(date: Date): Promise<number> {
    const startTime = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const endTime = new Date(date.setHours(23, 59, 59, 999)).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: new Date(startTime).getTime(),
          endTimeMillis: new Date(endTime).getTime()
        })
      }
    );

    const data = await response.json();
    return data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
  }
}
```

## Test Cases
1. **Apple Health Connection**
   - User authorizes HealthKit access
   - Permission dialog shows data types
   - User grants specific permissions
   - Connection established
   - Settings reflect connected status

2. **Google Fit Connection**
   - User authorizes Google Fit access
   - OAuth flow completes
   - Permissions granted
   - Connection established
   - Data types accessible

3. **Workout Sync to Health**
   - Complete workout in EvoFit
   - Sync to Apple Health/Google Fit
   - Verify workout appears in health app
   - Check data accuracy
   - Verify metadata (duration, calories, etc.)

4. **Import Health Data**
   - User imports steps from health app
   - Data displays in EvoFit dashboard
   - Historical data imported
   - Data visualization updated
   - Sync history recorded

5. **Two-Way Sync**
   - Enable two-way sync
   - Update weight in health app
   - Weight updates in EvoFit
   - Update workout in EvoFit
   - Workout syncs to health app

6. **Permission Management**
   - View current permissions
   - Revoke specific permission
   - Data type stops syncing
   - Re-grant permission
   - Sync resumes

7. **Data Privacy**
   - User requests health data deletion
   - Data removed from EvoFit
   - Revoked from health apps
   - Confirmation displayed
   - Audit log updated

## UI/UX Mockups
```
Health App Integration Settings

+----------------------------------+
|  ← Back  Health Integration      |
+----------------------------------+
|  Connected Apps                  |
|  ─────────────────────────────   |
|                                  |
|  [ Apple Health]       [Connected]
|  Last sync: 5 min ago            |
|  [Manage] [Disconnect]           |
|                                  |
|  [G Google Fit]          [Connect]
|  Not connected                   |
|  [Connect]                       |
|                                  |
|  Sync Settings                   |
|  ─────────────────────────────   |
|  Two-way sync              [ON]  |
|                                  |
|  Data to Sync                    |
|  [x] Workouts                    |
|  [x] Steps                       |
|  [x] Weight                      |
|  [x] Heart Rate                  |
|  [x] Calories                    |
|                                  |
|  Sync Frequency: [Real-time ▼]   |
|                                  |
|  [Sync Now]                      |
+----------------------------------+
```

```
Health Data Display

+----------------------------------+
|  ← Back  Health Dashboard        |
+----------------------------------+
|  Today's Overview                |
|  ─────────────────────────────   |
|                                  |
|  👣 Steps                        |
|  8,432 / 10,000 goal             |
|  ████████████████░░ 84%         |
|                                  |
|  🔥 Calories Burned              |
|  524 kcal                        |
|                                  |
|  ❤️ Heart Rate                   |
|  Avg: 72 bpm                     |
|  Range: 60-110 bpm               |
|                                  |
|  ⚖️ Weight                       |
|  175 lbs (↓ 2 lbs this week)     |
|                                  |
|  [View in Health App]            |
+----------------------------------+
```

```
Sync Status Indicator

+----------------------------------+
|  ✅ Health apps synced           |
|  Last sync: Just now             |
|  3 workouts synced today         |
|  Steps imported: 8,432           |
+----------------------------------+
```

## Dependencies
- Apple Developer account (for HealthKit)
- Google Cloud project (for Google Fit API)
- OAuth 2.0 setup for Google
- HealthKit framework (iOS native)
- Google Fit REST API
- User permission handling

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Apple Health integration working (iOS)
- [ ] Google Fit integration working
- [ ] Write workouts to health apps
- [ ] Read health metrics from apps
- [ ] Permission handling implemented
- [ ] Settings page complete
- [ ] Two-way sync functional
- [ ] Privacy controls working
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests with health apps
- [ ] Manual testing on real devices
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Platform Limitations
- **PWA/Web**: Limited health app integration
  - Google Fit: REST API available
  - Apple Health: Requires native app bridge
  - Consider using native app wrappers (Capacitor, TWA)

- **Native App**: Full health app integration
  - HealthKit framework (iOS)
  - Google Fit SDK (Android)
  - Full read/write access

## Privacy & Compliance
- Explicit user consent required
- Clear data usage policy
- GDPR compliance for health data
- HIPAA considerations (if applicable)
- Data encryption in transit and at rest
- Right to data deletion
- Audit trail for health data access

## Performance Targets
- Sync operation: < 5 seconds
- Import operation: < 10 seconds for 30 days
- Real-time sync: < 3 seconds delay
- Permission request: Instant

## Browser/Platform Compatibility
- iOS Safari: Requires native app for HealthKit
- Android Chrome: Google Fit REST API
- Desktop: Limited integration options
- Native apps: Full platform support

## Analytics Tracking
- Health app connection rate
- Sync success rate
- Data types synced
- Sync frequency
- Import/export operations
- Permission grant/deny rates

## Notes
- Start with Google Fit for web/PWA (easier to implement)
- Apple HealthKit requires native iOS app or bridge
- Consider native app wrapper for full health integration
- Respect user privacy - be transparent about data usage
- Provide easy disconnect option
- Handle sync conflicts gracefully
- Keep health data secure and encrypted
- Follow platform guidelines for health data
- Test on both iOS and Android devices
- Consider supporting Samsung Health for Android users
