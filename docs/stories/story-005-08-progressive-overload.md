# Story 005-08: Progressive Overload

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-08
**Priority**: P1 (High)
**Story Points**: 13
**Sprint**: Sprint 7

## User Story
**As a** trainer
**I want to** implement progressive overload
**So that** clients continuously improve

## Acceptance Criteria
- [ ] Can set progression type (linear, undulating, block, custom)
- [ ] Can define week-to-week progression rules
- [ ] Can set percentage-based increases
- [ ] Can set rep/set progression
- [ ] Can auto-calculate progressions across weeks
- [ ] Can set deload week frequency
- [ ] Can manually override any week
- [ ] Can visualize progression across program
- [ ] Can see predicted strength gains
- [ ] Can set different progression per exercise
- [ ] Can set RPE targets per week
- [ ] Can preview progression before applying
- [ ] Can copy progression to other exercises
- [ ] Clear indicators of progression difficulty
- [ ] Validation of realistic progression rates

## Technical Implementation

### Frontend Tasks
1. **Create ProgressionSettings Component**
   - Location: `frontend/src/components/programs/ProgressionSettings.tsx`
   - Progression type selector
   - Global progression rules
   - Exercise-specific progression
   - Deload configuration
   - Preview and apply

2. **Create ProgressionBuilder Component**
   - Location: `frontend/src/components/programs/ProgressionBuilder.tsx`
   - Week-by-week progression table
   - Exercise selector
   - Parameter configuration
   - Visual indicators
   - Bulk operations

3. **Create ProgressionVisualization Component**
   - Location: `frontend/src/components/programs/ProgressionVisualization.tsx`
   - Line charts for weight progression
   - Bar charts for volume progression
   - Week-by-week comparison
   - Exercise comparison
   - Export options

4. **Create ProgressionPreview Component**
   - Location: `frontend/src/components/programs/ProgressionPreview.tsx`
   - Show all weeks with calculated values
   - Highlight deload weeks
   - Show progression rate
   - Warning for unrealistic progressions
   - Apply or cancel options

### Backend Tasks
1. **Progression Endpoints**
   ```typescript
   // POST /api/programs/:programId/progression
   interface CreateProgressionDto {
     progressionType: 'linear' | 'undulating' | 'block' | 'custom';
     weightIncreasePercentage?: number;
     repIncreasePerWeek?: number;
     deloadFrequency?: number; // every N weeks
     deloadReductionPercentage?: number;
     exerciseProgressions?: ExerciseProgressionDto[];
   }

   interface ExerciseProgressionDto {
     exerciseId: string;
     progressionType: 'linear' | 'undulating' | 'block' | 'custom';
     startingWeight?: number;
     startingReps?: number;
     weeklyIncreases?: WeeklyIncreaseDto[];
   }

   interface WeeklyIncreaseDto {
     weekNumber: number;
     weightIncrease?: number; // percentage or absolute
     repIncrease?: number;
     rpeTarget?: number;
   }

   // GET /api/programs/:programId/progression
   // Get calculated progression for all weeks
   ```

2. **Progression Calculation Service**
   ```typescript
   class ProgressionService {
     calculateLinearProgression(
       program: Program,
       settings: CreateProgressionDto
     ): CalculatedProgression;

     calculateUndulatingProgression(
       program: Program,
       settings: CreateProgressionDto
     ): CalculatedProgression;

     calculateBlockProgression(
       program: Program,
       settings: CreateProgressionDto
     ): CalculatedProgression;

     calculateCustomProgression(
       program: Program,
       settings: CreateProgressionDto
     ): CalculatedProgression;

     applyProgressionToWeek(
       week: ProgramWeek,
       progression: WeeklyProgression
     ): ProgramWeek;
   }
   ```

3. **Progression Validation**
   ```typescript
   interface ProgressionValidation {
     isValid: boolean;
     warnings: string[];
     errors: string[];
     suggestions: string[];
   }

   // POST /api/programs/progression/validate
   interface ValidateProgressionDto {
     progressionSettings: CreateProgressionDto;
     programDuration: number;
   }
   ```

### Data Models
```typescript
interface ProgramProgression {
  id: string;
  programId: string;
  progressionType: ProgressionType;
  weightIncreasePercentage?: number;
  repIncreasePerWeek?: number;
  deloadFrequency?: number;
  deloadReductionPercentage?: number;
  progressionRules: Json; // Custom rules
  createdAt: Date;
  updatedAt: Date;
}

enum ProgressionType {
  linear = 'linear',
  undulating = 'undulating',
  block = 'block',
  custom = 'custom'
}

interface WeeklyProgression {
  weekNumber: number;
  exercises: ExerciseProgression[];
  isDeload?: boolean;
  volumeMultiplier?: number; // 0.6 for deload
  intensityMultiplier?: number; // 0.7 for deload
}

interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string | number;
  weight: number | string; // Can be percentage
  rpe?: number;
  rir?: number;
  notes?: string;
}

interface CalculatedProgression {
  programId: string;
  progressionType: ProgressionType;
  weeks: WeeklyProgression[];
  validation: ProgressionValidation;
}

interface ProgressionValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}
```

## Test Cases
1. **Linear Progression**
   - Select "Bench Press" exercise
   - Set progression type: Linear
   - Set starting weight: 100kg
   - Set weekly increase: 2.5%
   - Set duration: 12 weeks
   - Preview progression
   - Week 1: 100kg, Week 2: 102.5kg, ..., Week 12: ~130kg
   - Apply progression
   - All weeks updated correctly

2. **Undulating Progression**
   - Select "Squat" exercise
   - Set progression type: Undulating
   - Configure 3-week wave:
     - Week 1: 3x10 @ RPE 7
     - Week 2: 3x8 @ RPE 8
     - Week 3: 3x5 @ RPE 9
   - Repeat for 12 weeks
   - Preview shows wave pattern
   - Apply progression
   - Wave pattern applied correctly

3. **Deload Configuration**
   - Set deload frequency: every 4th week
   - Set deload reduction: 40% volume, 20% intensity
   - Apply to 12-week program
   - Weeks 4, 8, 12 marked as deload
   - Volume and intensity reduced correctly
   - Visual indicators show deload weeks

4. **Exercise-Specific Progression**
   - Set global progression: 2.5% weekly increase
   - Override for "Deadlift": 5% weekly increase (slower)
   - Override for "Chin-ups": add 1 rep per week
   - Preview shows different progressions
   - Apply to program
   - Each exercise has correct progression

5. **Validation Warnings**
   - Set 10% weekly increase (too aggressive)
   - Validation warning: "Unrealistic progression rate"
   - Suggestion: "Consider 2-5% for sustainable progress"
   - Adjust to 3%
   - Warning clears

6. **Visualization**
   - View progression chart
   - Line chart shows weight increase over 12 weeks
   - Bar chart shows volume per week
   - Deload weeks clearly marked
   - Export chart as image

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Progressive Overload Settings               [× Close]   |
+----------------------------------------------------------|
|  Apply progressive overload to your entire program       |
|                                                          |
|  Progression Type *                                     |
|  ◉ Linear (steady increase each week)                   |
|  ○ Undulating (wave pattern)                            |
|  ○ Block Periodization (phases)                         |
|  ○ Custom (manually set each week)                      |
|                                                          |
|  ┌─ Linear Progression Settings ─────────────────────┐   |
|  │                                                     |  |
|  │  Weight Increase Per Week                          |  |
|  │  [ 2.5 ] % (recommended: 2-5%)                     |  |
|  │                                                     |  |
|  │  Rep Increase (optional)                           |  |
|  │  [ 0 ] reps per week                               |  |
|  │                                                     |  |
|  │  RPE Progression (optional)                        |  |
|  │  Start: [7] → End: [9] (gradual increase)          |  |
|  │                                                     |  |
|  └─────────────────────────────────────────────────────┘   |
|                                                          |
|  Deload Weeks                                            |
|  Frequency: [Every 4 weeks ▼]                           |
|  Reduction: Volume [-40% ▼] Intensity [-20% ▼]          |
|                                                          |
|  ☑ Apply to all exercises                               |
|  [ ] Configure exercise-specific progression            |
|                                                          |
|  [Preview Progression]  [Apply to Program]              |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Undulating Progression Settings            [× Close]   |
+----------------------------------------------------------|
|  Create wave patterns for variety and adaptation         |
|                                                          |
|  Wave Pattern *                                         |
|  ◉ 3-Week Wave (Intensity)                              |
|  ○ 3-Week Wave (Volume)                                 |
|  ○ 4-Week Wave                                         |
|  ○ Custom Wave                                          |
|                                                          |
|  ┌─ 3-Week Intensity Wave ───────────────────────────┐   |
|  │                                                     |  |
|  │  Week 1: Accumulation                               |  |
|  │  • Sets: 3 • Reps: 10 • RPE: 7                      |  |
|  │  • Focus: Volume and technique                     |  |
|  │                                                     |  |
|  │  Week 2: Intensification                            |  |
|  │  • Sets: 3 • Reps: 8 • RPE: 8                       |  |
|  │  • Focus: Moderate intensity                        |  |
|  │                                                     |  |
|  │  Week 3: Peak                                       |  |
|  │  • Sets: 3 • Reps: 5 • RPE: 9                       |  |
|  │  • Focus: High intensity, low volume                |  |
|  │                                                     |  |
|  └─────────────────────────────────────────────────────┘   |
|                                                          |
|  Starting Weight (optional)                              |
|  [ 100 ] kg (used as base for calculations)             |
|                                                          |
|  Weight Increase Per Wave                                |
|  [ 5 ] % (applied after each 3-week cycle)              |
|                                                          |
|  [Preview Progression]  [Apply to Program]              |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Preview Progression                        [× Close]    |
+----------------------------------------------------------|
|  Linear Progression • 2.5% weekly increase               |
|                                                          |
|  Exercise: Barbell Bench Press                           |
|  Starting: 3x10 @ 100kg                                  |
|                                                          |
|  Week 1: 3x10 @ 100kg (RPE 7)                            |
|  Week 2: 3x10 @ 102.5kg (RPE 7)                          |
|  Week 3: 3x10 @ 105kg (RPE 7.5)                          |
|  Week 4: 3x10 @ 60kg (RPE 5) ⚠️ Deload                   |
|  Week 5: 3x10 @ 107.5kg (RPE 7.5)                        |
|  Week 6: 3x10 @ 110kg (RPE 7.5)                          |
|  Week 7: 3x10 @ 112.5kg (RPE 8)                          |
|  Week 8: 3x10 @ 67.5kg (RPE 5) ⚠️ Deload                 |
|  Week 9: 3x10 @ 115kg (RPE 8)                            |
|  Week 10: 3x10 @ 117.5kg (RPE 8)                         |
|  Week 11: 3x10 @ 120kg (RPE 8.5)                         |
|  Week 12: 3x10 @ 72kg (RPE 5) ⚠️ Deload                  |
|                                                          |
|  Predicted Improvement: +20% (100kg → 120kg)            |
|                                                          |
|  ⚠️ Validation Warnings                                 |
|  • Deload weeks may feel too light for some clients     |
|  • Consider adjusting deload intensity to 60%           |
|                                                          |
|  ← [Back]  [Apply This Progression]  [Customize →]      |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Exercise-Specific Progression              [× Close]    |
+----------------------------------------------------------|
|  Override global progression for specific exercises      |
|                                                          |
|  Global Progression: Linear, 2.5% weekly                 |
|                                                          |
|  Override Progression                                    |
|  +------------------------------------------------------+|
|  | Exercise                  | Progression               ||
|  +------------------------------------------------------+|
|  | Barbell Squat             | [Custom ▼]  [5%] weekly  ||
|  | (Heavier, slower gains)   | [Edit] [Remove]           ||
|  +------------------------------------------------------+|
|  | Bench Press               | [Use Global ▼]           ||
|  |                           | [Edit] [Remove]           ||
|  +------------------------------------------------------+|
|  | Barbell Row               | [Use Global ▼]           ||
|  |                           | [Edit] [Remove]           ||
|  +------------------------------------------------------+|
|  | Pull-ups                  | [Reps ▼] [+1] per week   ||
|  | (Bodyweight progression)  | [Edit] [Remove]           ||
|  +------------------------------------------------------+|
|  | Overhead Press            | [Use Global ▼]           ||
|  |                           | [Edit] [Remove]           ||
|  +------------------------------------------------------+|
|                                                          |
|  [+ Add Override]                                        |
|                                                          |
|  Exercise Progression Types:                             |
|  • Percentage: Increase weight by % each week           |
|  • Reps: Add reps each week (for bodyweight)            |
|  • RPE: Increase intensity by RPE target                |
|  • Custom: Manually set each week                       |
|                                                          |
|  [Cancel]  [Save Overrides]                              |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Progression Visualization                               |
+----------------------------------------------------------|
|  Barbell Squat - 12 Week Progression                     |
|                                                          |
|  Weight Progression (kg)                                 |
|  140 ┤                                                    |
|  135 ┤                                              ●     |
|  130 ┤                                          ●         |
|  125 ┤                                    ●             |
|  120 ┤                              ●                   |
|  115 ┤                        ●                         |
|  110 ┤                  ●                                 |
|  105 ┤            ●           ●           ●              |
|  100 ┤      ●                                           |
|   95 ┤●                                                   |
|      └───────────────────────────────────────────────   |
|       1  2  3  4  5  6  7  8  9  10 11 12              |
|       ⚠️                    ⚠️                    ⚠️      |
|                                                          |
|  Volume Progression (sets × reps)                        |
|  40 ┤                                                    |
|  36 ┤  ■■■  ■■■        ■■■  ■■■        ■■■  ■■■         |
|  32 ┤                                                    |
|  28 ┤                                                    |
|  24 ┤                                                    |
|      └───────────────────────────────────────────────   |
|       1  2  3  4  5  6  7  8  9  10 11 12              |
|                                                          |
|  Legend: ● Weight  ■ Volume  ⚠️ Deload Week              |
|                                                          |
|  [Export Chart]  [Print]  [Close]                        |
+----------------------------------------------------------+
```

## Dependencies
- Story 005-04: Configure Parameters (parameters must be set)
- Story 005-02: Build Weekly Structure (weeks must exist)
- Program structure complete
- Exercise configuration complete
- Progression calculation service

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Linear progression working
- [ ] Undulating progression working
- [ ] Block periodization working
- [ ] Custom progression working
- [ ] Exercise-specific overrides working
- [ ] Deload configuration working
- [ ] Progression visualization working
- [ ] Validation and warnings working
- [ ] Preview before apply working
- [ ] Progression calculation service tested
- [ ] Integration tests for progression flows
- [ ] Performance tested with complex programs
- [ ] Mobile responsive (simplified charts on mobile)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
**Status: NOT IMPLEMENTED**

This is an advanced feature that requires significant development work. The backend infrastructure is partially complete (exercise configurations support all needed parameters), but the progression calculation service and UI are not implemented.

Backend work needed:
- ProgressionService for calculations
- Progression validation logic
- Progression storage in database
- API endpoints for progression management
- Integration with existing program structure

Frontend work needed:
- Progression settings UI
- Progression builder interface
- Visualization charts (use charting library)
- Exercise-specific override interface
- Preview modal with warnings

Progressive overload is a key principle of training, but it's also complex to implement correctly. Focus on:
- Clear validation and warnings
- Realistic defaults
- Easy customization
- Visual feedback
- Undo functionality

Consider implementing:
- Machine learning for optimal progression rates
- Integration with client performance data
- Auto-adjustment based on feedback
- Progression templates for common goals
- Export/import progression schemes

This feature can be phased, starting with simple linear progression and adding advanced types over time.
