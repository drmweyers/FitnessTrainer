# Story 001-06: Trainer Certifications

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-06
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 2

## User Story
**As a** trainer
**I want to** showcase my certifications
**So that** clients trust my expertise

## Acceptance Criteria
- [ ] Add multiple certifications
- [ ] Upload verification documents (PDF, images)
- [ ] Certification expiry date tracking
- [ ] Verification badge system
- [ ] Specialization tags
- [ ] Education history
- [ ] Years of experience display
- [ ] Expiry reminders
- [ ] Public/private toggle for each certification
- [ ] Download/view uploaded documents

## Technical Implementation

### Frontend Tasks
1. **Create CertificationManager Component**
   - List view of all certifications
   - Add/Edit/Delete certification
   - Upload document interface
   - Verification status display
   - Expiry date warnings

2. **Create CertificationForm Component**
   - Certification name input
   - Issuing organization field
   - Credential ID input
   - Issue date picker
   - Expiry date picker (optional)
   - Document upload area
   - Public/private toggle
   - Specialization tags input

3. **Create CertificationCard Component**
   - Display certification details
   - Verification badge (verified/pending)
   - Expiry date indicator
   - Document preview
   - Edit/Delete actions

4. **Create SpecializationTags Component**
   - Tag input with autocomplete
   - Common specializations suggestions
   - Custom tag creation
   - Tag removal

5. **Create EducationHistory Component**
   - Degree/certificate information
   - Institution name
   - Graduation year
   - Field of study

### Backend Tasks
1. **Create Certification Endpoints**
   ```typescript
   GET /api/profile/certifications - Get all certifications
   POST /api/profile/certifications - Add certification
   PUT /api/profile/certifications/:id - Update certification
   DELETE /api/profile/certifications/:id - Delete certification
   POST /api/profile/certifications/:id/verify - Request verification
   GET /api/profile/certifications/:id/document - Get document
   POST /api/profile/certifications/:id/document - Upload document
   ```

2. **Create Specialization Endpoints**
   ```typescript
   GET /api/profile/specializations - Get specializations
   POST /api/profile/specializations - Add specialization
   PUT /api/profile/specializations/:id - Update specialization
   DELETE /api/profile/specializations/:id - Delete specialization
   ```

3. **Implement CertificationService**
   ```typescript
   class CertificationService {
     async getCertifications(trainerId: string)
     async addCertification(trainerId: string, data: CreateCertificationDto)
     async updateCertification(certId: string, data: UpdateCertificationDto)
     async deleteCertification(certId: string, trainerId: string)
     async uploadDocument(certId: string, file: Express.Multer.File)
     async requestVerification(certId: string)
     async checkExpiryDates()
   }
   ```

4. **Create trainer_certifications Table**
   ```sql
   CREATE TABLE trainer_certifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID REFERENCES users(id),
     certification_name VARCHAR(255) NOT NULL,
     issuing_organization VARCHAR(255),
     credential_id VARCHAR(100),
     issue_date DATE,
     expiry_date DATE,
     document_url VARCHAR(500),
     is_verified BOOLEAN DEFAULT false,
     verified_at TIMESTAMP,
     is_public BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_trainer_certs ON trainer_certifications(trainer_id, is_verified);
   CREATE INDEX idx_cert_expiry ON trainer_certifications(expiry_date);
   ```

5. **Create trainer_specializations Table**
   ```sql
   CREATE TABLE trainer_specializations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID REFERENCES users(id),
     specialization VARCHAR(100) NOT NULL,
     years_experience INTEGER,
     description TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_trainer_specs ON trainer_specializations(trainer_id, specialization);
   ```

6. **Create trainer_education Table**
   ```sql
   CREATE TABLE trainer_education (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID REFERENCES users(id),
     degree VARCHAR(255),
     institution VARCHAR(255),
     field_of_study VARCHAR(255),
     graduation_year INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Data Models
```typescript
interface CreateCertificationDto {
  certificationName: string;
  issuingOrganization: string;
  credentialId?: string;
  issueDate: Date;
  expiryDate?: Date;
  isPublic: boolean;
}

interface Certification {
  id: string;
  trainerId: string;
  certificationName: string;
  issuingOrganization: string;
  credentialId?: string;
  issueDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  isExpiringSoon: boolean;
}

interface Specialization {
  id: string;
  trainerId: string;
  specialization: string;
  yearsExperience?: number;
  description?: string;
}

interface Education {
  id: string;
  trainerId: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  graduationYear: number;
}
```

## Test Cases
1. **Add Certification**
   - Click "Add Certification"
   - Fill in certification name
   - Add issuing organization
   - Set issue and expiry dates
   - Upload verification document
   - Save
   - Verify certification appears in list

2. **Upload Document**
   - Select certification
   - Click "Upload Document"
   - Choose PDF file
   - Verify upload progress
   - Verify document available for view

3. **Verification Status**
   - Add certification without document
   - Verify status shows "Pending"
   - Upload verification document
   - Request verification
   - Verify status updates to "Verified" (admin action)

4. **Expiry Warning**
   - Add certification expiring in 30 days
   - Verify warning indicator appears
   - Test with expired certification
   - Verify expired status shown

5. **Specialization Tags**
   - Navigate to specializations section
   - Add "Weight Loss" specialization
   - Add "Strength Training" specialization
   - Set years of experience
   - Verify tags display on profile

6. **Public/Private Toggle**
   - Create certification as public
   - Verify visible on public profile
   - Toggle to private
   - Verify hidden from public profile
   - Verify still visible to trainer

7. **Education History**
   - Add degree information
   - Add institution
   - Set graduation year
   - Save
   - Verify displays on profile

## UI/UX Mockups
```
+------------------------------------------+
|  My Certifications             [+ Add]   |
+------------------------------------------+
|                                          |
|  Verified (2)  Pending (1)  Expired (0)  |
|                                          |
|  ✓ NASM-CPT              [Public 👁️]     |
|  National Academy of Sports Medicine     |
|  Issued: Jan 2020  |  Expires: Dec 2025  |
|  Credential: NASM-CPT-12345              |
|  [View Document] [Edit] [Delete]         |
|                                          |
|  ✓ ACE Personal Trainer     [Public 👁️]  |
|  American Council on Exercise            |
|  Issued: Mar 2018  |  No Expiry          |
|  Credential: ACE-PT-67890                |
|  [View Document] [Edit] [Delete]         |
|                                          |
|  ⏳ Precision Nutrition     [Private 🔒] |
|  Pending Verification                    |
|  Issued: Jun 2023  |  Expires: Jun 2026  |
|  [Upload Document] [Edit] [Delete]       |
|                                          |
+------------------------------------------+
```

```
+------------------------------------------+
|  Add Certification            [Cancel]   |
+------------------------------------------+
|                                          |
|  Certification Name *                    |
|  [_____________________________]         |
|  e.g., NASM-CPT, ACE-CPT                 |
|                                          |
|  Issuing Organization *                  |
|  [_____________________________]         |
|  e.g., National Academy of Sports Med.   |
|                                          |
|  Credential ID                           |
|  [_____________________________]         |
|                                          |
|  Issue Date *                   [📅]     |
|  [January 15, 2020___________]           |
|                                          |
|  Expiry Date                    [📅]     |
|  [December 31, 2025_________]            |
|                                          |
|  Upload Verification Document            |
|  +----------------------------------+    |
|  | Drag & drop or click to upload   |    |
|  | PDF, JPG, PNG up to 10MB         |    |
|  +----------------------------------+    |
|                                          |
|  [ ] Make public on profile             |
|                                          |
|  [  Cancel  ]  [  Add Certification  ]  |
+------------------------------------------+
```

## Dependencies
- STORY-001-01 (Create Initial Profile) must be completed
- Trainer role must be established
- Document upload service configured
- Admin verification workflow (future enhancement)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Certification CRUD operations working
- [ ] Document upload functional
- [ ] Verification tracking in place
- [ ] Expiry warnings displaying correctly
- [ ] Specialization tags working
- [ ] Education history implemented
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Document security tested
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Verification will be manual initially (admin panel)
- Consider integrating with certification databases for auto-verification
- Expiry reminders should be sent 60, 30, and 7 days before
- Documents should be stored securely with access controls
- Display certifications prominently on trainer public profile
- Consider adding certification verification badge
- Specializations should help clients find trainers
- Education history adds credibility
