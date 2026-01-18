# Story 008-07: Business Hours

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-07
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 10

## User Story
**As a** trainer
**I want to** set business hours
**So that** clients know when to expect responses

## Acceptance Criteria
- [ ] Weekly schedule setup (Monday-Sunday)
- [ ] Multiple time slots per day
- [ ] Holiday schedule management
- [ ] Time zone handling
- [ ] Auto-response message outside hours
- [ ] Override for emergencies
- [ ] Business hours visible to clients
- [ ] Vacation mode with dates
- [ ] Response time expectations display
- [ ] Schedule templates (work week, flexible)
- [ ] Copy hours from previous week
- [ ] Instant availability toggle

## Technical Implementation

### Frontend Tasks
1. **Create BusinessHoursEditor Component**
   - Weekly schedule grid (Mon-Sun)
   - Add/remove time slots per day
   - Time range pickers (start/end)
   - Enable/disable entire day toggle
   - Quick preset templates
   - Copy schedule to other days
   - Preview what clients see

2. **Create HolidayScheduler Component**
   - Add holiday dates
   - Recurring holidays (Christmas, etc.)
   - Custom holiday names
   - Delete holidays
   - Holiday auto-response message

3. **Create AutoResponseEditor Component**
   - Custom message for outside hours
   - Custom message for holidays
   - Custom message for vacation
   - Message preview
   - Variable placeholders (next available time, etc.)

4. **Create VacationMode Component**
   - Start/end date picker
   - Vacation mode toggle
   - Away message
   - Emergency contact option
   - Override individual conversations

5. **Create BusinessHoursDisplay Component** (Client View)
   - Show trainer's availability
   - Current status indicator (available/unavailable)
   - Next available time
   - Response time expectation
   - Time zone display
   - Holiday notices

6. **Create AvailabilityToggle Component**
   - Quick on/off switch
   - Status indicator
   - Custom temporary status
   - Duration selector

### Backend Tasks
1. **Create Business Hours Endpoints**
   ```typescript
   GET  /api/trainer/business-hours - Get business hours
   PUT  /api/trainer/business-hours - Update business hours
   POST /api/trainer/business-hours/holidays - Add holiday
   DELETE /api/trainer/business-hours/holidays/:id - Remove holiday
   POST /api/trainer/vacation - Set vacation mode
   GET  /api/trainer/:id/availability - Get availability status
   PUT  /api/trainer/auto-response - Update auto-response message
   ```

2. **Implement BusinessHoursService**
   ```typescript
   class BusinessHoursService {
     async getBusinessHours(trainerId: string)
     async updateBusinessHours(trainerId: string, schedule: WeeklySchedule)
     async addHoliday(trainerId: string, holiday: HolidayDto)
     async removeHoliday(trainerId: string, holidayId: string)
     async setVacationMode(trainerId: string, vacation: VacationDto)
     async isAvailable(trainerId: string, checkTime?: Date): Promise<boolean>
     async getNextAvailableTime(trainerId: string): Promise<Date>
     async getAutoResponse(trainerId: string, context: string): Promise<string>
     async calculateResponseTime(trainerId: string): Promise<string>
   }
   ```

3. **Implement Timezone Handling**
   - Convert trainer's timezone to client's timezone
   - Display times in client's local timezone
   - Handle daylight saving time
   - Store all times in UTC

4. **Database Schema Updates**
   ```prisma
   model BusinessHours {
     id              String   @id @default(uuid())
     trainerId       String   @unique
     trainer         User     @relation(fields: [trainerId], references: [id])
     schedule        Json // Weekly schedule
     autoResponse    String?  @db.Text
     vacationMode    Boolean  @default(false)
     vacationStart   DateTime?
     vacationEnd     DateTime?
     vacationMessage String?  @db.Text
     isInstantlyAvailable Boolean @default(false)
     responseTimeExpectation String? // e.g., "Within 24 hours"
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
   }

   model TimeSlot {
     id              String   @id @default(uuid())
     businessHoursId String
     dayOfWeek       Int // 0-6 (Sunday-Saturday)
     startTime       String // HH:MM format
     endTime         String // HH:MM format
     isAvailable     Boolean  @default(true)

     @@index([businessHoursId, dayOfWeek])
   }

   model Holiday {
     id              String   @id @default(uuid())
     trainerId       String
     trainer         User     @relation(fields: [trainerId], references: [id])
     name            String
     date            DateTime
     isRecurring     Boolean  @default(false)
     recurrenceMonth Int? // 1-12
     recurrenceDay   Int? // 1-31
     autoResponse    String?
     createdAt       DateTime @default(now())

     @@index([trainerId, date])
   }
   ```

5. **Implement Auto-Response Logic**
   - Check if message sent outside business hours
   - Check if current date is a holiday
   - Check if trainer is on vacation
   - Return appropriate auto-response
   - Calculate next available time

### Data Models
```typescript
interface BusinessHours {
  id: string;
  trainerId: string;
  schedule: WeeklySchedule;
  autoResponse?: string;
  vacationMode: boolean;
  vacationStart?: Date;
  vacationEnd?: Date;
  vacationMessage?: string;
  isInstantlyAvailable: boolean;
  responseTimeExpectation?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface TimeSlot {
  startTime: string; // HH:MM in trainer's timezone
  endTime: string; // HH:MM in trainer's timezone
  isAvailable: boolean;
}

interface Holiday {
  id: string;
  trainerId: string;
  name: string;
  date: Date;
  isRecurring: boolean;
  recurrenceMonth?: number;
  recurrenceDay?: number;
  autoResponse?: string;
}

interface AvailabilityStatus {
  isAvailable: boolean;
  nextAvailableTime?: Date;
  currentStatus: 'available' | 'outside-hours' | 'holiday' | 'vacation';
  responseTimeExpectation: string;
  businessHours: WeeklySchedule;
  timezone: string;
}

interface AutoResponseContext {
  messageType: 'outside-hours' | 'holiday' | 'vacation';
  nextAvailableTime?: Date;
  trainerName: string;
}
```

## Test Cases
1. **Happy Path**
   - Set business hours for all days
   - Add multiple time slots per day
   - Add holiday with custom message
   - Enable vacation mode
   - Update auto-response message
   - Toggle instant availability
   - View business hours as client
   - Receive auto-response outside hours

2. **Edge Cases**
   - Time slot ends after midnight (e.g., 11 PM - 2 AM)
   - Client in different timezone
   - Overlapping time slots
   - Holiday on weekend
   - Vacation end before start
   - Empty schedule (no available hours)
   - Recurring holiday on leap year

3. **Performance Tests**
   - Check availability for 1000 trainers
   - Calculate next available time
   - Handle multiple concurrent requests
   - Timezone conversion performance

4. **Security Tests**
   - Access control (only trainer can edit their hours)
   - Auto-response message sanitization
   - Prevent manipulation of other trainers' schedules

## UI/UX Mockups
```
+------------------------------------------+
|  Business Hours Settings                 |
|                                          |
|  Timezone: [UTC-5 (Eastern Time) ▼]      |
|                                          |
|  Weekly Schedule                         |
|  +--------------------------------------+ |
|  | Monday  [8:00 AM] - [6:00 PM]  [✕]  | |
|  |         [+ Add time slot]            | |
|  +--------------------------------------+ |
|  | Tuesday [8:00 AM] - [6:00 PM]  [✕]  | |
|  +--------------------------------------+ |
|  | Wednesday [8:00 AM] - [6:00 PM] [✕]| |
|  +--------------------------------------+ |
|  | Thursday [8:00 AM] - [6:00 PM]  [✕] | |
|  +--------------------------------------+ |
|  | Friday [8:00 AM] - [6:00 PM]    [✕] | |
|  +--------------------------------------+ |
|  | Saturday [Unavailable]               | |
|  +--------------------------------------+ |
|  | Sunday [Unavailable]                 | |
|  +--------------------------------------+ |
|                                          |
|  Quick Templates                         |
|  [Standard Work Week] [Flexible] [Custom]|
|                                          |
|  [Save Changes]                          |
+------------------------------------------+

+------------------------------------------+
|  Holidays & Vacations                    |
|                                          |
|  Upcoming Holidays                       |
|  +--------------------------------------+ |
|  | Christmas - Dec 25, 2025     [Edit] | |
|  | New Year's - Jan 1, 2026      [Edit] | |
|  +--------------------------------------+ |
|                                          |
|  [+ Add Holiday]                         |
|                                          |
|  Vacation Mode                           |
|  [ ] Currently on vacation               |
|                                          |
|  When on vacation:                       |
|  +--------------------------------------+ |
|  | Start Date: [January 15, 2025 ▼]    | |
|  | End Date: [January 22, 2025 ▼]      | |
|  +--------------------------------------+ |
|                                          |
|  Vacation Message:                       |
|  +--------------------------------------+ |
|  | Thanks for your message! I'm...     | |
|  |                                      | |
|  |                                    0/500|
 |  +--------------------------------------+ |
|                                          |
|  [Enable Vacation Mode]                  |
+------------------------------------------+

+------------------------------------------+
|  Auto-Response Messages                  |
|                                          |
|  Outside Business Hours                   |
|  +--------------------------------------+ |
|  | Thanks for reaching out! I'm...     | |
|  | I'll get back to you on {next_day}   | |
|  | at {next_available_time}.            | |
|  |                                      | |
|  |                                    0/500|
|  +--------------------------------------+ |
|                                          |
|  Holiday Response                        |
|  +--------------------------------------+ |
|  | I'm currently away for {holiday}... | |
|  |                                      | |
|  |                                    0/500|
|  +--------------------------------------+ |
|                                          |
|  Available Variables:                    |
|  • {trainer_name}                        |
|  • {next_day}                            |
|  • {next_available_time}                 |
|  • {holiday}                             |
|                                          |
|  [Save Messages]                         |
+------------------------------------------+

+------------------------------------------+
|  Trainer Availability (Client View)      |
|                                          |
|  John Doe                                |
|                                          |
|  Status: [🟢 Available Now]              |
|  or                                      |
|  Status: [🔴 Currently Unavailable]      |
|                                          |
|  Business Hours (UTC-5):                 |
|  Monday - Friday: 8:00 AM - 6:00 PM      |
|  Saturday - Sunday: Unavailable          |
|                                          |
|  Next Available:                         |
|  Tomorrow at 8:00 AM                     |
|                                          |
|  Response Time:                           |
|  Usually within 2 hours during business  |
|  hours                                  |
|                                          |
|  Currently on vacation until Jan 22     |
+------------------------------------------+

+------------------------------------------+
|  Quick Actions                           |
|                                          |
|  Instant Availability                    |
|  [🟢 Available Now]                      |
|                                          |
|  Or temporarily set status:              |
|  +--------------------------------------+ |
|  | [Away for 1 hour]                    | |
|  | [Away for 2 hours]                   | |
|  | [Available until 5 PM]               | |
|  | [Custom time]                        | |
|  +--------------------------------------+ |
|                                          |
|  Custom Status Message:                  |
|  [In a training session_________________] |
|                                          |
|  [Set Status]                            |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages
- STORY-008-04: Notification Management
- Timezone library (moment-timezone or date-fns-tz)
- Business hours validation logic

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for business hours logic
- [ ] Timezone conversion tested
- [ ] Auto-response tested
- [ ] Client view tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Default: Standard business hours (9 AM - 5 PM, Mon-Fri)
- Timezone: Use trainer's local timezone for setting, convert for clients
- Maximum time slots per day: 5
- Recurring holidays: Christmas (Dec 25), New Year (Jan 1)
- Auto-response variables: {trainer_name}, {next_day}, {next_available_time}, {holiday}
- Response time expectation: Default "Within 24 hours"
- Instant availability: Overrides business hours temporarily
- Consider adding appointment scheduling in future
- GDPR: Respect client's right to not receive auto-responses
- Accessibility: Ensure business hours are screen reader friendly
