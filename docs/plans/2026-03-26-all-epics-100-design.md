# All Epics to 100% — Design Document

**Date:** 2026-03-26
**Goal:** Complete all remaining epic gaps and launch EvoFitTrainer
**Approach:** 7 parallel agent teams in isolated git worktrees

## Scope Decisions

### Removed from Scope
- Apple HealthKit (requires native iOS app)
- Camera optimizations / photo uploads (removed from product)
- Progress photo comparison UI (photos removed)
- Financial/revenue admin dashboard (payments removed)
- Google/Apple Calendar external sync (post-launch)

### Simplified
- Push notifications: Web Push API only (no Firebase/native)
- Biometric login: WebAuthn passkeys only (browser-native)
- Health integration: Google Fit REST API only (skip Apple Health)
- Support tickets: Simple contact form + admin inbox
- Content moderation: Flagging system only

## 7 Parallel Streams

### Stream A: User Profiles + Health (Epic 001)
- Add gender field to profile
- Implement PAR-Q health questionnaire (7 questions)
- Add certification expiration alerts (30-day warning)

### Stream B: Client Management (Epic 003)
- Bulk client operations (select, status update, tag assign)
- Client profile inline edit mode

### Stream C: Exercise Collections (Epic 004)
- Full collection CRUD UI (create, list, detail, edit, delete)
- Add-to-collection dialog from exercise cards
- Favorites bulk unfavorite + export (CSV)

### Stream D: Workout Execution (Epic 006)
- Exercise substitution with alternatives lookup
- Workout modification templates (feeling great, time crunch, etc.)
- Offline mode UI (indicator, sync status bar, conflict resolution)

### Stream E: Program Builder Polish (Epic 005)
- Progression visualization charts
- Deload week configuration
- Percentage-based increase calculator

### Stream F: PWA/Mobile Core (Epic 011)
- Web Push notifications (opt-in, reminders, celebrations)
- WebAuthn biometric login (passkey registration + auth)
- Quick actions polish (shortcuts, recent exercises)
- Audio cues for rest timer
- Haptic feedback for PR celebrations
- Lock screen media controls for active workout

### Stream G: Admin + Scheduling (Epics 009, 012)
- Support ticket system (contact form + admin inbox)
- Content flagging (report exercise/program + admin review)
- Group class scheduling
- Recurring session polish

## Architecture Notes

- All streams touch non-overlapping files/directories
- Each stream gets its own git worktree + branch
- TDD: tests written before implementation
- Each stream commits independently, merges to master when complete
- Post-merge: spec review + quality review + full test suite
