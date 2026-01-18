# Story 006-03: Rest Timer

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-03
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 6

## User Story
**As a** client
**I want to** automated rest timers
**So that I** maintain proper rest periods

## Acceptance Criteria
- [ ] Auto-start rest timer after set completion
- [ ] Visual countdown display (large, easy to read)
- [ ] Audio alert when timer completes
- [ ] Vibration alert on mobile devices
- [ ] 10-second warning sound/vibration
- [ ] Background timer support (continue when phone locked)
- [ ] Skip timer option if ready early
- [ ] Pause/resume timer functionality
- [ ] Custom timer adjustment (+/- 15s, +/- 30s)
- [ ] Timer accuracy within ±1 second
- [ ] Clear visual indication when timer is running

## Technical Implementation

### Frontend Tasks
1. **Create RestTimer Component**
   - Large circular countdown display
   - Start/pause/skip controls
   - Time adjustment buttons
   - Background timer implementation
   - Audio and vibration controls

2. **Implement Timer Logic**
   - Use setInterval for countdown
   - Handle app background/foreground transitions
   - Implement proper cleanup to prevent memory leaks
   - Store timer state in Redux/Zustand for persistence

3. **Add Audio Features**
   - Play sound on timer completion
   - Play warning sound at 10 seconds
   - Volume control
   - Sound selection (beep, chime, voice)

4. **Background Timer Support**
   - Use Web Workers for timer continuation
   - Implement background sync with native timer APIs
   - Handle app suspension and resumption
   - Push notification when timer completes in background

### Backend Tasks
1. **Create Timer Endpoints**
   ```typescript
   POST /api/workouts/timer/start - Start rest timer
   POST /api/workouts/timer/stop - Stop rest timer
   POST /api/workouts/timer/pause - Pause timer
   POST /api/workouts/timer/resume - Resume timer
   PUT /api/workouts/timer/adjust - Adjust timer duration
   ```

2. **Implement TimerService**
   ```typescript
   class TimerService {
     async startTimer(sessionId: string, exerciseLogId: string, duration: number)
     async stopTimer(timerId: string)
     async pauseTimer(timerId: string)
     async resumeTimer(timerId: string)
     async adjustTimer(timerId: string, adjustment: number)
   }
   ```

3. **Database Operations**
   - Create rest_timers record
   - Update with actual rest duration
   - Track if timer was skipped or completed
   - Associate with exercise log

### Data Models
```typescript
interface RestTimer {
  id: string;
  clientId: string;
  exerciseLogId: string;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt: Date;
  completedAt?: Date;
  wasSkipped: boolean;
  wasPaused: boolean;
  totalPausedTime: number;
  status: 'running' | 'paused' | 'completed' | 'skipped';
}

interface TimerSettings {
  defaultRestDuration: number;
  warningTime: number; // seconds before end
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundType: 'beep' | 'chime' | 'voice';
  backgroundNotifications: boolean;
}
```

## Test Cases
1. **Happy Path**
   - Complete set
   - Timer auto-starts with prescribed rest (e.g., 90s)
   - Countdown displays correctly
   - Warning plays at 10 seconds
   - Completion alert plays at 0
   - User can proceed to next set

2. **Edge Cases**
   - Skip timer manually
   - Pause timer and resume
   - Adjust timer longer/shorter
   - App goes to background during timer
   - Phone call interrupts timer
   - Timer runs overnight (unlikely but possible)
   - Multiple timers (shouldn't happen but handle gracefully)

3. **Performance Tests**
   - Timer accuracy over 5 minutes
   - Background timer accuracy
   - Memory usage over 1-hour workout
   - Battery impact measurement

4. **Audio/Vibration Tests**
   - Sound plays on completion
   - Warning sound plays at 10s
   - Vibration works on mobile
   - Silent mode handling
   - Do not disturb mode handling

## UI/UX Mockups
```
+------------------------------------------+
|  Rest Timer                              |
|  Rest: 90 seconds                         |
+------------------------------------------+
|                                           |
|            ╭─────────╮                   |
|           ╱           ╲                  |
|          │    45s     │                 |
|          │             │                 |
|           ╲           ╱                  |
|            ╰─────────╯                   |
|                                           |
|  Next: Set 4 of 4                         |
|  Exercise: Barbell Bench Press            |
|                                           |
|  [−15s]  [⏸ Pause]  [+15s]               |
|                                           |
|  [⏭ Skip Timer]                          |
|                                           |
|  🔊 Sound ON  📳 Vibrate ON              |
+------------------------------------------+
```

**Warning State (10 seconds remaining):**
```
+------------------------------------------+
|  ⚠️ Get Ready!                            |
|  10 seconds remaining                     |
+------------------------------------------+
|                                           |
|            ╭─────────╮                   |
|           ╱██████████╲                  |
*         ████████████████                 *
*         █│    10s    │█                 *
*         ████████████████                 *
*           ╲██████████╱                  *
            ╰─────────╯                   |
|                                           |
|  [⏭ Skip to Next Set]                    |
+------------------------------------------+
```

**Timer Complete:**
```
+------------------------------------------+
|  ⏰ Time's Up!                            |
|  Rest Complete                            |
+------------------------------------------+
|                                           |
|            ╭─────────╮                   |
|           ╱██████████╲                  |
|          ██████████████                 |
*         █│  0:00 ✓   │█                 *
*         ██████████████                 *
|          ╲██████████╱                  |
|           ╰─────────╯                   |
|                                           |
|  Ready for your next set!                 |
|                                           |
|  [      Start Set →      ]               |
+------------------------------------------+
```

## Dependencies
- STORY-006-02 (Log Sets and Reps) must be complete
- Audio playback capability
- Vibration API access
- Background task support
- Notification permissions

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for timer flow
- [ ] Manual testing completed on iOS and Android
- [ ] Timer accuracy verified (±1s)
- [ ] Background timer tested and working
- [ ] Audio/vibration tested
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Critical for maintaining workout intensity and timing
- Background timer is challenging but essential for good UX
- Consider using native timer APIs through Capacitor/Cordova plugins
- Make sure timer doesn't drain battery excessively
- Provide visual cue (status bar) when timer is running in background
- Allow users to set default rest times per exercise type
- Consider adding "smart rest" suggestions based on RPE/load
- Check implementation status: ❌ Not Started
