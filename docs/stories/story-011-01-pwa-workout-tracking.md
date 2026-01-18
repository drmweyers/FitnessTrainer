# Story 011-01: PWA Workout Tracking

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-01
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 11

## User Story
**As a** client
**I want to** track workouts on my mobile device
**So that I** can log exercises at the gym

## Acceptance Criteria
- [ ] Progressive Web App (PWA) is installable on iOS and Android
- [ ] Quick exercise logging with large touch targets (minimum 44px)
- [ ] Offline functionality for workout tracking
- [ ] Auto-sync when device comes online
- [ ] Timer continues in background
- [ ] Lock screen controls for timer
- [ ] Audio cues for rest periods
- [ ] Haptic feedback on exercise completion
- [ ] PWA installs as home screen app
- [ ] Splash screen on app launch
- [ ] Smooth animations (60fps)

## Technical Implementation

### Frontend Tasks
1. **PWA Configuration**
   - Create `manifest.json` with app metadata
   - Configure service worker for offline caching
   - Implement app shell architecture
   - Add splash screen icons (multiple sizes)
   - Configure theme colors and display mode

2. **MobileWorkoutTracker Component**
   - Build touch-optimized exercise logging interface
   - Implement large touch targets (min 44px)
   - Add swipe gestures for exercise navigation
   - Create inline editing for sets/reps/weight
   - Implement quick-add buttons for common values

3. **BackgroundTimer Component**
   - Implement timer with Web Workers API
   - Add lock screen controls via Media Session API
   - Create audio cues using Web Audio API
   - Add haptic feedback using Vibration API
   - Handle background throttling on mobile

4. **OfflineSync Service**
   - Implement service worker for caching
   - Create offline storage using IndexedDB
   - Build sync queue for offline changes
   - Add conflict resolution logic
   - Implement progressive sync with delta updates

5. **PWA Installation Prompt**
   - Detect installability
   - Show custom install prompt
   - Handle installation events
   - Track installation metrics

### Backend Tasks
1. **Mobile Sync Endpoints**
   ```typescript
   POST /api/mobile/sync - Sync offline changes
   GET /api/mobile/sync/status - Get sync status
   POST /api/mobile/sync/resolve - Resolve conflicts
   ```

2. **Offline Data Support**
   - Implement delta sync endpoint
   - Add batch operations support
   - Create conflict detection logic
   - Build sync token management

3. **Timer API Extensions**
   ```typescript
   POST /api/workouts/:id/timer/start
   POST /api/workouts/:id/timer/pause
   POST /api/workouts/:id/timer/complete
   ```

### Data Models
```typescript
interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui';
  orientation: 'portrait' | 'landscape';
  icons: PWAIcon[];
}

interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: 'any' | 'maskable';
}

interface OfflineWorkout {
  id: string;
  clientId: string;
  workoutId: string;
  exercises: OfflineExercise[];
  startTime: Date;
  endTime?: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  lastModified: Date;
}

interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: any;
  retryCount: number;
  createdAt: Date;
}
```

### Service Worker Implementation
```typescript
// sw.js - Service worker for offline caching
const CACHE_NAME = 'evofit-v1';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Test Cases
1. **PWA Installation**
   - Verify install prompt appears on eligible browsers
   - Test installation on Chrome (Android)
   - Test installation on Safari (iOS)
   - Verify app icon and name
   - Test splash screen display

2. **Offline Functionality**
   - Load workout in online mode
   - Enable airplane mode
   - Complete workout offline
   - Disable airplane mode
   - Verify sync completes successfully

3. **Touch Interface**
   - Test all touch targets are minimum 44px
   - Verify swipe gestures work smoothly
   - Test tap responsiveness
   - Verify no accidental touches

4. **Background Timer**
   - Start workout timer
   - Switch to another app
   - Verify timer continues
   - Test lock screen controls
   - Verify audio cues play

5. **Sync Conflict Resolution**
   - Modify workout offline on device
   - Modify same workout on web
   - Bring device online
   - Verify conflict is detected
   - Test resolution options

6. **Performance Tests**
   - App launch time < 2 seconds
   - Screen transitions < 300ms
   - Smooth animations at 60fps
   - Memory usage < 150MB
   - Battery impact < 5% per hour

## UI/UX Mockups
```
Mobile PWA Workout Tracking Screen
(375px width reference)

+----------------------------------+
|  ← Back  Leg Day        [≡]     |
+----------------------------------+
|  Timer: 2:45              [Skip] |
|  [████████░░░░░░░░] Rest Period  |
+----------------------------------+
|  Exercise 1 of 5                |
|                                  |
|      [Barbell Squat]             |
|      /img/exercises/squat.jpg    |
|                                  |
|  Set 1 of 4                      |
|  +----------------------------+  |
|  |  Completed ✓               |  |
|  |  185 lbs × 10 reps         |  |
|  |  90s rest                   |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |  185 lbs × [9] reps        |  |
|  |  [Edit] [Complete] [Skip]  |  |
|  +----------------------------+  |
|                                  |
|  [← Prev]        [Next →]        |
+----------------------------------+
|  [📊 Notes] [📷 Camera] [❓ Help] |
+----------------------------------+
```

```
PWA Installation Prompt

+----------------------------------+
|  ┌─────────────────────────┐     |
|  │                         │     |
|  │    [EvoFit Icon]        │     |
|  │                         │     |
>│    Install EvoFit         │     |
|  │    as an app?           │     |
|  │                         │     |
|  │    [Cancel] [Install]   │     |
|  └─────────────────────────┘     |
+----------------------------------+
```

```
Sync Status Indicator

+----------------------------------+
|  ☑ You're online                |
|  Last sync: Just now            |
|  3 workouts synced              |
+----------------------------------+
```

## Dependencies
- Exercise library must be available offline
- Authentication system with token refresh
- Timer functionality working
- IndexedDB support in browser
- Service worker support

## Definition of Done
- [ ] All acceptance criteria met
- [ ] PWA installs successfully on iOS and Android
- [ ] Offline workout tracking fully functional
- [ ] Auto-sync works reliably
- [ ] Background timer functioning
- [ ] Touch targets meet size requirements
- [ ] Performance benchmarks met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for sync
- [ ] Manual testing on real devices
- [ ] Lighthouse PWA score > 90
- [ ] Code reviewed and approved
- [ ] Documentation updated

## PWA Checklist
- [ ] manifest.json configured
- [ ] Service worker registered
- [ ] Offline fallback page
- [ ] App icons in all required sizes
- [ ] Splash screen configured
- [ ] Theme colors set
- [ ] Display mode set to standalone
- [ ] Orientation locked to portrait
- [ ] HTTPS enabled (required for PWA)
- [ ] Lighthouse audit passed

## Performance Targets
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3s
- Speed Index: < 3.4s
- First Meaningful Paint (FMP): < 2s
- Time to First Byte (TTFB): < 600ms

## Browser Compatibility
- Chrome/Edge 90+ (full support)
- Safari 14+ (iOS 14.5+)
- Firefox 85+
- Samsung Internet 13+

## Notes
- Focus on PWA as MVP approach instead of native apps
- PWA provides 80% of native functionality at 20% of cost
- Can transition to native apps (React Native) later if needed
- Ensure progressive enhancement - core features work without service worker
- Test on real devices, not just browser dev tools
- Consider implementing native app wrappers (TWA/Capacitor) for better distribution
