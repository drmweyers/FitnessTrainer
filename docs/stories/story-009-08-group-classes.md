# Story 009-08: Group Class Management

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-08
**Priority**: P2 (Medium)
**Story Points**: 13
**Sprint**: Sprint 11

## User Story
**As a** trainer
**I want to** schedule and manage group training classes
**So that I** can train multiple clients efficiently

## Acceptance Criteria
- [ ] Create group class with capacity limits
- [ ] Set minimum and maximum participants
- [ ] Clients can register for open classes
- [ ] Waitlist functionality when class is full
- [ ] Automatic waitlist promotion when spots open
- [ ] Track attendance for each class
- [ ] Class descriptions and requirements
- [ ] Equipment needed for class
- [ ] Difficulty level indicators
- [ ] Send automatic confirmations on registration
- [ ] Cancel class if minimum not met
- [ ] Notify participants of cancellations
- [ ] Recurring class schedules
- [ ] Class pricing (per session or package)

## Technical Implementation

### Frontend Tasks
1. **Create GroupClassCreator Component**
   - Class name and description
   - Capacity settings (min/max participants)
   - Duration and schedule
   - Difficulty level selector
   - Equipment checklist
   - Pricing options (per session, package required)
   - Recurrence settings
   - Class image upload
   - Save and publish options

2. **Create ClassSchedule Component**
   - Calendar view of scheduled classes
   - Filter by class type
   - Show participant count (X/Y)
   - Indicate waitlist availability
   - Click to view class details
   - Quick actions (cancel, edit, view attendees)

3. **Create ClassRegistration Component** (Client View)
   - Browse available classes
   - Class details and description
   - Participant list (if public)
   - Register button
   - Waitlist join option
   - Registration confirmation
   - Add to calendar option

4. **Create ClassAttendanceTracker Component**
   - List of registered participants
   - Check-in/check-out buttons
   - Mark as attended or no-show
   - Notes field for each participant
   - Attendance summary
   - Export attendance report

5. **Create WaitlistManager Component**
   - View waitlist for each class
   - Waitlist position for each client
   - Manual promotion capability
   - Automatic promotion settings
   - Notify waitlisted clients
   - Waitlist analytics

6. **Create ClassDetailsModal Component**
   - Class information display
   - Trainer bio
   - Requirements and equipment
   - Current participants list
   - Register/Join waitlist buttons
   - Share class option
   - Reviews and ratings (future)

### Backend Tasks
1. **Create Group Class Endpoints**
   ```typescript
   POST /api/schedule/classes - Create new group class
   Body: CreateGroupClassDto
   Response: GroupClass

   GET /api/schedule/classes - Get list of classes
   Query params: trainerId, startDate, endDate, status, difficulty
   Response: Paginated class list

   GET /api/schedule/classes/:id - Get class details
   Response: GroupClass with schedules and registrations

   PUT /api/schedule/classes/:id - Update class
   Body: UpdateGroupClassDto

   DELETE /api/schedule/classes/:id - Delete class

   POST /api/schedule/classes/:id/schedule - Schedule class instance
   Body: ScheduleClassInstanceDto

   POST /api/schedule/classes/:classId/register - Register for class
   Body: { clientId, packageId? }
   Response: ClassRegistration

   DELETE /api/schedule/classes/:classId/registrations/:id - Cancel registration

   GET /api/schedule/classes/:classId/waitlist - Get waitlist
   Response: Waitlist entries

   POST /api/schedule/classes/:classId/attendance - Record attendance
   Body: AttendanceRecordDto

   POST /api/schedule/classes/:classId/cancel - Cancel class
   Body: { reason, notifyParticipants, refundParticipants }

   GET /api/schedule/classes/:classId/participants - Get participant list
   ```

2. **Implement GroupClassService**
   ```typescript
   class GroupClassService {
     async createClass(dto: CreateGroupClassDto, trainerId: string)
     async updateClass(classId: string, dto: UpdateGroupClassDto, trainerId: string)
     async getClass(classId: string, userId: string)
     async listClasses(filters: ClassFilters)
     async scheduleClassInstance(classId: string, dto: ScheduleDto)
     async registerClient(classId: string, clientId: string, dto: RegistrationDto)
     async cancelRegistration(classId: string, registrationId: string, clientId: string)
     async getWaitlist(classId: string)
     async addToWaitlist(classId: string, clientId: string)
     async removeFromWaitlist(classId: string, waitlistId: string)
     async promoteFromWaitlist(classId: string)
     async recordAttendance(classId: string, dto: AttendanceDto)
     async cancelClass(classId: string, dto: CancelClassDto)
     async checkMinimumParticipants(classId: string)
     async notifyParticipants(classId: string, message: string, type: NotificationType)
   }
   ```

3. **Waitlist Management Algorithm**
   - Auto-promote when spot opens
   - Maintain waitlist order (FIFO)
   - Check waitlist eligibility (package, time conflict)
   - Notify promoted clients
   - Set response deadline
   - Promote next if no response
   - Handle waitlist expiration

4. **Database Schema**
   ```sql
   -- Group classes
   group_classes (
     id UUID PRIMARY KEY,
     trainer_id UUID REFERENCES users(id),
     class_name VARCHAR(255) NOT NULL,
     description TEXT,
     class_image_url VARCHAR(500),
     max_participants INTEGER NOT NULL,
     min_participants INTEGER DEFAULT 1,
     duration_minutes INTEGER NOT NULL,
     difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'all_levels'
     equipment_needed TEXT[],
     requirements TEXT,
     pricing_type VARCHAR(20), -- 'per_session', 'package_required', 'free'
     price_per_session DECIMAL(10,2),
     required_package_type VARCHAR(50),
     is_recurring BOOLEAN DEFAULT false,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   )

   -- Class schedules
   class_schedules (
     id UUID PRIMARY KEY,
     group_class_id UUID REFERENCES group_classes(id),
     appointment_id UUID REFERENCES appointments(id),
     scheduled_date DATE NOT NULL,
     start_time TIME NOT NULL,
     end_time TIME NOT NULL,
     location VARCHAR(255),
     is_online BOOLEAN DEFAULT false,
     meeting_link VARCHAR(500),
     current_participants INTEGER DEFAULT 0,
     is_waitlist_open BOOLEAN DEFAULT true,
     status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'full', 'cancelled', 'completed'
     created_at TIMESTAMP DEFAULT NOW()
   )

   -- Class registrations
   class_registrations (
     id UUID PRIMARY KEY,
     class_schedule_id UUID REFERENCES class_schedules(id),
     client_id UUID REFERENCES users(id),
     registration_status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'waitlisted', 'cancelled', 'attended', 'no_show'
     waitlist_position INTEGER,
     package_id UUID REFERENCES booking_packages(id),
     registered_at TIMESTAMP DEFAULT NOW(),
     cancelled_at TIMESTAMP,
     UNIQUE(class_schedule_id, client_id)
   )

   -- Attendance records
   class_attendance (
     id UUID PRIMARY KEY,
     class_schedule_id UUID REFERENCES class_schedules(id),
     client_id UUID REFERENCES users(id),
     registration_id UUID REFERENCES class_registrations(id),
     attended BOOLEAN,
     check_in_time TIMESTAMP,
     notes TEXT,
     recorded_by UUID REFERENCES users(id),
     recorded_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(class_schedule_id, client_id)
   )

   -- Waitlist activity log
   waitlist_activity (
     id UUID PRIMARY KEY,
     class_schedule_id UUID REFERENCES class_schedules(id),
     client_id UUID REFERENCES users(id),
     activity_type VARCHAR(20), -- 'added', 'promoted', 'removed', 'expired'
     from_position INTEGER,
     to_position INTEGER,
     notified_at TIMESTAMP,
     responded_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   )
   ```

### Data Models
```typescript
interface GroupClass {
  id: string;
  trainerId: string;
  trainer: User;
  className: string;
  description: string;
  classImageUrl?: string;
  maxParticipants: number;
  minParticipants: number;
  durationMinutes: number;
  difficultyLevel: DifficultyLevel;
  equipmentNeeded: string[];
  requirements?: string;
  pricingType: PricingType;
  pricePerSession?: number;
  requiredPackageType?: string;
  isRecurring: boolean;
  isActive: boolean;
  schedules: ClassSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

interface ClassSchedule {
  id: string;
  groupClassId: string;
  groupClass: GroupClass;
  appointmentId?: string;
  appointment?: Appointment;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  currentParticipants: number;
  isWaitlistOpen: boolean;
  status: ClassScheduleStatus;
  registrations: ClassRegistration[];
  createdAt: Date;
}

interface ClassRegistration {
  id: string;
  classScheduleId: string;
  classSchedule: ClassSchedule;
  clientId: string;
  client: User;
  registrationStatus: RegistrationStatus;
  waitlistPosition?: number;
  packageId?: string;
  registeredAt: Date;
  cancelledAt?: Date;
}

interface AttendanceRecord {
  id: string;
  classScheduleId: string;
  clientId: string;
  attended: boolean;
  checkInTime?: Date;
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
}

enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ALL_LEVELS = 'all_levels'
}

enum PricingType {
  PER_SESSION = 'per_session',
  PACKAGE_REQUIRED = 'package_required',
  FREE = 'free'
}

enum ClassScheduleStatus {
  SCHEDULED = 'scheduled',
  FULL = 'full',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

enum RegistrationStatus {
  REGISTERED = 'registered',
  WAITLISTED = 'waitlisted',
  CANCELLED = 'cancelled',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show'
}

interface CreateGroupClassDto {
  className: string;
  description: string;
  maxParticipants: number;
  minParticipants?: number;
  durationMinutes: number;
  difficultyLevel: DifficultyLevel;
  equipmentNeeded: string[];
  requirements?: string;
  pricingType: PricingType;
  pricePerSession?: number;
  requiredPackageType?: string;
  isRecurring: boolean;
  classImageUrl?: string;
}
```

## Test Cases
1. **Create and Schedule Class**
   - Create group class with max 10 participants
   - Schedule for next week
   - Set minimum 3 participants
   - Publish class
   - Verify class appears in client view

2. **Registration Flow**
   - Client views available classes
   - Registers for class
   - Receives confirmation
   - Spot deducted from package (if applicable)
   - Class shows 1/10 participants

3. **Waitlist Functionality**
   - Class reaches capacity (10/10)
   - 11th client attempts registration
   - Automatically added to waitlist (position 1)
   - Participant cancels
   - Waitlisted client auto-promoted
   - Notification sent

4. **Minimum Participants**
   - Class requires 5 participants
   - Only 3 registered 24 hours before
   - Automatic cancellation triggered
   - Participants notified
   - Refunds processed

5. **Attendance Tracking**
   - Trainer marks attendance
   - Check-in time recorded
   - Notes added for specific clients
   - Attendance report generated
   - No-show penalties applied (if configured)

6. **Recurring Classes**
   - Create weekly class schedule
   - Generate 4 instances
   - Each instance independent registration
   - Cancel one instance without affecting others

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Create Group Class                        [Save Draft][Publish] |
+----------------------------------------------------------+
|  Class Information                                       |
|  Class Name: [HIIT Bootcamp________________]             |
|  Description:                                            |
|  [High-intensity interval training for all levels...]    |
|                                                          |
|  Class Details:                                          |
|  Duration: [45 minutes]                                  |
|  Difficulty: [Intermediate ▼]                            |
|  Max Participants: [10]  Min: [5]                        |
|                                                          |
|  Equipment Needed:                                       |
|  ☑ Mat  ☑ Dumbbells  ☐ Kettlebell  ☐ Resistance Bands   |
|  [+ Add Equipment]                                       |
|                                                          |
|  Requirements:                                           |
|  [No injuries, able to jump and run____________________] |
|                                                          |
|  Pricing:                                                |
|  ◉ Per session: [$15____]                                |
|  ○ Package required: [Select package ▼]                 |
|  ○ Free class                                            |
|                                                          |
|  Schedule:                                               |
|  ☑ This is a recurring class                             |
|  Repeat every: [1] [week]                                |
|  On: ☑ Monday ☐ Wednesday ☐ Friday                       |
|  End date: [April 30, 2025]                              |
|  Time: [06:00 PM] - [06:45 PM]                           |
|                                                          |
|  Class Image:                                            |
|  [Upload Image]  [Browse...]                             |
+----------------------------------------------------------+
```

**Class Registration (Client View):**
```
+----------------------------------------------------------+
|  HIIT Bootcamp - Group Class                             |
+----------------------------------------------------------+
|  [Class Image]                                           |
|                                                          |
|  Trainer: John Smith                                     |
|  Difficulty: Intermediate ⚡⚡⚡                            |
|                                                          |
|  About this class:                                       |
|  High-intensity interval training combining cardio       |
|  and strength exercises. Perfect for burning calories    |
|  and building endurance.                                  |
|                                                          |
|  Class Details:                                          |
|  📅 Tuesday, January 14, 2025                            |
|  ⏰ 06:00 PM - 06:45 PM (45 minutes)                     |
|  📍 Main Gym - Studio A                                  |
|  👥 7/10 spots available                                  |
|  🏷️ $15 per session                                      |
|                                                          |
|  Equipment Needed:                                       |
|  • Exercise mat                                          |
|  • Dumbbells (5-15 lbs)                                  |
|  • Water bottle                                          |
|                                                          |
|  Participants:                                           |
|  Sarah M.  Mike J.  Emma L.  John D.  +3 more            |
|                                                          |
|  Waitlist available (3 people)                           |
|                                                          |
|  [Register for $15]  [Join Waitlist]  [Share]           |
+----------------------------------------------------------+
```

**Attendance Tracker:**
```
+----------------------------------------------------------+
|  Class Attendance: HIIT Bootcamp                         |
|  Tuesday, January 14, 2025 • 06:00 PM                    |
+----------------------------------------------------------+
|  10 Registered Participants                              |
|                                                          |
|  +------------------+--------+--------+--------+--------+|
|  | Name             | Status | Check-in| Notes  | Action||
|  +------------------+--------+--------+--------+--------+|
|  | Sarah Miller     | ✓ Here | 6:02 PM |        | [View]||
|  +------------------+--------+--------+--------+--------+|
|  | Mike Johnson     | ✓ Here | 5:58 PM |        | [View]||
|  +------------------+--------+--------+--------+--------+|
|  | Emma Lee         | ⏳ Pending|    - |        | [Mark]||
|  +------------------+--------+--------+--------+--------+|
|  | John Davis       | ✗ No-show| - | Sick    | [Note]||
|  +------------------+--------+--------+--------+--------+|
|  | Lisa Brown       | ✓ Here | 6:05 PM | Late   | [View]||
|  +------------------+--------+--------+--------+--------+|
|  | ...              |        |        |        |        ||
|  +------------------+--------+--------+--------+--------+|
|                                                          |
|  Summary:                                                |
|  ✓ Attended: 7  ✗ No-show: 1  ⏳ Pending: 2             |
|                                                          |
|  [Mark All Present]  [Export Report]  [Complete]         |
+----------------------------------------------------------+
```

## Dependencies
- Story 009-01 (View Schedule) - for displaying classes in calendar
- Story 009-02 (Set Availability) - for checking trainer availability
- Story 009-03 (Book Session) - base scheduling functionality
- Package Management (EPIC-005) - for pricing and payments
- Communication system (EPIC-008) - for confirmations and notifications

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for registration and waitlist
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Mobile responsive tested

## Notes
- Consider implementing class ratings and reviews
- Add class categories (yoga, HIIT, strength, etc.)
- Implement class passes/punch cards
- Consider early bird pricing
- Add class reminders similar to 1-on-1 sessions
- Track popular class times for scheduling insights
- Consider adding a "class history" feature
- Implement trainer substitution capability
- Add class cancellation insurance option
- Consider multi-trainer classes
