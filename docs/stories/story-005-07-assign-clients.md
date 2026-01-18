# Story 005-07: Assign Program to Clients

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-07
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 6

## User Story
**As a** trainer
**I want to** assign programs to clients
**So that** they can start training

## Acceptance Criteria
- [ ] Can view client list from program
- [ ] Can select single client to assign
- [ ] Can select multiple clients for batch assignment
- [ ] Can set start date for assignment
- [ ] Can see calculated end date
- [ ] Can customize program per client
- [ ] Can add client-specific notes
- [ ] Can preview assignment before confirming
- [ ] Can see assignment history
- [ ] Client receives notification of assignment
- [ ] Can view all client assignments
- [ ] Can filter assignments by status
- [ ] Can modify assignment dates
- [ ] Can cancel/withdraw assignment
- [ ] Can see client's current programs
- [ ] Warning for scheduling conflicts

## Technical Implementation

### Frontend Tasks
1. **Create ClientAssignment Component**
   - Location: `frontend/src/components/programs/ClientAssignment.tsx`
   - Client selection with search
   - Multi-select for batch assignment
   - Start date picker
   - End date calculation
   - Customization options
   - Assignment preview
   - Confirmation modal

2. **Create ClientSelector Component**
   - Location: `frontend/src/components/programs/ClientSelector.tsx`
   - List of active clients
   - Filter by status (active, inactive)
   - Search by name/email
   - Show current program assignments
   - Multi-select checkboxes
   - Client avatars/names

3. **Create AssignmentPreview Component**
   - Location: `frontend/src/components/programs/AssignmentPreview.tsx`
   - Program overview
   - Selected clients
   - Start/end dates
   - Customizations summary
   - Warning indicators
   - Confirm button

4. **Create AssignmentHistory Component**
   - Location: `frontend/src/components/programs/AssignmentHistory.tsx`
   - List of past assignments
   - Status indicators
   - Completion percentage
   - Client feedback
   - Reassign option

### Backend Tasks
1. **Assignment Endpoints** (Already implemented)
   ```typescript
   // POST /api/programs/:programId/assign
   interface AssignProgramDto {
     clientId: string;
     startDate: Date; // ISO string
     customNotes?: string;
     customizations?: {
       weeks?: Partial<ProgramWeek>[];
       workouts?: Partial<ProgramWorkout>[];
       exercises?: Partial<WorkoutExercise>[];
     };
   }

   // GET /api/programs/assignments
   interface GetAssignmentsQuery {
     clientId?: string;
     trainerId?: string;
     status?: 'active' | 'completed' | 'cancelled';
     upcoming?: boolean;
   }

   // PUT /api/programs/assignments/:assignmentId
   interface UpdateAssignmentDto {
     startDate?: Date;
     endDate?: Date;
     customNotes?: string;
     isActive?: boolean;
   }

   // DELETE /api/programs/assignments/:assignmentId
   ```

2. **Batch Assignment**
   ```typescript
   // POST /api/programs/:programId/assign-batch
   interface BatchAssignDto {
     clientIds: string[];
     startDate: Date;
     customNotes?: string;
   }
   ```

3. **Conflict Detection**
   ```typescript
   // GET /api/programs/assignments/check-conflicts
   interface CheckConflictsQuery {
     clientId: string;
     startDate: Date;
     endDate: Date;
   }

   // Returns array of conflicting assignments
   interface ConflictInfo {
     assignmentId: string;
     programName: string;
     overlapDays: number;
   }
   ```

4. **Notification System**
   ```typescript
   // Send notification to client on assignment
   // Integration with notification service
   interface AssignmentNotification {
     clientId: string;
     programName: string;
     startDate: Date;
     trainerName: string;
     message: string;
   }
   ```

### Data Models
```typescript
interface ProgramAssignment {
  id: string;
  programId: string;
  program: Program;
  clientId: string;
  client: User;
  trainerId: string;
  trainer: User;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  customNotes?: string;
  progressData?: Json; // Tracking completion
  assignedAt: Date;
  completedAt?: Date;
  workoutSessions?: WorkoutSession[];
}

interface AssignmentConflict {
  hasConflict: boolean;
  conflicts: ConflictInfo[];
}

interface ConflictInfo {
  assignmentId: string;
  programName: string;
  startDate: Date;
  endDate: Date;
  overlapDays: number;
  overlapPercentage: number;
}
```

## Test Cases
1. **Single Client Assignment**
   - Open program "12-Week Strength"
   - Click "Assign to Clients"
   - Select client "John Doe"
   - Set start date: Next Monday
   - End date auto-calculated (12 weeks later)
   - Preview assignment
   - Confirm assignment
   - Assignment created successfully
   - Client receives notification

2. **Batch Assignment**
   - Select program "8-Week Fat Loss"
   - Click "Assign to Clients"
   - Select 5 clients (multi-select)
   - Set start date: Same date for all
   - Preview shows all 5 clients
   - Confirm batch assignment
   - All 5 clients assigned
   - All receive notifications

3. **Scheduling Conflict Detection**
   - Try to assign program to client
   - Client has active program overlapping
   - Warning displayed: "Client has active program"
   - Shows conflict details
   - Option to continue or cancel
   - Choose to continue
   - Assignment created with warning

4. **Customize Assignment**
   - Assign program to client
   - Click "Customize for Client"
   - Modify Week 4 to be deload week
   - Add client note: "Reduce intensity this week"
   - Save customization
   - Customization applied only to this client

5. **View Assignment History**
   - Navigate to assignment history
   - Filter by "completed"
   - View past assignments
   - See completion percentages
   - Reassign program to same client
   - New assignment created

6. **Cancel Assignment**
   - View active assignments
   - Select assignment to cancel
   - Click "Cancel Assignment"
   - Confirm cancellation
   - Assignment marked inactive
   - Client notified of cancellation

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Assign Program: 12-Week Strength          [× Close]     |
+----------------------------------------------------------|
|  Select Clients to Assign                                 |
|                                                          |
|  Search clients...                               🔍      |
|  Filter: [All ▼] [Active Only]                          |
|                                                          |
|  [☐] John Doe                                           |
|      Active • Current: None • [View Profile]            |
|  [☐] Jane Smith                                          |
|      Active • Current: PPL Split • [View Profile]       |
|  [☐] Mike Johnson                                        |
|      Active • Current: 5x5 Strength • [View Profile]    |
|  [☐] Sarah Williams                                      |
|      Active • Current: None • [View Profile]            |
|                                                          |
|  Selected: 2 clients                                     |
|                                                          |
|  Schedule                                               |
|  Start Date *                                            |
|  [January 15, 2026 ▼]                                   |
|                                                          |
|  End Date                                                |
|  [April 10, 2026] (auto-calculated from 12 weeks)       |
|                                                          |
|  Options                                                 |
|  [✓] Notify clients of assignment                       |
|  [ ] Allow clients to see full program structure        |
|  [✓] Send weekly progress reminders                     |
|                                                          |
|  Client-Specific Notes (optional)                        |
|  [Focus on progressive overload each week_____________] |
|  [________________________________________]              |
|                                                          |
|  ⚠️ 2 conflicts detected                                 |
|  • Jane Smith has active program overlapping 3 weeks     |
|  • Mike Johnson has active program overlapping 1 week    |
|  [View Details]                                          |
|                                                          |
|  [← Back]  [Preview Assignment]                          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Preview Assignment                          [× Close]   |
+----------------------------------------------------------|
|  Program: 12-Week Strength                              |
|  Duration: 12 weeks                                      |
|  Start: January 15, 2026                                 |
|  End: April 10, 2026                                     |
|                                                          |
|  Clients (2)                                             |
|  +------------------------------------------------------+|
|  | ✓ John Doe                                           ||
|  |   • No conflicts                                     ||
|  |   • First time with this program                     ||
|  |   • Will receive notification                        ||
|  +------------------------------------------------------+|
|  | ✓ Jane Smith                                         ||
|  |   ⚠️ Conflict: PPL Split (3 week overlap)            ||
|  |   • Will receive notification                        ||
|  +------------------------------------------------------+|
|                                                          |
|  Customizations                                          |
|  • Focus on progressive overload each week              |
|                                                          |
|  Total Assignments: 2                                    |
|  Estimated Completion: April 10, 2026                    |
|                                                          |
|  [← Back]  [Confirm Assignment]                          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Client Assignments                                      |
+----------------------------------------------------------|
|  [Active ▼]  [All Clients]  [This Program]              |
+----------------------------------------------------------|
|  Active Assignments (8)                                  |
|                                                          |
|  +------------------------------------------------------+|
|  | John Doe • 12-Week Strength                          ||
|  | Week 4 of 12 • 33% complete • Started Jan 15         ||
|  | [View Progress] [Modify] [Cancel]                    ||
|  +------------------------------------------------------+|
|  | Jane Smith • PPL Split                               ||
|  | Week 6 of 8 • 75% complete • Started Dec 1           ||
|  | [View Progress] [Modify] [Cancel]                    ||
|  +------------------------------------------------------+|
|  | Mike Johnson • 5x5 Strength                          ||
|  | Week 10 of 12 • 83% complete • Started Nov 1         ||
|  | [View Progress] [Modify] [Cancel]                    ||
|  +------------------------------------------------------+|
|  | Sarah Williams • 8-Week Fat Loss                     ||
|  | Week 2 of 8 • 25% complete • Started Jan 1           ||
|  | [View Progress] [Modify] [Cancel]                    ||
|  +------------------------------------------------------+|
|                                                          |
|  [Load More...]                                          |
|                                                          |
|  [+ Assign New Client]  [View All Assignments]          |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Assignment History                         [× Close]    |
+----------------------------------------------------------|
|  Past Assignments for: John Doe                            |
|                                                          |
|  +------------------------------------------------------+|
|  | ✅ 12-Week Strength                                  ||
|  | Completed April 10, 2026                             ||
|  | 100% complete • Client rating: ★★★★★               ||
|  | [View Details] [Reassign]                            ||
|  +------------------------------------------------------+|
|  | ✅ 8-Week Fat Loss                                   ||
|  | Completed November 30, 2025                          ||
|  | 95% complete • Client rating: ★★★★☆                ||
|  | [View Details] [Reassign]                            ||
|  +------------------------------------------------------+|
|  | ❌ 5x5 Strength                                      ||
|  | Cancelled October 15, 2025                           ||
|  | Week 3 of 12 • 25% complete                          ||
|  | [View Details] [Reassign]                            ||
|  +------------------------------------------------------+|
|                                                          |
|  [Close]                                                 |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------|
|  Conflict Detected                            [× Close]  |
+----------------------------------------------------------|
|  ⚠️ Scheduling Conflict Detected                         |
|                                                          |
|  Jane Smith already has an active program:               |
|                                                          |
|  Current Assignment:                                     |
|  • Program: PPL Split                                    |
|  • Started: December 1, 2025                             |
|  • Ends: February 1, 2026                                |
|                                                          |
|  New Assignment:                                         |
|  • Program: 12-Week Strength                             |
|  • Start: January 15, 2026                               |
|  • End: April 10, 2026                                   |
|                                                          |
|  Overlap: 3 weeks (January 15 - February 1)              |
|                                                          |
|  Options:                                                |
|  [ ] Cancel new assignment                               |
|  [ ] End current program early (January 14)              |
|  [ ] Assign both (client will have 2 active programs)    |
|  [✓] Continue with assignment (override warning)         |
|                                                          |
|  Note: Client will be notified of both programs           |
|                                                          |
|  [← Back]  [Confirm Assignment]                          |
+----------------------------------------------------------|
```

## Dependencies
- Story 005-01: Create Program (program must exist)
- Epic 003: Client Management (clients must exist)
- Trainer-client relationships established
- Notification system working
- ProgramAssignment model in database
- Assignment endpoints implemented

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Client selection working
- [ ] Batch assignment functional
- [ ] Date management working
- [ ] Conflict detection implemented
- [ ] Assignment preview working
- [ ] Assignment history tracking
- [ ] Notifications sent to clients
- [ ] Assignment modification working
- [ ] Assignment cancellation working
- [ ] API endpoints tested
- [ ] Integration tests for assignment flows
- [ ] Mobile responsive
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
**Status: PARTIALLY IMPLEMENTED**

Backend infrastructure is complete:
- Database schema includes ProgramAssignment model
- Full assignment tracking (startDate, endDate, isActive)
- Progress data field for completion tracking
- Assignment endpoints implemented in ProgramService
- Trainer-client relationship validation
- End date calculation logic

Frontend implementation still needed:
- Client selection interface
- Batch assignment UI
- Assignment preview modal
- Conflict detection display
- Assignment history view
- Notification settings
- Mobile responsive design

Assignment is the bridge between program creation and client training. The UI should make it easy to:
- Assign to multiple clients at once
- See scheduling conflicts clearly
- Customize programs per client
- Track assignment history
- Reassign popular programs

Consider implementing:
- Quick assign from client list
- Assignment calendar view
- Automated check-ins with clients
- Assignment reminders
- Bulk reassignment for program updates
- Client feedback on programs

The assignment flow should be smooth and error-free, as this is a critical business operation.
