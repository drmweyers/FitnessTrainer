# Story 008-04: Notification Management

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-04
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 9

## User Story
**As a** user
**I want to** control my notifications
**So that I** can manage interruptions

## Acceptance Criteria
- [ ] Global notification preferences (push/email/SMS)
- [ ] Per-conversation notification settings
- [ ] Quiet hours scheduling
- [ ] Priority contacts (bypass quiet hours)
- [ ] Custom notification sounds
- [ ] Badge count management
- [ ] Email digest settings (immediate/hourly/daily/weekly)
- [ ] Platform-specific settings (mobile/desktop)
- [ ] Do Not Disturb mode
- [ ] Notification preview settings
- [ ] Vibration control (mobile)
- [ ] Notification grouping

## Technical Implementation

### Frontend Tasks
1. **Create NotificationSettings Component**
   - Global notification toggles
   - Sound selection dropdown
   - Quiet hours time picker
   - Email digest frequency selector
   - Platform-specific settings
   - Save/reset buttons
   - Preview notification button

2. **Create ConversationNotificationSettings Component**
   - Per-conversation mute toggle
   - Notification level selector (all/mentions/none)
   - Custom sound assignment
   - Priority contact toggle
   - Preview conversation notifications

3. **Create QuietHoursScheduler Component**
   - Weekly schedule grid
   - Time range picker for each day
   - Multiple time slots per day
   - Quick presets (work hours, sleep hours)
   - Enable/disable toggle
   - Override for one-time events

4. **Create NotificationPreferences Component**
   - Categorized notification types
   - Toggle for each category
   - Granular controls per notification type
   - Search/filter preferences
   - Reset to defaults button

5. **Create DoNotDisturb Component**
   - Quick DND toggle
   - Duration selector (1hr, 2hr, until tomorrow, etc.)
   - Auto-enable schedule
   - Emergency bypass contacts
   - DND status indicator

6. **Create NotificationCenter Component**
   - List of recent notifications
   - Mark as read/unread
   - Clear all notifications
   - Filter by type
   - Grouped notifications
   - Notification actions (reply, archive, etc.)

7. **Implement Notification Permission Handler**
   - Request notification permissions
   - Handle permission denial
   - Guide users to enable notifications
   - Permission status display

### Backend Tasks
1. **Create Notification Endpoints**
   ```typescript
   GET  /api/notifications/settings - Get user notification settings
   PUT  /api/notifications/settings - Update notification settings
   GET  /api/notifications/conversations/:id - Get conversation settings
   PUT  /api/notifications/conversations/:id - Update conversation settings
   POST /api/notifications/test - Send test notification
   GET  /api/notifications/history - Get notification history
   PUT  /api/notifications/:id/read - Mark as read
   DELETE /api/notifications/:id - Delete notification
   POST /api/notifications/clear-all - Clear all notifications
   ```

2. **Implement NotificationService**
   ```typescript
   class NotificationService {
     async sendPushNotification(userId: string, notification: PushNotification)
     async sendEmailNotification(userId: string, notification: EmailNotification)
     async sendSMSNotification(userId: string, notification: SMSNotification)
     async queueNotificationDigest(userId: string, frequency: DigestFrequency)
     async checkQuietHours(userId: string): Promise<boolean>
     async canSendNotification(userId: string, conversationId?: string): Promise<boolean>
     async sendTestNotification(userId: string)
     async getUserNotificationHistory(userId: string, pagination: PaginationDto)
   }
   ```

3. **Implement Push Notification Service**
   - Firebase Cloud Messaging (FCM) integration
   - Apple Push Notification Service (APNS) integration
   - Web Push API integration
   - Device token management
   - Notification scheduling

4. **Implement Email Digest Service**
   - Aggregate notifications
   - Schedule digest jobs
   - HTML email templates
   - Unsubscribe links
   - Frequency validation

5. **Database Schema Updates**
   ```prisma
   model NotificationSettings {
     id                      String   @id @default(uuid())
     userId                  String   @unique
     user                    User     @relation(fields: [userId], references: [id])
     pushEnabled             Boolean  @default(true)
     emailEnabled            Boolean  @default(true)
     smsEnabled              Boolean  @default(false)
     quietHoursStart         String?  // HH:MM format
     quietHoursEnd           String?  // HH:MM format
     quietHoursTimezone      String?  // IANA timezone
     emailDigestFrequency    DigestFrequency @default(DAILY)
     notificationSound       String   @default("default")
     vibrationEnabled        Boolean  @default(true)
     previewEnabled          Boolean  @default(true)
     groupEnabled            Boolean  @default(true)
     dndEnabled              Boolean  @default(false)
     dndUntil                DateTime?
     createdAt               DateTime @default(now())
     updatedAt               DateTime @updatedAt
   }

   model ConversationNotificationSettings {
     id                      String   @id @default(uuid())
     userId                  String
     user                    User     @relation(fields: [userId], references: [id])
     conversationId          String
     conversation            Conversation @relation(fields: [conversationId], references: [id])
     notificationLevel       NotificationLevel @default(ALL)
     isMuted                 Boolean  @default(false)
     isPriority              Boolean  @default(false)
     customSound             String?
     createdAt               DateTime @default(now())
     updatedAt               DateTime @updatedAt

     @@unique([userId, conversationId])
   }

   model Notification {
     id              String   @id @default(uuid())
     userId          String
     user            User     @relation(fields: [userId], references: [id])
     type            NotificationType
     title           String
     body            String   @db.Text
     data            Json?
     isRead          Boolean  @default(false)
     readAt          DateTime?
     createdAt       DateTime @default(now())

     @@index([userId, isRead, createdAt])
     @@index([userId, createdAt])
   }

   model NotificationPreference {
     id              String   @id @default(uuid())
     userId          String
     user            User     @relation(fields: [userId], references: [id])
     category        NotificationCategory
     enabled         Boolean  @default(true)
     pushEnabled     Boolean  @default(true)
     emailEnabled    Boolean  @default(true)
     smsEnabled      Boolean  @default(false)

     @@unique([userId, category])
   }

   enum DigestFrequency {
     IMMEDIATELY
     HOURLY
     DAILY
     WEEKLY
   }

   enum NotificationLevel {
     ALL
     MENTIONS
     NONE
   }

   enum NotificationType {
     MESSAGE
     MENTION
     REACTION
     WORKOUT_ASSIGNED
     WORKOUT_COMPLETED
     PROGRESS_UPDATE
     SYSTEM
   }

   enum NotificationCategory {
     MESSAGES
     WORKOUTS
     PROGRESS
     CLIENTS
     SYSTEM
   }
   ```

6. **Implement Quiet Hours Logic**
   - Timezone-aware scheduling
   - Recurring quiet hours
   - Priority contact bypass
   - Emergency override
   - Cross-platform sync

### Data Models
```typescript
interface NotificationSettings {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime?: string; // HH:MM
    endTime?: string; // HH:MM
    timezone?: string;
    schedule?: WeeklySchedule;
  };
  emailDigestFrequency: 'immediately' | 'hourly' | 'daily' | 'weekly';
  notificationSound: string;
  vibrationEnabled: boolean;
  previewEnabled: boolean;
  groupEnabled: boolean;
  dnd: {
    enabled: boolean;
    until?: Date;
  };
}

interface ConversationNotificationSettings {
  id: string;
  userId: string;
  conversationId: string;
  notificationLevel: 'all' | 'mentions' | 'none';
  isMuted: boolean;
  isPriority: boolean; // Bypasses quiet hours
  customSound?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

interface WeeklySchedule {
  monday?: TimeRange[];
  tuesday?: TimeRange[];
  wednesday?: TimeRange[];
  thursday?: TimeRange[];
  friday?: TimeRange[];
  saturday?: TimeRange[];
  sunday?: TimeRange[];
}

interface TimeRange {
  start: string; // HH:MM
  end: string; // HH:MM
}
```

## Test Cases
1. **Happy Path**
   - Enable/disable push notifications
   - Set quiet hours
   - Mute specific conversation
   - Set priority contact
   - Change notification sound
   - Configure email digest
   - Test notification preview
   - Clear all notifications

2. **Edge Cases**
   - Deny notification permissions
   - Quiet hours across timezone change
   - Mute all conversations
   - Disable all notifications
   - Conflicting quiet hours (start after end)
   - Invalid email digest frequency
   - DND during quiet hours

3. **Performance Tests**
   - Handle 10,000+ notifications in history
   - Batch notification delivery
   - Email digest generation with 100+ notifications
   - Real-time notification delivery speed

4. **Security Tests**
   - Access control (users only manage their settings)
   - Notification content sanitization
   - Rate limiting on test notifications
   - Email digest unsubscribe validation

## UI/UX Mockups
```
+------------------------------------------+
|  Settings                                |
|  +--------------------------------------+ |
|  | ✓ Push Notifications                 | |
|  | ✓ Email Notifications                | |
|  | ✗ SMS Notifications                  | |
|  |                                      | |
|  | Notification Sound                   | |
|  | [Chime ▼]                            | |
|  |                                      | |
|  | Quiet Hours                          | |
|  | [Enable]                             | |
|  | 10:00 PM - 7:00 AM (UTC-5)           | |
|  | [Edit Schedule]                      | |
|  |                                      | |
|  | Email Digest                         | |
|  | ◉ Daily                              | |
|  | ○ Hourly                             | |
|  | ○ Weekly                             | |
|  |                                      | |
|  | [Save Settings]  [Reset to Defaults] | |
|  +--------------------------------------+ |
+------------------------------------------+

+------------------------------------------+
|  Conversation Settings                   |
|                                          |
|  John Doe                                |
|                                          |
|  Notification Level                      |
|  ◉ All messages                          | |
|  ○ Mentions only                         | |
|  ○ None                                 | |
|                                          |
|  [ ] Mute this conversation              | |
|  [ ] Priority contact (bypass DND)       | |
|                                          |
|  Custom Sound                            |
|  | [Default ▼]                          | |
|                                          |
|  [Test Notification]  [Save]            |
+------------------------------------------+

+------------------------------------------+
|  Quiet Hours Schedule                    |
|                                          |
|  [●] Enable Quiet Hours                  |
|                                          |
|  Monday    [10:00 PM] - [7:00 AM] ✓     | |
|  Tuesday   [10:00 PM] - [7:00 AM] ✓     | |
|  Wednesday [10:00 PM] - [7:00 AM] ✓     | |
|  Thursday  [10:00 PM] - [7:00 AM] ✓     | |
|  Friday    [10:00 PM] - [7:00 AM] ✓     | |
|  Saturday  [Off]                         | |
|  Sunday    [Off]                         | |
|                                          |
|  Quick Presets                           |
|  [Work Hours] [Sleep Hours] [Custom]    | |
|                                          |
|  [Save]                                  |
+------------------------------------------+

+------------------------------------------|
|  Do Not Disturb                          |
|                                          |
|         [☾] Do Not Disturb Off           |
|                                          |
|  Turn on for...                          |
|  +----------------------------------+   |
|  | 1 hour                           |   |
|  | 2 hours                          |   |
|  | Until tomorrow (7:00 AM)         |   |
|  | Until I leave this location      |   |
|  +----------------------------------+   |
|                                          |
|  Emergency bypass:                       |
|  [ ] John Doe (Family)                   |
|  [ ] Jane Smith (VIP Client)             |
|                                          |
|  [Cancel]                                |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages
- Firebase Cloud Messaging (push notifications)
- APNS (Apple push notifications)
- Email service provider (SendGrid, AWS SES)
- SMS service (optional)
- Notification permission from user

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for notification delivery
- [ ] Push notifications tested on iOS and Android
- [ ] Email digests tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] User guide created

## Notes
- Default: All notifications enabled
- Quiet hours should respect user's timezone
- Priority contacts bypass quiet hours and DND
- Email digests should be formatted nicely with HTML
- Consider adding notification categories for finer control
- GDPR: Allow users to opt-out of all non-essential notifications
- Accessibility: Ensure notifications work with screen readers
- Mobile: Test notification badge counts on iOS and Android
- Privacy: Don't include sensitive message content in notifications
