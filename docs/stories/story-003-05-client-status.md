# Story 003-05: Client Status Management

**Parent Epic**: [EPIC-003 - Client Management](../epics/epic-003-client-management.md)
**Story ID**: STORY-003-05
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** track and manage client status
**So that I** know who needs attention

## Acceptance Criteria
- [ ] Support multiple status types: Active, Pending, Offline, Need Programming, Archived
- [ ] Automatic status updates based on activity
- [ ] Manual status override capability
- [ ] Status change history tracking
- [ ] Filter clients by status
- [ ] Status-based notifications/alerts
- [ ] Visual status indicators (color-coded badges)
- [ ] Quick status change from list view
- [ ] Status change with reason notes
- [ ] Bulk status updates
- [ ] Status analytics dashboard
- [ ] Auto-archive inactive clients (>90 days)

## Technical Implementation

### Frontend Tasks
1. **Create StatusBadge Component**
   - Color-coded status display
   - Tooltip with status details
   - Last activity date
   - Quick status change dropdown
   - Animated status transitions

2. **Create StatusHistory Component**
   - Timeline of status changes
   - Show who changed status
   - Display change reason
   - Show timestamp
   - Filter by date range
   - Export history

3. **Create StatusChangeModal Component**
   - Status dropdown selection
   - Reason textarea (required for some changes)
   - Effective date option
   - Notification preferences
   - Confirmation for critical changes (archive)

4. **Create StatusAlerts Component**
   - Display clients needing attention
   - "Need Programming" alert
   - Inactive client warnings
   - Pending follow-up reminders
   - Quick action buttons
   - Dismiss or snooze alerts

5. **Create StatusAnalytics Component**
   - Status distribution chart
   - Status trends over time
   - Churn prediction
   - Activity heatmap
   - Export analytics

### Backend Tasks
1. **Create Status Endpoints**
   ```typescript
   PUT /api/clients/:id/status - Update client status
   GET /api/clients/:id/status/history - Get status history
   POST /api/clients/status/bulk - Bulk status update
   GET /api/clients/by-status/:status - Get clients by status
   GET /api/clients/alerts - Get clients needing attention
   GET /api/clients/status/analytics - Status analytics
   POST /api/clients/status/auto-update - Trigger auto-update
   ```

2. **Implement StatusService**
   ```typescript
   class StatusService {
     async updateStatus(clientId: string, status: ClientStatus, trainerId: string, reason?: string)
     async bulkUpdateStatus(clientIds: string[], status: ClientStatus, trainerId: string)
     async getStatusHistory(clientId: string)
     async autoUpdateStatuses(trainerId: string)
     async getClientsByStatus(trainerId: string, status: ClientStatus)
     async getClientAlerts(trainerId: string)
     async getStatusAnalytics(trainerId: string, timeframe?: string)
     async checkAndArchiveInactiveClients()
   }
   ```

3. **Automatic Status Rules**
   - **Active**: Logged in or completed workout within 7 days
   - **Offline**: No activity for 8-30 days
   - **Need Programming**: Active >14 days without assigned program
   - **Pending**: Invitation sent but not accepted
   - **Archived**: No activity for 90+ days (auto-archive)

4. **Database Operations**
   - Update trainer_clients.status
   - Insert status change history records
   - Query last activity timestamps
   - Calculate status distribution
   - Aggregate status analytics

5. **Background Jobs**
   - Daily status auto-update job
   - Weekly "Need Programming" check
   - Monthly inactivity review
   - Archive stale clients
   - Generate status reports

6. **Notification System**
   - Trigger notifications on status changes
   - Alert for "Need Programming" clients
   - Inactivity warnings
   - Status summary emails

### Data Models
```typescript
type ClientStatus = 'active' | 'pending' | 'offline' | 'need_programming' | 'archived';

interface StatusChange {
  id: string;
  clientId: string;
  trainerId: string;
  oldStatus: ClientStatus;
  newStatus: ClientStatus;
  reason?: string;
  changedBy: string; // trainer ID or 'system'
  changedAt: Date;
  effectiveDate?: Date;
}

interface StatusUpdateDto {
  status: ClientStatus;
  reason?: string;
  effectiveDate?: Date;
  notifyClient?: boolean;
}

interface BulkStatusUpdateDto {
  clientIds: string[];
  status: ClientStatus;
  reason?: string;
}

interface ClientAlert {
  clientId: string;
  clientName: string;
  alertType: 'need_programming' | 'inactive' | 'pending_followup' | 'expiring_soon';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  lastActivity?: Date;
  daysSinceActivity?: number;
  suggestedActions: string[];
}

interface StatusAnalytics {
  distribution: {
    [key in ClientStatus]: number;
  };
  trends: {
    date: string;
    [key in ClientStatus]?: number;
  }[];
  atRiskClients: number;
  avgClientLifespan: number;
  churnRate: number;
}

interface AutoUpdateRule {
  status: ClientStatus;
  condition: (client: Client) => boolean;
  priority: number;
}
```

## Test Cases
1. **Happy Path - Manual Status Change**
   - View client profile
   - Click status badge
   - Select new status
   - Enter reason
   - Save change
   - Verify status updated
   - Check history recorded

2. **Auto-Update Status**
   - Client active for 8 days
   - Run auto-update job
   - Verify status changes to Offline
   - Check history shows system change
   - Verify notification sent

3. **Bulk Status Update**
   - Select multiple clients
   - Choose bulk status change
   - Select "Archived" status
   - Enter reason
   - Execute bulk update
   - Verify all clients updated
   - Check individual histories

4. **Status Analytics**
   - Navigate to analytics dashboard
   - View status distribution
   - Check trends over time
   - Review at-risk clients
   - Export report

5. **Need Programming Detection**
   - Client active without program for 15 days
   - Run daily job
   - Verify status changes to Need Programming
   - Check alert generated
   - Verify notification sent

6. **Auto-Archive Inactive**
   - Client inactive for 95 days
   - Run archive job
   - Verify status changes to Archived
   - Check history recorded
   - Verify notification sent

7. **Edge Cases**
   - Invalid status transition
   - Missing required reason
   - Concurrent status changes
   - Status change during auto-update
   - Bulk update with mixed valid/invalid clients
   - Very long history records

8. **Performance Tests**
   - Bulk update 100+ clients
   - Auto-update job with 1000+ clients
   - Analytics query with extensive history
   - Status filtering performance

## UI/UX Mockups
```
+--------------------------------------------------+
|  Client Alerts                                   |
|                                                  |
|  Needs Attention (5)                             |
|                                                  |
|  +--------------------------------------------+  |
|  | [⚠] John Doe - Needs Programming          |  |
|  |     Active 15 days without assigned       |  |
|  |     program                               |  |
|  |     [Assign Program] [Dismiss]             |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | [⚠] Jane Smith - Inactive                 |  |
|  |     No activity for 25 days               |  |
|  |     [Send Message] [Archive] [Dismiss]     |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | [⚠] Bob Wilson - Pending Follow-up        |  |
|  |     Last session: 7 days ago              |  |
|  |     [Contact Client] [Dismiss]              |  |
|  +--------------------------------------------+  |
|                                                  |
|  [View All Clients]                              |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Change Client Status                    [×]     |
|                                                  |
|  Current Status: [Active ●]                      |
|                                                  |
|  New Status                                      |
|  [ ] Active                                       |
|  [ ] Pending                                      |
|  [ ] Offline                                      |
|  [×] Need Programming                            |
|  [ ] Archived                                     |
|                                                  |
|  Reason for Change *                       [*]    |
|  Client has been active for 15 days without     |
|  an assigned training program.                   |
|                                                  |
|  Effective Date                            [*]    |
|  [✓] Immediately                                |
|  [ ] On specific date: [Select Date]             |
|                                                  |
|  Notify Client                            [*]    |
|  [×] Yes, send notification about status change  |
|                                                  |
|  [Cancel]                      [Update Status]   |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Status History - John Doe              [×]      |
|                                                  |
|  [Filter by Date ▼]           [Export History]   |
|                                                  |
|  Status Changes (12)                             |
|                                                  |
|  +--------------------------------------------+  |
|  | Active ●                         Today     |  |
|  | Changed by: You (John Smith)                |  |
|  | Reason: Client completed new program        |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | Need Programming ●             Jan 10     |  |
|  | Changed by: System                         |  |
|  | Reason: Auto-update - No program assigned  |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | Active ●                         Jan 5      |  |
|  | Changed by: You (John Smith)                |  |
|  | Reason: New program assigned                |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | Pending ●                       Dec 20     |  |
|  | Changed by: System                         |  |
|  | Reason: Invitation accepted                 |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Load More...]                                  |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Status Analytics                                |
|                                                  |
|  [Last 30 Days ▼]                                |
|                                                  |
|  Current Distribution                            |
|                                                  |
|  Active:     ████████████████████ 15 (60%)      |
|  Offline:    ████ 2 (8%)                         |
|  Pending:    ████ 2 (8%)                         |
|  Need Prog:  ██ 1 (4%)                          |
|  Archived:   ██████ 5 (20%)                     |
|                                                  |
|  Status Trends (Last 30 Days)                   |
|                                                  |
|  20 ┤      ●──●──●                              |
|  15 ┤   ●─●     ●                               |
|  10 ┤ ●                                         |
|   5 ┤                                          |
|   0 └────────────────────                      |
|       Jan  Feb  Mar                            |
|                                                  |
|  Key Metrics                                     |
|  • At-Risk Clients: 3                           |
|  • Avg Client Lifespan: 180 days                |
|  • Churn Rate: 12%                              |
|  • Need Programming: 1                          |
|                                                  |
|  [Export Report]                                 |
+--------------------------------------------------+
```

## Dependencies
- Client creation (STORY-003-01) must be complete
- Client list (STORY-003-02) must be complete
- Activity tracking system in place
- Notification service configured
- Background job scheduler
- Analytics infrastructure

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for status updates
- [ ] Manual testing of auto-update rules
- [ ] Performance tests with bulk operations
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Auto-update job tested
- [ ] Documentation updated
- [ ] Status transitions validated

## Notes
- **ALREADY IMPLEMENTED** - This feature has been completed and is in production
- Auto-update rules should be configurable per trainer
- Consider machine learning for churn prediction
- Status change reasons should be used for analytics
- Add "snooze" functionality for alerts
- Consider SMS alerts for critical status changes
- Status trends could predict client attrition
- Add integration with calendar for status-based reminders
- Consider custom status types for enterprise clients
- Status history should be exportable for compliance
