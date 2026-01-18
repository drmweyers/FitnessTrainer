# Story 012-02: Manage Users

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-02
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 13

## User Story
**As an** admin
**I want to** manage user accounts
**So that I** can maintain platform quality and handle account issues

## Acceptance Criteria
- [ ] Search users by name, email, ID
- [ ] Filter users by role, status, date range
- [ ] View detailed user profiles
- [ ] Suspend/unsuspend user accounts
- [ ] Reset user passwords
- [ ] Verify trainer credentials
- [ ] View user activity logs
- [ ] Handle account issues
- [ ] Bulk user operations (suspend, delete)
- [ ] Export user list
- [ ] Account recovery tools
- [ ] Impersonation capability (with audit)

## Technical Implementation

### Frontend Tasks
1. **UserManagement Component**
   - User list with pagination
   - Search and filter controls
   - Sortable columns
   - Bulk selection checkboxes

2. **UserProfile Component**
   - Display user details
   - Show account status
   - Activity timeline
   - Connected accounts

3. **UserActions Component**
   - Suspend/unsuspend buttons
   - Password reset trigger
   - Email verification resend
   - Account deletion
   - Impersonate user (audit logged)

4. **BulkOperations Component**
   - Select multiple users
   - Apply bulk actions
   - Confirm operation
   - Show progress indicator

### Backend Tasks
1. **User Management Endpoints**
   ```typescript
   GET /api/admin/users - List users with filters
   GET /api/admin/users/:id - Get user details
   PUT /api/admin/users/:id - Update user
   POST /api/admin/users/:id/suspend - Suspend account
   POST /api/admin/users/:id/unsuspend - Unsuspend account
   POST /api/admin/users/:id/reset-password - Reset password
   POST /api/admin/users/:id/verify - Verify trainer
   DELETE /api/admin/users/:id - Delete user
   POST /api/admin/users/bulk-suspend - Bulk suspend
   POST /api/admin/users/bulk-delete - Bulk delete
   POST /api/admin/users/:id/impersonate - Impersonate user
   GET /api/admin/users/:id/activity - Get user activity
   GET /api/admin/users/export - Export user list
   ```

2. **AdminUserService**
   ```typescript
   class AdminUserService {
     async listUsers(filters: UserFilters): Promise<PaginatedUsers>
     async getUserDetails(userId: string): Promise<UserDetails>
     async suspendUser(userId: string, reason: string): Promise<void>
     async unsuspendUser(userId: string): Promise<void>
     async resetUserPassword(userId: string): Promise<string>
     async verifyTrainer(userId: string, credentials: any): Promise<void>
     async deleteUser(userId: string): Promise<void>
     async bulkSuspend(userIds: string[], reason: string): Promise<void>
     async getUserActivity(userId: string): Promise<ActivityLog[]>
     async impersonateUser(userId: string): Promise<string>
   }
   ```

3. **Audit Logging**
   - Log all admin actions
   - Track who did what
   - Store IP and timestamp
   - Provide audit trail

### Data Models
```typescript
interface UserFilters {
  search?: string;
  role?: 'trainer' | 'client' | 'admin';
  status?: 'active' | 'suspended' | 'deleted';
  verified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastActiveAfter?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface UserDetails {
  user: User;
  profile: Profile;
  subscription?: Subscription;
  clients?: User[]; // For trainers
  trainer?: User; // For clients
  stats: UserStats;
  activity: ActivityLog[];
  accountStatus: AccountStatus;
}

interface UserStats {
  totalWorkouts: number;
  totalSessions: number;
  joinDate: Date;
  lastActive: Date;
  subscriptionValue?: number;
  clientCount?: number;
}

interface AccountStatus {
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  trainerVerified: boolean;
  subscriptionActive: boolean;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: 'user' | 'content' | 'system';
  entityId: string;
  changes: any;
  reason?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### Database Queries
```sql
-- User list with filters
SELECT
  u.*,
  p.first_name,
  p.last_name,
  p.avatar_url,
  s.status as subscription_status,
  COUNT(DISTINCT c.id) as client_count
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id
  AND s.status = 'active'
LEFT JOIN trainer_client_relationships tcr
  ON u.id = tcr.trainer_id
LEFT JOIN users c ON tcr.client_id = c.id
WHERE
  ($1::text IS NULL OR
    u.email ILIKE '%' || $1 || '%' OR
    p.first_name ILIKE '%' || $1 || '%' OR
    p.last_name ILIKE '%' || $1 || '%' OR
    u.id::text = $1)
  AND ($2::user_role IS NULL OR u.role = $2)
  AND ($3::user_status IS NULL OR u.status = $3)
GROUP BY u.id, p.id, s.id
ORDER BY
  CASE
    WHEN $4 = 'created_at' THEN u.created_at
    WHEN $4 = 'last_active' THEN u.last_active_at
    WHEN $4 = 'email' THEN u.email
  END ${$5}
LIMIT $6 OFFSET $7;

-- User activity log
SELECT
  al.*,
  a.email as admin_email
FROM audit_logs al
LEFT JOIN users a ON al.admin_id = a.id
WHERE al.user_id = $1
ORDER BY al.created_at DESC
LIMIT 50;

-- Suspend user
UPDATE users
SET
  status = 'suspended',
  suspended_at = NOW(),
  suspended_by = $2,
  suspension_reason = $3
WHERE id = $1
RETURNING *;

-- Bulk suspend
UPDATE users
SET
  status = 'suspended',
  suspended_at = NOW(),
  suspended_by = $2,
  suspension_reason = $3
WHERE id = ANY($1::uuid[])
RETURNING id;
```

## Test Cases
1. **User Search**
   - Search by email address
   - Search by name
   - Search by user ID
   - Results display correctly
   - Search is fast (< 1s)

2. **User Filtering**
   - Filter by role (trainer/client)
   - Filter by status (active/suspended)
   - Filter by verification status
   - Filter by date range
   - Filters combine correctly

3. **View User Profile**
   - Click on user from list
   - Profile page loads
   - All sections display
   - Activity log shows
   - Stats calculated correctly

4. **Suspend User**
   - Click suspend button
   - Enter suspension reason
   - Confirm suspension
   - User status updates
   - User cannot login
   - Audit log created

5. **Unsuspend User**
   - Click unsuspend button
   - Confirm action
   - User status updates to active
   - User can login again
   - Audit log created

6. **Reset Password**
   - Click reset password
   - Confirm action
   - Password reset email sent
   - User receives email
   - Can reset password

7. **Verify Trainer**
   - View trainer profile
   - Check credentials
   - Click verify button
   - Trainer marked as verified
   - Badge displays on profile

8. **Bulk Operations**
   - Select multiple users
   - Choose bulk suspend
   - Enter reason
   - Confirm operation
   - All users suspended
   - Progress indicator shown

9. **Export Users**
   - Apply filters
   - Click export
   - CSV file downloads
   - Data is correct
   - All columns included

10. **Impersonate User**
    - Click impersonate
    - Confirm action
    - Logged in as user
    - Can see user's view
    - Audit log created
    - Can exit impersonation

## UI/UX Mockups
```
User Management - List View

+--------------------------------------------------------------+
|  [Logo]  Admin Dashboard        [Search]  [🔔]  [Admin▼]     |
+--------------------------------------------------------------+
|  Dashboard  Users  Content  System  Finance  Reports  Config |
+--------------------------------------------------------------+
|  Manage Users                            [+ Add User]         |
|  ─────────────────────────────────────────────────────────   |
|  Search: [Search by name, email, ID________]                 |
|  Filters: [Role▼] [Status▼] [Verified▼] [Date Range▼]       |
|  [Export CSV]  [Bulk Actions]                                 |
|                                                              |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ ☐ │ Avatar │ Name         │ Email        │ Role │ Status│ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ ☐ │ [img]  │ John Smith   │ john@...     │ Trainer│Active│ |
|  │   │        │ 12 clients   │ Member since│ ✓Verified│  │ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ ☐ │ [img]  │ Jane Doe     │ jane@...     │ Client │Active│ |
|  │   │        │ Trainer: John│ Member since│         │  │ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ ☐ │ [img]  │ Bob Wilson   │ bob@...      │ Trainer│Suspended│ |
|  │   │        │ 8 clients    │ Member since│ ⚠️Reason│  │ |
|  └────────────────────────────────────────────────────────┘ |
|                                                              |
|  Showing 1-10 of 12,847 users    [<] 1 2 3 ... 1285 [>]    |
+--------------------------------------------------------------+
```

```
User Profile Detail

+--------------------------------------------------------------+
|  ← Back to Users                    John Smith               |
+--------------------------------------------------------------+
|  Account Status                                   [Edit]     |
|  ┌──────────────────────────────────────────────────────┐   |
|  │  Status:     ✅ Active                               │   |
|  │  Role:       💪 Trainer                              │   |
|  │  Verified:  ✓ Verified                              │   |
|  │  Member:    Jan 15, 2024                             │   |
|  │  Last Active: 2 hours ago                            │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  Profile                                                      |
|  ┌──────────────────────────────────────────────────────┐   |
|  │  [Avatar]                                             │   |
|  │  Name: John Smith                                     │   |
|  │  Email: john@example.com                             │   |
|  │  Phone: (555) 123-4567                               │   |
|  │  Location: San Francisco, CA                         │   |
|  │  Certifications: NASM-CPT, ACE                       │   |
|  │  Specialties: Strength Training, Weight Loss        │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  Statistics                                                  |
|  ┌──────────────────┐ ┌──────────────────┐                 |
|  │ Total Clients    │ │ Active Clients   │                 |
|  │ 12               │ │ 10               │                 |
|  └──────────────────┘ └──────────────────┘                 |
|  ┌──────────────────┐ ┌──────────────────┐                 |
|  │ Total Sessions   │ │ This Month       │                 |
|  │ 245              │ │ $4,850           │                 |
|  └──────────────────┘ └──────────────────┘                 |
|                                                              |
|  Recent Activity                                             |
|  ┌──────────────────────────────────────────────────────┐   |
|  │ 2h ago  Completed workout "Leg Day"                  │   |
|  │ 5h ago  Sent message to client Jane Doe              │   |
|  │ 1d ago  Created new program for client Bob Wilson    │   |
|  │ 2d ago  Updated profile photo                        │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  Actions                                                     |
|  [Reset Password] [Suspend Account] [Impersonate]           |
|  [View As Client] [Delete Account] [Send Email]            |
+--------------------------------------------------------------+
```

```
Suspend Account Modal

+----------------------------------+
|  ⚠️ Suspend Account               |
+----------------------------------+
|  Are you sure you want to        |
|  suspend John Smith's account?    |
|                                  |
|  Reason for suspension:          |
|  ┌────────────────────────────┐  |
|  │ [Select reason▼]           │  |
|  │ • Violation of terms       │  |
|  │ • Inappropriate behavior   │  |
|  │ • Fraudulent activity      │  |
|  │ • Other...                 │  |
|  └────────────────────────────┘  |
|                                  |
|  Additional details:             |
|  [_________________________]     |
|  [_________________________]     |
|                                  |
|  ☑ Send notification email       |
|                                  |
|  [Cancel]  [Suspend Account]      |
+----------------------------------+
```

```
Bulk Actions Modal

+----------------------------------+
|  Bulk Actions        [3 selected]|
+----------------------------------+
|  Selected Users:                 |
|  • John Smith (john@...)         |
|  • Jane Doe (jane@...)           |
|  • Bob Wilson (bob@...)          |
|                                  |
|  Action:                         |
|  ┌────────────────────────────┐  |
|  │ [Select action▼]           │  |
|  │ • Suspend accounts         │  |
|  │ • Unsuspend accounts       │  |
|  │ • Send email               │  |
|  │ • Delete accounts          │  |
|  │ • Export data              │  |
|  └────────────────────────────┘  |
|                                  |
|  Reason:                         |
|  [_________________________]     |
|                                  |
|  ☑ Notify users                 |
|                                  |
|  [Cancel]  [Apply to 3 users]    |
+----------------------------------+
```

## Dependencies
- Admin authentication
- User database access
- Email service
- Audit logging system
- Password reset flow

## Definition of Done
- [ ] All acceptance criteria met
- [ ] User search functional
- [ ] Filtering working
- [ ] User profile view complete
- [ ] Suspend/unsuspend working
- [ ] Password reset working
- [ ] Trainer verification working
- [ ] Activity log displaying
- [ ] Bulk operations working
- [ ] Export functional
- [ ] Impersonation with audit
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for user management
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Performance Targets
- User list load: < 2 seconds
- Search response: < 1 second
- Profile load: < 1 second
- Bulk operation: < 5 seconds for 100 users
- Export generation: < 10 seconds for 10,000 users

## Security Considerations
- Admin-only access (role-based)
- All actions audit logged
- IP tracking for security
- Rate limiting on sensitive operations
- Two-factor authentication for critical actions
- Secure impersonation (clear indicators)

## Data Privacy
- Handle personal data carefully
- Comply with data protection laws
- Right to deletion (GDPR)
- Data export for user requests
- Secure password reset tokens

## Notes
- Provide clear reasons for suspensions
- Send notifications to users
- Keep audit logs for legal compliance
- Consider automated suspension rules
- Add warning before destructive actions
- Provide undo for suspensions (not deletions)
- Monitor admin activity for abuse
- Consider escalation paths for appeals
