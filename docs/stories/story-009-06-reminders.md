# Story 009-06: Send Reminders

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-06
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 10

## User Story
**As a** trainer
**I want to** automated reminders sent to clients before sessions
**So that** clients don't miss sessions and no-shows are reduced

## Acceptance Criteria
- [ ] Customize reminder timing (24h, 2h, 1h before)
- [ ] Support multiple reminder times per appointment
- [ ] Send reminders via SMS, email, and push notifications
- [ ] Include session details in reminders
- [ ] Request confirmation from client
- [ ] Custom reminder message templates
- [ ] Reminder history tracking
- [ ] Client notification preferences
- [ ] Automatic reschedule request if client can't make it
- [ ] Trainer notifications for upcoming sessions
- [ ] Different reminders for new vs. recurring clients
- [ ] Pause reminders for specific sessions
- [ ] Delivery status tracking

## Technical Implementation

### Frontend Tasks
1. **Create ReminderSettings Component**
   - Reminder timing configuration (multiple slots)
   - Notification channel toggles (SMS, email, push)
   - Custom message template editor
   - Preview reminder as client would see it
   - Save settings with confirmation
   - Reset to defaults option

2. **Create ReminderTemplateEditor Component**
   - Rich text editor for email templates
   - Plain text editor for SMS templates
   - Variable placeholders ({{clientName}}, {{time}}, {{location}})
   - Template preview with sample data
   - Save as template option
   - Template library

3. **Create ReminderHistory Component**
   - List of sent reminders
   - Filter by date range, client, status
   - Show delivery status (sent, delivered, failed)
   - View reminder content
   - Resend failed reminders
   - Export to CSV

4. **Create NotificationPreferences Component** (Client View)
   - Channel preferences (email, SMS, push)
   - Reminder frequency preferences
   - Opt-out options
   - Quiet hours setting
   - Per-client customization

5. **Create ReminderDashboard Component**
   - Upcoming reminders queue
   - Delivery success rate
   - No-show reduction stats
   - Recent reminder activity
   - Failed reminder alerts

### Backend Tasks
1. **Create Reminder Endpoints**
   ```typescript
   GET /api/schedule/reminders/settings - Get trainer reminder settings
   PUT /api/schedule/reminders/settings - Update reminder settings
   Body: ReminderSettingsDto

   GET /api/schedule/reminders/templates - Get message templates
   POST /api/schedule/reminders/templates - Create template
   PUT /api/schedule/reminders/templates/:id - Update template
   DELETE /api/schedule/reminders/templates/:id - Delete template

   GET /api/schedule/reminders/history - Get reminder history
   Query params: startDate, endDate, clientId, status
   Response: Paginated reminder list

   POST /api/schedule/reminders/:id/resend - Resend failed reminder

   GET /api/schedule/reminders/stats - Get reminder statistics
   Response: Delivery stats, no-show reduction, etc.

   PUT /api/schedule/reminders/pause - Pause reminders for appointment
   Body: { appointmentId, pauseUntil, reason }
   ```

2. **Implement ReminderService**
   ```typescript
   class ReminderService {
     async createReminder(appointmentId: string, timing: ReminderTiming)
     async scheduleReminder(appointmentId: string, settings: ReminderSettings)
     async sendReminder(reminderId: string)
     async sendBatchReminders(dueDate: Date)
     async processReminderQueue()
     async markReminderSent(reminderId: string, status: DeliveryStatus)
     async getReminderHistory(filters: ReminderFilters)
     async getReminderStats(trainerId: string)
     async updateReminderSettings(trainerId: string, settings: ReminderSettings)
     async renderTemplate(template: string, data: TemplateData)
     async handleClientResponse(reminderId: string, response: ClientResponse)
     async cancelReminder(reminderId: string, reason: string)
   }
   ```

3. **Background Job Scheduler**
   - Cron job to check for due reminders every 5 minutes
   - Queue reminders for sending
   - Process queue with worker threads
   - Retry failed reminders with exponential backoff
   - Handle rate limiting for SMS

4. **Notification Delivery**
   - Email service integration (SendGrid, AWS SES)
   - SMS gateway integration (Twilio)
   - Push notification service (Firebase Cloud Messaging)
   - Delivery tracking and webhooks
   - Error handling and retry logic

5. **Database Schema**
   ```sql
   -- Reminder settings
   reminder_settings (
     id UUID PRIMARY KEY,
     trainer_id UUID REFERENCES users(id) UNIQUE,
     reminder_timings JSONB NOT NULL, -- [24, 2, 1] hours before
     channels JSONB NOT NULL, -- {email: true, sms: true, push: false}
     email_template_id UUID,
     sms_template_id UUID,
     request_confirmation BOOLEAN DEFAULT true,
     allow_client_opt_out BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   )

   -- Reminder templates
   reminder_templates (
     id UUID PRIMARY KEY,
     trainer_id UUID REFERENCES users(id),
     template_name VARCHAR(100) NOT NULL,
     channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
     subject TEXT, -- For email
     body TEXT NOT NULL,
     variables TEXT[], -- ['clientName', 'time', 'location']
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   )

   -- Scheduled reminders
   appointment_reminders (
     id UUID PRIMARY KEY,
     appointment_id UUID REFERENCES appointments(id),
     reminder_type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
     scheduled_for TIMESTAMP NOT NULL,
     send_before_minutes INTEGER NOT NULL,
     message_template TEXT NOT NULL,
     status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
     sent_at TIMESTAMP,
     delivered_at TIMESTAMP,
     delivery_error TEXT,
     retry_count INTEGER DEFAULT 0,
     is_paused BOOLEAN DEFAULT false,
     pause_reason VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW()
   )

   -- Client notification preferences
   client_notification_preferences (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES users(id),
     trainer_id UUID REFERENCES users(id),
     email_enabled BOOLEAN DEFAULT true,
     sms_enabled BOOLEAN DEFAULT true,
     push_enabled BOOLEAN DEFAULT false,
     quiet_hours_start TIME,
     quiet_hours_end TIME,
     opt_out BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(client_id, trainer_id)
   )

   -- Reminder responses
   reminder_responses (
     id UUID PRIMARY KEY,
     reminder_id UUID REFERENCES appointment_reminders(id),
     response_type VARCHAR(20) NOT NULL, -- 'confirm', 'cancel', 'reschedule'
     responded_at TIMESTAMP DEFAULT NOW(),
     additional_notes TEXT
   )
   ```

### Data Models
```typescript
interface ReminderSettings {
  trainerId: string;
  reminderTimings: number[]; // Hours before appointment: [24, 2, 1]
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  emailTemplate?: string;
  smsTemplate?: string;
  requestConfirmation: boolean;
  allowClientOptOut: boolean;
}

interface ReminderTiming {
  hoursBefore: number;
  channels: NotificationChannel[];
  templateId?: string;
}

interface ReminderTemplate {
  id: string;
  trainerId: string;
  templateName: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  isDefault: boolean;
}

interface TemplateVariable {
  name: string;
  placeholder: string; // {{clientName}}
  description: string;
  required: boolean;
}

interface TemplateData {
  clientName: string;
  trainerName: string;
  appointmentDate: string;
  appointmentTime: string;
  location: string;
  sessionType: string;
  confirmationLink: string;
  cancellationLink: string;
  calendarInviteLink: string;
}

interface ReminderRecord {
  id: string;
  appointment: Appointment;
  type: 'email' | 'sms' | 'push';
  scheduledFor: Date;
  sendBeforeMinutes: number;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
}

interface ReminderStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number; // Percentage
  averageDeliveryTime: number; // Minutes
  noShowReduction: number; // Percentage
  confirmationRate: number;
  channelBreakdown: {
    email: { sent: number; delivered: number; failed: number };
    sms: { sent: number; delivered: number; failed: number };
    push: { sent: number; delivered: number; failed: number };
  };
}

interface ClientNotificationPreferences {
  clientId: string;
  trainerId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  quietHours: {
    start?: string; // HH:mm
    end?: string; // HH:mm
  };
  optOut: boolean;
}

enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  PAUSED = 'paused'
}
```

## Test Cases
1. **Happy Path**
   - Configure reminders for 24h, 2h, and 1h before
   - Create appointment
   - Verify reminders scheduled
   - Reminders sent at correct times
   - Client receives and confirms
   - Delivery status updated

2. **Multiple Channels**
   - Send reminder via email and SMS
   - Verify both delivered
   - Track delivery status separately
   - Handle partial failure (email fails, SMS succeeds)

3. **Template Rendering**
   - Render template with all variables
   - Handle missing optional variables
   - Test with special characters
   - Preview before saving

4. **Failed Reminders**
   - Invalid email address
   - SMS delivery failure
   - Push notification token expired
   - Retry logic (3 attempts with exponential backoff)
   - Alert trainer if all retries fail

5. **Client Preferences**
   - Client opts out of SMS
   - Client only wants email reminders
   - Client sets quiet hours
   - Verify preferences respected

6. **Reschedule/Cancel**
   - Client responds to reminder with cancellation
   - Client requests reschedule
   - Reminder cancelled if appointment cancelled
   - Reschedule reminders when appointment rescheduled

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Reminder Settings                         [Save][Cancel] |
+----------------------------------------------------------+
|  Reminder Timing:                                        |
|  Send reminders at these times before each session:      |
|                                                          |
|  +---------------------------------------------------+   |
|  | [24] hours before  [SMS] [Email] [Remove]        |   |
|  +---------------------------------------------------+   |
|  | [2] hours before   [SMS] [Email] [Push] [Remove] |   |
|  +---------------------------------------------------+   |
|  | [1] hours before   [SMS] [Email] [Remove]        |   |
|  +---------------------------------------------------+   |
|  [+ Add Reminder Timing]                                |
|                                                          |
|  Message Templates:                                      |
|  Email Template:                                         |
|  [Default Template ▼]                    [Edit][Custom] |
|                                                          |
|  SMS Template:                                           |
|  [Default Template ▼]                     [Edit][Custom] |
|                                                          |
|  Options:                                                |
|  ☑ Request confirmation from client                     |
|  ☐ Allow clients to opt-out of reminders                 |
|  ☑ Send me summary of upcoming sessions daily            |
|                                                          |
|  Preview:                                                |
|  [View how client will see reminder]                     |
+----------------------------------------------------------+
```

**Template Editor:**
```
+----------------------------------------------------------+
|  Edit Email Template                                    |
+----------------------------------------------------------+
|  Template Name: [Standard 24h Reminder________]          |
|                                                          |
|  Subject:                                                 |
|  [Reminder: Your session with {{trainerName}} tomorrow]  |
|                                                          |
|  Message:                                                |
|  +------------------------------------------------------+ |
|  | Hi {{clientName}},                                   | |
|  |                                                      | |
|  | This is a friendly reminder about your upcoming      | |
|  | {{sessionType}} session with {{trainerName}}.        | |
|  |                                                      | |
|  | 📅 Date: {{appointmentDate}}                         | |
|  | ⏰ Time: {{appointmentTime}}                         | |
|  | 📍 Location: {{location}}                            | |
|  |                                                      | |
|  | Please confirm you'll be attending:                 | |
|  | [Confirm Attendance] [Cancel] [Reschedule]           | |
|  |                                                      | |
|  | See you soon!                                        | |
|  +------------------------------------------------------+ |
|                                                          |
|  Available Variables:                                    |
|  {{clientName}} {{trainerName}} {{appointmentDate}}      |
|  {{appointmentTime}} {{location}} {{sessionType}}        |
|                                                          |
|  [Save Template] [Preview] [Cancel]                      |
+----------------------------------------------------------+
```

**Reminder History:**
```
+----------------------------------------------------------+
|  Reminder History                                       |
+----------------------------------------------------------+
|  Filters: [Last 30 Days ▼] [All Clients ▼] [All ▼]     |
|                                                          |
|  Scheduled      | Client       | Type | Status | Action  |
|  +---------------+--------------+------+--------+--------|
|  | Jan 14, 9:00  | Sarah Miller | SMS  | ✓ Sent | View   |
|  | 24h before    |              |      |        |        |
|  +---------------+--------------+------+--------+--------|
|  | Jan 14, 9:00  | Mike Johnson | Email| ✓ Deliv| View   |
|  | 24h before    |              |      |        |        |
|  +---------------+--------------+------+--------+--------|
|  | Jan 13, 7:00  | Emma Lee     | SMS  | ✗ Fail | Resend |
|  | 2h before     |              |      |        |        |
|  +---------------+--------------+------+--------+--------|
|  | Jan 13, 8:00  | John Davis   | Push | ✓ Sent | View   |
|  | 1h before     |              |      |        |        |
|  +---------------+--------------+------+--------+--------|
|                                                          |
|  Statistics:                                             |
|  Sent: 156 | Delivered: 152 | Failed: 4 | Rate: 97.4%      |
+----------------------------------------------------------+
```

## Dependencies
- Story 009-01 (View Schedule) - for appointment data
- Story 009-03 (Book Session) - for triggering reminders
- Communication system (EPIC-008) - for sending notifications
- Email service (SendGrid/AWS SES)
- SMS gateway (Twilio)
- Push notification service (Firebase)
- Background job scheduler

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for reminder delivery
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Delivery reliability >99%

## Notes
- Use idempotent reminder scheduling to prevent duplicates
- Implement rate limiting for SMS to avoid costs
- Queue reminders in advance to handle load
- Monitor delivery rates and alert on failures
- Consider adding "smart reminders" based on client no-show history
- Test timezone handling thoroughly
- Add analytics to measure reminder effectiveness
- Consider A/B testing reminder timing/templates
- Ensure compliance with SMS/email regulations
