# Story 003-03: Client Profile View

**Parent Epic**: [EPIC-003 - Client Management](../epics/epic-003-client-management.md)
**Story ID**: STORY-003-03
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 4

## User Story
**As a** trainer
**I want to** view detailed client information
**So that I** can provide personalized training

## Acceptance Criteria
- [ ] Display comprehensive client personal information
- [ ] Show health questionnaire responses
- [ ] Display current goals and limitations
- [ ] Show progress photo gallery with timeline
- [ ] Display measurement history with charts
- [ ] List all assigned programs
- [ ] Show activity timeline (workouts, messages)
- [ ] Include notes section with add/edit capability
- [ ] Show client contact information
- [ ] Display emergency contact details
- [ ] Show training statistics (streaks, totals)
- [ ] Allow editing client information
- [ ] Responsive design for mobile viewing

## Technical Implementation

### Frontend Tasks
1. **Create ClientProfile Component**
   - Build tabbed interface (Overview, Health, Progress, Programs, Activity)
   - Implement lazy loading for heavy data
   - Add edit mode toggle
   - Include quick actions (message, assign program)
   - Show client status with ability to change
   - Display connection date

2. **Create ProfileOverview Component**
   - Display personal info (name, age, contact)
   - Show profile photo with upload option
   - Display emergency contact
   - Show key stats (workouts completed, streak)
   - List assigned tags
   - Quick status change dropdown

3. **Create HealthQuestionnaire Component**
   - Display PAR-Q responses
   - Show medical conditions
   - List medications
   - Display allergies
   - Show injuries history
   - Include fitness assessment results

4. **Create GoalsSection Component**
   - Display primary goal
   - Show target dates
   - List secondary goals
   - Display limitations/restrictions
   - Show progress towards goals
   - Edit capability

5. **Create ProgressGallery Component**
   - Display photo grid with dates
   - Implement lightbox for enlarged view
   - Show comparison view (before/after)
   - Include upload functionality
   - Filter by date range
   - Delete with confirmation

6. **Create MeasurementChart Component**
   - Line chart for weight over time
   - Body measurements progress
   - Comparison views
   - Data point editing
   - Add new measurement button
   - Export data option

7. **Create AssignedPrograms Component**
   - List active programs
   - Show program start dates
   - Display completion status
   - Include quick assign button
   - Show program adherence

8. **Create ActivityTimeline Component**
   - Reverse chronological feed
   - Show workout completions
   - Display messages
   - Show program assignments
   - Display status changes
   - Filter by activity type

9. **Create NotesSection Component**
   - Display all notes in timeline
   - Add new note with rich text
   - Edit existing notes
   - Delete notes with confirmation
   - Search notes
   - Pin important notes

### Backend Tasks
1. **Create Profile Endpoints**
   ```typescript
   GET /api/clients/:id - Get full client profile
   PUT /api/clients/:id - Update client information
   GET /api/clients/:id/health - Get health questionnaire
   GET /api/clients/:id/progress - Get progress data
   GET /api/clients/:id/measurements - Get measurements
   POST /api/clients/:id/measurements - Add measurement
   GET /api/clients/:id/photos - Get progress photos
   POST /api/clients/:id/photos - Upload photo
   DELETE /api/clients/:id/photos/:photoId - Delete photo
   GET /api/clients/:id/programs - Get assigned programs
   GET /api/clients/:id/activity - Get activity timeline
   GET /api/clients/:id/notes - Get client notes
   POST /api/clients/:id/notes - Add note
   PUT /api/clients/:id/notes/:noteId - Update note
   DELETE /api/clients/:id/notes/:noteId - Delete note
   GET /api/clients/:id/stats - Get client statistics
   ```

2. **Implement ClientProfileService**
   ```typescript
   class ClientProfileService {
     async getClientProfile(clientId: string, trainerId: string)
     async updateClientInfo(clientId: string, data: UpdateClientDto)
     async getHealthData(clientId: string)
     async getProgressData(clientId: string, filters?: ProgressFilters)
     async addMeasurement(clientId: string, data: MeasurementDto)
     async uploadProgressPhoto(clientId: string, file: File, date: Date)
     async getActivityTimeline(clientId: string, limit?: number)
     async getClientStats(clientId: string)
   }
   ```

3. **Database Queries**
   - Complex joins across multiple tables
   - Aggregate queries for statistics
   - Time-series queries for charts
   - Photo storage with metadata
   - Activity log queries
   - Note CRUD operations

4. **File Storage**
   - Store progress photos in secure storage (S3/Cloudinary)
   - Generate thumbnails for gallery
   - Implement CDN delivery
   - Photo compression on upload
   - Secure access control

### Data Models
```typescript
interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  photo?: string;
  status: ClientStatus;
  tags: Tag[];
  emergencyContact?: EmergencyContact;
  goals?: ClientGoals;
  limitations?: string[];
  connectedAt: Date;
  lastActivity?: Date;
}

interface HealthData {
  parQCompleted: boolean;
  parQResponses?: ParQResponses;
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
  injuries?: Injury[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  healthNotes?: string;
}

interface ProgressData {
  measurements: Measurement[];
  photos: ProgressPhoto[];
  goals: ClientGoals[];
  stats: ClientStats;
}

interface Measurement {
  id: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  arms?: number;
  neck?: number;
  shoulders?: number;
  notes?: string;
}

interface ProgressPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  date: Date;
  notes?: string;
}

interface ClientStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  completedPrograms: number;
  activePrograms: number;
  averageAdherence: number;
}

interface ActivityItem {
  id: string;
  type: 'workout' | 'message' | 'program' | 'status' | 'note';
  description: string;
  createdAt: Date;
  metadata?: any;
}

interface ClientNote {
  id: string;
  trainerId: string;
  note: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Test Cases
1. **Happy Path - View Profile**
   - Navigate to client profile
   - Verify all sections load
   - Check personal information displays
   - Verify health data shows
   - Check progress gallery loads
   - Test measurement charts render
   - Verify programs list shows
   - Check activity timeline displays

2. **Edit Client Info**
   - Enter edit mode
   - Update client phone number
   - Change emergency contact
   - Update goals
   - Save changes
   - Verify updates persist

3. **Progress Photos**
   - Upload new progress photo
   - Verify thumbnail generated
   - Add date and notes
   - View in gallery
   - Open lightbox view
   - Delete photo with confirmation

4. **Measurements**
   - Add new measurement
   - Update chart renders
   - Check data point on chart
   - Edit existing measurement
   - Delete measurement

5. **Notes**
   - Add new note
   - Verify timestamp
   - Edit existing note
   - Pin important note
   - Delete note
   - Search notes

6. **Performance Tests**
   - Load profile with extensive history
   - Gallery with 100+ photos
   - Activity timeline with 1000+ items
   - Measurement chart performance

7. **Edge Cases**
   - Client with no progress data
   - Empty activity timeline
   - Very long notes
   - Special characters in fields
   - Concurrent edits
   - Large photo uploads

## UI/UX Mockups
```
+--------------------------------------------------+
|  ← Back to Clients           [Edit] [✕]          |
|                                                  |
|  [Client Photo]      John Doe                   |
|                      Active ●                   |
|                                                  |
|  [Overview] [Health] [Progress] [Programs]      |
|  [Activity] [Notes]                              |
|                                                  |
|  Personal Information                            |
|  Email: john.doe@example.com                     |
|  Phone: (555) 123-4567         [Edit]           |
|  DOB: January 15, 1990                           |
|  Emergency: Jane Doe (555) 987-6543              |
|                                                  |
|  Quick Stats                                     |
|  Workouts: 45 | Streak: 12 days | Active: 3 mo  |
|                                                  |
|  Goals                                           |
|  Primary: Lose 10 lbs by June 30                |
|  Progress: 6/10 lbs lost  [=======>    ] 60%    |
|                                                  |
|  Active Programs                                 |
|  + 12-Week Strength Program (Week 4/12)         |
|    [View Details] [Track Workout]                |
|                                                  |
|  Recent Activity                                 |
|  Today - Completed "Leg Day" workout             |
|  Yesterday - Updated weight: 185 lbs             |
|  2 days ago - Message from trainer               |
|                                                  |
|  [Send Message] [Assign Program]                |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  John Doe                    [Edit Profile] [×] |
|                                                  |
|  [Overview] [Health] [Progress] [Programs]      |
|  [Activity] [Notes]                              |
|                                                  |
|  Health Questionnaire                            |
|                                                  |
|  PAR-Q Status: ✓ Completed (Jan 15, 2025)        |
|                                                  |
|  Medical Conditions                              |
|  • Asthma (mild)                                 |
|  • High Blood Pressure (controlled)              |
|                                                  |
|  Current Medications                             |
|  • Albuterol Inhaler (as needed)                 |
|  • Lisinopril 10mg daily                         |
|                                                  |
|  Allergies                                        |
|  • Penicillin                                    |
|  • Peanuts                                       |
|                                                  |
|  Injuries                                        |
|  • ACL tear (right knee) - 2018, fully recovered |
|  • Rotator cuff strain - 2020, resolved          |
|                                                  |
|  Fitness Level: Intermediate                     |
|                                                  |
|  Limitations                                     |
|  • Avoid deep lunges due to previous knee injury |
|  • No overhead pressing >135 lbs                 |
|                                                  |
|  [View Full PAR-Q]                               |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  John Doe                        [Edit] [×]      |
|                                                  |
|  [Overview] [Health] [Progress] [Programs]      |
|  [Activity] [Notes]                              |
|                                                  |
|  Progress Photos                                 |
|                                                  |
|  [+ Upload Photo]  [Filter Date ▼]  [Compare]   |
|                                                  |
|  +---------+  +---------+  +---------+           |
|  | [Photo] |  | [Photo] |  | [Photo] |           |
|  | Jan 15  |  | Feb 15  |  | Mar 15  |           |
|  | 2025    |  | 2025    |  | 2025    |           |
|  +---------+  +---------+  +---------+           |
|                                                  |
|  +---------+  +---------+  +---------+           |
|  | [Photo] |  | [Photo] |  | [Photo] |           |
|  | Apr 15  |  | May 15  |  | Jun 15  |           |
|  | 2025    |  | 2025    |  | 2025    |           |
|  +---------+  +---------+  +---------+           |
|                                                  |
|  Measurements                                    |
|                                                  |
|  Weight Progress                                 |
|  200 ┤                                          |
|  195 ┤      ●                                   |
|  190 ┤           ●                              |
|  185 ┤                ●                         |
|  180 ┤                                          |
|       Jan   Feb   Mar   Apr   May   Jun         |
|                                                  |
|  [+ Add Measurement]  [Export Data]              |
+--------------------------------------------------+
```

## Dependencies
- Client creation (STORY-003-01) must be complete
- Client list (STORY-003-02) must be complete
- File storage service configured
- Chart library installed
- Health questionnaire system in place
- Program assignment system ready

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for profile endpoints
- [ ] File upload tests completed
- [ ] Performance tests with large datasets
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Profile load time <3 seconds
- [ ] Mobile responsive design verified
- [ ] Documentation updated

## Notes
- **ALREADY IMPLEMENTED** - This feature has been completed and is in production
- Consider lazy loading for activity timeline to improve performance
- Photo gallery should support swipe gestures on mobile
- Measurements chart should support custom date ranges
- Health questionnaire responses should be exportable
- Add "print profile" feature for offline reference
- Consider adding client goals with target dates and reminders
- Progress photos should have before/after comparison view
- Measurements could support custom fields
- Activity timeline should be filterable by type
