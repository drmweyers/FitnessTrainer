# Story 009-02: Set Availability

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-02
**Priority**: P1 (High)
**Story Points**: 13
**Sprint**: Sprint 9

## User Story
**As a** trainer
**I want to** set my available hours and manage exceptions
**So that** clients can only book appropriate times

## Acceptance Criteria
- [ ] Create weekly availability template (recurring schedule)
- [ ] Set available hours for each day of the week
- [ ] Override availability for specific dates
- [ ] Block time for breaks and personal time
- [ ] Set vacation/holiday periods
- [ ] Configure different availability per service type
- [ ] Set location-based availability (gym vs online)
- [ ] Configure minimum notice period for bookings
- [ ] Set maximum advance booking window
- [ ] Copy availability from one day to another
- [ ] Visual preview of availability in calendar format
- [ ] Bulk update availability for date ranges
- [ ] Set "unavailable" status for entire days
- [ ] Add notes for availability exceptions

## Technical Implementation

### Frontend Tasks
1. **Create AvailabilitySettings Component**
   - Weekly schedule grid with time slots
   - Day-by-day availability editor
   - Time range picker for each day
   - Toggle for available/unavailable
   - Copy settings to other days
   - Save/cancel actions

2. **Create AvailabilityOverride Component**
   - Date picker for specific date overrides
   - Override type: unavailable, custom hours, break
   - Reason field (vacation, holiday, personal, etc.)
   - Bulk override for date ranges
   - Recurring override option

3. **Create BookingRules Component**
   - Minimum notice period input (hours)
   - Maximum advance booking input (days/weeks)
   - Per-service type availability
   - Location-based availability toggle
   - Buffer time between sessions setting

4. **Create AvailabilityPreview Component**
   - Visual calendar showing availability
   - Color-coded available/unavailable slots
   - Conflict warnings with existing appointments
   - Preview changes before saving
   - Side-by-side comparison (current vs. new)

5. **Implement TimeSlotSelector Component**
   - Grid of time slots
   - Multi-select with shift key
   - Quick select buttons (morning, afternoon, evening)
   - Custom time range input

### Backend Tasks
1. **Create Availability Endpoints**
   ```typescript
   GET /api/schedule/availability - Get trainer availability
   Query params:
   - trainerId: UUID (optional, defaults to current user)
   - startDate: ISO date (optional)
   - endDate: ISO date (optional)

   PUT /api/schedule/availability - Update weekly availability
   Body: WeeklyAvailabilityDto

   POST /api/schedule/availability/override - Create date override
   Body: AvailabilityOverrideDto

   DELETE /api/schedule/availability/override/:id - Remove override

   GET /api/schedule/booking-rules - Get booking rules
   PUT /api/schedule/booking-rules - Update booking rules
   ```

2. **Implement AvailabilityService**
   ```typescript
   class AvailabilityService {
     async getWeeklyAvailability(trainerId: string)
     async updateWeeklyAvailability(trainerId: string, data: WeeklyAvailabilityDto)
     async createOverride(trainerId: string, data: CreateOverrideDto)
     async getOverrides(trainerId: string, startDate: Date, endDate: Date)
     async deleteOverride(overrideId: string, trainerId: string)
     async getAvailableSlots(trainerId: string, startDate: Date, endDate: Date)
     async isSlotAvailable(trainerId: string, datetime: Date, duration: number)
     async getBookingRules(trainerId: string)
     async updateBookingRules(trainerId: string, rules: BookingRulesDto)
   }
   ```

3. **Database Schema**
   ```sql
   -- Weekly availability template
   trainer_availability (
     id UUID PRIMARY KEY,
     trainer_id UUID REFERENCES users(id),
     day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
     start_time TIME NOT NULL,
     end_time TIME NOT NULL,
     location VARCHAR(100), -- 'gym', 'online', 'both'
     service_types TEXT[], -- ['one_on_one', 'group_class']
     is_available BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(trainer_id, day_of_week, start_time)
   )

   -- Availability overrides
   availability_overrides (
     id UUID PRIMARY KEY,
     trainer_id UUID REFERENCES users(id),
     date DATE NOT NULL,
     start_time TIME,
     end_time TIME,
     override_type VARCHAR(20) NOT NULL, -- 'unavailable', 'custom', 'break'
     reason VARCHAR(255),
     is_available BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(trainer_id, date, start_time)
   )

   -- Booking rules
   booking_rules (
     id UUID PRIMARY KEY,
     trainer_id UUID REFERENCES users(id) UNIQUE,
     min_notice_hours INTEGER DEFAULT 24,
     max_advance_booking_days INTEGER DEFAULT 14,
     buffer_minutes INTEGER DEFAULT 0,
     allow_same_day BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   )
   ```

4. **Slot Generation Algorithm**
   - Merge weekly availability with overrides
   - Account for existing appointments
   - Apply booking rules (notice period, advance booking)
   - Generate available slots for booking widget
   - Cache results for performance

### Data Models
```typescript
interface WeeklyAvailabilityDto {
  trainerId: string;
  schedule: DayAvailability[];
}

interface DayAvailability {
  dayOfWeek: DayOfWeek; // 0-6
  slots: TimeSlot[];
  isAvailable: boolean;
  locations: Location[];
  serviceTypes: AppointmentType[];
}

interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

interface AvailabilityOverrideDto {
  trainerId: string;
  date: Date;
  overrideType: 'unavailable' | 'custom' | 'break';
  startTime?: string;
  endTime?: string;
  reason?: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

interface BookingRulesDto {
  trainerId: string;
  minNoticeHours: number; // Default 24
  maxAdvanceBookingDays: number; // Default 14
  bufferMinutes: number; // Between sessions
  allowSameDayBooking: boolean;
  sameDayMinNoticeHours?: number;
}

interface AvailableSlot {
  startDateTime: Date;
  endDateTime: Date;
  location: Location;
  availableServiceTypes: AppointmentType[];
}

enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

enum Location {
  GYM = 'gym',
  ONLINE = 'online',
  BOTH = 'both'
}
```

## Test Cases
1. **Happy Path**
   - Set weekly availability for all weekdays
   - Add availability exceptions for vacation
   - Configure booking rules
   - Preview availability in calendar
   - Save changes successfully

2. **Edge Cases**
   - Overlapping time slots
   - End time before start time
   - Midnight crossover (11pm - 1am)
   - Multiple overrides on same date
   - Availability in different time zones
   - Very long unavailability (months)

3. **Validation**
   - Minimum notice period can't be negative
   - Maximum advance booking must be reasonable
   - Can't book outside available hours
   - Break time can't overlap with appointments
   - Must have at least some available hours

4. **Conflict Detection**
   - Existing appointments during availability
   - Warning if removing availability for booked sessions
   - Conflicting overrides on same date
   - Booking rule violations

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Availability Settings                          [Save][Cancel] |
+----------------------------------------------------------+
|  Weekly Schedule                                          |
|  +---------------------------------------------------+    |
|  | Monday    | [09:00 - 12:00] [Add Slot]            |    |
|  |           | [14:00 - 18:00] [Remove]              |    |
|  |           | ☑ Gym  ☑ Online  Types: [1-on-1][Group]|    |
|  +---------------------------------------------------+    |
|  | Tuesday   | [09:00 - 12:00] [Add Slot]            |    |
|  |           | [14:00 - 18:00]                        |    |
|  |           | ☑ Gym  ☑ Online  Types: [1-on-1]      |    |
|  +---------------------------------------------------+    |
|  | Wednesday | [09:00 - 12:00] [Add Slot]            |    |
|  |           | [14:00 - 18:00]                        |    |
|  |           | ☑ Gym  ☐ Online  Types: [1-on-1]      |    |
|  +---------------------------------------------------+    |
|  | Thursday  | [09:00 - 12:00] [Add Slot]            |    |
|  |           | [14:00 - 18:00]                        |    |
|  |           | ☑ Gym  ☑ Online  Types: [1-on-1]      |    |
|  +---------------------------------------------------+    |
|  | Friday    | [09:00 - 12:00] [Add Slot]            |    |
|  |           | [14:00 - 18:00]                        |    |
|  |           | ☑ Gym  ☑ Online  Types: [1-on-1][Group]|    |
|  +---------------------------------------------------+    |
|  | Saturday  | [10:00 - 14:00] [Add Slot]            |    |
|  |           | ☐ Gym  ☑ Online  Types: [Group]       |    |
|  +---------------------------------------------------+    |
|  | Sunday    | [Unavailable]                          |    |
|  +---------------------------------------------------+    |
|                                                           |
|  [Copy to All Weekdays]                                   |
+-----------------------------------------------------------+
```

**Availability Override Modal:**
```
+----------------------------------------------------------+
|  Add Availability Override                        [×]     |
+----------------------------------------------------------+
|  Override Type:                                          |
|  ◉ Unavailable for entire day                            |
|  ○ Custom availability                                   |
|  ○ Break time                                            |
|                                                          |
|  Date: [January 15, 2025]                                |
|                                                          |
|  Time Range:                                             |
|  Start: [09:00 AM]    End: [05:00 PM]                   |
|                                                          |
|  Reason: [Vacation________________________________]       |
|           [Personal][Holiday][Gym Closure][Other]         |
|                                                          |
|  Recurring:                                              |
|  ☐ Repeat weekly     [1] times                           |
|  ☐ Repeat until:   [January 30, 2025]                    |
|                                                          |
|  Notes: [____________________________]                   |
|                                                          |
|  Warning: 3 existing appointments during this period     |
|  [View Appointments]                                     |
|                                                          |
|                          [Cancel]  [Save Override]       |
+----------------------------------------------------------+
```

**Booking Rules:**
```
+----------------------------------------------------------+
|  Booking Settings                                        |
+----------------------------------------------------------+
|  Minimum Notice Period                                   |
|  Clients must book at least [24] hours in advance        |
|                                                          |
|  Maximum Advance Booking                                 |
|  Clients can book up to [14] days in advance             |
|                                                          |
|  Buffer Time                                             |
|  Add [0] minutes between sessions                        |
|                                                          |
|  Same-Day Booking                                        |
|  ☐ Allow same-day bookings                              |
|  Minimum notice: [4] hours                               |
|                                                          |
|  Cancellation Policy                                     |
|  Full refund if cancelled [24] hours before session     |
|                                                          |
|  [Save Settings]                                         |
+----------------------------------------------------------+
```

## Dependencies
- Authentication system - for trainer identification
- Story 009-01 (View Schedule) - to see existing appointments
- Database schema - availability tables must be created
- Timezone handling - consistent timezone management

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for availability API
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Timezone handling verified

## Notes
- Consider bulk operations for setting seasonal availability
- Add "quick set" templates (e.g., "standard 9-5 weekday schedule")
- Implement conflict warnings before saving
- Cache availability calculations for performance
- Consider adding " recurring availability exceptions" for regular holidays
- Add audit trail for availability changes
- Ensure UI handles different time zones correctly
