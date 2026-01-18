# Story 007-03: Progress Photos Comparison

**Parent Epic**: [EPIC-007 - Progress Analytics](../epics/epic-007-progress-analytics.md)
**Story ID**: STORY-007-03
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 8

## User Story
**As a** client
**I want to** compare progress photos
**So that I** can see visual transformation

## Acceptance Criteria
- [ ] Side-by-side comparison view
- [ ] Slider comparison tool (before/after)
- [ ] Timeline view with all photos
- [ ] Multiple angle support (front, side, back)
- [ ] Privacy controls for photos
- [ ] Date stamps on photos
- [ ] Measurement overlay option
- [ ] Share options (with permission)
- [ ] Photo management (delete, reorder)
- [ ] High-resolution photo support

## Technical Implementation

### Frontend Tasks
1. **Create PhotoComparison Component**
   - Side-by-side image display
   - Slider/before-after view
   - Date selector for each photo
   - Angle selector (front, side, back)
   - Zoom functionality

2. **Create PhotoSlider Component**
   - Draggable slider between images
   - Smooth reveal animation
   - Before/after labels
   - Touch-friendly slider handle

3. **Create PhotoTimeline Component**
   - Chronological photo grid
   - Date-grouped sections
   - Thumbnail preview
   - Quick select for comparison

4. **Create PhotoManager Component**
   - Upload new photos
   - Delete existing photos
   - Reorder photos
   - Edit photo metadata (date, angle, notes)

5. **Implement Privacy Controls**
   - Photo visibility settings
   - Share permissions
   - Download prevention option
   - Blur option for sensitive areas

### Backend Tasks
1. **Create Photo Endpoints**
   ```typescript
   POST /api/analytics/photos - Upload progress photo
   GET /api/analytics/photos - Get all photos
   GET /api/analytics/photos/compare - Get comparison data
   PUT /api/analytics/photos/:id - Update photo metadata
   DELETE /api/analytics/photos/:id - Delete photo
   POST /api/analytics/photos/:id/share - Generate share link
   ```

2. **Implement PhotoService**
   ```typescript
   class PhotoService {
     async uploadPhoto(userId: string, file: File, metadata: PhotoMetadata)
     async getPhotos(userId: string, angle?: string)
     async getComparison(userId: string, photo1Id: string, photo2Id: string)
     async deletePhoto(photoId: string, userId: string)
     async generateShareLink(photoId: string, permissions: SharePermissions)
     async processPhoto(file: File): Promise<ProcessedPhoto>
   }
   ```

3. **Image Processing**
   - Resize/compress for storage
   - Generate thumbnails
   - Apply watermarks (optional)
   - Handle EXIF data
   - Store in cloud storage (S3, etc.)

### Data Models
```typescript
interface ProgressPhotoSession {
  id: string;
  userId: string;
  sessionDate: Date;
  lightingConditions: string;
  timeOfDay: string;
  photos: ProgressPhoto[];
  notes?: string;
  createdAt: Date;
}

interface ProgressPhoto {
  id: string;
  sessionId: string;
  userId: string;
  angle: 'front' | 'side' | 'back' | 'other';
  url: string;
  thumbnailUrl: string;
  date: Date;
  measurements?: PhotoMeasurements;
  privacy: PhotoPrivacy;
  metadata: PhotoMetadata;
}

interface PhotoMeasurements {
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
}

interface PhotoPrivacy {
  isPrivate: boolean;
  allowSharing: boolean;
  allowDownload: boolean;
  sharedWith: string[]; // User IDs
}

interface PhotoMetadata {
  originalFilename: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  camera?: string;
  location?: GeoLocation;
}

interface ComparisonData {
  photo1: ProgressPhoto;
  photo2: ProgressPhoto;
  timeDifference: number; // days
  measurements: {
    photo1: PhotoMeasurements;
    photo2: PhotoMeasurements;
    changes: MeasurementChanges;
  };
}

interface MeasurementChanges {
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
}
```

## Test Cases
1. **Happy Path**
   - User uploads progress photo
   - Photo appears in timeline
   - User selects two photos to compare
   - Side-by-side view displays correctly
   - Slider tool works smoothly
   - User can see transformation

2. **Edge Cases**
   - Only one photo (can't compare)
   - Photos with different angles
   - Very old vs. recent photos
   - Low-quality photos
   - Different lighting conditions
   - Different poses/angles
   - Photo upload failure
   - Storage quota exceeded

3. **Privacy Tests**
   - Private photo not visible to trainer
   - Share link expires correctly
   - Download prevention works
   - Blur function applied

4. **Performance Tests**
   - Photo load time
   - Slider performance
   - Zoom/pan smoothness
   - Thumbnail generation speed

## UI/UX Mockups
```
+------------------------------------------+
|  Progress Photos                         |
|  [← Back]                    [+ Upload]  |
+------------------------------------------+
|                                           |
|  [Timeline] [Comparison] [Manage]         |
|                                           |
|  Timeline:                                |
|                                           |
|  October 2025                             |
|  ┌─────┐ ┌─────┐ ┌─────┐                 |
|  │Front│ │Side │ │Back │                 |
|  │ 20  │ │ 20  │ │ 20  │                 |
|  └─────┘ └─────┘ └─────┘                 |
|                                           |
|  September 2025                           |
|  ┌─────┐ ┌─────┐ ┌─────┐                 |
|  │Front│ │Side │ │Back │                 |
|  │ 15  │ │ 15  │ │ 15  │                 |
|  └─────┘ └─────┘ └─────┘                 |
|                                           |
|  August 2025                              |
|  ┌─────┐ ┌─────┐ ┌─────┐                 |
|  │Front│ │Side │ │Back │                 |
|  │ 10  │ │ 10  │ │ 10  │                 |
|  └─────┘ └─────┘ └─────┘                 |
+------------------------------------------+
```

**Comparison View (Side-by-Side):**
```
+------------------------------------------+
|  Compare Photos                          |
|  [← Back]                    [Slider View]|
+------------------------------------------+
|                                           |
|  Oct 20, 2025              Sep 15, 2025   |
|  ┌─────────────┐           ┌─────────────┐|
|  │             │           │             │|
|  │   [Photo 1] │           │   [Photo 2] │|
|  │             │           │             │|
|  │  Front View │           │  Front View │|
|  │             │           │             │|
|  │  185 lbs    │           │  190 lbs    │|
|  │  15% BF     │           │  16% BF     │|
|  └─────────────┘           └─────────────┘|
|                                           |
|  Time difference: 35 days                 |
|  Weight change: -5 lbs                    |
|  Body fat: -1%                            |
|                                           |
|  [Swap Photos] [Show Measurements]        |
+------------------------------------------+
```

**Slider View:**
```
+------------------------------------------+
|  Before / After                          |
|  [← Back]                    [Side View] │
+------------------------------------------+
|                                           |
|           Before │ After                  |
|  ┌─────────────────────────────────┐     |
|  │                                 │     |
|  │      ╱────────────╮             │     |
|  │     │    Before    │    After    │     |
*  │     │    Photo     │    Photo    │     *
*  │     │              │             │     *
  │      ╲────────────╯             │     |
|  │                                 │     |
|  │        ◉─────────               │     |
|  │        Slider Handle            │     |
|  └─────────────────────────────────┘     |
|                                           |
|  Sep 15, 2025              Oct 20, 2025   |
|  190 lbs / 16% BF          185 / 15%      |
|                                           |
|  Drag slider to compare                   |
+------------------------------------------+
```

**Upload Modal:**
```
+------------------------------------------+
|  Upload Progress Photos                  |
+------------------------------------------+
|                                           |
|  Date: [Oct 20, 2025]                     |
|  Time of Day: [Morning ▼]                |
|  Lighting: [Good ▼]                       |
|                                           |
|  Select photos to upload:                 |
|  ┌──────┐ ┌──────┐ ┌──────┐             |
|  │[+]   │ │[+]   │ │[+]   │             |
|  │Front │ │Side  │ │Back  │             |
|  └──────┘ └──────┘ └──────┘             |
|                                           |
|  Measurements (optional):                 |
|  Weight: [185] lbs                        |
|  Body Fat: [15] %                         |
|                                           |
|  Notes:                                   |
|  [_________________________________]      |
|                                           |
|  Privacy:                                 |
|  ☐ Private (only me)                      |
* ☐ Allow trainer to view                  *
* ☐ Allow sharing                          *
                                           |
|  [Upload Photos]                          |
+------------------------------------------+
```

## Dependencies
- Photo storage service (S3, Cloudinary, etc.)
- Image processing library
- File upload component
- EPIC-001 (User Profiles) for user association
- Progress photos from STORY-007-01

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for photo flow
- [ ] Manual testing completed
- [ ] Privacy controls verified
- [ ] Slider performance tested
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Progress photos are incredibly motivating - invest in good UX
- Consider AI-powered alignment assistance (pose detection)
- Consistent lighting/posing guidance is important
- Storage costs can add up - implement compression
- Check implementation status: ❌ Not Started
