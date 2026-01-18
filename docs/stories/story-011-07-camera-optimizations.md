# Story 011-07: Camera Optimizations

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-07
**Priority**: P2 (Medium)
**Story Points**: 8
**Sprint**: Sprint 12

## User Story
**As a** user
**I want an** optimized camera experience
**So that I** can easily capture progress photos and form check videos

## Acceptance Criteria
- [ ] In-app camera interface (no need to leave app)
- [ ] Grid overlay for alignment
- [ ] Previous photo ghost overlay for consistency
- [ ] Multi-angle capture workflow
- [ ] Automatic backup to cloud
- [ ] Image compression options
- [ ] Batch upload support
- [ ] Video recording for form check
- [ ] Camera controls (flash, front/back, timer)
- [ ] Photo gallery with comparison view
- [ ] Tag photos with date/exercise

## Technical Implementation

### Frontend Tasks
1. **CameraCapture Component**
   - Access device camera using MediaDevices API
   - Build in-app camera interface
   - Implement grid overlay
   - Add ghost image overlay
   - Handle camera permissions

2. **MultiAngleCapture Workflow**
   - Guide user through poses (front, side, back)
   - Show reference images for each angle
   - Capture and organize by angle
   - Provide preview before saving

3. **PhotoComparison Component**
   - Display before/after slider
   - Side-by-side comparison
   - Overlay comparison mode
   - Timeline view of progress

4. **FormCheckRecorder Component**
   - Video recording interface
   - Playback with slow motion
   - Drawing tools for annotation
   - Share functionality

5. **Gallery Component**
   - Display progress photos chronologically
   - Filter by angle/date
   - Tag with workout/exercise
   - Batch operations (delete, share)

### Backend Tasks
1. **Media Upload Endpoints**
   ```typescript
   POST /api/media/upload - Upload photo/video
   POST /api/media/upload/batch - Batch upload
   GET /api/media/:id - Get media file
   DELETE /api/media/:id - Delete media
   PUT /api/media/:id - Update metadata
   ```

2. **Media Processing Service**
   ```typescript
   class MediaProcessingService {
     async compressImage(buffer: Buffer, quality: number): Promise<Buffer>
     async generateThumbnail(buffer: Buffer): Promise<Buffer>
     async extractVideoFrame(videoPath: string, timestamp: number): Promise<Buffer>
     async processBatch(files: File[]): Promise<ProcessedMedia[]>
   }
   ```

3. **Storage Management**
   - Integration with cloud storage (S3, CloudFront)
   - CDN configuration for fast delivery
   - Image optimization pipeline
   - Video transcoding for web

### Data Models
```typescript
interface MediaFile {
  id: string;
  userId: string;
  type: 'photo' | 'video';
  category: 'progress' | 'form_check' | 'exercise' | 'profile';
  url: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  angle?: 'front' | 'side' | 'back' | 'other';
  tags: string[];
  metadata: MediaMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  duration?: number; // for videos
  camera?: string;
  location?: GeoLocation;
}

interface ProgressPhotoSet {
  id: string;
  userId: string;
  date: Date;
  photos: {
    front?: MediaFile;
    side?: MediaFile;
    back?: MediaFile;
  };
  notes?: string;
  weight?: number;
  measurements?: BodyMeasurements;
}

interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

interface FormCheckVideo {
  id: string;
  userId: string;
  exerciseId: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  annotations?: FormAnnotation[];
  notes?: string;
  createdAt: Date;
}

interface FormAnnotation {
  timestamp: number;
  type: 'line' | 'circle' | 'arrow' | 'text';
  coordinates: any;
  label?: string;
}
```

### Camera Implementation
```typescript
class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(
    videoRef: React.RefObject<HTMLVideoElement>,
    facingMode: 'user' | 'environment' = 'environment'
  ): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = this.stream;
        await videoRef.current.play();
      }
    } catch (error) {
      throw new Error('Camera access denied or unavailable');
    }
  }

  async capturePhoto(
    videoRef: React.RefObject<HTMLVideoElement>,
    quality: number = 0.8
  ): Promise<Blob> {
    if (!videoRef.current) {
      throw new Error('Video element not ready');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        quality
      );
    });
  }

  async startRecording(
    videoRef: React.RefObject<HTMLVideoElement>
  ): Promise<MediaRecorder> {
    if (!this.stream) {
      throw new Error('Camera not started');
    }

    const recorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    });

    recorder.start();
    return recorder;
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  switchCamera(): void {
    // Implementation for switching between front/back cameras
    // Requires stopping current stream and restarting with new facing mode
  }
}
```

### Grid Overlay Component
```typescript
const GridOverlay: React.FC = () => {
  return (
    <div className="camera-grid-overlay">
      {/* Rule of thirds grid */}
      <div className="grid-line vertical" style={{ left: '33.33%' }} />
      <div className="grid-line vertical" style={{ left: '66.67%' }} />
      <div className="grid-line horizontal" style={{ top: '33.33%' }} />
      <div className="grid-line horizontal" style={{ top: '66.67%' }} />

      {/* Center crosshair */}
      <div className="crosshair">
        <div className="crosshair-line vertical" />
        <div className="crosshair-line horizontal" />
      </div>
    </div>
  );
};
```

### Photo Comparison Component
```typescript
const PhotoComparison: React.FC<{
  before: MediaFile;
  after: MediaFile;
}> = ({ before, after }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [mode, setMode] = useState<'slider' | 'side-by-side' | 'overlay'>('slider');

  return (
    <div className="photo-comparison">
      <div className="comparison-controls">
        <button onClick={() => setMode('slider')}>Slider</button>
        <button onClick={() => setMode('side-by-side')}>Side by Side</button>
        <button onClick={() => setMode('overlay')}>Overlay</button>
      </div>

      {mode === 'slider' && (
        <div className="comparison-slider">
          <img src={before.url} alt="Before" className="before-image" />
          <img
            src={after.url}
            alt="After"
            className="after-image"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="slider-control"
          />
        </div>
      )}

      {mode === 'side-by-side' && (
        <div className="comparison-side-by-side">
          <img src={before.url} alt="Before" />
          <img src={after.url} alt="After" />
        </div>
      )}

      {mode === 'overlay' && (
        <div className="comparison-overlay">
          <img src={before.url} alt="Before" className="base-image" />
          <img
            src={after.url}
            alt="After"
            className="overlay-image"
            style={{ opacity: sliderPosition / 100 }}
          />
        </div>
      )}
    </div>
  );
};
```

## Test Cases
1. **In-App Camera**
   - Open camera in app
   - Request permissions
   - Display camera feed
   - Capture photo
   - Photo saved correctly

2. **Grid Overlay**
   - Enable grid overlay
   - Grid lines visible
   - Helps with alignment
   - Can toggle on/off

3. **Ghost Image Overlay**
   - Select previous photo
   - Display as ghost overlay
   - Align new photo with ghost
   - Consistent positioning achieved

4. **Multi-Angle Capture**
   - Start multi-angle workflow
   - Guided to front pose
   - Capture front photo
   - Guided to side pose
   - Capture side photo
   - Guided to back pose
   - Capture back photo
   - All photos saved as set

5. **Automatic Backup**
   - Capture photo offline
   - Photo queued for upload
   - Connect to internet
   - Photo uploads automatically
   - Available in gallery

6. **Image Compression**
   - Capture high-res photo
   - Apply compression
   - File size reduced
   - Quality maintained
   - Upload speed improved

7. **Video Recording**
   - Start video recording
   - Record exercise form
   - Stop recording
   - Video processed
   - Available for playback

8. **Progress Comparison**
   - Select two photos from different dates
   - View side-by-side comparison
   - Use slider to compare
   - Overlay photos
   - Progress visible

9. **Gallery and Batch Operations**
   - Open photo gallery
   - View all progress photos
   - Select multiple photos
   - Delete selected photos
   - Share selected photos

## UI/UX Mockups
```
In-App Camera Interface

+----------------------------------+
|  [×]              [Flash⚡] [🔄]  |
|                                  |
|  ┌────────────────────────────┐ |
|  │     │           │          │ |
|  │ ────┼───────────┼─────     │ |
|  │     │           │          │ |
|  │     │      ⊕     │          │ |
|  │     │           │          │ |
|  │ ────┼───────────┼─────     │ |
|  │     │           │          │ |
|  └────────────────────────────┘ |
|  [Grid] [Ghost] [Timer]         |
|                                  |
|  Progress Photo - Front View     |
|                                  |
|  [Cancel]      [📷 Capture]      |
+----------------------------------+
```

```
Multi-Angle Capture Workflow

Step 1 of 3: Front View

+----------------------------------+
|  ← Back  Progress Photo          |
+----------------------------------+
|  Stand facing the camera         |
|  directly, arms at your sides    |
|                                  |
|  [Reference Image]               |
|  /img/poses/front-ref.jpg        |
|                                  |
|  ┌────────────────────────────┐ |
|  │     │           │          │ |
|  │     │      👤     │          │ |
|  │     │           │          │ |
|  └────────────────────────────┘ |
|                                  |
|  Position yourself like the     |
|  reference image above          |
|                                  |
|  [Retake]        [Next →]        |
+----------------------------------+
```

```
Photo Comparison View

+----------------------------------+
|  ← Back  Progress Comparison     |
+----------------------------------+
|  [Before] Jan 1    [After] Jan 30|
|                                  |
|  ┌────────────────────────────┐ |
|  │                            │ │
|  │   [Slider: ||••|]          │ │
|  │                            │ │
|  │  Side-by-side comparison   │ │
|  │  showing visible progress  │ │
|  │  in muscle definition      │ │
|  │                            │ │
|  └────────────────────────────┘ │ |
|                                  |
|  [Slider] [Side-by-Side] [Overlay]|
|                                  |
|  Measurements:                   |
|  Weight: 185 lbs → 180 lbs       |
|  Chest: 42" → 43"                |
|  Waist: 34" → 32"                |
|                                  |
|  [Share] [Download]              |
+----------------------------------+
```

```
Photo Gallery

+----------------------------------+
|  ← Back  Progress Gallery        |
+----------------------------------+
|  Filter: [All Angles ▼]         |
|  Sort: [Newest ▼]                |
|                                  |
|  January 2025                    |
|  +---+---+---+                  |
|  │front│ side│back│            |
|  +---+---+---+                  |
|  Jan 15, 2025                   |
|                                  |
|  December 2024                   |
|  +---+---+---+                  |
|  │front│ side│back│            |
|  +---+---+---+                  |
|  Dec 1, 2024                    |
|                                  |
|  [+ Add Progress Photos]         |
+----------------------------------+
```

## Dependencies
- MediaDevices API (camera access)
- Canvas API (image capture)
- MediaRecorder API (video recording)
- File API (file handling)
- Cloud storage service (AWS S3, etc.)
- Image processing library (Sharp for Node.js)
- Video transcoding service (FFmpeg)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] In-app camera working
- [ ] Grid overlay implemented
- [ ] Ghost image overlay working
- [ ] Multi-angle capture complete
- [ ] Automatic backup functional
- [ ] Image compression working
- [ ] Video recording working
- [ ] Photo gallery with comparison
- [ ] Batch operations supported
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for media upload
- [ ] Manual testing on real devices
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Browser Compatibility
- Chrome 60+: Full camera support
- Safari 11+: Full camera support (iOS 11+)
- Firefox 55+: Full camera support
- Edge 79+: Full camera support
- Samsung Internet: Full support

## Performance Targets
- Camera launch: < 1 second
- Photo capture: < 500ms
- Photo upload: < 3 seconds (5MB photo)
- Video upload: < 10 seconds (30MB video)
- Gallery load: < 2 seconds (100 photos)

## Storage & Costs
- Estimate storage needs per user
- Implement CDN for fast delivery
- Auto-expire old videos (keep photos longer)
- Provide storage management tools
- Monitor costs and optimize

## Privacy & Security
- Secure media upload (HTTPS)
- Private by default (user controls sharing)
- Secure storage (encrypted at rest)
- Access control (only owner can view)
- Right to deletion (GDPR)
- Metadata stripping (location, etc.)

## Accessibility
- Voice guidance for poses
- High contrast grid lines
- Large capture buttons
- Alternative input methods
- Screen reader support for gallery

## Notes
- Progressive Web App has good camera support
- Consider native app for advanced camera features
- Image compression saves storage and bandwidth
- Provide guidance for best results (lighting, pose)
- Make comparison tools powerful and easy to use
- Consider AI pose detection for alignment assistance
- Enable social sharing (user's choice)
- Add watermark option for shared photos
