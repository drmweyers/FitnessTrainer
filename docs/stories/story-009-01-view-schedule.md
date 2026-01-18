# Story 009-01: View Training Schedule

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-01
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 9

## User Story
**As a** trainer
**I want to** view my training schedule in an interactive calendar
**So that I** can manage my time effectively and see all upcoming appointments

## Acceptance Criteria
- [ ] Calendar displays with day, week, and month view options
- [ ] All scheduled appointments visible across all time views
- [ ] Client details shown on hover/click (name, phone, email)
- [ ] Filter calendar by client or service type
- [ ] Print calendar option available
- [ ] Export calendar to PDF
- [ ] Mobile responsive design
- [ ] Quick navigation controls (today, next, previous)
- [ ] Color-coded appointments by type (training, assessment, class)
- [ ] Display session status (scheduled, confirmed, completed, cancelled)
- [ ] Show time zone indicator when viewing different time zones
- [ ] Loading states during data fetch
- [ ] Error handling for failed calendar loads

## Technical Implementation

### Frontend Tasks
1. **Create CalendarView Component**
   - Implement using a calendar library (react-big-calendar or fullcalendar)
   - Build view switcher (day/week/month)
   - Add navigation controls (today, next, previous)
   - Implement responsive layout for mobile devices
   - Add loading skeleton and error states

2. **Create AppointmentCard Component**
   - Display appointment summary in calendar cell
   - Color-code by appointment type
   - Show status indicators (confirmed, cancelled, etc.)
   - Implement hover tooltip with client details
   - Add click handler to open appointment details

3. **Create CalendarFilters Component**
   - Client filter dropdown/autocomplete
   - Service type filter (1-on-1, group, assessment)
   - Status filter (all, upcoming, completed, cancelled)
   - Date range picker
   - Clear filters button

4. **Create AppointmentDetailsModal Component**
   - Show full appointment information
   - Display client contact details
   - Show session notes and workout plan
   - Include action buttons (edit, cancel, reschedule)
   - Add "Add to Calendar" download (.ics file)

5. **Implement Calendar Export Feature**
   - Generate PDF from current calendar view
   - Include date range and filters in export
   - Maintain color coding in PDF
   - Add trainer branding to header

### Backend Tasks
1. **Create Calendar Endpoints**
   ```typescript
   GET /api/schedule/calendar - Get calendar events
   Query params:
   - start: ISO date string (required)
   - end: ISO date string (required)
   - trainerId: UUID (optional, defaults to current user)
   - clientIds: UUID[] (optional filter)
   - appointmentTypes: string[] (optional filter)
   - status: string[] (optional filter)

   Response:
   {
     appointments: Appointment[],
     totalCount: number,
     hasNext: boolean
   }
   ```

2. **Implement SchedulingService**
   ```typescript
   class SchedulingService {
     async getAppointments(params: GetAppointmentsDto, userId: string)
     async getAppointmentById(id: string, userId: string)
     async getAppointmentsByDateRange(start: Date, end: Date, userId: string)
     async getAppointmentsByClient(clientId: string, trainerId: string)
   }
   ```

3. **Database Queries**
   - Optimize queries for date range filtering
   - Add indexes on (trainer_id, start_datetime)
   - Include related data (client, appointment_type)
   - Implement pagination for large date ranges

4. **Calendar Export Endpoint**
   ```typescript
   POST /api/schedule/calendar/export
   Body: { start, end, filters, format }
   Response: PDF file or error
   ```

### Data Models
```typescript
interface Appointment {
  id: string;
  trainerId: string;
  clientId: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  appointmentType: AppointmentType;
  title: string;
  description?: string;
  startDatetime: Date;
  endDatetime: Date;
  durationMinutes: number;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum AppointmentType {
  ONE_ON_ONE = 'one_on_one',
  GROUP_CLASS = 'group_class',
  ASSESSMENT = 'assessment',
  CONSULTATION = 'consultation'
}

enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Appointment;
  color?: string; // Based on appointment type
}

interface GetAppointmentsDto {
  start: Date;
  end: Date;
  trainerId?: string;
  clientIds?: string[];
  appointmentTypes?: AppointmentType[];
  status?: AppointmentStatus[];
}
```

## Test Cases
1. **Happy Path**
   - View calendar in week mode
   - Navigate to different weeks
   - Switch between day/week/month views
   - Click appointment to see details
   - Filter appointments by client
   - Export calendar to PDF

2. **Edge Cases**
   - Calendar with no appointments
   - Calendar with 100+ appointments (performance)
   - Appointments spanning multiple days
   - Overnight appointments
   - Timezone changes
   - Very long appointment titles
   - Overlapping appointments

3. **Error Cases**
   - Failed API call (network error)
   - Invalid date range
   - Unauthorized access (viewing another trainer's calendar)
   - Server timeout with large date ranges

4. **Mobile Tests**
   - Calendar view on mobile device
   - Touch interactions (swipe, tap)
   - Landscape vs portrait orientation
   - Performance on slower mobile devices

## UI/UX Mockups
```
+----------------------------------------------------------+
|  My Schedule                                [Month][Week][Day] |
|                                                  Today     |
|  Filters: [Client_______] [Type_______] [Clear]           |
|                                                          |
|  [<] January 2025 [>]                          Export [PDF] |
+----------------------------------------------------------+
|  Sun      Mon      Tue      Wed      Thu      Fri      Sat |
|-----------+---------+---------+---------+---------+--------|
|           | 09:00   | 09:00   | 09:00   | 09:00   |        |
|           | John D. | Sarah M.| [FREE]  | Mike R. |        |
|           | Training| Assessment      | Training|        |
|           |         | 10:00   | 11:00   | 12:00   |        |
|           | [green] | [blue]  |         | [green] |        |
|-----------+---------+---------+---------+---------+--------|
|           | 14:00   | 14:00   | 14:00   | 14:00   |        |
|           | [FREE]  | Group   | Emma L. | [FREE]  |        |
|           |         | Class   | Training|         |        |
|           |         | 15:00   | 15:00   |         |        |
|           |         | [purple]| [green] |         |        |
+-----------+---------+---------+---------+---------+--------+

Legend:
[green] = 1-on-1 Training
[blue] = Assessment
[purple] = Group Class
```

**Day View:**
```
+----------------------------------------------------------+
|  My Schedule - Tuesday, Jan 14, 2025    [Month][Week][Day] |
|                                                          |
|  09:00 AM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|           ┌─────────────────────────────────────────┐   |
|           │ Sarah Miller - Assessment               │   |
|           │ 📍 Main Gym | 💬 Video Call             │   |
|           │ [View Details] [Edit]                   │   |
|           └─────────────────────────────────────────┘   |
|                                                          |
|  10:00 AM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|           ┌─────────────────────────────────────────┐   |
|           │ FREE SLOT                               │   |
|           └─────────────────────────────────────────┘   |
|                                                          |
|  11:00 AM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   |
|           ┌─────────────────────────────────────────┐   |
|           │ Book Session                            │   |
|           └─────────────────────────────────────────┘   |
+----------------------------------------------------------+
```

## Dependencies
- Client Management (EPIC-003) - for client data
- Authentication system - for user context
- Database schema - appointments table must exist
- Calendar library - react-big-calendar or similar

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for calendar API
- [ ] Manual testing completed on desktop and mobile
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (load calendar in <2s)
- [ ] Documentation updated
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- Use a well-established calendar library to save development time
- Consider offline caching for better performance
- Implement lazy loading for large date ranges
- Add keyboard navigation for accessibility
- Consider adding a "quick book" feature for free slots
- Ensure timezone support from the start (store in UTC, display in user timezone)
