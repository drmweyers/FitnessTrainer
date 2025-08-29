# Next Session Tasks - Program Builder Frontend

**Priority**: HIGH  
**Epic**: 005 - Program Builder  
**Last Updated**: January 28, 2025  

## 🎯 Immediate Tasks (Start Here)

### 1. Create Program API Service
**File**: `/src/lib/api/programs.ts`
```typescript
// TODO: Implement these functions
- fetchPrograms(token: string)
- createProgram(data: ProgramData, token: string)
- updateProgram(id: string, data: ProgramData, token: string)
- deleteProgram(id: string, token: string)
- duplicateProgram(id: string, token: string)
- assignProgram(programId: string, clientId: string, startDate: Date, token: string)
- getTemplates(token: string)
```

### 2. Create Program Types
**File**: `/src/types/program.ts`
```typescript
// TODO: Define interfaces
- Program
- ProgramWeek
- ProgramWorkout
- WorkoutExercise
- ExerciseConfiguration
- ProgramAssignment
- ProgramTemplate
```

### 3. Update Programs Page
**File**: `/src/app/programs/page.tsx`
- Replace calendar view with program list
- Add "Create Program" button
- Show existing programs in cards/table
- Add edit/duplicate/delete actions

### 4. Create Program Builder Components
**Directory**: `/src/components/features/ProgramBuilder/`
```
ProgramBuilder/
├── ProgramBuilder.tsx         // Main builder container
├── ProgramForm.tsx            // Basic program info form
├── WeekBuilder.tsx            // Week structure builder
├── WorkoutBuilder.tsx         // Individual workout builder
├── ExerciseSelector.tsx       // Exercise picker modal
├── ExerciseConfigurator.tsx   // Sets/reps/weight config
├── SupersetBuilder.tsx        // Superset grouping
├── ProgramPreview.tsx         // Preview before save
└── ClientAssignment.tsx       // Assign to clients
```

## 📋 Component Requirements

### ProgramBuilder.tsx
- Step-by-step wizard interface
- State management for program data
- Save draft functionality
- Validation before submission

### WeekBuilder.tsx
- Add/remove weeks
- Copy week structure
- Deload week toggle
- Week naming

### WorkoutBuilder.tsx
- Day selector (Mon-Sun or Day 1-7)
- Rest day designation
- Workout type selection
- Duration estimation
- Drag-and-drop exercise ordering

### ExerciseSelector.tsx
- Search from exercise library
- Filter by body part/equipment
- Quick add from favorites
- Recent exercises section
- Multi-select capability

### ExerciseConfigurator.tsx
- Sets configuration (working, warmup, drop sets)
- Reps input (ranges, AMRAP, time-based)
- Weight guidance (%, RPE, RIR)
- Rest periods
- Exercise notes/cues
- Alternative exercises

## 🔄 State Management

### Consider Using:
- React Context for program builder state
- Or Zustand for simpler state management
- Local storage for draft saving

### State Structure:
```typescript
interface ProgramBuilderState {
  program: {
    name: string
    description: string
    programType: ProgramType
    difficultyLevel: DifficultyLevel
    durationWeeks: number
    goals: string[]
    equipmentNeeded: string[]
  }
  weeks: ProgramWeek[]
  currentStep: number
  isDirty: boolean
  isSaving: boolean
}
```

## 🎨 UI/UX Requirements

### Design Elements
- Use existing Tailwind classes for consistency
- Match current app color scheme (blue primary)
- Mobile-responsive design
- Loading states for all async operations
- Error handling with user-friendly messages
- Success notifications on save

### User Flow
1. Click "Create Program" button
2. Fill basic program info
3. Build week structure
4. Add workouts to each week
5. Add exercises to workouts
6. Configure exercise parameters
7. Preview complete program
8. Save or assign to clients

## 🧪 Testing Requirements

### Manual Testing Checklist
- [ ] Create new program
- [ ] Edit existing program
- [ ] Duplicate program
- [ ] Delete program
- [ ] Assign to client
- [ ] Create from template
- [ ] Save as template
- [ ] Drag-and-drop exercises
- [ ] Create supersets
- [ ] Mobile responsiveness

### API Integration Tests
- [ ] Authentication headers included
- [ ] Error handling for 401/403
- [ ] Loading states
- [ ] Optimistic updates
- [ ] Cache invalidation

## 🚀 Quick Start Commands

```bash
# Start development environment
cd /c/Users/drmwe/claude-workspace/FitnessTrainer
docker-compose --profile dev up -d

# Check backend is running
curl http://localhost:5000/api/health

# Frontend is accessible at
http://localhost:3001

# Backend API at
http://localhost:5000/api
```

## 📚 Reference Documentation

- Epic Details: `/docs/epics/epic-005-program-builder.md`
- API Endpoints: `/docs/implementation-reports/epic-005-program-builder-report.md`
- Business Logic: `/docs/businesslogic.md`
- Backend Code: `/backend/src/services/programService.ts`

## ⚠️ Known Issues

1. Frontend container mounts from root directory, not `/frontend`
2. API runs on port 5000 (not default 4000)
3. Use bcryptjs, not bcrypt in backend

## 💡 Implementation Tips

1. Start with read-only program list view
2. Then add program creation form
3. Build week/workout builders incrementally
4. Use existing ExerciseLibrary components where possible
5. Leverage existing client management for assignments
6. Consider using react-beautiful-dnd for drag-drop

## ✅ Success Criteria

- Trainer can create multi-week programs
- Programs include structured workouts
- Each workout has exercises with parameters
- Programs can be assigned to clients
- Templates can be created and reused
- Mobile-friendly interface
- <20 minutes to create a program
- Zero data loss with auto-save

---

**Remember**: Backend is fully functional. Focus on frontend implementation only.