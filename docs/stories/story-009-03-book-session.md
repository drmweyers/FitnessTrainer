# Story 009-03: Book Training Session

**Parent Epic**: [EPIC-009 - Scheduling & Calendar](../epics/epic-009-scheduling-calendar.md)
**Story ID**: STORY-009-03
**Priority**: P1 (High)
**Story Points**: 13
**Sprint**: Sprint 9

## User Story
**As a** client
**I want to** book training sessions through an easy-to-use interface
**So that I** can schedule my workouts at convenient times

## Acceptance Criteria
- [ ] View trainer's availability in a calendar or slot format
- [ ] Select preferred date and time slot
- [ ] Choose session type (1-on-1, group class, assessment)
- [ ] Select session duration (30, 45, 60, 90 minutes)
- [ ] Choose location (gym or online)
- [ ] Add session notes or goals
- [ ] View package balance before booking
- [ ] Receive instant booking confirmation
- [ ] Download calendar invite (.ics file)
- [ ] View booking history
- [ ] See upcoming appointments on dashboard
- [ ] Cancel or reschedule booking (subject to policy)
- [ ] Get email/SMS confirmation
- [ ] Handle payment if package is insufficient

## Technical Implementation

### Frontend Tasks
1. **Create BookingWidget Component**
   - Calendar view with available slots
   - Date picker with availability indicators
   - Time slot grid for selected date
   - Session type selector
   - Duration options (30/45/60/90 min)
   - Location toggle (gym/online)
   - Session notes textarea
   - Package balance display
   - Book button with confirmation

2. **Create AvailableSlotsGrid Component**
   - Display time slots for selected date
   - Show slot availability status
   - Filter by session type and duration
   - Show disabled slots for unavailable times
   - Highlight first available slot
   - Show "no slots available" message

3. **Create BookingSummary Component**
   - Display selected slot details
   - Show session type and duration
   - Display location information
   - Show package balance after booking
   - Include pricing if payment needed
   - Terms and cancellation policy display
   - Confirm booking button

4. **Create BookingConfirmation Component**
   - Success message with appointment details
   - Add to calendar buttons (Google, Apple, Outlook)
   - Download .ics file option
   - View in my calendar button
   - Schedule another booking option
   - Share with trainer message

5. **Create BookingHistory Component**
   - List of upcoming appointments
   - Past appointments with status
   - Cancel/reschedule buttons
   - Filter by status and date
   - Search functionality

### Backend Tasks
1. **Create Booking Endpoints**
   ```typescript
   GET /api/schedule/available-slots - Get available time slots
   Query params:
   - trainerId: UUID (required)
   - startDate: ISO date (required)
   - endDate: ISO date (optional)
   - sessionType: string (optional)
   - duration: number (optional)
   - location: string (optional)

   POST /api/schedule/bookings - Create new booking
   Body: CreateBookingDto
   Response: Appointment with confirmation details

   GET /api/schedule/bookings - Get user's bookings
   Query params:
   - userId: UUID (optional, defaults to current user)
   - status: string[] (optional)
   - startDate: ISO date (optional)
   - endDate: ISO date (optional)

   GET /api/schedule/bookings/:id - Get booking details

   PUT /api/schedule/bookings/:id - Update booking

   DELETE /api/schedule/bookings/:id - Cancel booking

   POST /api/schedule/bookings/:id/reschedule - Reschedule booking

   GET /api/schedule/package-balance - Get client package balance
   Query params: clientId, trainerId
   ```

2. **Implement BookingService**
   ```typescript
   class BookingService {
     async getAvailableSlots(params: GetSlotsDto)
     async createBooking(dto: CreateBookingDto, clientId: string)
     async getBookingById(bookingId: string, userId: string)
     async getClientBookings(clientId: string, filters?: BookingFilters)
     async updateBooking(bookingId: string, dto: UpdateBookingDto, userId: string)
     async cancelBooking(bookingId: string, userId: string, reason?: string)
     async rescheduleBooking(bookingId: string, newSlot: SlotDto, userId: string)
     async checkPackageBalance(clientId: string, trainerId: string)
     async deductPackageSession(clientId: string, trainerId: string)
     async generateCalendarInvite(appointmentId: string)
     async sendBookingConfirmation(appointmentId: string)
   }
   ```

3. **Availability Checking Algorithm**
   - Get trainer's weekly availability
   - Apply date-specific overrides
   - Check existing appointments
   - Apply booking rules (min notice, max advance)
   - Filter by session type and duration
   - Account for buffer time
   - Return available slots

4. **Package Integration**
   - Check client's active packages
   - Verify session availability
   - Deduct session on booking
   - Handle insufficient packages
   - Trigger payment flow if needed
   - Refund session on cancellation (per policy)

5. **Notification Service**
   - Send booking confirmation email
   - Send SMS confirmation (if enabled)
   - Send push notification
   - Generate calendar invite attachment
   - Notify trainer of new booking

### Data Models
```typescript
interface CreateBookingDto {
  trainerId: string;
  clientId: string;
  appointmentType: AppointmentType;
  startDateTime: Date;
  durationMinutes: number;
  location: Location;
  isOnline: boolean;
  title?: string;
  description?: string;
  sessionNotes?: string;
  goals?: string[];
  packageId?: string; // If using specific package
}

interface BookingResponse {
  appointment: Appointment;
  confirmationCode: string;
  calendarInvite: string; // Base64 encoded .ics file
  packageBalance?: {
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
  };
  cancellationPolicy: CancellationPolicy;
}

interface AvailableSlot {
  startDateTime: Date;
  endDateTime: Date;
  isAvailable: boolean;
  unavailableReason?: string;
  canBook: boolean; // Based on booking rules
  sessionTypes: AppointmentType[];
  locations: Location[];
}

interface GetSlotsDto {
  trainerId: string;
  startDate: Date;
  endDate?: Date;
  sessionType?: AppointmentType;
  duration?: number;
  location?: Location;
}

interface BookingFilters {
  status?: AppointmentStatus[];
  startDate?: Date;
  endDate?: Date;
  trainerId?: string;
}

interface CancellationPolicy {
  noticeHours: number;
  refundPolicy: 'full' | 'partial' | 'none';
  partialRefundPercent?: number;
  description: string;
}
```

## Test Cases
1. **Happy Path**
   - View available slots for a date
   - Select a time slot
   - Choose session type and duration
   - Add session notes
   - Complete booking
   - Receive confirmation
   - Download calendar invite

2. **Edge Cases**
   - No available slots for selected date
   - Booking at minimum notice time
   - Booking at maximum advance time
   - Session with insufficient package balance
   - Booking for very far future date
   - Back-to-back sessions
   - Session spanning midnight

3. **Validation**
   - Can't book past appointments
   - Can't book outside availability
   - Duration must match session type
   - Location must match availability
   - Must have valid payment/package
   - Can't double book same time

4. **Error Cases**
   - Trainer unavailable at selected time
   - Slot just booked by another client
   - Network error during booking
   - Payment processing failure
   - Package expired
   - Invalid trainer or client ID

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Book a Session                                          |
+----------------------------------------------------------+
|  Step 1 of 3: Choose Date & Time  [====----]             |
|                                                          |
|  Select Trainer: [John Smith ▼]                          |
|                                                          |
|  Session Type:                                           |
|  ◉ 1-on-1 Training (60 min)                              |
|  ○ Assessment (90 min)                                   |
|  ○ Group Class (45 min)                                  |
|                                                          |
|  Location:                                               |
|  ◉ In-Person at Gym                                      |
|  ○ Online (Video Call)                                   |
|                                                          |
|  Your Package Balance: 5 sessions remaining              |
|                                                          |
|  Select Date:                                            |
|  [January 2025]                                          |
|  +---+---+---+---+---+---+---+                           |
|  | S | M | T | W | T | F | S |                           |
|  +---+---+---+---+---+---+---+                           |
|  |   | 6 | 7 | 8 | 9 |10 |11 |                           |
|  |12 |13 |14 |15 |16 |17 |18 |                           |
|  +---+---+---+---+---+---+---+                           |
|  Selected: January 14, 2025                              |
|                                                          |
|  Available Times:                                        |
|  +-------------+ +-------------+ +-------------+          |
|  | 09:00 AM    | | 11:00 AM    | | 02:00 PM    |          |
+  +-------------+ +-------------+ +-------------+          |
|  +-------------+ +-------------+ +-------------+          |
|  | 09:30 AM    | | 11:30 AM    | | 02:30 PM    |          |
|  +-------------+ +-------------+ +-------------+          |
|                                                          |
|  [Previous]                    [Next: Add Details]       |
+----------------------------------------------------------+
```

**Booking Summary:**
```
+----------------------------------------------------------+
|  Review Booking                                          |
+----------------------------------------------------------+
|  Session Details:                                        |
|  • Date: Tuesday, January 14, 2025                       |
|  • Time: 09:00 AM - 10:00 AM                             |
|  • Type: 1-on-1 Training                                 |
|  • Duration: 60 minutes                                  |
|  • Location: Main Gym                                    |
|  • Trainer: John Smith                                   |
|                                                          |
|  Your Notes:                                             |
|  "Focus on upper body strength, particularly shoulders"  |
|                                                          |
|  Package Balance:                                        |
|  Before: 5 sessions                                      |
|  After: 4 sessions                                       |
|                                                          |
|  Cancellation Policy:                                    |
|  Full refund if cancelled 24 hours before session        |
|                                                          |
|  ☐ I agree to the cancellation policy                   |
|                                                          |
|  Total Cost: $0 (covered by package)                     |
|                                                          |
|  [Back]                      [Confirm Booking]           |
+----------------------------------------------------------+
```

**Booking Confirmation:**
```
+----------------------------------------------------------+
|  ✓ Booking Confirmed!                        [Close ×]   |
+----------------------------------------------------------+
|  Your session has been successfully booked               |
|                                                          |
|  Appointment Details:                                    |
|  • Confirmation #: BK-2025-0142                          |
|  • Date: Tuesday, January 14, 2025                       |
|  • Time: 09:00 AM - 10:00 AM                             |
|  • Type: 1-on-1 Training                                 |
|  • Location: Main Gym                                    |
|  • Trainer: John Smith                                   |
|                                                          |
|  Add to Calendar:                                        |
|  [Google Calendar] [Apple Calendar] [Outlook]            |
|  [Download .ics file]                                    |
|                                                          |
|  Confirmation sent to:                                   |
|  • Email: client@email.com                               |
|  • SMS: +1 (555) 123-4567                                |
|                                                          |
|  [View My Bookings]  [Book Another Session]              |
+----------------------------------------------------------+
```

## Dependencies
- Story 009-01 (View Schedule) - for calendar display
- Story 009-02 (Set Availability) - for slot generation
- Payment system (EPIC-005) - for package handling
- Communication system (EPIC-008) - for confirmations
- Authentication system - for user identification

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for booking flow
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (booking <3s)
- [ ] Documentation updated
- [ ] Mobile responsive tested
- [ ] Accessibility compliant

## Notes
- Implement optimistic locking to prevent double bookings
- Add real-time slot availability updates if possible
- Consider adding a "waitlist" feature for fully booked slots
- Ensure timezone clarity throughout the booking process
- Add analytics to track booking conversion rates
- Consider implementing booking deposits for new clients
- Test thoroughly on mobile devices
- Add keyboard navigation for accessibility
