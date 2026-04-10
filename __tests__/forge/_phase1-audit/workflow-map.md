# FORGE QA Phase 1 — Workflow Audit

## Primary Journeys
### Trainer (12 steps)
1. Register → 2. Profile/certs → 3. Dashboard → 4. Invite client → 5. Client accepts → 6. View client profile → 7. Exercise library → 8. Create program → 9. Assign program → 10. Track client workouts → 11. Analytics → 12. Export report

### Client (12 steps)
1. Receive invitation → 2. Register + profile/health → 3. Dashboard (today's workout) → 4. View assigned programs → 5. Start workout → 6. Log exercise perf → 7. Substitute exercise → 8. Complete workout → 9. Log measurements → 10. Progress charts → 11. Set goals → 12. Milestones

### Admin (8 steps)
1. Login → 2. System dashboard → 3. User mgmt → 4. User details → 5. Feature flags → 6. Support tickets → 7. Moderation → 8. Platform analytics

## Cross-Role Sync Points
1. Trainer assigns program → Client sees workout (WorkoutSession auto-gen)
2. Client logs workout → Trainer views progress
3. Client uploads photo → Trainer reviews in analytics
4. Admin deactivates trainer → Clients see offline status
5. Client sets goal → Trainer tracks milestone

## 15 Brainstormed Edge Workflows
1. Archive client + reassign same program
2. Offline mode: log 3 workouts, sync on return
3. Duplicate program, edit copy, original untouched
4. Admin deactivates trainer mid-session; clients can't message
5. Client switches trainers mid-program
6. Bulk-assign program to 10 clients (atomic)
7. Mobile pull-to-refresh on workout history
8. Concurrent edit: trainer edits program while client views
9. Rapid double-submit "Complete Workout" idempotency
10. JWT expires mid-workout logging → refresh/recover
11. Special-char search ("O'Brien & Co.") injection safety
12. New client empty analytics state
13. Permission leak: client accesses another client via URL tampering
14. 500-client pagination boundaries (page 10)
15. Role assymetry: client tries POST /api/programs

## Top-5 Highest-Risk Workflows
1. Program assignment → WorkoutSession cascade
2. Trainer deactivation data orphaning
3. Concurrent PerformanceMetric duplication
4. ProgressPhoto + measurement sync timing
5. ClientInvitation token re-invite race condition
