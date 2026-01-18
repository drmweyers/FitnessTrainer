# Story 001-07: Progress Photos

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-07
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 2

## User Story
**As a** client
**I want to** upload progress photos
**So that I** can track my physical transformation

## Acceptance Criteria
- [ ] Private photo gallery with client-only access
- [ ] Date-stamped uploads
- [ ] Front/side/back view tagging
- [ ] Before/after comparison view
- [ ] Share with trainer only (optional)
- [ ] Bulk upload option
- [ ] Delete individual photos
- [ ] Export photo timeline as PDF
- [ ] Photo notes and comments
- [ ] Calendar view for tracking
- [ ] Mobile-optimized upload flow

## Technical Implementation

### Frontend Tasks
1. **Create ProgressGallery Component**
   - Grid view of all progress photos
   - Filter by date range, view type
   - Timeline view option
   - Calendar view integration
   - Bulk selection mode

2. **Create PhotoUploader Component**
   - Multi-photo upload support
   - Drag-and-drop interface
   - Camera capture (mobile)
   - View type selector (front/side/back)
   - Date picker (default: today)
   - Notes input field

3. **Create ComparisonViewer Component**
   - Side-by-side comparison
   - Slider comparison (before/after)
   - Select two photos to compare
   - Zoom functionality
   - Full-screen mode

4. **Create PhotoCard Component**
   - Display photo thumbnail
   - Show date and view type
   - Quick actions (view, delete, share)
   - Notes preview

5. **Create TimelineView Component**
   - Chronological photo display
   - Group by date/week/month
   - Progress visualization
   - Navigation between time periods

### Backend Tasks
1. **Create Progress Photo Endpoints**
   ```typescript
   GET /api/profile/progress-photos - Get all photos
   POST /api/profile/progress-photos - Upload photo(s)
   GET /api/profile/progress-photos/:id - Get photo details
   DELETE /api/profile/progress-photos/:id - Delete photo
   PUT /api/profile/progress-photos/:id - Update photo metadata
   POST /api/profile/progress-photos/:id/share - Share with trainer
   GET /api/profile/progress-photos/timeline - Get timeline view
   GET /api/profile/progress-photos/export - Export as PDF
   POST /api/profile/progress-photos/bulk-upload - Bulk upload
   ```

2. **Implement ProgressPhotoService**
   ```typescript
   class ProgressPhotoService {
     async getPhotos(userId: string, filters?: PhotoFilters)
     async uploadPhoto(userId: string, data: UploadPhotoDto)
     async bulkUpload(userId: string, files: Express.Multer.File[])
     async getPhoto(photoId: string, userId: string)
     async deletePhoto(photoId: string, userId: string)
     async updatePhoto(photoId: string, data: UpdatePhotoDto)
     async shareWithTrainer(photoId: string)
     async getTimeline(userId: string, startDate?: Date, endDate?: Date)
     async exportToPDF(userId: string, dateRange?: DateRange)
   }
   ```

3. **Create progress_photos Table**
   ```sql
   CREATE TABLE progress_photos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     photo_url VARCHAR(500) NOT NULL,
     thumbnail_url VARCHAR(500),
     photo_type VARCHAR(20),
     notes TEXT,
     is_private BOOLEAN DEFAULT true,
     shared_with_trainer BOOLEAN DEFAULT false,
     taken_at DATE,
     uploaded_at TIMESTAMP DEFAULT NOW(),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_progress_photos_user ON progress_photos(user_id, taken_at DESC);
   CREATE INDEX idx_progress_photos_type ON progress_photos(user_id, photo_type);
   ```

4. **Storage Configuration**
   - Create bucket structure: `progress-photos/{user_id}/{date}/`
   - Generate multiple thumbnails (150x150, 300x300, 600x600)
   - Configure CDN for delivery
   - Set up presigned URLs for direct uploads

### Data Models
```typescript
enum PhotoType {
  FRONT = 'front',
  SIDE = 'side',
  BACK = 'back',
  OTHER = 'other'
}

interface UploadPhotoDto {
  file: Express.Multer.File;
  photoType: PhotoType;
  notes?: string;
  takenAt?: Date;
  shareWithTrainer?: boolean;
}

interface ProgressPhoto {
  id: string;
  userId: string;
  photoUrl: string;
  thumbnailUrl: string;
  photoType: PhotoType;
  notes?: string;
  isPrivate: boolean;
  sharedWithTrainer: boolean;
  takenAt: Date;
  uploadedAt: Date;
  createdAt: Date;
}

interface PhotoFilters {
  startDate?: Date;
  endDate?: Date;
  photoType?: PhotoType;
  sharedWithTrainer?: boolean;
}

interface TimelineEntry {
  date: Date;
  photos: ProgressPhoto[];
}
```

## Test Cases
1. **Upload Single Photo**
   - Navigate to progress photos
   - Click "Upload Photo"
   - Select "Front" view
   - Upload image file
   - Add note: "Starting point"
   - Save
   - Verify photo appears in gallery

2. **Bulk Upload**
   - Click "Bulk Upload"
   - Select 5 photos
   - Set date for all
   - Assign view types
   - Upload
   - Verify all photos uploaded
   - Verify correct view types assigned

3. **Comparison View**
   - Select two photos from different dates
   - Click "Compare"
   - Verify side-by-side display
   - Test slider comparison
   - Verify zoom functionality

4. **Share with Trainer**
   - Upload photo (private by default)
   - Click "Share with Trainer"
   - Verify shared flag set
   - Verify trainer can now view
   - Test unsharing

5. **Delete Photo**
   - Select photo from gallery
   - Click delete
   - Confirm deletion
   - Verify photo removed
   - Verify file deleted from storage

6. **Timeline View**
   - Navigate to timeline view
   - Verify chronological order
   - Test grouping by month
   - Navigate between months
   - Verify all photos present

7. **Export to PDF**
   - Select date range
   - Click "Export"
   - Verify PDF generation
   - Verify all photos included
   - Verify notes included
   - Verify download starts

8. **Mobile Upload**
   - Test on mobile device
   - Use camera capture
   - Verify photo orientation correct
   - Verify upload successful
   - Test bulk upload from gallery

## UI/UX Mockups
```
+------------------------------------------+
|  Progress Photos              [+ Upload] |
+------------------------------------------+
|                                          |
|  [Grid View] [Timeline] [Calendar]       |
|                                          |
|  Filter: [All Views ▼]  [Jan 2024 ▼]     |
|                                          |
|  January 2024                            |
|  +-----+  +-----+  +-----+               |
|  |Front|  |Side |  |Back |               |
|  | 1/15|  | 1/15|  | 1/15|               |
|  +-----+  +-----+  +-----+               |
|                                          |
|  +-----+  +-----+  +-----+               |
|  |Front|  |Side |  |Back |               |
|  | 2/15|  | 2/15|  | 2/15|               |
|  +-----+  +-----+  +-----+               |
|                                          |
|  [Compare Selected] [Export PDF]         |
+------------------------------------------+
```

```
+------------------------------------------+
|  Upload Progress Photo      [Cancel]     |
+------------------------------------------+
|                                          |
|  Select Photos                           |
|  +----------------------------------+    |
|  |                                  |    |
|  |     Drag & drop photos here      |    |
|  |     or click to browse           |    |
|  |                                  |    |
|  +----------------------------------+    |
|  Selected: 3 photos                  |
|                                          |
|  View Type for Selected Photos:         |
|  ○ Front   ● Side   ○ Back   ○ Other   |
|                                          |
|  Date Taken: [January 15, 2024____📅]   |
|                                          |
|  Notes:                                  |
|  [__________________________________]   |
|  [__________________________________]   |
|                                          |
|  [ ] Share with trainer                 |
|                                          |
|  [  Cancel  ]  [  Upload Photos  ]       |
+------------------------------------------+
```

```
+------------------------------------------+
|  Compare Photos                  [Close] |
+------------------------------------------+
|                                          |
|  Jan 1, 2024              Feb 1, 2024    |
|  +----------------+      +----------------+ |
|  |                |      |                | |
|  |                |      |                | |
|  |                |      |                | |
|  |                |      |                | |
|  +----------------+      +----------------+ |
|                                          |
|  [  <  Slider  >  ]                      |
|                                          |
|  [ Zoom In ] [ Full Screen ]             |
+------------------------------------------+
```

## Dependencies
- STORY-001-01 (Create Initial Profile) must be completed
- Client role must be established
- Image upload service configured
- PDF generation library
- CDN for photo delivery

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Single and bulk upload working
- [ ] Comparison view functional
- [ ] Timeline view implemented
- [ ] Export to PDF working
- [ ] Share with trainer functional
- [ ] Mobile camera capture working
- [ ] Privacy controls respected
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Performance tested with 100+ photos
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Photos are highly sensitive - ensure strict privacy controls
- Consider adding AI-based progress analysis (future)
- Calendar view could show workout adherence alongside photos
- Add reminders for periodic photo uploads
- Trainer should be able to comment on photos
- Consider adding progress photo challenges
- Storage costs could grow - implement retention policies
- Thumbnails essential for performance with many photos
- Consider video support for progress tracking
