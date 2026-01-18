# Story 001-02: Edit Profile Information

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-02
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 1

## User Story
**As a** user
**I want to** update my profile information
**So that I** can keep my data current

## Acceptance Criteria
- [ ] Edit individual sections separately
- [ ] Auto-save functionality with visual feedback
- [ ] Real-time field validation
- [ ] Change history tracking (audit log)
- [ ] Undo recent changes functionality
- [ ] Mobile-friendly editing interface
- [ ] Inline editing mode
- [ ] Confirmation for destructive changes
- [ ] Loading states during save operations
- [ ] Success/error notifications

## Technical Implementation

### Frontend Tasks
1. **Create ProfileEditor Component**
   - Section-based editing (basic info, measurements, goals, etc.)
   - Inline editing with edit/save/cancel modes
   - Auto-save with debouncing (3-5 seconds)
   - Visual save indicators (saving, saved, error)

2. **Create ProfileSection Components**
   - BasicInfoEditor
   - ContactInfoEditor
   - PreferencesEditor
   - MeasurementsEditor

3. **Implement Auto-Save Logic**
   - Debounce save requests
   - Queue multiple changes
   - Handle offline scenarios
   - Show save status

4. **Create ChangeHistory Component**
   - Display recent changes
   - Timestamp and field changed
   - Undo functionality for recent changes
   - View full history option

5. **Implement Validation**
   - Client-side validation on input
   - Real-time error display
   - Server-side validation on save
   - Cross-field validation

### Backend Tasks
1. **Update Profile Endpoints**
   ```typescript
   PATCH /api/profile/:section - Update specific section
   PUT /api/profile - Full profile update
   GET /api/profile/history - Get change history
   POST /api/profile/undo - Undo last change
   ```

2. **Implement ProfileService with Auto-Save**
   ```typescript
   class ProfileService {
     async updateSection(userId: string, section: string, data: any)
     async updateProfile(userId: string, data: UpdateProfileDto)
     async getChangeHistory(userId: string, limit?: number)
     async undoLastChange(userId: string)
     async validateField(field: string, value: any)
   }
   ```

3. **Create AuditLog Table**
   ```sql
   CREATE TABLE profile_audit_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     section VARCHAR(50),
     field_changed VARCHAR(100),
     old_value JSONB,
     new_value JSONB,
     changed_at TIMESTAMP DEFAULT NOW(),
     ip_address INET,
     user_agent TEXT
   );

   CREATE INDEX idx_profile_audit_user ON profile_audit_log(user_id, changed_at DESC);
   ```

4. **Update user_profiles Table**
   ```sql
   ALTER TABLE user_profiles
   ADD COLUMN last_updated_at TIMESTAMP DEFAULT NOW();

   CREATE INDEX idx_user_profiles_updated ON user_profiles(user_id, updated_at DESC);
   ```

### Data Models
```typescript
interface UpdateProfileDto {
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  timezone?: string;
  preferredUnits?: 'metric' | 'imperial';
}

interface SectionUpdateDto {
  section: 'basic' | 'contact' | 'preferences' | 'measurements';
  data: Record<string, any>;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  section: string;
  fieldChanged: string;
  oldValue: any;
  newValue: any;
  changedAt: Date;
  ipAddress?: string;
}

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date;
  pendingChanges: number;
}
```

## Test Cases
1. **Edit Single Field**
   - Open profile editor
   - Modify bio field
   - Wait for auto-save
   - Verify saved indicator appears
   - Refresh page and verify change persisted

2. **Edit Multiple Fields**
   - Modify multiple fields in quick succession
   - Verify auto-save debouncing works
   - Verify all changes saved in one request

3. **Validation**
   - Enter invalid phone number
   - Verify real-time validation error
   - Correct the input
   - Verify error clears

4. **Undo Recent Change**
   - Make a change to profile
   - Navigate to change history
   - Click undo on most recent change
   - Verify field reverts to previous value

5. **Offline Scenario**
   - Make changes while offline
   - Verify changes queued
   - Reconnect to internet
   - Verify changes sync automatically

6. **Mobile Editing**
   - Test on mobile device
   - Verify touch targets adequate
   - Test virtual keyboard doesn't hide inputs
   - Verify auto-save works on mobile

## UI/UX Mockups
```
+------------------------------------------+
|  My Profile                    [Edit]    |
+------------------------------------------+
|                                          |
|  Basic Information                        |
|  [Bio____________________________] [✓]   |
|  Last saved 2 seconds ago                 |
|                                          |
|  Contact Information                     |
|  Phone: [+1 (555) 123-4567_______] [✓]   |
|  Saving...                                |
|                                          |
|  Preferences                             |
|  Units: [○ Metric  ● Imperial]    [✓]    |
|  Saved                                    |
|                                          |
|  [ View Full History > ]                 |
+------------------------------------------+
```

```
+------------------------------------------+
|  Change History                [Close]   |
+------------------------------------------+
|                                          |
|  Recent Changes                          |
|                                          |
|  Today, 2:34 PM                          |
|  • Bio updated                           |
|  • Units changed to Imperial             |
|  [Undo] [View Details]                   |
|                                          |
|  Yesterday, 10:15 AM                     |
|  • Phone number updated                  |
|  [Undo] [View Details]                   |
|                                          |
|  [ View All Changes > ]                  |
+------------------------------------------+
```

## Dependencies
- STORY-001-01 (Create Initial Profile) must be completed
- User profile tables must exist
- Authentication middleware in place

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Auto-save functionality working smoothly
- [ ] Change history tracking accurate
- [ ] Undo functionality working for recent changes
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Performance tested with rapid edits
- [ ] Accessibility standards met
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Auto-save interval should be 3-5 seconds to balance performance and UX
- Consider adding "unsaved changes" warning on page navigation
- Undo should only be available for last 10 changes
- Audit log retention policy: 90 days recommended
