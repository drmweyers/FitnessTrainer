# Story 009-07: Sync External Calendars

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-07
**Priority**: P2 (Medium)
**Story Points**: 13
**Sprint**: Sprint 11

## User Story
**As a** user (trainer or client)
**I want to** sync my appointments with external calendar apps
**So that I** have all my appointments in one place

## Acceptance Criteria
- [ ] Google Calendar integration (two-way sync)
- [ ] Apple Calendar integration (read/write)
- [ ] Outlook/Microsoft 365 integration
- [ ] One-way sync option (platform to external only)
- [ ] Selective sync (choose which appointments to sync)
- [ ] Conflict resolution for sync conflicts
- [ ] Handle private events (don't sync sensitive data)
- [ ] Sync status indicators and error handling
- [ ] Manual sync trigger option
- [ ] Automatic background sync (every 15 minutes)
- [ ] Sync history and logs
- [ ] Disconnect/reconnect calendar accounts
- [ ] Handle timezone conversions correctly

## Technical Implementation

### Frontend Tasks
1. **Create CalendarSyncSettings Component**
   - List of supported calendar providers
   - Connect account buttons for each provider
   - OAuth flow handling
   - Sync preferences (direction, frequency)
   - Selective sync options
   - Sync status display
   - Last sync timestamp
   - Manual sync button
   - Disconnect account button

2. **Create SyncConflictResolver Component**
   - Display sync conflicts
   - Show both versions (platform vs. external)
   - Resolution options: keep platform, keep external, merge
   - Bulk resolution option
   - Conflict preview
   - Apply resolution button

3. **Create SyncHistory Component**
   - List of recent sync operations
   - Success/failure indicators
   - Sync details (items synced, errors)
   - Filter by date and status
   - View error details
   - Retry failed sync option

4. **Create SyncStatusIndicator Component**
   - Real-time sync status badge
   - Animated syncing indicator
   - Error alert with details
   - Last sync time display
   - Click to view sync logs

5. **Create SelectiveSync Component**
   - Filter by appointment type
   - Filter by client
   - Filter by date range
   - Toggle individual appointments
   - Save sync preferences

### Backend Tasks
1. **Create Calendar Sync Endpoints**
   ```typescript
   GET /api/schedule/sync/providers - Get available providers
   Response: ['google', 'apple', 'outlook']

   POST /api/schedule/sync/connect - Initiate OAuth flow
   Body: { provider, redirectUri }
   Response: { authUrl, state }

   POST /api/schedule/sync/callback - Handle OAuth callback
   Body: { provider, code, state }
   Response: { success, calendarId }

   GET /api/schedule/sync/status - Get sync status
   Response: SyncStatus

   PUT /api/schedule/sync/settings - Update sync settings
   Body: SyncSettingsDto

   POST /api/schedule/sync/sync-now - Trigger manual sync
   Response: { syncId, status }

   GET /api/schedule/sync/history - Get sync history
   Query params: limit, offset, status
   Response: Paginated sync history

   POST /api/schedule/sync/resolve-conflict - Resolve sync conflict
   Body: { conflictId, resolution }

   DELETE /api/schedule/sync/disconnect - Disconnect calendar
   Body: { provider }
   ```

2. **Implement SyncService**
   ```typescript
   class SyncService {
     async connectProvider(userId: string, provider: CalendarProvider, credentials: OAuthCredentials)
     async disconnectProvider(userId: string, provider: CalendarProvider)
     async performSync(userId: string, provider: CalendarProvider)
     async syncToExternal(userId: string, provider: CalendarProvider)
     async syncFromExternal(userId: string, provider: CalendarProvider)
     async resolveConflict(conflictId: string, resolution: ConflictResolution)
     async getSyncStatus(userId: string, provider: CalendarProvider)
     async getSyncHistory(userId: string, filters: SyncHistoryFilters)
     async handleExternalWebhook(provider: CalendarProvider, payload: WebhookPayload)
     async mapToExternalEvent(appointment: Appointment): ExternalEvent
     async mapFromExternalEvent(event: ExternalEvent): Partial<Appointment>
     async detectConflicts(local: Appointment, external: ExternalEvent): Conflict[]
   }
   ```

3. **Provider-Specific Adapters**
   ```typescript
   interface CalendarAdapter {
     authenticate(credentials: OAuthCredentials): Promise<string>
     getEvents(calendarId: string, start: Date, end: Date): Promise<ExternalEvent[]>
     createEvent(calendarId: string, event: ExternalEvent): Promise<string>
     updateEvent(calendarId: string, eventId: string, event: ExternalEvent): Promise<void>
     deleteEvent(calendarId: string, eventId: string): Promise<void>
     setupWebhook(calendarId: string, webhookUrl: string): Promise<void>
   }

   class GoogleCalendarAdapter implements CalendarAdapter { }
   class AppleCalendarAdapter implements CalendarAdapter { }
   class OutlookCalendarAdapter implements CalendarAdapter { }
   ```

4. **OAuth Integration**
   - Google OAuth 2.0 flow
   - Apple Calendar (requires app-specific credentials)
   - Microsoft Graph API OAuth
   - Secure token storage (encryption)
   - Token refresh handling
   - Revocation handling

5. **Background Sync Jobs**
   - Cron job every 15 minutes
   - Process users with enabled sync
   - Queue sync tasks
   - Rate limiting per provider
   - Error handling and retry
   - Sync status tracking

6. **Database Schema**
   ```sql
   -- Calendar sync configurations
   calendar_sync_configs (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     provider VARCHAR(20) NOT NULL, -- 'google', 'apple', 'outlook'
     calendar_id VARCHAR(255) NOT NULL,
     calendar_name VARCHAR(255),
     access_token TEXT NOT NULL,
     refresh_token TEXT,
     token_expires_at TIMESTAMP,
     sync_direction VARCHAR(10) DEFAULT 'both', -- 'push', 'pull', 'both'
     sync_frequency_minutes INTEGER DEFAULT 15,
     last_sync_at TIMESTAMP,
     last_sync_status VARCHAR(20), -- 'success', 'failed', 'partial'
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, provider)
   )

   -- Sync mappings (track external event IDs)
   calendar_sync_mappings (
     id UUID PRIMARY KEY,
     sync_config_id UUID REFERENCES calendar_sync_configs(id),
     appointment_id UUID REFERENCES appointments(id),
     external_event_id VARCHAR(255) NOT NULL,
     external_calendar_id VARCHAR(255) NOT NULL,
     last_synced_at TIMESTAMP DEFAULT NOW(),
   etag VARCHAR(255), -- For conflict detection
     UNIQUE(sync_config_id, appointment_id)
   )

   -- Sync history
   calendar_sync_history (
     id UUID PRIMARY KEY,
     sync_config_id UUID REFERENCES calendar_sync_configs(id),
     sync_type VARCHAR(20) NOT NULL, -- 'full', 'push', 'pull', 'webhook'
     started_at TIMESTAMP DEFAULT NOW(),
     completed_at TIMESTAMP,
     status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
     items_pushed INTEGER DEFAULT 0,
     items_pulled INTEGER DEFAULT 0,
     conflicts_detected INTEGER DEFAULT 0,
     errors JSONB, -- [{ timestamp, error, details }]
     sync_metadata JSONB
   )

   -- Sync conflicts
   calendar_sync_conflicts (
     id UUID PRIMARY KEY,
     sync_config_id UUID REFERENCES calendar_sync_configs(id),
     appointment_id UUID REFERENCES appointments(id),
     external_event_id VARCHAR(255),
     conflict_type VARCHAR(50) NOT NULL, -- 'time_change', 'deleted', 'data_mismatch'
     local_data JSONB,
     external_data JSONB,
     detected_at TIMESTAMP DEFAULT NOW(),
     resolution VARCHAR(20), -- 'keep_local', 'keep_external', 'merge'
     resolved_at TIMESTAMP,
     resolved_by UUID REFERENCES users(id)
   )

   -- Selective sync preferences
   calendar_sync_filters (
     id UUID PRIMARY KEY,
     sync_config_id UUID REFERENCES calendar_sync_configs(id) UNIQUE,
     sync_all BOOLEAN DEFAULT true,
     appointment_types TEXT[], -- ['one_on_one', 'group_class']
     client_ids UUID[],
     exclude_private BOOLEAN DEFAULT true,
     custom_rules JSONB -- [{ field: 'title', pattern: 'PRIVATE' }]
   )
   ```

### Data Models
```typescript
interface SyncSettingsDto {
  provider: CalendarProvider;
  syncDirection: 'push' | 'pull' | 'both';
  syncFrequencyMinutes: number;
  syncAll: boolean;
  filters?: SyncFilters;
}

interface SyncFilters {
  appointmentTypes?: AppointmentType[];
  clientIds?: string[];
  excludePrivate?: boolean;
  dateRange?: { start: Date; end: Date };
}

interface SyncStatus {
  provider: CalendarProvider;
  isActive: boolean;
  lastSyncAt: Date;
  lastSyncStatus: 'success' | 'failed' | 'partial';
  nextSyncAt: Date;
  syncDirection: string;
  itemsSynced: number;
  errors?: SyncError[];
}

interface ExternalEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: Attendee[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  isPrivate?: boolean;
  recurrence?: RecurrenceRule;
  [key: string]: any; // Provider-specific fields
}

interface SyncConflict {
  id: string;
  appointmentId: string;
  externalEventId?: string;
  conflictType: 'time_change' | 'deleted' | 'data_mismatch' | 'created_externally';
  localData: Appointment;
  externalData?: ExternalEvent;
  detectedAt: Date;
}

enum CalendarProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  OUTLOOK = 'outlook'
}

interface SyncHistoryRecord {
  id: string;
  syncType: 'full' | 'push' | 'pull' | 'webhook';
  startedAt: Date;
  completedAt?: Date;
  status: 'success' | 'failed' | 'partial';
  itemsPushed: number;
  itemsPulled: number;
  conflictsDetected: number;
  errors?: SyncError[];
}

interface SyncError {
  timestamp: Date;
  error: string;
  details: any;
  appointmentId?: string;
  externalEventId?: string;
}
```

## Test Cases
1. **Google Calendar Sync**
   - Connect Google account via OAuth
   - Perform initial sync
   - Create appointment in platform → appears in Google Calendar
   - Create event in Google Calendar → appears in platform
   - Edit appointment → updates in Google Calendar
   - Delete appointment → removes from Google Calendar

2. **Two-Way Sync**
   - Enable two-way sync
   - Create appointment in both systems simultaneously
   - Detect conflict
   - Resolve conflict (keep platform version)
   - Verify resolution applied

3. **Selective Sync**
   - Configure to sync only 1-on-1 sessions
   - Create group class session
   - Verify group class not synced
   - Configure to exclude private appointments
   - Verify privacy respected

4. **Timezone Handling**
   - User in PST, external calendar in EST
   - Create appointment at 9am PST
   - Verify appears at 12pm EST in external calendar
   - DST transition handling

5. **Error Handling**
   - Invalid OAuth token
   - Rate limit exceeded
   - Network timeout
   - Provider API down
   - Verify retry logic and error notifications

6. **Conflict Scenarios**
   - Time changed in both systems
   - Appointment deleted externally
   - Appointment created externally
   - Data mismatch (title, location)
   - Bulk conflict resolution

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Calendar Sync Settings                                 |
+----------------------------------------------------------+
|  Connect your calendar to keep appointments in sync      |
|                                                          |
|  Connected Calendars:                                    |
|  +----------------------------------------------------+  |
|  | Google Calendar                            [Disconnect] |
|  | ✓ Sync active • Last sync: 5 mins ago           |  |
|  | Sync both ways • Every 15 minutes               |  |
|  | [View Settings] [Sync Now]                       |  |
|  +----------------------------------------------------+  |
|                                                          |
|  Available Calendars:                                    |
|  +----------------------------------------------------+  |
|  | [🍎] Apple Calendar       [Not Connected] [Connect]|  |
|  +----------------------------------------------------+  |
|  +----------------------------------------------------+  |
|  | [🔵] Outlook / Office 365 [Not Connected] [Connect]|  |
|  +----------------------------------------------------+  |
|                                                          |
|  Sync Status:                                            |
|  ✓ All calendars synced successfully                    |
|  5 appointments synced in last sync                     |
|  0 conflicts detected                                   |
+----------------------------------------------------------+
```

**Sync Settings:**
```
+----------------------------------------------------------+
|  Google Calendar Settings                     [Save][×]   |
+----------------------------------------------------------+
|  Sync Direction:                                         |
|  ◉ Two-way sync (keep both calendars in sync)           |
|  ○ Platform to external only                            |
|  ○ External to platform only                            |
|                                                          |
|  Sync Frequency:                                         |
|  [Every 15 minutes ▼]                                    |
|                                                          |
|  Selective Sync:                                         |
|  ☑ Sync all appointments                                |
|  ☐ Only sync specific types:                             |
|     ☑ 1-on-1 Training  ☐ Group Classes  ☐ Assessments   |
|  ☐ Only sync specific clients:                           |
|     [Select clients...]                                  |
|  ☐ Exclude private appointments (marked "Private")      |
|                                                          |
|  Advanced:                                               |
|  ☑ Sync appointment notes                                |
|  ☐ Include client contact information                   |
|  ☑ Handle conflicts automatically (keep platform version)|
|                                                          |
|  [Test Connection]  [View Sync History]                  |
+----------------------------------------------------------+
```

**Conflict Resolution:**
```
+----------------------------------------------------------+
|  Sync Conflicts Detected (3)                  [Resolve All]|
+----------------------------------------------------------|
|  Conflict 1 of 3                                         |
|  Time changed in both calendars                          |
|                                                          |
|  Platform Version:                                       |
|  Training with Sarah Miller                               |
|  Tuesday, January 14, 2025                               |
|  09:00 AM - 10:00 AM                                     |
|                                                          |
|  Google Calendar Version:                                |
|  Training with Sarah Miller                               |
|  Tuesday, January 14, 2025                               |
|  10:00 AM - 11:00 AM                                     |
|                                                          |
|  Resolve:                                                |
|  ◉ Keep platform version (09:00 AM)                      |
|  ○ Keep Google Calendar version (10:00 AM)              |
|  ○ Keep most recently edited                             |
|                                                          |
|  ☐ Apply this decision to all 3 conflicts                |
|                                                          |
|  [Previous]  [Next]  [Apply Resolution]                  |
+----------------------------------------------------------+
```

## Dependencies
- Story 009-01 (View Schedule) - for appointment data
- Story 009-02 (Set Availability) - for availability sync
- OAuth 2.0 libraries for each provider
- Google Calendar API
- Apple EventKit (requires Apple Developer account)
- Microsoft Graph API
- Webhook handling infrastructure
- Background job scheduler

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for all providers
- [ ] OAuth flows tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Timezone handling verified
- [ ] Error handling robust

## Notes
- Store OAuth tokens encrypted at rest
- Implement token refresh before expiry
- Use webhooks for real-time sync when available
- Rate limit API calls to avoid provider throttling
- Implement exponential backoff for failed syncs
- Log all sync operations for audit trail
- Consider adding "sync cooldown" after conflicts
- Test with large numbers of appointments (1000+)
- Ensure GDPR compliance (user can delete all synced data)
- Monitor sync costs (API quotas, webhook calls)
