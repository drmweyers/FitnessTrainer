# Story 001-04: Complete Health Questionnaire

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-04
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 2

## User Story
**As a** client
**I want to** fill out a health questionnaire
**So that my** trainer can create safe, effective programs

## Acceptance Criteria
- [ ] Comprehensive health questions covering all key areas
- [ ] Medical conditions checklist with common conditions
- [ ] Current medications field with dosage tracking
- [ ] Detailed injury history section
- [ ] Lifestyle questions (smoking, drinking, sleep, stress)
- [ ] Save progress functionality
- [ ] Update reminders for incomplete sections
- [ ] Privacy assurance messaging throughout
- [ ] Option to mark certain info as trainer-only
- [ ] Export/download questionnaire responses

## Technical Implementation

### Frontend Tasks
1. **Create HealthQuestionnaire Component**
   - Multi-section form with progress tracking
   - Accordion-style sections for easier navigation
   - Conditional logic (show/hide based on answers)
   - Auto-save after each section
   - Completion indicator

2. **Create HealthSection Components**
   - MedicalConditionsSection (checklist + custom input)
   - MedicationsSection (dynamic list with dosage)
   - InjuryHistorySection (body map or checklist)
   - LifestyleSection (habits and daily routines)
   - EmergencyContactSection (contact details)

3. **Create PrivacyNotice Component**
   - Display privacy assurance message
   - Explain data usage
   - Show who can access information
   - Link to full privacy policy

4. **Implement Form Features**
   - Dynamic form fields (add/remove medications)
   - Conditional validation
   - Save draft functionality
   - Section completion tracking
   - Reminder scheduling

### Backend Tasks
1. **Create Health Endpoints**
   ```typescript
   GET /api/profile/health - Get health questionnaire
   PUT /api/profile/health - Update health questionnaire
   PATCH /api/profile/health/:section - Update specific section
   GET /api/profile/health/export - Export as PDF
   POST /api/profile/health/complete - Mark as complete
   ```

2. **Implement HealthService**
   ```typescript
   class HealthService {
     async getHealthInfo(userId: string)
     async updateHealthInfo(userId: string, data: HealthDto)
     async updateSection(userId: string, section: string, data: any)
     async exportHealthInfo(userId: string)
     async markComplete(userId: string)
   }
   ```

3. **Create user_health Table**
   ```sql
   CREATE TABLE user_health (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) UNIQUE,
     blood_type VARCHAR(10),
     medical_conditions TEXT[],
     custom_conditions TEXT[],
     medications JSONB,
     allergies TEXT[],
     injuries JSONB,
     surgeries JSONB,
     family_history JSONB,
     lifestyle JSONB,
     last_physical_exam DATE,
     emergency_contact JSONB,
     is_complete BOOLEAN DEFAULT false,
     completed_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_user_health_complete ON user_health(user_id, is_complete);
   ```

4. **Medications Structure**
   ```sql
   -- JSONB structure for medications field
   {
     "medications": [
       {
         "name": "Aspirin",
         "dosage": "81mg",
         "frequency": "Once daily",
         "purpose": "Heart health",
         "prescribingDoctor": "Dr. Smith"
       }
     ]
   }
   ```

### Data Models
```typescript
interface HealthDto {
  bloodType?: string;
  medicalConditions: string[];
  customConditions?: string[];
  medications: Medication[];
  allergies: string[];
  injuries: Injury[];
  surgeries: Surgery[];
  familyHistory?: FamilyHistory;
  lifestyle: Lifestyle;
  lastPhysicalExam?: Date;
  emergencyContact: EmergencyContact;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  prescribingDoctor?: string;
}

interface Injury {
  type: string;
  location: string;
  date?: Date;
  severity: 'mild' | 'moderate' | 'severe';
  isRecurring: boolean;
  notes?: string;
}

interface Lifestyle {
  smokingStatus: 'never' | 'former' | 'current';
  smokingFrequency?: string;
  drinkingStatus: 'never' | 'occasional' | 'regular' | 'heavy';
  drinkingFrequency?: string;
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  stressLevel: 'low' | 'moderate' | 'high';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}
```

## Test Cases
1. **Happy Path - Complete Questionnaire**
   - Navigate to health questionnaire
   - Complete medical conditions section
   - Add current medications
   - Document injury history
   - Fill out lifestyle information
   - Add emergency contact
   - Mark as complete
   - Verify all data saved

2. **Save Progress**
   - Start questionnaire
   - Complete first section
   - Navigate away
   - Return and verify progress saved
   - Complete remaining sections

3. **Conditional Logic**
   - Select "smoker" in lifestyle section
   - Verify smoking frequency field appears
   - Change to "non-smoker"
   - Verify frequency field hidden/removed

4. **Dynamic Medications List**
   - Add first medication
   - Add second medication
   - Remove first medication
   - Verify list updates correctly

5. **Privacy Controls**
   - Verify privacy notice displayed
   - Test marking information as trainer-only
   - Verify access controls respected

6. **Export Functionality**
   - Complete questionnaire
   - Click export button
   - Verify PDF generated
   - Verify all information included

## UI/UX Mockups
```
+------------------------------------------+
|  Health Questionnaire       Section 2 of 5|
|  ████████░░░░░░░░░░░░░░░░░  40%         |
+------------------------------------------+
|                                          |
|  🩺 Medical Conditions                   |
|                                          |
|  Do you have any of the following        |
|  medical conditions? Select all that     |
|  apply.                                  |
|                                          |
|  ☑ Diabetes                              |
|  ☐ High Blood Pressure                   |
|  ☐ Heart Disease                         |
|  ☐ Asthma                                |
|  ☐ Arthritis                             |
|  ☐ Osteoporosis                          |
|  ☐ Other (specify below)                 |
|                                          |
|  Other conditions:                       |
|  [___________________________________]   |
|  [+ Add Another]                         |
|                                          |
|  💬 Your health information is private   |
|  and only shared with your trainer       |
|                                          |
|  [  Previous ]  [  Next  ]  [ Save ]     |
+------------------------------------------+
```

```
+------------------------------------------+
|  💊 Current Medications                  |
+------------------------------------------+
|                                          |
|  List any medications you are currently  |
|  taking.                                 |
|                                          |
|  +----------------------------------+    |
|  | Medication 1              [Remove]|    |
|  +----------------------------------+    |
|  | Name: [Aspirin_________________]  |    |
|  | Dosage: [81mg___________________]  |    |
|  | Frequency: [Once daily__________]  |    |
|  | Purpose: [Heart health__________]  |    |
|  +----------------------------------+    |
|                                          |
|  [+ Add Another Medication]              |
|                                          |
|  [  Previous ]  [  Next  ]  [ Save ]     |
+------------------------------------------+
```

## Dependencies
- STORY-001-01 (Create Initial Profile) must be completed
- Client role must be established
- PDF generation library (for export functionality)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All health sections implemented and tested
- [ ] Auto-save functionality working
- [ ] Privacy controls implemented and tested
- [ ] Export functionality working
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] HIPAA/GDPR compliance review
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Critical for trainer to create safe programs
- Ensure HIPAA/GDPR compliance for health data
- Add visual indicators for incomplete sections
- Consider adding health risk scoring for trainers
- Export should be PDF for easy sharing with healthcare providers
- All health data should be encrypted at rest
- Trainer access should be logged for audit purposes
