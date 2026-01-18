# Story 011-06: Quick Actions

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-06
**Priority**: P2 (Medium)
**Story Points**: 5
**Sprint**: Sprint 12

## User Story
**As a** user
**I want** quick access to key features
**So that I** can navigate efficiently and perform common actions faster

## Acceptance Criteria
- [ ] 3D Touch/Long Press menus show relevant actions (iOS)
- [ ] App shortcuts on home screen (iOS/Android)
- [ ] Home screen widgets for quick access
- [ ] Voice assistant integration (Siri/Google Assistant)
- [ ] Quick workout start from shortcut
- [ ] Quick message access from shortcut
- [ ] Today's schedule view widget
- [ ] Recent exercises quick access
- [ ] Customizable shortcuts in settings

## Technical Implementation

### Frontend Tasks
1. **App Shortcuts (PWA)**
   - Define shortcuts in manifest.json
   - Create shortcut handlers
   - Implement deep linking for shortcuts
   - Track shortcut usage

2. **Long Press Menus**
   - Implement context menus on key elements
   - Add relevant actions to menus
   - Handle menu item selection
   - Animate menu appearance

3. **Home Screen Widgets**
   - Create widget components
   - Implement widget manifest
   - Handle widget updates
   - Design widget layouts

4. **Voice Assistant Integration**
   - Register voice commands
   - Implement voice action handlers
   - Provide voice feedback
   - Handle voice errors

### Backend Tasks
1. **Shortcut Endpoints**
   ```typescript
   GET /api/shortcuts - Get user's shortcuts
   POST /api/shortcuts/custom - Create custom shortcut
   PUT /api/shortcuts/:id - Update shortcut
   DELETE /api/shortcuts/:id - Delete shortcut
   GET /api/shortcuts/recent - Get recent items
   ```

2. **Widget Data Endpoints**
   ```typescript
   GET /api/widgets/today - Get today's schedule
   GET /api/widgets/progress - Get recent progress
   GET /api/widgets/messages - Get unread count
   ```

### Data Models
```typescript
interface AppShortcut {
  id: string;
  userId: string;
  type: 'workout' | 'message' | 'schedule' | 'progress' | 'custom';
  title: string;
  description: string;
  icon: string;
  deepLink: string;
  isEnabled: boolean;
  order: number;
}

interface ShortcutAction {
  shortcutId: string;
  action: string;
  params: any;
  timestamp: Date;
}

interface WidgetData {
  type: 'today_schedule' | 'recent_progress' | 'quick_workout' | 'messages';
  data: any;
  updatedAt: Date;
}

interface VoiceCommand {
  command: string;
  intent: string;
  parameters: any;
  handler: string;
}
```

### PWA Manifest with Shortcuts
```json
{
  "name": "EvoFit",
  "short_name": "EvoFit",
  "shortcuts": [
    {
      "name": "Start Workout",
      "short_name": "Workout",
      "description": "Start today's workout",
      "url": "/workouts/start?source=shortcut",
      "icons": [
        {
          "src": "/icons/shortcut-workout.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Messages",
      "short_name": "Messages",
      "description": "Check your messages",
      "url": "/messages?source=shortcut",
      "icons": [
        {
          "src": "/icons/shortcut-messages.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Today's Schedule",
      "short_name": "Schedule",
      "description": "View your schedule",
      "url": "/schedule?source=shortcut",
      "icons": [
        {
          "src": "/icons/shortcut-schedule.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Log Progress",
      "short_name": "Progress",
      "description": "Log your progress",
      "url": "/progress/log?source=shortcut",
      "icons": [
        {
          "src": "/icons/shortcut-progress.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

### Widget Implementation (PWA)
```typescript
// Widget using Web Widget API (where supported) or custom widget
class WidgetManager {
  registerWidget(type: string, component: React.Component) {
    // Register widget component
  }

  async updateWidget(type: string, data: any) {
    // Update widget data
    // Push new data to widget
  }
}

// Example: Today's Schedule Widget
const TodayScheduleWidget: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    fetch('/api/widgets/today')
      .then(r => r.json())
      .then(data => setSchedule(data));
  }, []);

  return (
    <div className="widget today-schedule">
      <h3>Today's Schedule</h3>
      {schedule.map(item => (
        <div key={item.id} className="schedule-item">
          <span className="time">{item.time}</span>
          <span className="title">{item.title}</span>
        </div>
      ))}
    </div>
  );
};
```

### Long Press Menu Implementation
```typescript
const LongPressMenu: React.FC = ({ children, actions }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const handlePressStart = () => {
    timerRef.current = setTimeout(() => {
      setMenuVisible(true);
      HapticFeedback.heavy(); // Vibrate on menu appear
    }, 500);
  };

  const handlePressEnd = () => {
    clearTimeout(timerRef.current);
  };

  return (
    <div
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
    >
      {children}
      {menuVisible && (
        <ContextMenu
          actions={actions}
          onClose={() => setMenuVisible(false)}
        />
      )}
    </div>
  );
};
```

## Test Cases
1. **App Shortcuts**
   - Long press app icon on home screen
   - Shortcuts menu appears
   - All configured shortcuts visible
   - Tapping shortcut opens correct screen
   - Shortcut deep linking works

2. **Quick Workout Start**
   - Use "Start Workout" shortcut
   - Opens today's workout directly
   - Ready to begin tracking
   - No extra navigation needed

3. **Quick Message Access**
   - Use "Messages" shortcut
   - Opens message list
   - Unread count shown
   - Can compose new message

4. **Today's Schedule Widget**
   - Add widget to home screen
   - Shows today's workouts
   - Shows upcoming appointments
   - Tapping item opens details

5. **Voice Commands**
   - Activate Siri/Google Assistant
   - Say "Start EvoFit workout"
   - App opens to workout screen
   - Say "Check EvoFit messages"
   - App opens to messages

6. **Custom Shortcuts**
   - User creates custom shortcut
   - Appears in shortcut menu
   - Opens configured screen
   - Can be edited/deleted

7. **Recent Exercises Quick Access**
   - Long press workout card
   - Shows recent exercises
   - Tap exercise to view details
   - Quick add to new workout

## UI/UX Mockups
```
Home Screen App Shortcuts (Long Press)

+---------------------------+
|                           |
|  [EvoFit Icon]            |
|                           |
|  Quick Actions            |
|  ┌─────────────┐          |
|  │ 💪 Workout  │          |
|  └─────────────┘          |
|  ┌─────────────┐          |
|  │ 💬 Messages │          |
|  └─────────────┘          |
|  ┌─────────────┐          |
|  │ 📅 Schedule │          |
|  └─────────────┘          |
|  ┌─────────────┐          |
|  │ 📊 Progress │          |
|  └─────────────┘          |
+---------------------------+
```

```
Today's Schedule Widget

+---------------------------+
|  Today's Schedule         |
|  ────────────────────     |
|  9:00 AM                  |
|  Leg Day Workout          |
|  45 min • 8 exercises     |
|                           |
|  2:00 PM                  |
|  Client Session - John    |
|  60 min                   |
|                           |
|  5:00 PM                  |
|  Cardio                  |
|  30 min                   |
+---------------------------+
```

```
Long Press Context Menu

+---------------------------+
|  Workout Card             |
|  [Long press activated]   |
|                           |
|  ┌─────────────────────┐  |
|  │  Start Now          │  |
|  │  Edit               │  |
|  │  Duplicate          │  |
|  │  Share              │  |
|  │  ─────────────      │  |
|  │  Delete             │  |
|  └─────────────────────┘  |
+---------------------------+
```

```
Quick Actions Settings

+----------------------------------+
|  ← Back  Quick Actions           |
+----------------------------------+
|  Enabled Shortcuts               |
|  ─────────────────────────────   |
|  [≡] 💪 Start Workout      [ON]  |
|  [≡] 💬 Messages            [ON]  |
|  [≡] 📅 Today's Schedule    [ON]  |
|  [≡] 📊 Log Progress        [ON]  |
|  [≡] 🎥 Record Progress     [OFF] |
|                                  |
|  Custom Shortcuts                |
|  ─────────────────────────────   |
|  [+ Add Custom Shortcut]         |
|                                  |
|  Widget Settings                 |
|  ─────────────────────────────   |
|  Widget Style: [Compact ▼]       |
|  Update Frequency: [Auto ▼]      |
|                                  |
+----------------------------------+
```

## Dependencies
- PWA manifest with shortcuts
- Long press event handling
- Haptic feedback API
- Widget API (where supported)
- Voice assistant registration
- Deep linking infrastructure

## Definition of Done
- [ ] All acceptance criteria met
- [ ] App shortcuts configured in manifest
- [ ] Long press menus implemented
- [ ] Home screen widgets working
- [ ] Voice assistant integration
- [ ] Settings page for customization
- [ ] Deep linking functional
- [ ] Haptic feedback working
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for shortcuts
- [ ] Manual testing on real devices
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Platform Support
- **iOS**:
  - 3D Touch/Long Press menus
  - Home screen quick actions
  - Siri voice commands
  - iOS 14+ widgets (requires native app)

- **Android**:
  - App shortcuts (long press)
  - Home screen widgets
  - Google Assistant actions
  - Quick settings tiles

- **PWA/Web**:
  - Web App Manifest shortcuts
  - Long press context menus
  - Limited widget support
  - Voice assistant via web

## Performance Targets
- Shortcut menu appear: < 200ms
- Deep link navigation: < 500ms
- Widget load time: < 1 second
- Voice command response: < 1 second

## Accessibility
- Keyboard shortcuts
- Screen reader announcements
- Alternative to long press (right-click, menu button)
- Voice commands for motor accessibility
- Customizable shortcut placement

## Analytics Tracking
- Shortcut usage frequency
- Most used shortcuts
- Widget impressions
- Voice command usage
- Time saved by shortcuts

## Notes
- Start with PWA manifest shortcuts (broadest support)
- Add long press menus for enhanced experience
- Widgets provide ongoing value (engagement)
- Voice commands are convenient but optional
- Make shortcuts discoverable (onboarding, tips)
- Allow user customization
- Monitor usage to optimize defaults
- Consider accessibility needs
- Test on different screen sizes
- Document shortcuts in help section
