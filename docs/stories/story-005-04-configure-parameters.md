# Story 005-04: Configure Exercise Parameters

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-04
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 6

## User Story
**As a** trainer
**I want to** set specific parameters for each exercise
**So that** clients know exactly how to perform their workouts

## Acceptance Criteria
- [ ] Can configure sets (working, warm-up, drop sets)
- [ ] Can set reps using multiple formats (exact, range, AMRAP)
- [ ] Can specify weight guidance (RPE, percentage, absolute)
- [ ] Can set rest periods between sets
- [ ] Can specify tempo (e.g., 3-1-2-0)
- [ ] Can set RPE (Rate of Perceived Exertion) 1-10
- [ ] Can set RIR (Reps in Reserve)
- [ ] Can add exercise-specific notes
- [ ] Can suggest alternative exercises
- [ ] Can copy parameters to other sets
- [ ] Can copy parameters to other exercises
- [ ] Can use preset configurations
- [ ] Visual preview of set structure
- [ ] Validation of parameter combinations
- [ ] Clear indication of required vs optional fields

## Technical Implementation

### Frontend Tasks
1. **Create ExerciseConfigurator Component**
   - Location: `frontend/src/components/programs/ExerciseConfigurator.tsx`
   - Set-by-set configuration table
   - Bulk configuration options
   - Preset configuration selector
   - Visual representation of set structure
   - Copy/paste functionality

2. **Create SetConfigRow Component**
   - Location: `frontend/src/components/programs/SetConfigRow.tsx`
   - Set number display
   - Set type selector (warm-up, working, drop, etc.)
   - Reps input with validation
   - Weight guidance input
   - Rest period input
   - Tempo input
   - RPE/RIR sliders
   - Notes field

3. **Create PresetConfigurations Component**
   - Location: `frontend/src/components/programs/PresetConfigurations.tsx`
   - Common strength templates (5x5, 3x10, etc.)
   - Hypertrophy templates
   - Endurance templates
   - Custom presets
   - Preview before applying

4. **Create ParameterValidation Component**
   - Location: `frontend/src/components/programs/ParameterValidation.tsx`
   - Real-time validation feedback
   - Warning for incompatible combinations
   - Suggestions for improvements

### Backend Tasks
1. **Exercise Configuration Endpoints**
   ```typescript
   // POST /api/programs/exercises/:exerciseId/configurations
   interface CreateConfigurationDto {
     setNumber: number;
     setType: SetType;
     reps: string;
     weightGuidance?: string;
     restSeconds?: number;
     tempo?: string;
     rpe?: number;
     rir?: number;
     notes?: string;
   }

   // PUT /api/programs/configurations/:configId
   interface UpdateConfigurationDto {
     setType?: SetType;
     reps?: string;
     weightGuidance?: string;
     restSeconds?: number;
     tempo?: string;
     rpe?: number;
     rir?: number;
     notes?: string;
   }

   // DELETE /api/programs/configurations/:configId
   ```

2. **Bulk Configuration Operations**
   ```typescript
   // POST /api/programs/exercises/:exerciseId/configurations/bulk
   interface BulkCreateConfigurationsDto {
     configurations: CreateConfigurationDto[];
   }

   // POST /api/programs/exercises/:exerciseId/configurations/copy
   interface CopyConfigurationsDto {
     targetExerciseIds: string[];
   }
   ```

3. **Preset Configurations Endpoint**
   ```typescript
   // GET /api/programs/presets
   interface GetPresetsQuery {
     setType?: string;
     goal?: string;
   }

   interface ConfigurationPreset {
     id: string;
     name: string;
     description: string;
     setType: SetType;
     configurations: Omit<CreateConfigurationDto, 'setNumber'>[];
   }
   ```

### Data Models
```typescript
interface ExerciseConfiguration {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  setType: SetType;
  reps: string; // "8-10", "AMRAP", "30s", "5", etc.
  weightGuidance?: string; // "70% 1RM", "RPE 7", "100kg", "Bodyweight"
  restSeconds?: number;
  tempo?: string; // "3-1-2-0" (eccentric-pause-concentric-pause)
  rpe?: number; // 1-10 scale
  rir?: number; // Reps in Reserve
  notes?: string;
  createdAt: Date;
}

enum SetType {
  warmup = 'warmup',
  working = 'working',
  drop = 'drop',
  pyramid = 'pyramid',
  amrap = 'amrap',
  cluster = 'cluster',
  rest_pause = 'rest_pause'
}

interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  setType: SetType;
  configurations: Omit<ExerciseConfiguration, 'id' | 'workoutExerciseId' | 'setNumber' | 'createdAt'>[];
}

interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  orderIndex: number;
  supersetGroup?: string;
  setsConfig: SetsConfig;
  notes?: string;
  createdAt: Date;
  configurations: ExerciseConfiguration[];
}
```

## Test Cases
1. **Happy Path - Standard Sets**
   - Open exercise "Bench Press"
   - Click "Configure Parameters"
   - Select preset: "3x10 Hypertrophy"
   - Review configuration: 3 working sets, 10 reps, 90s rest
   - Adjust weight guidance to "RPE 8"
   - Add tempo: "3-1-2-0"
   - Save configuration
   - Configuration applied correctly

2. **Custom Set Structure**
   - Start with blank configuration
   - Add 2 warm-up sets: 1x8 @ 50%, 1x5 @ 70%
   - Add 3 working sets: 3x8-10 @ RPE 8
   - Add 1 drop set: 1x12 AMRAP
   - Set rest: 120s for working sets
   - Configuration reflects all sets correctly

3. **Parameter Validation**
   - Enter RPE 10 for 10 reps (warning)
   - Enter tempo "10-0-10-0" (too long, suggestion)
   - Enter negative rest period (error)
   - Validation catches all issues

4. **Copy Parameters**
   - Configure "Squat" with 5x5
   - Click "Copy to Deadlift"
   - Select "Deadlift" from list
   - Configuration applied to deadlift

5. **Preset Application**
   - Select "5x5 Strength" preset
   - Preview shows: 5 working sets, 5 reps, 3min rest
   - Apply to exercise
   - Configuration matches preview

6. **Different Rep Formats**
   - Set 1: exact reps "8"
   - Set 2: rep range "8-10"
   - Set 3: AMRAP "AMRAP"
   - Set 4: time-based "30s"
   - All formats accepted and displayed correctly

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Configure: Barbell Bench Press              [× Close]   |
+----------------------------------------------------------+
|  Sets Configuration                                      |
|                                                          |
|  Preset: [3x10 Hypertrophy ▼]  [View Presets]           |
|                                                          |
|  +--------+-------+----------+-----------+------+-------+|
|  | Set    | Type  | Reps     | Weight    | Rest | Tempo ||
|  +--------+-------+----------+-----------+------+-------+|
|  | Set 1  | [Work▼] | [8-10]  | [RPE 8 ▼] | [90s]|[3-0-1-0]|
|  |        |       |          |           |      |       ||
|  +--------+-------+----------+-----------+------+-------+|
|  | Set 2  | [Work▼] | [8-10]  | [RPE 8 ▼] | [90s]|[3-0-1-0]|
|  |        |       |          |           |      |       ||
|  +--------+-------+----------+-----------+------+-------+|
|  | Set 3  | [Work▼] | [8-10]  | [RPE 8 ▼] | [90s]|[3-0-1-0]|
|  |        |       |          |           |      |       ||
|  +--------+-------+----------+-----------+------+-------+|
|                                                          |
|  [+ Add Set]  [Copy to Other Exercises]                  |
|                                                          |
|  Advanced Options                                        |
|  +------------------------------------------------------++
|  | RPE/RIR per Set                                      ||
|  | Set 1: [7 |=======| 10] RIR: [2 |====| 5]            ||
|  | Set 2: [7 |=======| 10] RIR: [2 |====| 5]            ||
|  | Set 3: [8 |========| 10] RIR: [1 |===| 5]            ||
|  +------------------------------------------------------++
|                                                          |
|  Exercise Notes                                          |
|  [Keep elbows tucked at 45°]                            |
|  [Control the descent]                                   |
|  [+ Add Note]                                            |
|                                                          |
|  Alternative Exercises                                   |
|  [+ Add Alternative]                                     |
|                                                          |
|  [Cancel]  [Save Configuration]                          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Configuration Presets                                   |
+----------------------------------------------------------+
|  Select a preset to preview and apply:                   |
|                                                          |
|  +------------------+  +------------------+              |
|  | 5x5 Strength     |  | 3x10 Hypertrophy |              |
|  | Classic strength |  | Muscle building  |              |
|  | 5 working sets   |  | 3 working sets   |              |
|  | 5 reps each      |  | 8-10 reps each   |              |
|  | 3 min rest       |  | 90s rest         |              |
|  | [Preview →]      |  | [Preview →]      |              |
|  +------------------+  +------------------+              |
|                                                          |
|  +------------------+  +------------------+              |
|  | German Volume    |  | 5-3-1 Wave       |              |
|  | Training         |  | Periodization    |              |
|  | 10 sets x 10     |  | Week 1: 5 reps   |              |
|  | High intensity   |  | Week 2: 3 reps   |              |
|  | [Preview →]      |  | Week 3: 1 rep    |              |
|  +------------------+  +------------------+              |
|                                                          |
|  Filter: [All ▼] [Strength] [Hypertrophy] [Endurance]   |
|  [+ Create Custom Preset]                                |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Preview: 5x5 Strength                      [× Close]    |
+----------------------------------------------------------+
|  Classic linear progression for strength                 |
|                                                          |
|  Set Structure:                                          |
|  +------------------------------------------------------++
|  | Warm-up Sets (optional)                              ||
|  | • 1x8 @ 50% of working weight                        ||
|  | • 1x5 @ 70% of working weight                        ||
|  | • 1x3 @ 90% of working weight                        ||
|  +------------------------------------------------------++
|  | Working Sets                                         ||
|  | • 5 sets x 5 reps @ RPE 8                            ||
|  | • Rest: 3 minutes between sets                       ||
|  | • Tempo: 3-0-X-0 (controlled descent)                ||
|  +------------------------------------------------------++
|                                                          |
|  Expected Outcomes:                                      |
|  • Primary goal: Strength increase                      |
|  • Secondary goal: Lean muscle mass                     |
|  • Best for: Intermediate+ lifters                      |
|  • Duration: 4-6 weeks cycle                            |
|                                                          |
|  [Cancel]  [Apply This Preset]                          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Copy Configuration                                     |
+----------------------------------------------------------+
|  Copy "Bench Press" configuration to:                   |
|                                                          |
|  Available Exercises:                                    |
|  [✓] Incline Dumbbell Press                             |
|  [✓] Dumbbell Fly                                       |
|  [ ] Cable Crossover                                    |
|  [✓] Push-ups                                           |
|                                                          |
|  [Select All]  [Clear All]                               |
|                                                          |
|  Options:                                                |
|  [ ] Copy set structure only                             |
|  [ ] Copy tempo and rest periods                        |
|  [✓] Copy all parameters                                |
|                                                          |
|  This will overwrite existing configurations.            |
|                                                          |
|  [Cancel]  [Copy Configuration]                          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Parameter Validation Warnings                           |
+----------------------------------------------------------+
|  ⚠️ Warning: High volume with high intensity             |
|  You have set RPE 9-10 for 12 reps. This is very         |
|  difficult to maintain. Consider lowering RPE or         |
|  reducing reps.                                          |
|  [Adjust] [Keep as is]                                   |
|                                                          |
|  ⚠️ Warning: Very short rest periods                     |
|  60s rest with heavy compound movements may not         |
|  allow full recovery. Consider 120s+ for optimal         |
|  performance.                                            |
|  [Adjust] [Keep as is]                                   |
|                                                          |
|  ℹ️ Tip: Progressive overload                            |
|  For strength gains, consider increasing weight          |
|  by 2.5-5% each week while maintaining                  |
|  rep ranges.                                             |
|  [Dismiss]                                               |
+----------------------------------------------------------+
```

## Dependencies
- Story 005-03: Add Exercises (exercises must be added to workout)
- ExerciseConfiguration model in database
- Configuration endpoints implemented

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Exercise configurator fully functional
- [ ] All parameter types supported (sets, reps, weight, rest, tempo, RPE/RIR)
- [ ] Preset system working
- [ ] Copy/paste functionality operational
- [ ] Parameter validation working
- [ ] Bulk operations implemented
- [ ] API endpoints tested
- [ ] Integration tests for configuration flows
- [ ] Performance tested with 20+ sets
- [ ] Mobile responsive (simplified view on mobile)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
**Status: PARTIALLY IMPLEMENTED**

Backend infrastructure is complete:
- Database schema includes ExerciseConfiguration model
- All set types defined in enum (warmup, working, drop, pyramid, etc.)
- Full nested structure in ProgramService
- Configuration endpoints created

Frontend implementation still needed:
- Exercise configurator UI
- Set-by-set configuration table
- Preset system
- Copy/paste functionality
- Parameter validation
- Bulk operations
- Mobile responsive layout

This is a complex feature that requires careful UX design. The configurator should balance power user needs (quick presets, bulk operations) with flexibility (custom set structures).

Consider implementing:
- Keyboard shortcuts for set types (w=warmup, enter=working, d=drop)
- Smart defaults based on exercise type
- Visual representation of set structure (timeline view)
- Export/import configurations for sharing

The configurator is where trainers spend the most time, so efficiency is key.
