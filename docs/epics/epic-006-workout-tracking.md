# Epic 006: Workout Tracking

## Epic Overview
**Epic ID**: EPIC-006  
**Epic Name**: Workout Tracking  
**Priority**: P0 (Critical)  
**Estimated Effort**: 5-6 weeks  
**Dependencies**: EPIC-005 (Program Builder), EPIC-004 (Exercise Library)  

## Business Value
Workout tracking is where clients interact with their programs and trainers monitor progress in real-time. This feature enables clients to log their training with precision, provides trainers with immediate feedback on client performance, and creates the data foundation for progress analytics. It's essential for client engagement and results tracking.

## Features Included

### Workout Execution
- Today's workout display
- Exercise-by-exercise guidance
- Set and rep tracking
- Weight/resistance logging
- Rest timer with notifications
- Exercise form videos/GIFs
- Quick navigation between exercises

### Performance Logging
- Real-time set completion
- Weight/reps input
- RPE/RIR tracking
- Form quality notes
- Exercise substitutions
- Workout modifications
- Performance vs. prescribed

### Timer Features
- Auto-start rest timers
- Customizable timer alerts
- Background timer support
- Workout duration tracking
- Exercise duration tracking
- Pause/resume functionality

### Historical Data
- Previous workout reference
- Personal records tracking
- Performance trends
- Workout history calendar
- Exercise history lookup
- Comparison views

## User Stories

### Story 1: Start Today's Workout
**As a** client  
**I want to** easily start my scheduled workout  
**So that I** can begin training immediately  

**Acceptance Criteria:**
- Prominent "Start Workout" button
- Today's workout clearly displayed
- Overview of exercises
- Estimated duration shown
- Equipment needed list
- Warm-up reminder option
- Previous performance summary
- Skip to any exercise

### Story 2: Log Sets and Reps
**As a** client  
**I want to** log my performance for each set  
**So that I** can track my progress accurately  

**Acceptance Criteria:**
- Easy number input (numpad preferred)
- Quick increment/decrement buttons
- Previous set pre-filled
- Mark set as complete
- Add/remove sets dynamically
- Failed set indication
- Drop set support
- AMRAP result logging

### Story 3: Rest Timer
**As a** client  
**I want** automated rest timers  
**So that I** maintain proper rest periods  

**Acceptance Criteria:**
- Auto-start after set completion
- Visual countdown display
- Audio/vibration alerts
- 10-second warning
- Background timer support
- Skip timer option
- Pause/resume timer
- Custom timer adjustment

### Story 4: Exercise Guidance
**As a** client  
**I want** clear exercise instructions  
**So that I** perform movements correctly  

**Acceptance Criteria:**
- Exercise GIF/video display
- Step-by-step instructions
- Target muscles highlighted
- Common mistakes warnings
- Trainer's notes visible
- Alternative exercises available
- Form cues displayed
- Full-screen video option

### Story 5: Track Personal Records
**As a** client  
**I want to** see when I hit personal records  
**So that I** stay motivated and track progress  

**Acceptance Criteria:**
- Automatic PR detection
- Visual PR indicators
- PR history by exercise
- Different PR types (1RM, volume, etc.)
- PR celebration animation
- Share PR achievements
- PR leaderboards (optional)
- Export PR data

### Story 6: Modify Workout
**As a** client  
**I want to** make modifications when needed  
**So that I** can adapt to circumstances  

**Acceptance Criteria:**
- Substitute exercises
- Skip exercises with reason
- Add extra sets
- Modify weight/reps
- Change rest periods
- Save modifications
- Notify trainer of changes
- Quick templates for common mods

### Story 7: Workout Summary
**As a** client  
**I want** a comprehensive workout summary  
**So that I** can review my performance  

**Acceptance Criteria:**
- Total volume lifted
- Workout duration
- Exercises completed
- PRs achieved
- Performance vs. prescribed
- Calories burned (estimate)
- Share summary option
- Add workout notes

### Story 8: Offline Tracking
**As a** client  
**I want to** track workouts offline  
**So that I** can train without internet  

**Acceptance Criteria:**
- Offline mode detection
- Local data storage
- Sync when online
- No data loss
- Full functionality offline
- Visual offline indicator
- Sync status display
- Conflict resolution

## Technical Requirements

### Frontend Components
- WorkoutTracker component
- ExerciseCard component
- SetLogger component
- RestTimer component
- ExerciseGuidance component
- WorkoutSummary component
- PRIndicator component
- OfflineSync component
- WorkoutCalendar component

### Backend Services
- WorkoutService for session management
- LoggingService for performance data
- TimerService for rest period management
- PRService for record detection
- SyncService for offline support
- NotificationService for alerts

### Database Schema
```sql
-- Workout sessions
workout_sessions (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  program_workout_id UUID REFERENCES program_workouts(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes INTEGER,
  status ENUM('in_progress', 'completed', 'skipped', 'partial'),
  notes TEXT,
  location VARCHAR(100),
  energy_level INTEGER, -- 1-5 scale
  sync_status ENUM('synced', 'pending', 'conflict'),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Exercise logs
exercise_logs (
  id UUID PRIMARY KEY,
  workout_session_id UUID REFERENCES workout_sessions(id),
  workout_exercise_id UUID REFERENCES workout_exercises(id),
  exercise_id UUID REFERENCES exercises(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  skipped BOOLEAN DEFAULT false,
  skip_reason VARCHAR(100),
  substituted_exercise_id UUID REFERENCES exercises(id),
  form_quality INTEGER, -- 1-5 scale
  notes TEXT
)

-- Set logs
set_logs (
  id UUID PRIMARY KEY,
  exercise_log_id UUID REFERENCES exercise_logs(id),
  set_number INTEGER,
  prescribed_reps VARCHAR(20),
  performed_reps INTEGER,
  prescribed_weight VARCHAR(50),
  performed_weight DECIMAL(8,2),
  weight_unit ENUM('kg', 'lb'),
  rpe INTEGER, -- 1-10 scale
  rir INTEGER, -- reps in reserve
  rest_seconds INTEGER,
  is_warmup BOOLEAN DEFAULT false,
  is_dropset BOOLEAN DEFAULT false,
  completed_at TIMESTAMP DEFAULT NOW()
)

-- Personal records
personal_records (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  exercise_id UUID REFERENCES exercises(id),
  record_type ENUM('1rm', '3rm', '5rm', '10rm', 'max_reps', 'max_volume', 'max_time'),
  value DECIMAL(10,2),
  unit VARCHAR(20),
  set_log_id UUID REFERENCES set_logs(id),
  previous_record_id UUID REFERENCES personal_records(id),
  achieved_at TIMESTAMP DEFAULT NOW()
)

-- Rest timers
rest_timers (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  exercise_log_id UUID REFERENCES exercise_logs(id),
  duration_seconds INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  was_skipped BOOLEAN DEFAULT false
)

-- Workout modifications
workout_modifications (
  id UUID PRIMARY KEY,
  workout_session_id UUID REFERENCES workout_sessions(id),
  modification_type ENUM('exercise_sub', 'sets_added', 'sets_removed', 'weight_adjusted', 'reps_adjusted'),
  original_value JSONB,
  modified_value JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Offline sync queue
offline_sync_queue (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id UUID,
  operation ENUM('create', 'update', 'delete'),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP
)

-- Workout streaks
workout_streaks (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  streak_started_at DATE,
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### API Endpoints
- GET /api/workouts/today
- GET /api/workouts/schedule
- POST /api/workouts/start
- GET /api/workouts/:id
- PUT /api/workouts/:id
- POST /api/workouts/:id/complete
- POST /api/workouts/:id/exercises/:exerciseId/sets
- PUT /api/workouts/sets/:id
- DELETE /api/workouts/sets/:id
- POST /api/workouts/timer/start
- POST /api/workouts/timer/stop
- GET /api/workouts/history
- GET /api/workouts/personal-records
- POST /api/workouts/sync
- GET /api/workouts/stats

### Real-time Features
- WebSocket connection for live updates
- Timer synchronization across devices
- Live workout tracking for trainers
- Real-time PR notifications
- Instant modification alerts

### Performance Requirements
- Set logging: <100ms response
- Timer accuracy: ±1 second
- Offline data capacity: 30 days
- Sync time: <5 seconds
- App launch to workout: <3 seconds

## Definition of Done
- [ ] All user stories completed
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for tracking flows
- [ ] Offline mode fully functional
- [ ] Performance benchmarks met
- [ ] Cross-device timer sync working
- [ ] Mobile app optimized
- [ ] Documentation complete
- [ ] Deployed to staging

## UI/UX Requirements
- Large, touch-friendly buttons
- Clear visual hierarchy
- Minimal scrolling during workout
- One-handed operation support
- High contrast for gym lighting
- Landscape mode support
- Quick input methods
- Haptic feedback
- Audio cues for timers
- Swipe gestures

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Timer accuracy issues | High | Native timer APIs, background support |
| Offline data conflicts | Medium | Conflict resolution rules, user choice |
| Battery drain | Medium | Optimize background processes |
| Data entry errors | Medium | Input validation, easy correction |
| Network interruptions | High | Robust offline mode, auto-retry |

## Metrics for Success
- Workout completion rate: >85%
- Average logging time per set: <5 seconds
- Offline mode usage: >30% of workouts
- Timer usage rate: >90%
- PR detection accuracy: 100%
- Sync success rate: >99%
- User satisfaction: >4.6/5

## Dependencies
- Program Builder for workout structure
- Exercise Library for demonstrations
- Push notifications for timers
- Local storage APIs
- Background task support

## Out of Scope
- Live video streaming
- Social workout features
- Wearable device integration
- Barcode scanning
- Plate calculator
- 1RM calculators (separate feature)
- Workout music integration
