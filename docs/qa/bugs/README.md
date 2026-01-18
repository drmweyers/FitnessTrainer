# Bug Reports - QA Session 3 (2026-01-17)

## Summary
- **Total Bugs**: 7
- **Critical**: 2
- **High**: 3
- **Medium**: 2
- **Low**: 0 (1 Low priority)

## Bug List

| ID | Severity | Title | Assigned To | Status |
|----|----------|-------|-------------|--------|
| [bug-001](./bug-001-password-validation-failing.md) | Medium | Password Validation Test Failing | Session 1 (Backend) | Open |
| [bug-002](./bug-002-email-service-crashes.md) | High | Email Service Crashes Tests | Session 1 (Backend) | Open |
| [bug-003](./bug-003-programform-input-duplication.md) | Medium | ProgramForm Input Duplication | Session 2 (Frontend) | Open |
| [bug-004](./bug-004-frontend-typescript-errors.md) | Critical | Frontend: 279 TypeScript Errors | Session 2 (Frontend) | Open |
| [bug-005](./bug-005-eslint-config-error.md) | Low | ESLint Configuration Error | Session 2 (Frontend) | Open |
| [bug-006](./bug-006-backend-typescript-errors.md) | High | Backend: TypeScript Return Errors | Session 1 (Backend) | Open |
| [bug-007](./bug-007-e2e-server-startup-failure.md) | Critical | E2E: Server Startup Timeout | Session 1,2,3 | Open |

## Priority Matrix

### Immediate (Block Deployment)
1. [bug-004](./bug-004-frontend-typescript-errors.md) - Fix 279 TypeScript errors in frontend
2. [bug-007](./bug-007-e2e-server-startup-failure.md) - Fix E2E server startup

### High Priority
1. [bug-002](./bug-002-email-service-crashes.md) - Fix email service test crashes
2. [bug-006](./bug-006-backend-typescript-errors.md) - Fix backend TypeScript errors

### Medium Priority
1. [bug-001](./bug-001-password-validation-failing.md) - Fix password validation test
2. [bug-003](./bug-003-programform-input-duplication.md) - Fix ProgramForm input bug

### Low Priority
1. [bug-005](./bug-005-eslint-config-error.md) - Fix ESLint configuration

## Session Assignments

### Session 1 (Backend) - 4 Bugs
- bug-001 (Medium)
- bug-002 (High)
- bug-006 (High)
- bug-007 (Critical - backend part)

### Session 2 (Frontend) - 4 Bugs
- bug-003 (Medium)
- bug-004 (Critical)
- bug-005 (Low)
- bug-007 (Critical - frontend part)

### Session 3 (QA) - 1 Bug
- bug-007 (Critical - verification)

## Bug Lifecycle

1. **Open** - Bug identified, report created, assigned to session
2. **In Progress** - Session working on fix
3. **Fixed - Awaiting Verification** - Fix committed, QA needs to verify
4. **Verified - Closed** - QA verified fix, bug closed

## How to Update Bug Status

### When You Start Working on a Bug
Edit the bug file and change status:
```markdown
## Status
- [x] Open
- [x] In Progress
- [ ] Fixed - Awaiting Verification
- [ ] Verified - Closed
```

### When You Commit a Fix
```bash
git add docs/qa/bugs/bug-XXX.md
git commit -m "fix(session-X): address bug-XXX - [brief description]"
git push origin session-X
```

### When QA Verifies Fix
QA Session 3 will:
1. Pull from your session branch
2. Re-run tests
3. If tests pass: Update bug status to "Verified - Closed"
4. Commit closure: `git commit -m "qa: verify fix - bug-XXX closed"`

## Quick Reference

- **All Bug Reports**: See individual files in this directory
- **QA Summary**: See `../reports/qa-session-summary-2025-01-17.md`
- **Test Results**: See QA summary for detailed test results

---

**Last Updated**: 2026-01-17
**QA Session**: Session 3
