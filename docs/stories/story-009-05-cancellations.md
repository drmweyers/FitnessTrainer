# Story 009-05: Handle Cancellations

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-05
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 10

## User Story
**As a** user (trainer or client)
**I want to** cancel or reschedule sessions with clear policies
**So that I** can manage changes fairly and transparently

## Acceptance Criteria
- [ ] Enforce cancellation policy based on notice period
- [ ] Calculate refund/charge based on policy
- [ ] Allow rescheduling to available slots
- [ ] Require cancellation reason
- [ ] Send automatic notifications to both parties
- [ ] Handle credit/refund processing
- [ ] Maintain cancellation history
- [ ] Allow policy override for trainers
- [ ] Show policy details before cancellation
- [ ] Different rules for trainer vs. client cancellations
- [ ] Handle recurring series cancellations
- [ ] Package credit restoration (when applicable)
- [ ] No-show tracking and penalties

## Technical Implementation

### Frontend Tasks
1. **Create CancellationModal Component**
   - Display appointment details
   - Show cancellation policy and notice period
   - Calculate and display refund/charge amount
   - Cancellation reason dropdown (required)
   - Additional notes textarea (optional)
   - Warning message about consequences
   - Confirm and cancel buttons
   - Reschedule option instead of cancel

2. **Create RescheduleModal Component**
   - Display original appointment details
   - Show available slots for rescheduling
   - Slot selection with date/time picker
   - Policy warning if within notice period
   - Reason for rescheduling
   - Confirm reschedule button
   - Calendar invite update notice

3. **Create CancellationPolicyDisplay Component**
   - Show trainer's cancellation policy
   - Notice period requirements
   - Refund policy details
   - No-show penalties
   - Package session restoration rules
   - Link to full policy document

4. **Create CancellationHistory Component**
   - List of past cancellations
   - Filter by date range and user
   - Show cancellation reason and outcome
   - Display refund/credit amount
   - Cancellation rate statistics
   - Export to CSV option

5. **Create NoShowTracking Component**
   - Mark client as no-show
   - Automatic no-show detection (if client doesn't confirm)
   - No-show history per client
   - Penalty warnings
   - Block future bookings after X no-shows

### Backend Tasks
1. **Create Cancellation Endpoints**
   ```typescript
   POST /api/schedule/appointments/:id/cancel
   Body: CancelAppointmentDto
   Response: { success, refundAmount, creditRestored, message }

   POST /api/schedule/appointments/:id/reschedule
   Body: RescheduleAppointmentDto
   Response: { appointment, newAppointment, policyApplied }

   GET /api/schedule/appointments/:id/cancellation-policy
   Response: CancellationPolicy with refund calculation

   GET /api/schedule/cancellations/history
   Query params: userId, startDate, endDate
   Response: Paginated cancellation history

   POST /api/schedule/appointments/:id/no-show
   Body: { reason, notifyClient }
   Response: { noShowRecorded, penaltyApplied }

   GET /api/schedule/cancellations/stats
   Response: Cancellation statistics
   ```

2. **Implement CancellationService**
   ```typescript
   class CancellationService {
     async cancelAppointment(appointmentId: string, dto: CancelAppointmentDto, userId: string)
     async rescheduleAppointment(appointmentId: string, dto: RescheduleAppointmentDto, userId: string)
     async getCancellationPolicy(appointmentId: string)
     async calculateRefund(appointment: Appointment, cancelledAt: Date)
     async processRefund(appointment: Appointment, amount: number)
     async restorePackageSession(appointment: Appointment)
     async notifyCancellation(appointment: Appointment, reason: string)
     async recordNoShow(appointmentId: string, dto: NoShowDto)
     async checkNoShowPenalty(clientId: string, trainerId: string)
     async getCancellationHistory(filters: CancellationFilters)
     async getCancellationStats(userId: string, role: UserRole)
   }
   ```

3. **Policy Engine**
   - Calculate notice hours (appointment time - cancellation time)
   - Apply refund rules based on notice period
   - Different rules for trainer vs. client cancellations
   - Handle package session restoration
   - Apply no-show penalties
   - Handle recurring series cancellations
   - Support policy overrides for trainers

4. **Database Schema**
   ```sql
   -- Cancellations
   appointment_cancellations (
     id UUID PRIMARY KEY,
     appointment_id UUID REFERENCES appointments(id),
     cancelled_by UUID REFERENCES users(id),
     cancellation_reason VARCHAR(50) NOT NULL,
     additional_notes TEXT,
     notice_hours DECIMAL(5,2) NOT NULL,
     is_chargeable BOOLEAN DEFAULT false,
     refund_amount DECIMAL(10,2),
     credit_restored BOOLEAN DEFAULT false,
     sessions_restored INTEGER DEFAULT 0,
     policy_override BOOLEAN DEFAULT false,
     override_reason TEXT,
     cancelled_at TIMESTAMP DEFAULT NOW()
   )

   -- Rescheduling
   appointment_reschedules (
     id UUID PRIMARY KEY,
     original_appointment_id UUID REFERENCES appointments(id),
     new_appointment_id UUID REFERENCES appointments(id),
     rescheduled_by UUID REFERENCES users(id),
     reschedule_reason TEXT,
     notice_hours DECIMAL(5,2),
     policy_applied VARCHAR(100),
     rescheduled_at TIMESTAMP DEFAULT NOW()
   )

   -- No-shows
   appointment_noshows (
     id UUID PRIMARY KEY,
     appointment_id UUID REFERENCES appointments(id),
     client_id UUID REFERENCES users(id),
     trainer_id UUID REFERENCES users(id),
     marked_by UUID REFERENCES users(id),
     reason TEXT,
     penalty_applied BOOLEAN DEFAULT false,
     penalty_amount DECIMAL(10,2),
     notified_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   )
   ```

### Data Models
```typescript
interface CancelAppointmentDto {
  reason: CancellationReason;
  additionalNotes?: string;
  requestRefund: boolean;
  policyOverride?: {
    enabled: boolean;
    reason: string;
    overrideRefund?: number; // Custom refund amount
  };
}

interface RescheduleAppointmentDto {
  newStartDateTime: Date;
  reason?: string;
  acceptPolicy: boolean;
}

interface CancellationPolicy {
  noticePeriodHours: number;
  fullRefundBeforeHours: number;
  partialRefundBeforeHours: number;
  partialRefundPercent: number;
  noRefundAfterHours: number;
  trainerCancellationPolicy: 'full_refund' | 'partial_refund' | 'no_refund';
  noShowPenalty: boolean;
  noShowPenaltyAmount?: number;
  packageSessionRestoration: boolean;
  description: string;
}

interface CancellationCalculation {
  noticeHours: number;
  refundAmount: number;
  creditRestored: boolean;
  sessionsRestored: number;
  isChargeable: boolean;
  policyApplied: string;
  warningMessage?: string;
}

enum CancellationReason {
  SCHEDULING_CONFLICT = 'scheduling_conflict',
  ILLNESS = 'illness',
  EMERGENCY = 'emergency',
  WEATHER = 'weather',
  FINANCIAL = 'financial',
  DISSATISFACTION = 'dissatisfaction',
  OTHER = 'other'
}

interface CancellationRecord {
  id: string;
  appointment: Appointment;
  cancelledBy: User;
  reason: CancellationReason;
  noticeHours: number;
  refundAmount: number;
  creditRestored: boolean;
  sessionsRestored: number;
  cancelledAt: Date;
}

interface NoShowRecord {
  id: string;
  appointment: Appointment;
  client: User;
  reason?: string;
  penaltyApplied: boolean;
  penaltyAmount?: number;
  createdAt: Date;
}
```

## Test Cases
1. **Happy Path**
   - Client cancels 48 hours before session
   - Full refund applied
   - Package session restored
   - Notification sent to trainer
   - Cancellation recorded in history

2. **Partial Refund**
   - Client cancels 12 hours before session (24h policy)
   - 50% refund applied
   - Partial package session restored
   - Warning shown before confirmation

3. **No Refund**
   - Client cancels 2 hours before session
   - No refund applied
   - Session forfeited
   - Package session not restored

4. **Trainer Cancellation**
   - Trainer cancels for any reason
   - Full refund or full credit restored
   - Notification sent to client
   - Apology message option

5. **Rescheduling**
   - Client reschedules 48 hours before
   - No penalty applied
   - New appointment created
   - Updated calendar invites sent

6. **No-Show**
   - Trainer marks client as no-show
   - Penalty applied if configured
   - Session charged
   - Client notified
   - No-show recorded in history

7. **Recurring Series**
   - Cancel entire series
   - Refund all future sessions
   - Restore all package sessions
   - Option to cancel only future sessions

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Cancel Appointment                         [Cancel ×]   |
+----------------------------------------------------------+
|  Appointment Details:                                    |
|  • Date: Tuesday, January 14, 2025                       |
|  • Time: 09:00 AM - 10:00 AM                             |
|  • Type: 1-on-1 Training                                 |
|  • Trainer: John Smith                                   |
|                                                          |
|  Cancellation Policy:                                    |
|  ✓ Full refund if cancelled 24+ hours before             |
|  ⚠️ 50% refund if cancelled 12-24 hours before           |
|  ✗ No refund if cancelled <12 hours before               |
|                                                          |
|  Your Notice Period:                                     |
|  Current time: January 12, 3:30 PM                       |
|  Appointment time: January 14, 9:00 AM                   |
|  Notice: 41.5 hours                                      |
|                                                          |
|  Refund Amount: $0 (1 session restored to package)       |
|                                                          |
|  Reason for Cancellation (required):                     |
|  [Scheduling Conflict ▼]                                 |
|                                                          |
|  Additional Notes (optional):                            |
|  [________________________]                              |
|                                                          |
|  ☐ I understand that 1 session will be restored          |
|                                                          |
|  [Cancel Appointment]  [Reschedule Instead]             |
+----------------------------------------------------------+
```

**Reschedule Modal:**
```
+----------------------------------------------------------+
|  Reschedule Appointment                      [Cancel ×]  |
+----------------------------------------------------------+
|  Original Appointment:                                   |
|  Tuesday, January 14, 2025 at 09:00 AM                   |
|                                                          |
|  Select New Date & Time:                                 |
|  [January 2025]                                          |
|  +---+---+---+---+---+---+---+                           |
|  | S | M | T | W | T | F | S |                           |
|  +---+---+---+---+---+---+---+                           |
|  |   | 6 | 7 | 8 | 9 |10 |11 |                           |
|  |12 |13 |14 |15 |16 |17 |18 |                           |
|  +---+---+---+---+---+---+---+                           |
|                                                          |
|  Available times for January 15:                         |
|  +-------------+ +-------------+ +-------------+          |
|  | 09:00 AM    | | 11:00 AM    | | 02:00 PM    |          |
|  +-------------+ +-------------+ +-------------+          |
|  +-------------+ +-------------+ +-------------+          |
|  | 09:30 AM    | | 11:30 AM    | | 02:30 PM    |          |
|  +-------------+ +-------------+ +-------------+          |
|                                                          |
|  Reason for rescheduling:                                |
|  [________________________]                              |
|                                                          |
|  ℹ️ No penalty - you're outside the notice period         |
|                                                          |
|  [Cancel]  [Confirm Reschedule]                          |
+----------------------------------------------------------+
```

**Cancellation History:**
```
+----------------------------------------------------------+
|  Cancellation History                     [Export CSV]   |
+----------------------------------------------------------+
|  Filters: [All Time ▼] [All Clients ▼] [All Reasons ▼]  |
|                                                          |
|  Date         | Client        | Reason         | Refund  |
|  +-------------+---------------+----------------+---------+
|  | Jan 10, 2025| Sarah Miller | Illness        | $0      |
|  |             | 41h notice   | 1 session      | restored|
|  +-------------+---------------+----------------+---------+
|  | Jan 5, 2025 | Mike Johnson | Scheduling     | $25     |
|  |             | 8h notice    | Conflict       | (50%)   |
|  +-------------+---------------+----------------+---------+
|  | Dec 28, 2024| Emma Lee     | Emergency      | $0      |
|  |             | 2h notice    | No refund      |         |
|  +-------------+---------------+----------------+---------+
|                                                          |
|  Statistics:                                             |
|  Total Cancellations: 24                                 |
|  Cancellation Rate: 8.3%                                 |
|  Average Notice: 18.5 hours                              |
|  Refunds Given: $450                                     |
+----------------------------------------------------------+
```

## Dependencies
- Story 009-01 (View Schedule) - for accessing appointments
- Story 009-03 (Book Session) - for rescheduling
- Package Management (EPIC-005) - for session restoration
- Payment system (EPIC-005) - for refunds
- Communication system (EPIC-008) - for notifications

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for cancellation flows
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Policy calculations verified

## Notes
- Ensure timezone accuracy for notice period calculations
- Consider adding "emergency" exception for policy
- Implement audit trail for all cancellations
- Add analytics to track cancellation rates by reason
- Consider implementing a "strike" system for chronic cancellations
- Test edge cases (cancellation exactly at notice period threshold)
- Ensure idempotency for cancellation API calls
- Add email templates for different cancellation scenarios
