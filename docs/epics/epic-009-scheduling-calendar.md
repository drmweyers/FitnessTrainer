# Epic 009: Scheduling & Calendar

## Epic Overview
**Epic ID**: EPIC-009  
**Epic Name**: Scheduling & Calendar  
**Priority**: P1 (High)  
**Estimated Effort**: 5-6 weeks  
**Dependencies**: EPIC-003 (Client Management), EPIC-008 (Communication)  

## Business Value
Efficient scheduling is crucial for trainers managing multiple clients and for clients booking sessions. This epic streamlines appointment management, reduces no-shows through automated reminders, prevents double-booking, and provides a professional booking experience that saves time for both trainers and clients.

## Features Included

### Calendar Management
- Interactive calendar views (day, week, month)
- Drag-and-drop scheduling
- Recurring appointments
- Multiple calendar support
- Time zone handling
- Calendar sync (Google, Apple, Outlook)
- Color-coded events

### Booking System
- Client self-booking portal
- Availability management
- Booking rules and restrictions
- Package-based booking
- Waitlist functionality
- Cancellation policies
- Rescheduling options

### Appointment Types
- 1-on-1 training sessions
- Group classes
- Assessments/consultations
- Online vs in-person sessions
- Different duration options
- Custom appointment types
- Buffer time settings

### Automated Features
- Reminder notifications
- Booking confirmations
- Cancellation handling
- No-show tracking
- Recurring session setup
- Availability updates
- Schedule optimization

## User Stories

### Story 1: View Training Schedule
**As a** trainer  
**I want to** view my training schedule  
**So that I** can manage my time effectively  

**Acceptance Criteria:**
- Calendar with day/week/month views
- All appointments visible
- Client details on hover/click
- Filter by client or service type
- Print calendar option
- Export to PDF
- Mobile responsive
- Quick navigation controls

### Story 2: Set Availability
**As a** trainer  
**I want to** set my available hours  
**So that** clients can book appropriate times  

**Acceptance Criteria:**
- Weekly availability template
- Override specific dates
- Block time for breaks
- Vacation/holiday settings
- Different availability per service
- Location-based availability
- Minimum notice period
- Maximum advance booking

### Story 3: Book Training Session
**As a** client  
**I want to** book training sessions  
**So that I** can schedule my workouts  

**Acceptance Criteria:**
- See trainer availability
- Select preferred time slots
- Choose session type
- Add session notes
- Receive confirmation
- Add to personal calendar
- View booking history
- Package balance visible

### Story 4: Manage Recurring Sessions
**As a** trainer  
**I want to** set up recurring sessions  
**So that I** can efficiently schedule regular clients  

**Acceptance Criteria:**
- Weekly/bi-weekly/monthly options
- Custom recurrence patterns
- End date or number of sessions
- Skip specific dates
- Bulk edit recurring series
- Conflict detection
- Client confirmation required
- Automatic package deduction

### Story 5: Handle Cancellations
**As a** user  
**I want to** cancel or reschedule sessions  
**So that I** can manage changes  

**Acceptance Criteria:**
- Cancellation policy enforcement
- Minimum notice period
- Reschedule to available slots
- Reason for cancellation
- Automatic notifications
- Credit/refund handling
- Cancellation history
- Policy override options

### Story 6: Send Reminders
**As a** trainer  
**I want** automated reminders sent  
**So that** clients don't miss sessions  

**Acceptance Criteria:**
- Customizable reminder timing
- Multiple reminder options
- SMS/Email/Push notifications
- Include session details
- Confirmation requests
- Custom reminder messages
- Reminder history
- Client preferences

### Story 7: Sync External Calendars
**As a** user  
**I want to** sync with my calendar app  
**So that I** have all appointments in one place  

**Acceptance Criteria:**
- Google Calendar sync
- Apple Calendar sync
- Outlook integration
- Two-way sync option
- Selective sync
- Conflict resolution
- Private event handling
- Sync status indicators

### Story 8: Group Class Management
**As a** trainer  
**I want to** schedule group classes  
**So that I** can train multiple clients  

**Acceptance Criteria:**
- Set class capacity
- Client registration
- Waitlist management
- Attendance tracking
- Class descriptions
- Equipment requirements
- Automatic confirmations
- Class cancellation threshold

## Technical Requirements

### Frontend Components
- CalendarView component
- AppointmentModal component
- AvailabilitySettings component
- BookingWidget component
- RecurrenceSelector component
- TimezoneSelector component
- ConflictResolver component
- ReminderSettings component
- ClassManager component

### Backend Services
- SchedulingService for appointment logic
- AvailabilityService for slot management
- ReminderService for notifications
- SyncService for calendar integration
- RecurrenceService for repeat logic
- ConflictService for overlap detection

### Database Schema
```sql
-- Trainer availability
trainer_availability (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  day_of_week INTEGER, -- 0-6, NULL for specific dates
  specific_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(100),
  service_types TEXT[], -- types of sessions available
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Appointments
appointments (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  appointment_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  start_datetime TIMESTAMP,
  end_datetime TIMESTAMP,
  duration_minutes INTEGER,
  location VARCHAR(255),
  is_online BOOLEAN DEFAULT false,
  meeting_link VARCHAR(500),
  status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Recurring appointments
recurring_appointments (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  recurrence_pattern ENUM('daily', 'weekly', 'biweekly', 'monthly', 'custom'),
  recurrence_details JSONB, -- days of week, interval, etc.
  start_date DATE,
  end_date DATE,
  occurrences_count INTEGER,
  exceptions DATE[], -- skipped dates
  is_active BOOLEAN DEFAULT true
)

-- Appointment instances
appointment_instances (
  id UUID PRIMARY KEY,
  recurring_appointment_id UUID REFERENCES recurring_appointments(id),
  appointment_id UUID REFERENCES appointments(id),
  instance_date DATE,
  is_exception BOOLEAN DEFAULT false,
  exception_reason VARCHAR(255)
)

-- Group classes
group_classes (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  class_name VARCHAR(255),
  description TEXT,
  max_participants INTEGER,
  min_participants INTEGER DEFAULT 1,
  duration_minutes INTEGER,
  equipment_needed TEXT[],
  difficulty_level VARCHAR(50),
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Class schedules
class_schedules (
  id UUID PRIMARY KEY,
  group_class_id UUID REFERENCES group_classes(id),
  appointment_id UUID REFERENCES appointments(id),
  current_participants INTEGER DEFAULT 0,
  is_waitlist_open BOOLEAN DEFAULT true
)

-- Class registrations
class_registrations (
  id UUID PRIMARY KEY,
  class_schedule_id UUID REFERENCES class_schedules(id),
  client_id UUID REFERENCES users(id),
  registration_status ENUM('registered', 'waitlisted', 'cancelled'),
  waitlist_position INTEGER,
  registered_at TIMESTAMP DEFAULT NOW()
)

-- Booking packages
booking_packages (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  trainer_id UUID REFERENCES users(id),
  package_type VARCHAR(50),
  total_sessions INTEGER,
  used_sessions INTEGER DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Cancellations
appointment_cancellations (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  notice_hours INTEGER,
  is_chargeable BOOLEAN,
  refund_amount DECIMAL(10,2),
  cancelled_at TIMESTAMP DEFAULT NOW()
)

-- Reminders
appointment_reminders (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  reminder_type ENUM('email', 'sms', 'push'),
  send_before_minutes INTEGER,
  message_template TEXT,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Calendar sync
calendar_sync_configs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider ENUM('google', 'apple', 'outlook'),
  calendar_id VARCHAR(255),
  sync_token VARCHAR(500),
  last_sync_at TIMESTAMP,
  sync_direction ENUM('push', 'pull', 'both'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Availability overrides
availability_overrides (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  date DATE,
  is_available BOOLEAN,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
)
```

### API Endpoints
- GET /api/schedule/calendar
- GET /api/schedule/availability
- PUT /api/schedule/availability
- POST /api/schedule/appointments
- GET /api/schedule/appointments/:id
- PUT /api/schedule/appointments/:id
- DELETE /api/schedule/appointments/:id
- POST /api/schedule/appointments/:id/cancel
- POST /api/schedule/appointments/:id/reschedule
- GET /api/schedule/slots
- POST /api/schedule/recurring
- PUT /api/schedule/recurring/:id
- POST /api/schedule/classes
- GET /api/schedule/classes
- POST /api/schedule/classes/:id/register
- POST /api/schedule/sync
- GET /api/schedule/reminders
- PUT /api/schedule/reminders

### Integration Requirements
- Google Calendar API
- Apple EventKit
- Microsoft Graph API
- SMS gateway for reminders
- Email service for notifications
- Video conferencing APIs
- Payment system integration

### Time Zone Handling
- Store all times in UTC
- User timezone preferences
- Daylight saving time support
- Cross-timezone booking
- Clear timezone display
- Automatic conversions

## Definition of Done
- [ ] All user stories completed
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for booking flows
- [ ] Calendar sync tested all providers
- [ ] Performance with many appointments
- [ ] Timezone handling verified
- [ ] Mobile responsive
- [ ] Documentation complete
- [ ] Deployed to staging

## UI/UX Requirements
- Intuitive calendar interface
- Drag-and-drop functionality
- Mobile touch gestures
- Quick appointment creation
- Visual availability indicators
- Conflict warnings
- Loading states
- Offline capability
- Print-friendly views
- Accessibility compliant

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Calendar sync conflicts | High | Conflict resolution UI, manual override |
| Double booking | High | Real-time availability, locks |
| Timezone errors | Medium | Extensive testing, clear display |
| No-show management | Medium | Automated tracking, policies |
| Integration failures | Medium | Fallback options, error handling |

## Metrics for Success
- Booking completion rate: >90%
- No-show rate: <10%
- Calendar sync reliability: >99%
- Reminder delivery: >95%
- Average booking time: <2 minutes
- Schedule conflicts: <1%
- User satisfaction: >4.5/5

## Dependencies
- Client Management for user data
- Notification services
- Calendar provider APIs
- Payment system (for packages)
- Video conferencing integration

## Out of Scope
- Complex resource scheduling
- Equipment booking
- Facility management
- Staff scheduling
- Payroll integration
- Advanced analytics
- Multi-location management
