# Story 005-01: Create New Program

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-01
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 5

## User Story
**As a** trainer
**I want to** create a new training program
**So that I** can provide structured training to clients

## Acceptance Criteria
- [ ] Can access program creation wizard from dashboard
- [ ] Can enter program name and description
- [ ] Can select program duration (1-12 weeks)
- [ ] Can choose program type (strength, hypertrophy, endurance, etc.)
- [ ] Can set difficulty level (beginner, intermediate, advanced)
- [ ] Can define program goals
- [ ] Can specify required equipment
- [ ] Can select from existing templates (optional)
- [ ] Can save program as draft
- [ ] Can preview program before finalizing
- [ ] Program auto-saves every 30 seconds
- [ ] Can create program from scratch or template
- [ ] Validation ensures all required fields are filled
- [ ] Can cancel creation and return to dashboard

## Technical Implementation

### Frontend Tasks
1. **Create ProgramBuilderWizard Component**
   - Location: `frontend/src/components/programs/ProgramBuilderWizard.tsx`
   - Multi-step wizard with 5 steps:
     - Step 1: Basic Info (name, description, type)
     - Step 2: Duration & Difficulty
     - Step 3: Goals & Equipment
     - Step 4: Template Selection (optional)
     - Step 5: Review & Confirm
   - Navigation between steps with validation
   - Progress indicator showing current step
   - Auto-save with visual indicator
   - Draft recovery on page reload

2. **Create ProgramForm Component**
   - Location: `frontend/src/components/programs/ProgramForm.tsx`
   - Form validation using Zod schema
   - Real-time validation feedback
   - Controlled inputs for all fields
   - Equipment selector with multi-select
   - Goals input with auto-complete

3. **Create TemplateSelector Component**
   - Location: `frontend/src/components/programs/TemplateSelector.tsx`
   - Display available templates in grid
   - Filter by category and type
   - Preview template details
   - "Use Template" button
   - Skip template option

### Backend Tasks
1. **Program Creation Endpoint**
   ```typescript
   // POST /api/programs
   interface CreateProgramDto {
     name: string;
     description?: string;
     programType: ProgramType;
     difficultyLevel: FitnessLevel;
     durationWeeks: number;
     goals?: string[];
     equipmentNeeded?: string[];
     isTemplate?: boolean;
   }
   ```

2. **Update ProgramService**
   - Location: `backend/src/services/programService.ts`
   - Method: `createProgram(trainerId, programData)`
   - Validate required fields
   - Create program with empty weeks structure
   - Return complete program with ID

3. **Auto-save Endpoint**
   ```typescript
   // PUT /api/programs/:id/draft
   interface UpdateDraftDto {
     name?: string;
     description?: string;
     programType?: ProgramType;
     // ... other fields
   }
   ```

### Data Models
```typescript
interface Program {
  id: string;
  trainerId: string;
  name: string;
  description?: string;
  programType: ProgramType;
  difficultyLevel: FitnessLevel;
  durationWeeks: number;
  goals: string[];
  equipmentNeeded: string[];
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  weeks: ProgramWeek[];
}

enum ProgramType {
  strength = 'strength',
  hypertrophy = 'hypertrophy',
  endurance = 'endurance',
  powerlifting = 'powerlifting',
  bodybuilding = 'bodybuilding',
  general_fitness = 'general_fitness',
  sport_specific = 'sport_specific',
  rehabilitation = 'rehabilitation'
}

enum FitnessLevel {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced'
}
```

## Test Cases
1. **Happy Path**
   - Trainer clicks "Create Program"
   - Enters program name: "12-Week Strength Program"
   - Selects duration: 12 weeks
   - Selects type: Strength
   - Selects difficulty: Intermediate
   - Adds goals: ["Build muscle", "Increase strength"]
   - Selects equipment: ["Barbell", "Dumbbells", "Squat rack"]
   - Skips template selection
   - Reviews and confirms
   - Program created successfully

2. **Validation Tests**
   - Empty program name shows error
   - Duration must be between 1-12 weeks
   - At least one goal should be added
   - Program type is required
   - Difficulty level is required

3. **Draft Saving**
   - Program auto-saves after entering name
   - "Saving..." indicator shows during save
   - "Saved" indicator appears after successful save
   - Draft recovered on page reload

4. **Template Selection**
   - Templates displayed in grid
   - Filter by "strength" shows relevant templates
   - Preview shows template structure
   - Using template populates program fields

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Create New Program                              Step 1/5 |
|  ◉ Basic Info  ○ Duration  ○ Goals  ○ Template  ○ Review |
+----------------------------------------------------------+
|                                                          |
|  Program Information                                     |
|                                                          |
|  Program Name *                                          |
|  [_____________________________________]                 |
|                                                          |
|  Description                                             |
|  [_____________________________________]                 |
|  [_____________________________________]                 |
|                                                          |
|  Program Type *                                          |
|  ◉ Strength  ○ Hypertrophy  ○ Endurance                 |
|  ○ Powerlifting  ○ Bodybuilding  ○ General Fitness      |
|                                                          |
|  Difficulty Level *                                      |
|  ◉ Beginner  ○ Intermediate  ○ Advanced                 |
|                                                          |
|  Auto-saved 2 minutes ago                     [Cancel]   |
|                                         [Next Step →]    |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Create New Program                              Step 2/5 |
|  ○ Basic Info  ◉ Duration  ○ Goals  ○ Template  ○ Review |
+----------------------------------------------------------+
|                                                          |
|  Program Duration & Structure                            |
|                                                          |
|  Duration *                                              |
|  [ 12 ] weeks  (1-12 weeks)                              |
|                                                          |
|  How many days per week? *                               |
|  ◉ 3 days  ○ 4 days  ○ 5 days  ○ 6 days  ○ 7 days       |
|                                                          |
|  Estimated Duration per Workout                          |
|  [ 60 ] minutes                                          |
|                                                          |
|  [← Previous]                              [Next Step →] |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Create New Program                              Step 3/5 |
|  ○ Basic Info  ○ Duration  ◉ Goals  ○ Template  ○ Review |
+----------------------------------------------------------+
|                                                          |
|  Program Goals & Equipment                               |
|                                                          |
|  Primary Goals (select at least one) *                   |
|  [✓] Build muscle                                        |
|  [✓] Increase strength                                   |
|  [✓] Improve endurance                                   |
|  [ ] Lose weight                                          |
|  [ ] Enhance flexibility                                  |
|  [+ Add custom goal]                                      |
|                                                          |
|  Required Equipment                                      |
|  [✓] Barbell                                             |
|  [✓] Dumbbells                                           |
|  [✓] Squat rack                                          |
|  [ ] Bench press                                         |
|  [ ] Pull-up bar                                         |
|  [+ Add equipment]                                        |
|                                                          |
|  [← Previous]                              [Next Step →] |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Create New Program                              Step 4/5 |
|  ○ Basic Info  ○ Duration  ○ Goals  ◉ Template  ○ Review |
+----------------------------------------------------------+
|                                                          |
|  Start from Template? (Optional)                         |
|                                                          |
|  You can start with a template and customize it,         |
|  or create from scratch.                                  |
|                                                          |
|  [ ○ Start from Scratch ]                                |
|                                                          |
|  Or select a template:                                    |
|  +----------------+  +----------------+  +----------------+|
|  | 5x5 Strength   |  | PPL            |  | Full Body      ||
|  | Beginner       |  | Intermediate   |  | Beginner       ||
|  | 12 weeks       |  | 8 weeks        |  | 6 weeks        ||
|  | [Preview]      |  | [Preview]      |  | [Preview]      ||
|  |  [Use This →]  |  |  [Use This →]  |  |  [Use This →]  ||
|  +----------------+  +----------------+  +----------------+|
|                                                          |
|  Filter: [All ▼] [Strength] [Hypertrophy] [Beginner]    |
|                                                          |
|  [← Previous]                              [Next Step →] |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Create New Program                              Step 5/5 |
|  ○ Basic Info  ○ Duration  ○ Goals  ○ Template  ◉ Review |
+----------------------------------------------------------+
|                                                          |
|  Review Your Program                                     |
|                                                          |
|  Program Name: 12-Week Strength Program                  |
|  Type: Strength                                          |
|  Difficulty: Intermediate                                |
|  Duration: 12 weeks (5 days/week)                        |
|  Goals: Build muscle, Increase strength                  |
|  Equipment: Barbell, Dumbbells, Squat rack               |
|                                                          |
|  Weeks structure:                                        |
|  Week 1: Foundation                                      |
|  Week 2: Progressive Overload                            |
|  ... (show all weeks)                                    |
|                                                          |
|  [← Previous]  [Save as Draft]    [Create Program →]    |
+----------------------------------------------------------+
```

## Dependencies
- Epic 002: Authentication (users must be logged in as trainers)
- Epic 004: Exercise Library (for template creation)
- Database schema must be migrated
- Program routes must be registered

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Program creation wizard fully functional
- [ ] Auto-save working with visual feedback
- [ ] Form validation on all required fields
- [ ] Template selection functional
- [ ] Draft recovery on page reload
- [ ] API endpoints tested
- [ ] Unit tests for service layer
- [ ] Integration tests for creation flow
- [ ] Mobile responsive design
- [ ] Accessibility standards met
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
**Status: ALREADY IMPLEMENTED**

The backend infrastructure for program creation is complete:
- Database schema includes Program model with all required fields
- ProgramService.createProgram() method implemented
- API endpoints created in programController.ts
- Full nested creation support for weeks/workouts/exercises

Frontend implementation still needed:
- Program builder wizard UI
- Multi-step form with validation
- Auto-save functionality
- Template selection interface
- Mobile responsive design

This story provides the foundation for all subsequent Program Builder stories. The wizard should be intuitive and guide trainers through the creation process step-by-step.
