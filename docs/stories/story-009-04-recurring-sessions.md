# Story 009-04: Manage Recurring Sessions

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-04
**Priority**: P1 (High)
**Story Points**: 13
**Sprint**: Sprint 10

## User Story
**As a** trainer
**I want to** set up recurring training sessions for regular clients
**So that I** can efficiently schedule ongoing training programs

## Acceptance Criteria
- [ ] Create recurring session series (weekly, bi-weekly, monthly)
- [ ] Set custom recurrence patterns (e.g., every Monday and Wednesday)
- [ ] Define end date or maximum number of sessions
- [ ] Skip specific dates in the series
- [ ] Edit entire series or individual occurrences
- [ ] View all upcoming sessions in the series
- [ ] Conflict detection for future dates
- [ ] Require client confirmation for recurring series
- [ ] Automatic package session deduction
- [ ] Pause and resume recurring series
- [ ] Cancel entire series or individual sessions
- [ ] Set different notes for each occurrence
- [ ] Handle exceptions (holidays, client unavailability)

## Technical Implementation

### Frontend Tasks
1. **Create RecurringSessionModal Component**
   - Base session details (client, type, duration, location)
   - Recurrence pattern selector
   - Frequency options: daily, weekly, bi-weekly, monthly, custom
   - Day of week multi-select (for weekly patterns)
   - End condition: date or count
   - Exceptions list (dates to skip)
   - Series notes vs. individual session notes
   - Preview calendar of all sessions

2. **Create RecurrencePatternSelector Component**
   - Simple presets: "Every week", "Every 2 weeks", "Every month"
   - Custom pattern builder
   - Day of week checkboxes (Mon-Sun)
   - Interval input (every X days/weeks)
   - Month day selector (1-31 or "first Monday", etc.)
   - End date picker or session count input

3. **Create RecurringSessionList Component**
   - Display all sessions in the series
   - Group by month or show all
   - Show conflict warnings
   - Indicate skipped/exception dates
   - Edit individual session button
   - Remove from series option
   - Series statistics (total sessions, completed, remaining)

4. **Create SeriesEditOptions Component**
   - Radio buttons for edit scope:
     - "This session only"
     - "This and all following sessions"
     - "All sessions in series"
   - Warning about implications
   - Confirmation dialog

5. **Create RecurringPreview Component**
   - Calendar view showing all recurring sessions
   - Highlight conflicts and exceptions
   - Scrollable list view
   - Session count summary
   - Package deduction preview

### Backend Tasks
1. **Create Recurring Session Endpoints**
   ```typescript
   POST /api/schedule/recurring - Create recurring series
   Body: CreateRecurringSeriesDto
   Response: RecurringSeries with all generated appointments

   GET /api/schedule/recurring/:id - Get recurring series details
   Query params:
   - includeInstances: boolean (default true)
   - startDate: ISO date (optional)
   - endDate: ISO date (optional)

   PUT /api/schedule/recurring/:id - Update series definition
   Body: UpdateRecurringSeriesDto
   Query params: scope ('all' | 'this_and_following' | 'single')

   DELETE /api/schedule/recurring/:id - Cancel entire series
   Body: { reason?: string, applyTo?: 'all' | 'future' }

   POST /api/schedule/recurring/:id/exceptions - Add exception
   Body: { date: Date, reason?: string }

   DELETE /api/schedule/recurring/:id/exceptions/:date - Remove exception

   PUT /api/schedule/recurring/:id/pause - Pause series
   Body: { pauseFrom: Date, resumeAt?: Date }

   GET /api/schedule/recurring/:id/conflicts - Check for conflicts
   ```

2. **Implement RecurrenceService**
   ```typescript
   class RecurrenceService {
     async createSeries(dto: CreateRecurringSeriesDto, trainerId: string)
     async getSeries(seriesId: string, userId: string)
     async updateSeries(seriesId: string, dto: UpdateRecurringSeriesDto, scope: EditScope)
     async cancelSeries(seriesId: string, options: CancelOptions)
     async addException(seriesId: string, date: Date, reason?: string)
     async removeException(seriesId: string, date: Date)
     async pauseSeries(seriesId: string, pauseFrom: Date, resumeAt?: Date)
     async generateInstances(series: RecurringSeries, startDate: Date, endDate: Date)
     async checkConflicts(seriesId: string)
     async deductPackageSessions(seriesId: string, count: number)
     async confirmSeries(seriesId: string, clientId: string)
   }
   ```

3. **Recurrence Generation Algorithm**
   - Parse recurrence pattern (RFC 5545 RRULE style)
   - Generate all occurrences within date range
   - Apply exception dates
   - Check against trainer availability
   - Detect conflicts with existing appointments
   - Handle timezone conversions
   - Account for daylight saving time
   - Generate appointment instances

4. **Series Editing Logic**
   - Scope: "this only" - create exception, keep series
   - Scope: "this and following" - split series into two
   - Scope: "all" - update series definition, regenerate all
   - Handle package session adjustments
   - Send notifications for changes

5. **Database Schema**
   ```sql
   -- Recurring appointments
   recurring_appointments (
     id UUID PRIMARY KEY,
     appointment_id UUID REFERENCES appointments(id),
     trainer_id UUID REFERENCES users(id),
     client_id UUID REFERENCES users(id),
     recurrence_pattern VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
     recurrence_details JSONB NOT NULL, -- { daysOfWeek: [1,3,5], interval: 1 }
     start_date DATE NOT NULL,
     end_date DATE,
     max_occurrences INTEGER,
     exceptions JSONB, -- [{ date: '2025-01-15', reason: 'Holiday' }]
     is_active BOOLEAN DEFAULT true,
     is_paused BOOLEAN DEFAULT false,
     pause_start_date DATE,
     package_id UUID REFERENCES booking_packages(id),
     requires_confirmation BOOLEAN DEFAULT true,
     confirmation_status VARCHAR(20), -- 'pending', 'confirmed', 'declined'
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   )

   -- Link instances to series
   appointment_instances (
     id UUID PRIMARY KEY,
     appointment_id UUID REFERENCES appointments(id),
     recurring_series_id UUID REFERENCES recurring_appointments(id),
     instance_date DATE NOT NULL,
     instance_order INTEGER NOT NULL, -- 1, 2, 3...
     is_exception BOOLEAN DEFAULT false,
     exception_reason VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(recurring_series_id, instance_date)
   )
   ```

### Data Models
```typescript
interface CreateRecurringSeriesDto {
  trainerId: string;
  clientId: string;
  appointmentType: AppointmentType;
  title: string;
  description?: string;

  // Base session details
  durationMinutes: number;
  location: Location;
  isOnline: boolean;

  // Recurrence pattern
  recurrencePattern: RecurrencePattern;

  // Series settings
  endDate?: Date;
  maxOccurrences?: number;

  // Optional
  sessionNotes?: string;
  packageId?: string;
  requiresConfirmation: boolean;
}

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly patterns
  dayOfMonth?: number; // For monthly (1-31)
  weekOfMonth?: number; // For "first Monday", etc.
  customPattern?: string; // Free-form description
}

interface RecurringSeries {
  id: string;
  baseAppointment: Appointment;
  recurrencePattern: RecurrencePattern;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  exceptions: Exception[];
  instances: AppointmentInstance[];
  isActive: boolean;
  isPaused: boolean;
  packageDeduction: {
    totalSessions: number;
    sessionsCreated: number;
    sessionsDeducted: number;
  };
  confirmationStatus: 'pending' | 'confirmed' | 'declined';
  createdAt: Date;
}

interface AppointmentInstance {
  id: string;
  appointmentId: string;
  recurringSeriesId: string;
  date: Date;
  order: number; // 1st, 2nd, 3rd session
  isException: boolean;
  exceptionReason?: string;
  appointment: Appointment;
}

interface Exception {
  date: Date;
  reason?: string;
  isSkipped: boolean;
  rescheduledTo?: Date;
}

enum EditScope {
  THIS_ONLY = 'this_only',
  THIS_AND_FOLLOWING = 'this_and_following',
  ALL = 'all'
}

interface UpdateRecurringSeriesDto {
  pattern?: RecurrencePattern;
  endDate?: Date;
  maxOccurrences?: number;
  sessionNotes?: string;
  location?: Location;
  durationMinutes?: number;
}
```

## Test Cases
1. **Happy Path**
   - Create weekly recurring series (every Monday)
   - Set end date after 12 weeks
   - Generate 12 appointments
   - Client confirms series
   - Deduct 12 sessions from package
   - View all sessions in calendar

2. **Custom Patterns**
   - Every Monday and Wednesday
   - Every 2 weeks on Tuesday
   - First and third Friday of each month
   - Daily for 2 weeks
   - Every 30 days

3. **Editing Series**
   - Edit single occurrence time only
   - Edit this and all following (splits series)
   - Edit all sessions in series
   - Add exception for specific date
   - Pause and resume series

4. **Conflicts**
   - Detect conflict with existing appointment
   - Show warning but allow creation
   - Skip conflicting dates automatically
   - Manual conflict resolution

5. **Package Handling**
   - Insufficient sessions for full series
   - Warning before creation
   - Allow partial series creation
   - Refund sessions on cancellation

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Create Recurring Session Series                         |
+----------------------------------------------------------+
|  Base Session Details:                                   |
|  Client: [Sarah Miller ▼]                                |
|  Session Type: [1-on-1 Training ▼]                       |
|  Duration: [60 minutes ▼]                                |
|  Location: [In-Person at Gym ▼]                          |
|                                                          |
|  Recurrence Pattern:                                     |
|  ○ Every week                                            |
|  ○ Every 2 weeks                                         |
|  ○ Every month                                           |
|  ◉ Custom pattern                                        |
|                                                          |
|  Repeat every: [1] [week(s)]                             |
|  On: ☑ Monday ☑ Wednesday ☐ Friday                      |
|                                                          |
|  End:                                                    |
|  ◉ On [April 30, 2025]                                   |
|  ○ After [12] sessions                                   |
|  ○ No end date                                           |
|                                                          |
|  Exceptions:                                             |
|  +-----------------------------------+                   |
|  | Skip: January 20, 2025 [Remove] |                   |
|  | Skip: February 17, 2025 [Remove]| [+ Add Date]      |
|  +-----------------------------------+                   |
|                                                          |
|  Package Balance: 12 sessions                            |
|  Sessions to Create: 24                                  |
|  ⚠️ Insufficient sessions for full series                 |
|  [Upgrade Package] [Create Partial Series]               |
|                                                          |
|  [Cancel]  [Preview Sessions]  [Create Series]           |
+----------------------------------------------------------+
```

**Recurring Sessions Preview:**
```
+----------------------------------------------------------+
|  Recurring Series Preview                    [Edit][×]   |
+----------------------------------------------------------+
|  Every Monday & Wednesday from Jan 15 - Apr 30, 2025     |
|                                                          |
|  Sessions Created: 24                                    |
|  Conflicts: 2 (January 20, February 17)                 |
|  Package Sessions: 24 deducted from balance              |
|                                                          |
|  January 2025:                                           |
|  +---------------+  +---------------+                    |
|  | Mon Jan 13    |  | Mon Jan 20    |                    |
|  | 09:00 AM      |  | ⚠️ Conflict    |                    |
|  | [View]        |  | [Resolve]     |                    |
|  +---------------+  +---------------+                    |
|  +---------------+  +---------------+                    |
|  | Wed Jan 15    |  | Wed Jan 22    |                    |
|  | 09:00 AM      |  | 09:00 AM      |                    |
|  | [View]        |  | [View]        |                    |
|  +---------------+  +---------------+                    |
|  +---------------+  +---------------+                    |
|  | Mon Jan 27    |  | Wed Jan 29    |                    |
|  | 09:00 AM      |  | 09:00 AM      |                    |
|  | [View]        |  | [View]        |                    |
|  +---------------+  +---------------+                    |
|                                                          |
|  [View All 24 Sessions]  [Download Schedule]             |
|                                                          |
|  [Back]  [Confirm & Create Series]                       |
+----------------------------------------------------------+
```

**Edit Series Options:**
```
+----------------------------------------------------------+
|  Edit Recurring Session                       [×]        |
+----------------------------------------------------------+
|  You're editing the session for Monday, January 27, 2025  |
|                                                          |
|  What do you want to edit?                                |
|                                                          |
|  ◉ This session only                                     |
|     Changes will not affect other sessions in the series |
|                                                          |
|  ○ This and all following sessions                       |
|     Creates a new series starting from this date         |
|                                                          |
|  ○ All sessions in the series                            |
|     Updates all 24 sessions                              |
|                                                          |
|  New Time: [10:00 AM - 11:00 AM]                         |
|                                                          |
|  ⚠️ This change will affect 24 sessions                   |
|  [View Affected Sessions]                                |
|                                                          |
|  Reason for change: [________________________]            |
|                                                          |
|  [Cancel]  [Save Changes]                                |
+----------------------------------------------------------+
```

## Dependencies
- Story 009-01 (View Schedule) - for viewing series in calendar
- Story 009-02 (Set Availability) - for checking availability
- Story 009-03 (Book Session) - base booking functionality
- Package Management (EPIC-005) - for session deduction
- Communication system (EPIC-008) - for client confirmation

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for recurrence logic
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Timezone handling verified

## Notes
- Use RFC 5545 (iCalendar) RRULE format for recurrence patterns
- Consider using a library like rrule.js for pattern generation
- Implement limits to prevent excessive series creation (max 1 year)
- Add database indexes for efficient series queries
- Consider background jobs for generating long series
- Cache recurrence calculations for performance
- Test DST transitions thoroughly
- Add audit logging for series changes
- Consider adding "series templates" for common patterns
