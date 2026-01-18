# Story 001-03: Upload Profile Photo

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-03
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 1

## User Story
**As a** user
**I want to** upload and manage my profile photo
**So that I** can personalize my account

## Acceptance Criteria
- [ ] Drag-and-drop upload functionality
- [ ] Image cropping tool with aspect ratio lock
- [ ] Multiple format support (JPG, PNG, WebP)
- [ ] File size optimization (max 5MB, auto-compress)
- [ ] Automatic thumbnail generation
- [ ] Replace existing photo option
- [ ] Remove photo option (with confirmation)
- [ ] Upload progress indicator
- [ ] Image preview before saving
- [ ] Error handling for invalid files
- [ ] Mobile camera capture support

## Technical Implementation

### Frontend Tasks
1. **Create PhotoUploader Component**
   - Drag-and-drop zone with visual feedback
   - File input fallback
   - Camera capture button (mobile)
   - Upload progress bar
   - Error message display

2. **Create ImageCropper Component**
   - Integration with react-image-crop or similar
   - Aspect ratio presets (1:1 for profile)
   - Zoom and pan controls
   - Real-time preview
   - Reset button

3. **Create PhotoPreview Component**
   - Display current photo
   - Show upload/change/remove options
   - Display photo metadata (size, dimensions)
   - Loading states during upload

4. **Implement Image Processing**
   - Client-side compression using browser-image-compression
   - Format validation
   - Size validation
   - EXIF data stripping (privacy)

### Backend Tasks
1. **Create Photo Upload Endpoints**
   ```typescript
   POST /api/profile/photo - Upload new photo
   PUT /api/profile/photo - Replace existing photo
   DELETE /api/profile/photo - Remove photo
   GET /api/profile/photo/thumbnail - Get thumbnail
   ```

2. **Implement MediaService**
   ```typescript
   class MediaService {
     async uploadProfilePhoto(userId: string, file: Express.Multer.File)
     async replacePhoto(userId: string, file: Express.Multer.File)
     async deletePhoto(userId: string)
     async generateThumbnail(imageUrl: string)
     async optimizeImage(buffer: Buffer)
   }
   ```

3. **Storage Configuration**
   - Use AWS S3 or similar object storage
   - Create bucket structure: `profile-photos/{user_id}/`
   - Configure CDN for delivery (CloudFront)
   - Set up presigned URLs for direct uploads

4. **Update user_profiles Table**
   ```sql
   ALTER TABLE user_profiles
   ADD COLUMN profile_photo_url VARCHAR(500),
   ADD COLUMN profile_photo_thumbnail_url VARCHAR(500),
   ADD COLUMN profile_photo_updated_at TIMESTAMP;

   CREATE INDEX idx_profile_photo ON user_profiles(user_id, profile_photo_updated_at DESC);
   ```

### Data Models
```typescript
interface UploadPhotoDto {
  file: File;
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface PhotoMetadata {
  originalSize: number;
  optimizedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  uploadedAt: Date;
}

interface UploadedPhotoResponse {
  photoUrl: string;
  thumbnailUrl: string;
  metadata: PhotoMetadata;
}
```

## Test Cases
1. **Happy Path - Upload Photo**
   - Click upload button
   - Select valid image file
   - Crop image to desired area
   - Preview cropped image
   - Confirm upload
   - Verify photo appears in profile

2. **Drag and Drop**
   - Drag image file onto upload zone
   - Verify visual feedback
   - Drop file
   - Verify upload initiates

3. **File Size Validation**
   - Attempt to upload 6MB file
   - Verify error message
   - Verify auto-compression offered
   - Test with 4MB file (should succeed)

4. **Format Validation**
   - Test valid formats (JPG, PNG, WebP)
   - Test invalid formats (PDF, GIF, BMP)
   - Verify appropriate error messages

5. **Replace Photo**
   - Upload initial photo
   - Click "Change Photo"
   - Upload new photo
   - Verify replacement successful
   - Verify old photo deleted from storage

6. **Remove Photo**
   - Click "Remove Photo"
   - Confirm deletion
   - Verify default placeholder shown
   - Verify photo deleted from storage

7. **Mobile Camera Capture**
   - Test on mobile device
   - Click camera icon
   - Take photo
   - Verify photo captured and uploaded

## UI/UX Mockups
```
+------------------------------------------+
|  Profile Photo                           |
+------------------------------------------+
|                                          |
|          [  Current Photo  ]             |
|          [      150x150     ]             |
|                                          |
|  [ Change Photo ]  [ Remove ]            |
|                                          |
|  Or drag and drop a file here            |
|  +----------------------------------+    |
|  |                                  |    |
|  |     Drop image here to upload    |    |
|  |                                  |    |
|  +----------------------------------+    |
|                                          |
|  Supported formats: JPG, PNG, WebP       |
|  Maximum size: 5MB                       |
+------------------------------------------+
```

```
+------------------------------------------+
|  Crop Your Photo              [Cancel]   |
+------------------------------------------+
|                                          |
|     +-----------------------------+       |
|     |                             |       |
|     |      [ Crop Area ]         |       |
|     |                             |       |
|     +-----------------------------+       |
|                                          |
|  Zoom: [━━━━━━━○────] 100%              |
|                                          |
|  [ Reset ]  [ Apply ]                    |
+------------------------------------------+
```

## Dependencies
- STORY-001-01 (Create Initial Profile) must be completed
- Object storage service configured (S3, CloudFront, etc.)
- CDN setup for image delivery
- Multer or similar middleware for file uploads

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Upload functionality tested across browsers
- [ ] Mobile camera capture working
- [ ] Image optimization reducing file sizes by >50%
- [ ] Thumbnails generating correctly
- [ ] Error handling comprehensive
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for upload endpoints
- [ ] Security review (file type validation, size limits)
- [ ] Performance tested with various file sizes
- [ ] Accessibility standards met
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Use client-side compression to reduce bandwidth
- Store original and optimized versions
- Implement lazy loading for photo display
- Consider adding photo moderation for public profiles
- CDN caching strategy: Cache for 1 year with versioning
- Privacy: Strip EXIF data before upload
- Max file size: 5MB (auto-compress if over 2MB)
