# 🚀 Parallel Workflow Quick Start Guide

## Overview

Run **3 parallel Claude Code sessions** to develop EvoFit Trainer simultaneously without conflicts.

## Session Setup

### Terminal 1 - Backend Development

```bash
# Open new terminal
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
claude

# In Claude Code, paste the content from:
# .claude/prompts/session-1-backend.md
```

### Terminal 2 - Frontend Development

```bash
# Open new terminal
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
claude

# In Claude Code, paste the content from:
# .claude/prompts/session-2-frontend.md
```

### Terminal 3 - QA Testing

```bash
# Open new terminal
cd C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer
claude

# In Claude Code, paste the content from:
# .claude/prompts/session-3-qa.md
```

## File Ownership (No Conflicts)

| Session | Owns (Write) | Reads (Only) |
|---------|--------------|--------------|
| **Session 1** | `backend/src/` | `docs/`, `src/` |
| **Session 2** | `src/app/`, `src/components/` | `docs/`, `backend/src/` |
| **Session 3** | `backend/tests/`, `tests/`, `docs/qa/` | All (for review) |

## Conflict Prevention Rules

### 1. File Ownership
- ✅ Session 1: Only writes to `backend/src/`
- ✅ Session 2: Only writes to `src/`
- ✅ Session 3: Only writes to test files
- ❌ NEVER: Write to another session's domain

### 2. Commit Frequency
- ✅ Commit after EACH task completion
- ✅ Use descriptive commit messages
- ✅ Push to your session branch immediately
- ❌ NEVER: Let commits pile up

### 3. Pull Before Work
```bash
# Every session, before starting work:
git pull origin main
git checkout -b session-X-name  # if not exists
git pull origin session-X-name  # get latest
```

### 4. Communication via Git
- ✅ Use commit messages to communicate
- ✅ Create empty commits for requests:
  ```bash
  git commit --allow-empty -m "feat(frontend): needed for backend API

  Frontend needs to:
  - Add loading state
  - Handle new component

  Assigned to: Session 2"
  ```

## Synchronization Schedule

### Every 30 Minutes
All sessions:
```bash
git add .
git commit -m "wip: [session-name] progress"
git push origin session-X-name
git pull origin main
```

Session 3:
```bash
npm test  # Run full suite
# Report any failures
```

### Every 2 Hours
All sessions: Meet to discuss blockers
- Reassign work if needed
- Resolve merge conflicts
- Update story statuses

## Merge Protocol

### When Completing a Story

1. **Session 1 or 2**: Push to session branch
2. **Session 3**: Run full test suite
3. **If all pass**: Merge to main
4. **If failures**: Assign to owning session

### Merge Conflicts

```bash
# Only Session 3 handles conflicts
git pull origin main
# Resolve conflicts
git add .
git commit -m "resolve: merge conflict"
git push origin session-3-qa
```

## Branch Strategy

```bash
# Session branches (long-lived)
session-1-backend    # Backend work
session-2-frontend   # Frontend work
session-3-qa         # QA work

# Main branch (integration)
main                 # Always passing tests
```

## Daily Workflow

### Morning (Start of Day)
1. All sessions: Pull latest from `main`
2. Session 3: Run full test suite
3. If any failures: Fix before starting new work
4. All sessions: Assign stories for the day

### During Day
1. Work in parallel on assigned stories
2. Commit frequently (every 30 min)
3. Session 3: Validates continuously
4. Communicate via git commits

### Evening (End of Day)
1. All sessions: Push final commits
2. Session 3: Run full test suite
3. If all pass: Merge to `main`
4. If failures: Fix next morning

## Emergency Procedures

### If Tests Fail
1. Session 3: Identifies failing tests
2. Session 3: Creates bug report
3. Owning session: Fixes immediately
4. Session 3: Verifies fix
5. Only then: Continue work

### If Merge Conflict
1. Stop all work
2. Session 3: Handles resolution
3. Other sessions: Pull resolution
4. Session 3: Verify all tests pass
5. Only then: Continue work

### If Blocked by Other Session
1. Create ticket with empty commit
2. Switch to different story
3. Return when unblocked

## Quick Commands

### Session 1 (Backend)
```bash
cd backend
npm test -- --watch     # Watch tests
npm run dev             # Dev server
```

### Session 2 (Frontend)
```bash
npm test -- --watch     # Watch tests
npm run dev             # Dev server
npm run type-check      # TypeScript check
```

### Session 3 (QA)
```bash
npm test                # All tests
npm run test:coverage   # Coverage report
npx playwright test     # E2E tests
```

## Success Indicators

You're doing it right if:
- ✅ 3 terminals running simultaneously
- ✅ Each terminal working on different files
- ✅ Commits every 30 minutes
- ✅ No merge conflicts (or resolved quickly)
- ✅ Tests always passing on main
- ✅ Stories being completed daily

## Troubleshooting

### Problem: Can't run in parallel
**Solution**: Check file ownership, ensure no overlap

### Problem: Merge conflicts
**Solution**: Session 3 handles, others pull

### Problem: Tests failing
**Solution**: Owning session fixes, others wait

### Problem: Blocked by other session
**Solution**: Switch to another story, return later

---

**Remember**: Communication via git commits. Test everything. Session 3 is gatekeeper. Never work on same files.
