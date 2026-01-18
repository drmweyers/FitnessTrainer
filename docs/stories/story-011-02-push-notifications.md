# Story 011-02: Push Notifications

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-02
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 11

## User Story
**As a** user
**I want to** receive push notifications
**So that I** stay informed and engaged with my fitness journey

## Acceptance Criteria
- [ ] Users can opt-in to push notifications during onboarding
- [ ] Workout reminders 30 minutes before scheduled time
- [ ] New message notifications with sender preview
- [ ] Progress celebration notifications (achievements, milestones)
- [ ] Appointment reminders for trainer sessions
- [ ] Customizable notification preferences in settings
- [ ] Quiet hours respected (user-configurable)
- [ ] Rich notifications with images/actions on supported platforms
- [ ] Quick reply actions for messages
- [ ] Notification history/log available
- [ ] Grouped notifications to avoid spam
- [ ] Deep linking from notifications to relevant content

## Technical Implementation

### Frontend Tasks
1. **PushNotificationService**
   - Implement Firebase Cloud Messaging (FCM) for web/PWA
   - Request notification permissions gracefully
   - Handle permission denial with fallback
   - Register device tokens
   - Manage subscription lifecycle

2. **NotificationSettings Component**
   - Build notification preferences interface
   - Toggle notifications by category
   - Set quiet hours
   - Configure notification sound/vibration
   - Test notification button

3. **NotificationHandler Component**
   - Handle incoming notifications in foreground
   - Display system notifications in background
   - Process notification clicks
   - Navigate to relevant content
   - Handle deep linking

4. **NotificationHistory Component**
   - Display list of past notifications
   - Filter by type/date
   - Clear history option
   - Notification details view

### Backend Tasks
1. **Push Notification Infrastructure**
   - Set up Firebase Cloud Messaging (FCM)
   - Configure APNS (Apple Push Notification Service) for future iOS app
   - Implement VAPID keys for web push
   - Create notification queue system
   - Build notification template engine

2. **Notification Endpoints**
   ```typescript
   POST /api/notifications/register - Register device token
   DELETE /api/notifications/unregister - Unregister device
   PUT /api/notifications/settings - Update preferences
   GET /api/notifications/settings - Get user preferences
   GET /api/notifications/history - Get notification log
   POST /api/notifications/test - Send test notification
   ```

3. **NotificationService**
   ```typescript
   class NotificationService {
     async sendWorkoutReminder(userId: string, workoutId: string)
     async sendMessageNotification(userId: string, message: Message)
     async sendProgressCelebration(userId: string, achievement: Achievement)
     async sendAppointmentReminder(userId: string, appointmentId: string)
     async scheduleNotification(userId: string, notification: Notification, schedule: Schedule)
     async sendBulkNotification(userIds: string[], notification: Notification)
   }
   ```

4. **Background Jobs**
   - Workout reminder scheduler (cron job every 5 minutes)
   - Appointment reminder scheduler
   - Progress milestone checker (daily job)
   - Notification retry logic for failed sends

### Data Models
```typescript
interface DeviceRegistration {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}

interface NotificationSettings {
  userId: string;
  workoutReminders: boolean;
  messages: boolean;
  progressCelebrations: boolean;
  appointmentReminders: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationLog {
  id: string;
  userId: string;
  type: 'workout_reminder' | 'message' | 'celebration' | 'appointment';
  title: string;
  body: string;
  data?: any;
  sentAt: Date;
  readAt?: Date;
  clickedAt?: Date;
  status: 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
}

interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    image?: string;
    icon?: string;
    badge?: number;
    sound?: string;
  };
  data: {
    type: string;
    entityId?: string;
    deepLink?: string;
    [key: string]: any;
  };
  android?: {
    notification?: {
      channelId?: string;
      priority?: 'min' | 'low' | 'default' | 'high' | 'max';
      visibility?: 'secret' | 'private' | 'public';
    };
    data?: any;
  };
  apns?: {
    payload?: {
      aps: {
        category?: string;
        thread-id?: string;
        alert?: any;
      };
    };
  };
}
```

### Firebase Configuration
```typescript
// firebase.config.ts
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission and get token
export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: process.env.VAPID_KEY
    });
    return token;
  }
  throw new Error('Notification permission denied');
};
```

## Test Cases
1. **Permission Request**
   - User sees permission request at appropriate time
   - Can grant permission
   - Can deny permission gracefully
   - Permission-denied state handled

2. **Workout Reminders**
   - Schedule workout for 2:00 PM
   - Receive reminder at 1:30 PM
   - Click notification → opens workout
   - Reminder not sent if workout already completed

3. **Message Notifications**
   - Trainer sends message
   - Client receives notification with preview
   - Click notification → opens message thread
   - Quick reply works on supported platforms

4. **Progress Celebrations**
   - User completes 10 workouts milestone
   - Receive celebration notification
   - Notification includes achievement icon
   - Share functionality available

5. **Quiet Hours**
   - Set quiet hours 10 PM - 7 AM
   - Workout scheduled during quiet hours
   - Notification suppressed
   - Notification sent after quiet hours end

6. **Rich Notifications**
   - Message notification shows sender avatar
   - Workout notification shows exercise image
   - Action buttons available (Complete, Snooze)
   - Grouped notifications for multiple messages

7. **Notification Settings**
   - Toggle all notification types independently
   - Set custom quiet hours
   - Test notification button works
   - Settings persist across sessions

8. **Deep Linking**
   - Click workout notification → opens workout detail
   - Click message notification → opens conversation
   - Click appointment notification → opens calendar
   - Handles deep linking when app is closed

## UI/UX Mockups
```
Notification Permission Request

+----------------------------------+
|  🔔 Stay Motivated               |
|                                  |
|  Enable notifications to:        |
|  • Get workout reminders         |
|  • Receive messages from trainer |
|  • Celebrate your progress       |
|  • Never miss appointments       |
|                                  |
|  [Enable Notifications]          |
|  [Not Now]                       |
+----------------------------------+
```

```
Notification Settings

+----------------------------------+
|  ← Back  Notifications           |
+----------------------------------+
|  Push Notifications     [ON/OFF] |
|                                  |
|  Notification Types              |
|  ─────────────────────────────   |
|  💪 Workout Reminders      [ON]  |
|  💬 Messages               [ON]  |
|  🎉 Progress Celebrations  [ON]  |
|  📅 Appointment Reminders  [ON]  |
|                                  |
|  Quiet Hours                    |
|  ─────────────────────────────   |
|  Enable Quiet Hours        [ON]  |
|  From: [10:00 PM]   To: [7:00 AM]|
|                                  |
|  Preferences                     |
|  ─────────────────────────────   |
|  Sound                   [ON]    |
|  Vibration               [ON]    |
|                                  |
|  [Send Test Notification]        |
+----------------------------------+
```

```
Push Notification Examples

Workout Reminder:
+----------------------+
|  💪 30 min left      |
|  Leg Day starting at |
|  2:00 PM             |
|                      |
|  [View] [Snooze]     |
+----------------------+

Message:
+----------------------+
|  👤 Trainer John      |
|  Great work today!   |
|  Keep it up!         |
|  [Avatar]            |
+----------------------+

Celebration:
+----------------------+
|  🎉 Milestone!        |
|  You completed 10    |
|  workouts this month |
|  [Share]             |
+----------------------+
```

```
Notification History

+----------------------------------+
|  ← Back  Notification History    |
+----------------------------------+
|  Filter: [All ▼]  [Clear All]   |
|                                  |
|  Today                           |
|  +----------------------------+  |
|  | 🎉 Milestone achieved!   | 2h|
|  +----------------------------+  |
|  | 💪 Workout in 30 min     | 5h|
|  +----------------------------+  |
|                                  |
|  Yesterday                       |
|  +----------------------------+  |
|  | 💬 New message from John  | 1d|
|  +----------------------------+  |
|  | 📅 Appointment tomorrow  | 1d|
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

## Dependencies
- Firebase project setup
- VAPID keys generated for web push
- User authentication system
- Workout scheduling system
- Message system
- Progress tracking system

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Push notifications working on web/PWA
- [ ] Permission flow implemented
- [ ] All notification types functional
- [ ] Settings page complete
- [ ] Quiet hours working
- [ ] Rich notifications with actions
- [ ] Deep linking functional
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for notification delivery
- [ ] Manual testing on multiple devices
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Security Considerations
- Validate notification payloads
- Sanitize user-generated content in notifications
- Rate limit notification sends
- Secure device token storage
- Respect user privacy settings
- GDPR compliance for notification data

## Performance Targets
- Notification delivery: < 3 seconds
- Permission request: Show at optimal time
- Battery impact: Minimal
- Network usage: Efficient payload sizes

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support (requires service worker)
- Safari: Limited support (iOS 16.4+ for web push)
- Samsung Internet: Full support

## Analytics Tracking
- Notification opt-in rate
- Notification delivery rate
- Notification click-through rate
- Notification type performance
- Quiet hours usage
- Unsubscribe reasons

## Notes
- Start with web push via Firebase for PWA
- Can extend to native push notifications when building native apps
- Be respectful of notification frequency to avoid user opt-out
- A/B test notification timing and content
- Monitor notification performance metrics
- Consider notification categories/grouping to reduce spam
- Localize notification content for international users
