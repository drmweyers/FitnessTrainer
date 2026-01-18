# Story 005-06: Use Program Templates

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-06
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 6

## User Story
**As a** trainer
**I want to** use and create program templates
**So that I** can quickly build similar programs

## Acceptance Criteria
- [ ] Can browse pre-built template library
- [ ] Can filter templates by goal (strength, hypertrophy, etc.)
- [ ] Can filter templates by difficulty (beginner, intermediate, advanced)
- [ ] Can filter templates by duration
- [ ] Can preview template content before using
- [ ] Can use template as starting point
- [ ] Can customize template after selection
- [ ] Can save custom programs as templates
- [ ] Can name and describe custom templates
- [ ] Can categorize custom templates
- [ ] Can set template as public or private
- [ ] Can see template popularity (use count)
- [ ] Can delete own templates
- [ ] Can duplicate existing templates
- [ ] Template categories displayed clearly
- [ ] Featured templates highlighted

## Technical Implementation

### Frontend Tasks
1. **Create TemplateLibrary Component**
   - Location: `frontend/src/components/programs/TemplateLibrary.tsx`
   - Grid/list view of templates
   - Filter sidebar
   - Search functionality
   - Template cards with key info
   - Featured section at top
   - Pagination or infinite scroll

2. **Create TemplateCard Component**
   - Location: `frontend/src/components/programs/TemplateCard.tsx`
   - Template name and description
   - Category and difficulty badges
   - Duration and weeks info
   - Use count/rating display
   - Preview button
   - Use Template button
   - Favorite toggle

3. **Create TemplatePreview Component**
   - Location: `frontend/src/components/programs/TemplatePreview.tsx`
   - Full program structure display
   - Week-by-week breakdown
   - Exercise list per workout
   - Equipment needed
   - Goals and focus areas
   - "Use This Template" button

4. **Create SaveAsTemplate Component**
   - Location: `frontend/src/components/programs/SaveAsTemplate.tsx`
   - Template name input
   - Description field
   - Category selector
   - Tags input
   - Public/private toggle
   - Preview before saving

### Backend Tasks
1. **Template Endpoints**
   ```typescript
   // GET /api/programs/templates
   interface GetTemplatesQuery {
     category?: string;
     difficulty?: string;
     duration?: number;
     isPublic?: boolean;
     search?: string;
     page?: number;
     limit?: number;
   }

   // GET /api/programs/templates/:templateId
   // Get template with full program structure

   // POST /api/programs/:programId/save-as-template
   interface SaveAsTemplateDto {
     name: string;
     description: string;
     category: string;
     tags?: string[];
     isPublic?: boolean;
   }

   // PUT /api/programs/templates/:templateId
   interface UpdateTemplateDto {
     name?: string;
     description?: string;
     category?: string;
     tags?: string[];
     isPublic?: boolean;
   }

   // DELETE /api/programs/templates/:templateId
   ```

2. **Template Usage Tracking**
   ```typescript
   // POST /api/programs/templates/:templateId/use
   // Track when a template is used

   // Increment use count on program creation from template
   ```

3. **Featured Templates**
   ```typescript
   // GET /api/programs/templates/featured
   // Get curated list of featured templates
   ```

### Data Models
```typescript
interface ProgramTemplate {
  id: string;
  programId: string;
  program: Program;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  useCount: number;
  rating?: number;
  createdBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
}

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

interface TemplateUsage {
  templateId: string;
  userId: string;
  usedAt: Date;
  programCreatedId?: string;
}
```

## Test Cases
1. **Browse Templates**
   - Navigate to template library
   - View featured templates
   - Filter by "strength"
   - Filter by "intermediate"
   - Filter by "12 weeks"
   - Search for "5x5"
   - Relevant templates shown

2. **Preview Template**
   - Click on "5x5 Strength" template
   - Preview modal opens
   - Shows all 12 weeks
   - Shows workout structure
   - Shows exercises per workout
   - Shows equipment needed
   - Close preview

3. **Use Template**
   - Click "Use This Template"
   - Redirected to program builder
   - Program pre-populated with template data
   - Can make modifications
   - Save as new program

4. **Save Custom Template**
   - Complete program creation
   - Click "Save as Template"
   - Enter name: "My Custom Push Pull"
   - Select category: "Hypertrophy"
   - Add tags: ["6 day split", "intermediate"]
   - Set as private
   - Save template
   - Template appears in "My Templates"

5. **Template Management**
   - Navigate to "My Templates"
   - View all custom templates
   - Edit template name
   - Delete unused template
   - Duplicate existing template

6. **Public vs Private**
   - Public templates visible to all users
   - Private templates only visible to creator
   - Toggle between public/private
   - Visibility updates correctly

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Program Templates                                      |
+----------------------------------------------------------+
|  🔍 Search templates...                         [Grid ▼] |
+----------------------------------------------------------+
|  Filters                                          [Reset]|
|  +--------------------------------------------------+    |
|  | Goal                                              |    |
|  | [✓] Strength  [ ] Hypertrophy  [ ] Fat Loss      |    |
|  | [ ] Endurance  [ ] General Fitness               |    |
|  +--------------------------------------------------+    |
|  +--------------------------------------------------+    |
|  | Difficulty                                        |    |
|  | [ ] Beginner  [✓] Intermediate  [ ] Advanced     |    |
|  +--------------------------------------------------+    |
|  +--------------------------------------------------+    |
|  | Duration                                          |    |
|  | [ ] 4-6 weeks  [✓] 8-12 weeks  [ ] 12+ weeks     |    |
|  +--------------------------------------------------+    |
|                                                          |
|  Featured Templates                                     |
|  +----------------+  +----------------+  +----------------+|
|  | ⭐ 5x5 Strength |  | ⭐ PPL Split   |  | ⭐ Full Body   ||
|  | Classic linear |  | 6-day split    |  | 3-day beginner ||
|  | Intermediate    |  | Advanced       |  | Beginner       ||
|  | 12 weeks       |  | 8 weeks        |  | 6 weeks        ||
|  | ★★★★★ (2.4k)  |  | ★★★★☆ (1.8k)  |  | ★★★★★ (3.1k)  ||
|  | [Preview] [Use]|  | [Preview] [Use]|  | [Preview] [Use]||
|  +----------------+  +----------------+  +----------------+|
|                                                          |
|  All Templates (24)                                      |
|  +----------------+  +----------------+  +----------------+|
|  | German Volume  |  | PHAT          |  | Starting      ||
|  | Training       |  | Hypertrophy    |  | Strength      ||
|  | Advanced       |  | Intermediate   |  | Beginner       ||
|  | 6 weeks        |  | 8 weeks        |  | 12 weeks       ||
|  | ★★★★☆ (892)   |  | ★★★★☆ (756)   |  | ★★★★☆ (2.1k)  ||
|  | [Preview] [Use]|  | [Preview] [Use]|  | [Preview] [Use]||
|  +----------------+  +----------------+  +----------------+|
|  [Load More...]                                          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Template Preview: 5x5 Strength            [× Close]    |
+----------------------------------------------------------|
|  ⭐ Featured • Strength • Intermediate • 12 weeks       |
|                                                          |
|  Classic linear progression program for strength        |
|  gains. Focuses on compound movements and               |
|  progressive overload.                                   |
|                                                          |
|  Program Structure:                                      |
|  • 12 weeks duration                                     |
|  • 3 days per week                                      |
|  • Focus: Squat, Bench, Deadlift                        |
|  • Equipment: Barbell, Rack, Bench                      |
|                                                          |
|  Week Structure:                                         |
|  Week 1-4: Foundation (5x5 @ RPE 7)                      |
|  Week 5-8: Progression (5x5 @ RPE 8)                     |
|  Week 9-12: Peak (5x3 @ RPE 8-9, 5x5 @ RPE 7)           |
|                                                          |
|  Sample Workout (Monday):                                |
|  1. Barbell Squat: 5x5                                  |
|  2. Barbell Bench Press: 5x5                            |
|  3. Bent Over Row: 5x5                                  |
|                                                          |
|  Goals:                                                  |
  [✓] Build Strength                                      |
  [✓] Compound Movements                                  |
  [✓] Progressive Overload                                |
                                                          |
|  Equipment:                                              |
  [✓] Barbell                                             |
  [✓] Squat Rack                                          |
  [✓] Bench                                               |
                                                          |
|  Used by 2,451 trainers • ★★★★★ (234 reviews)           |
|                                                          |
|  [← Back]  [Use This Template →]                        |
+----------------------------------------------------------|
```

```
+----------------------------------------------------------|
|  Save as Template                          [× Close]    |
+----------------------------------------------------------|
|  Create a template from your program                    |
|                                                          |
|  Template Name *                                        |
|  [My Custom Push Pull________________]                   |
|                                                          |
|  Description *                                          |
|  [6-day push/pull/legs split for hypertrophy________]   |
|  [_____________________________________]                |
|                                                          |
|  Category *                                             |
|  [Hypertrophy ▼] (Strength, Endurance, Fat Loss, etc.)  |
|                                                          |
|  Tags (optional)                                        |
|  [6 day split]  [intermediate]  [upper/lower]           |
|  [+ Add Tag]                                            |
|                                                          |
|  Visibility                                             |
|  ◉ Private (only you can see)                           |
|  ○ Public (available to all trainers)                   |
|                                                          |
|  Preview:                                                |
|  Name: My Custom Push Pull                               |
|  Category: Hypertrophy                                   |
|  Duration: 8 weeks                                       |
|  Days/week: 6                                           |
|  Tags: 6 day split, intermediate, upper/lower           |
|                                                          |
|  [Cancel]  [Save Template]                               |
+----------------------------------------------------------|
```

```
+----------------------------------------------------------|
|  My Templates                                           |
+----------------------------------------------------------|
|  [+ Create New Template]  [Import from Program]        |
+----------------------------------------------------------|
|  3 templates created                                    |
|                                                          |
|  +----------------+  +----------------+  +----------------+|
|  | My Custom      |  | Modified 5x5   |  | HIIT for Fat   ||
|  | Push Pull      |  | (Lighter)      |  | Loss           ||
|  | Hypertrophy    |  | Strength       |  | Fat Loss       ||
|  | Intermediate   |  | Beginner       |  | Intermediate   ||
|  | 8 weeks        |  | 12 weeks       |  | 6 weeks        ||
|  | Private        |  | Private        |  | Public         ||
|  | Used 12x       |  | Used 0x        |  | Used 45x       ||
|  | [Edit] [Delete]|  | [Edit] [Delete]|  | [Edit] [Delete]||
|  +----------------+  +----------------+  +----------------+|
|                                                          |
|  [Share Public Templates]  [Browse Template Library]     |
+----------------------------------------------------------|
```

## Dependencies
- Story 005-01: Create Program (programs must exist)
- ProgramTemplate model in database
- Template endpoints implemented
- Program structure complete

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Template library browse working
- [ ] Template filtering functional
- [ ] Template preview working
- [ ] Use template flow working
- [ ] Save as template working
- [ ] Template management (edit/delete) working
- [ ] Public/private visibility working
- [ ] Template usage tracking
- [ ] Featured templates highlighted
- [ ] API endpoints tested
- [ ] Integration tests for template flows
- [ ] Performance tested with 100+ templates
- [ ] Mobile responsive
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
**Status: PARTIALLY IMPLEMENTED**

Backend infrastructure is complete:
- Database schema includes ProgramTemplate model
- Template fields: name, description, category, tags, isPublic, useCount
- Template tracking via useCount field
- Full program structure accessible via relationship
- Template endpoints implemented in ProgramService

Frontend implementation still needed:
- Template library browse interface
- Template cards and preview modal
- Save as template form
- Template management UI
- Filtering and search
- Featured templates section
- Mobile responsive grid layout

Templates are a major time-saver for trainers. Focus on:
- Clear categorization and filtering
- Rich previews so trainers know what they're getting
- Easy customization after selection
- Usage metrics to show popular templates
- Option to share good templates with community

Consider implementing:
- Template ratings and reviews
- Template versioning
- Template folders/organizers
- Bulk template import/export
- Template analytics (most used, highest rated)

The template system should encourage sharing and community building among trainers.
