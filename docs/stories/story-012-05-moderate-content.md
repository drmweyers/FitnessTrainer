# Story 012-05: Moderate Content

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-05
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 14

## User Story
**As an** admin
**I want to** review reported content
**So that I** can maintain community standards and platform quality

## Acceptance Criteria
- [ ] Content report queue management
- [ ] Quick review interface for reported items
- [ ] Approve/reject content actions
- [ ] Warning system for violations
- [ ] Ban functionality for repeat offenders
- [ ] Appeal process handling
- [ ] Moderation history tracking
- [ ] Policy enforcement guidelines
- [ ] Bulk moderation actions
- [ ] Content removal and deletion
- [ ] User notifications for actions

## Technical Implementation

### Frontend Tasks
1. **ContentModeration Component** - Report queue with filters
2. **ContentReview Component** - Detailed content view for review
3. **ModerationActions Component** - Action buttons and warnings
4. **AppealHandling Component** - Appeal review interface
5. **ModerationHistory Component** - User moderation history

### Backend Tasks
1. **Moderation Endpoints**
   ```typescript
   GET /api/admin/content-reports - Get reported content
   GET /api/admin/content-reports/:id - Get report details
   PUT /api/admin/content-reports/:id/review - Review content
   POST /api/admin/content-reports/:id/approve - Approve content
   POST /api/admin/content-reports/:id/remove - Remove content
   POST /api/admin/users/:id/warn - Issue warning
   POST /api/admin/users/:id/ban - Ban user
   GET /api/admin/appeals - Get appeals
   PUT /api/admin/appeals/:id - Handle appeal
   GET /api/admin/moderation-history/:userId - Get user history
   ```

2. **ModerationService**
   ```typescript
   class ModerationService {
     async getReports(filters: ReportFilters): Promise<PaginatedReports>
     async reviewReport(reportId: string, decision: ReviewDecision): Promise<void>
     async removeContent(contentId: string, reason: string): Promise<void>
     async warnUser(userId: string, warning: Warning): Promise<void>
     async banUser(userId: string, reason: string): Promise<void>
     async handleAppeal(appealId: string, decision: AppealDecision): Promise<void>
   }
   ```

### Data Models
```typescript
interface ContentReport {
  id: string;
  reporterId: string;
  reporter: User;
  contentType: 'message' | 'photo' | 'video' | 'exercise' | 'program' | 'comment';
  contentId: string;
  content: any;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  actionTaken?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

interface Warning {
  id: string;
  userId: string;
  issuedBy: string;
  warningType: 'first' | 'second' | 'final';
  reason: string;
  contentReportId?: string;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

interface Ban {
  id: string;
  userId: string;
  issuedBy: string;
  reason: string;
  isPermanent: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

interface Appeal {
  id: string;
  userId: string;
  contentReportId?: string;
  banId?: string;
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  reviewedBy?: string;
  decisionReason?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

interface ModerationAction {
  id: string;
  adminId: string;
  userId: string;
  action: 'warn' | 'ban' | 'remove_content' | 'dismiss_report';
  reason: string;
  contentId?: string;
  createdAt: Date;
}
```

### Database Schema
```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES admin_users(id),
  action_taken VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE TABLE user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  issued_by UUID REFERENCES admin_users(id) NOT NULL,
  warning_type VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  content_report_id UUID REFERENCES content_reports(id),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  issued_by UUID REFERENCES admin_users(id) NOT NULL,
  reason TEXT NOT NULL,
  is_permanent BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  content_report_id UUID REFERENCES content_reports(id),
  ban_id UUID REFERENCES user_bans(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES admin_users(id),
  decision_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
```

## Test Cases
1. **Report Queue** - View and filter reported content
2. **Content Review** - Review reported content details
3. **Approve Content** - Dismiss report and keep content
4. **Remove Content** - Delete violating content
5. **Issue Warning** - Warn user for violation
6. **Ban User** - Ban user for severe violations
7. **Appeal Process** - Handle user appeals
8. **Moderation History** - View user's moderation history
9. **Bulk Actions** - Process multiple reports

## UI/UX Mockups
```
Content Moderation Queue

+--------------------------------------------------------------+
|  Content Reports (12 pending)                     [Export]    |
|  ─────────────────────────────────────────────────────────   |
|  Filters: [All▼] [Type▼] [Reason▼] [Status▼]                |
|                                                              |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ ID    │ Type   │ Reporter   │ Reason     │ Status      │ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ #1234 │ Photo  │ John Smith │ Inappropriate│ Pending  │ |
|  │ #1235 │ Message│ Jane Doe   │ Harassment │ Reviewing│ |
|  │ #1236 │ Video │ Bob Wilson │ Spam       │ Resolved  │ |
|  └────────────────────────────────────────────────────────┘ |
+--------------------------------------------------------------+
```

```
Content Review Interface

+--------------------------------------------------------------+
|  ← Back  Report #1234                       [Take Action]     |
+--------------------------------------------------------------+
|  Reported by: John Smith (john@example.com)                  |
|  Reported: 2 hours ago                                       |
|  Reason: Inappropriate content                               |
|                                                              |
|  Content Preview                                             |
|  ┌──────────────────────────────────────────────────────┐   |
|  │  [Image/Video/Message Content]                      │   |
|  │                                                      │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  User History                                                |
|  • 2 previous warnings                                       |
|  • 1 previous ban (expired)                                  |
|  • Account age: 6 months                                     |
|                                                              |
|  Decision                                                    |
|  ┌────────────────────────────────────────────────────┐     |
|  │ ◉ Dismiss report (keep content)                    │     |
|  │ ○ Remove content                                   │     |
|  │ ○ Remove and warn user                             │     |
|  │ ○ Remove and ban user                              │     |
|  └────────────────────────────────────────────────────┘     |
|                                                              |
|  Reason for action:                                         |
|  [_________________________________________________]         |
|  [_________________________________________________]         |
|                                                              |
|  ☑ Notify user                                             |
|  [Submit Decision]  [View User Profile]                      |
+--------------------------------------------------------------+
```

## Dependencies
- Content reporting system
- User management
- Notification system
- Email service

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Report management working
- [ ] Content moderation functional
- [ ] Warning system implemented
- [ ] Ban system working
- [ ] Appeal process functional
- [ ] Moderation history tracked
- [ ] Unit tests passing
- [ ] Code reviewed
- [ ] Documentation updated

## Notes
- Create clear community guidelines
- Provide context for moderation decisions
- Be consistent with enforcement
- Allow for nuance and context
- Provide clear communication to users
- Track false positive rates
- Review and update policies regularly
