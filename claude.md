# EvoFit Trainer - Claude AI Instructions

## Project Overview

**Project**: EvoFit Trainer
**Type**: Full-Stack Web Application
**Purpose**: Fitness tracking and training application
**Tech Stack**: Next.js, React, TypeScript, Tailwind CSS, Node.js

---

# ⚡ SUPERPOWERS - DEFAULT WORKFLOW FOR EVOFIT

**CRITICAL:** Superpowers is the PRIMARY methodology for ALL EvoFit development work.

### Superpowers for EvoFit Development:

| Activity | Superpowers Skill | Auto-Activate When |
|----------|-------------------|-------------------|
| **Debugging** | `systematic-debugging` | Bug/error reported |
| **Feature Implementation** | `subagent-driven-development` | Starting new feature |
| **TDD** | `test-driven-development` | Writing tests + code |
| **Code Review** | `requesting-code-review` | Ready for review |
| **BMAD Stories** | Superpowers as CTO | Creating BMAD stories |
| **Planning** | `writing-plans` | Designing features |
| **Completion** | `verification-before-completion` | Finishing work |

### How to Use Superpowers in EvoFit:

```
❌ DON'T SAY:                    ✅ SAY:
"Use agents to implement"        "Implement workout creation feature"
"Debug this test failure"        "Tests are failing in WorkoutForm.spec.ts"
"Review my code"                 "Ready for code review"
"Create a BMAD story"            "Add user profile management feature"
```

### Superpowers + BMAD for EvoFit:
```
BMAD Process → Superpowers Skills as CTO → Execute

Example Workflow:
1. "Add workout tracking feature"
   → @subagent-driven-development (TDD approach)
   → Write tests → Implement → Verify

2. "Login is broken"
   → @systematic-debugging
   → Investigate → Fix → Verify

3. "Ready to merge workout feature"
   → @requesting-code-review
   → Review → Address feedback → Merge
```

---

# 🚀 AUTO-CLAUDE INTEGRATION

## Auto-Claude Location
- **Installation**: `C:\Users\drmwe\Auto-Claude`
- **Start**: Double-click "Auto-Claude" desktop shortcut
- **Project Path**: `C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer`

## Quick Start Templates for EvoFit

### Template 1: New Feature with TDD (Superpowers-Powered)
```
Implement [FEATURE_NAME] in EvoFit using Superpowers TDD:

Phase 1 - Planning:
- Define user stories for fitness feature
- Design component architecture
- Plan state management (React Context/Zustand)
- Identify data models and API endpoints
- Create wireframes/mockups

Phase 2 - TDD Implementation (Superpowers test-driven-development):
- Write Playwright GUI tests first
- Write Jest unit tests for components
- Write failing tests (RED)
- Implement React components (GREEN)
- Refactor for clean code (REFACTOR)
- Ensure 100% test coverage

Phase 3 - Quality Assurance:
- @requesting-code-review for React/TypeScript best practices
- @security-auditor for OWASP compliance
- GUI testing with @webapp-testing (Playwright)
- Performance testing with Lighthouse
- Mobile responsiveness testing
- @verification-before-completion before merging

Phase 4 - Documentation:
- Component documentation with Storybook
- API documentation
- User guide for fitness feature
```

### Template 2: GUI Testing Task
```
Create GUI testing task for [EVOFIT_FEATURE]:

Test Scenarios:
1. User registration and onboarding flow
2. Workout creation and management
3. Exercise tracking and logging
4. Progress visualization (charts/graphs)
5. Mobile responsive design
6. Form validation and error handling
7. Accessibility (WCAG 2.1 AA compliance)
8. Performance (Lighthouse score >90)
9. Cross-browser testing (Chrome, Firefox, Safari)
10. Touch gestures for mobile

Tools:
- Playwright for E2E testing
- Claude Chrome Extension for visual testing
- @webapp-testing skill
- Jest + React Testing Library for unit tests
- MSW for API mocking

Success Criteria:
- All tests pass
- 100% critical user path coverage
- No accessibility issues
- Lighthouse score >90
```

### Template 3: API Development Task
```
Create Ralph Loop task for [API_ENDPOINT]:

Phase 1 - Planning:
- Define REST API contract (OpenAPI spec)
- Design database schema (PostgreSQL)
- Plan authentication/authorization
- Identify error scenarios

Phase 2 - TDD Implementation:
- Write API integration tests first
- Implement endpoint with Next.js API routes
- Add input validation with Zod
- Implement error handling
- Add database migrations

Phase 3 - Quality:
- @security-auditor for SQL injection/XSS prevention
- @performance-tuner for query optimization
- Load testing with k6
- API documentation with Swagger

Phase 4 - Documentation:
- OpenAPI/Swagger documentation
- Example requests/responses
- Error response documentation
```

---

# 🎯 SUPERPOWERS + RALPH LOOP TDD FOR EVOFIT

## Superpowers-Powered Development Process

```
┌─────────────────────────────────────────────────────────────┐
│              PHASE 1: PLANNING & DESIGN                      │
│  • Define fitness feature requirements                     │
│  • Create user stories with acceptance criteria             │
│  • Design React component architecture                     │
│  • Plan state management (Context/Zustand/Redux)          │
│  • Design database schema                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│      PHASE 2: TEST-DRIVEN DEVELOPMENT (Superpowers)         │
│  • @test-driven-development (TDD approach)                 │
│  • Write Playwright GUI tests (user flows)                 │
│  • Write Jest unit tests (components, hooks, utils)        │
│  • Write failing tests (RED)                               │
│  • Implement React components (GREEN)                       │
│  • Refactor code (REFACTOR)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          PHASE 3: QUALITY GATE (Superpowers)                │
│  • @requesting-code-review (React/TypeScript)             │
│  • @security-auditor (OWASP Top 10, authentication)       │
│  • @webapp-testing (Playwright E2E tests)                  │
│  • @performance-tuner (bundle size, rendering)            │
│  • Accessibility audit (WCAG 2.1 AA)                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│   PHASE 4: VERIFICATION (Superpowers)                       │
│  • @verification-before-completion                         │
│  • All tests pass                                          │
│  • No security vulnerabilities                             │
│  • Performance benchmarks met                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│             PHASE 5: DOCUMENTATION                           │
│  • Component documentation (Storybook)                     │
│  • API documentation (OpenAPI)                             │
│  • User guides and walkthroughs                           │
│  • Code comments and JSDoc                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
           [TASK COMPLETE - MERGE TO MAIN]
```

## Superpowers Rules for EvoFit

1. **Superpowers First**: Always use Superpowers methodology for development
2. **Tests First**: Always write tests before implementation (TDD)
3. **Red-Green-Refactor**: Follow strict TDD cycle
4. **GUI Tests Required**: All user-facing features need Playwright tests
5. **Quality Gate**: Use @requesting-code-review before merging
6. **Security First**: All features must pass @security-auditor review
7. **Performance**: Lighthouse score >90, bundle size monitoring
8. **Accessibility**: WCAG 2.1 AA compliance required
9. **Documentation**: Every feature documented before merge
10. **Verification**: Always use @verification-before-completion before claiming done

---

# 🛠️ SUPERPOWERS DEVELOPMENT WORKFLOWS

## Creating a New Feature (Superpowers-Powered)

```bash
# 1. Simply state what you want
"Implement workout creation feature for EvoFit"

# 2. Superpowers activates automatically
→ @subagent-driven-development
→ @test-driven-development (TDD)
→ Planning, tests, implementation, review

# 3. Verification
→ @verification-before-completion
→ @requesting-code-review (if needed)

# 4. Merge
→ @finishing-development-branch
```

## Debugging (Superpowers Systematic Debugging)

```bash
# Simply report the issue
"Workout form is not submitting"

# Superpowers activates:
→ @systematic-debugging
→ Investigates → Identifies root cause → Fixes → Verifies
```

## Code Review (Superpowers Requesting Review)

```bash
# When ready for review
"Ready for code review on workout feature"

# Superpowers activates:
→ @requesting-code-review
→ Reviews → Provides feedback → Waits for fixes
```

---

# 🚀 AUTO-CLAUDE INTEGRATION (LEGACY)

## Creating a New Feature via Auto-Claude

```bash
# 1. Start Auto-Claude
Double-click "Auto-Claude" desktop shortcut

# 2. Create new task
- Click "New Task"
- Select "EvoFit Trainer" project
- Paste "Template 1: New Feature with TDD"
- Customize for your feature
- Click "Create Task"

# 3. Auto-Claude runs Ralph Loop with Superpowers
- Planning phase (PM + Architect)
- TDD implementation (Test Engineer + Developer)
- Quality gate (Code Reviewer + Security Auditor)
- Documentation (Docs Writer)

# 4. Review and merge
- Review generated code
- Run tests locally
- Merge to main branch
```

## GUI Testing with Playwright

```bash
# Run GUI tests
npm run test:e2e

# Run specific test
npx playwright test tests/workouts.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

## Running Tests Locally

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check
```

---

# 📱 EVOFIT-SPECIFIC GUIDELINES

## Component Development

### React Component Template
```typescript
// Use TDD approach
// 1. Write tests first
// 2. Implement component
// 3. Ensure accessibility

import { useState } from 'react';

interface ComponentProps {
  // Define props with TypeScript
}

export function Component({ prop }: ComponentProps) {
  // Component logic
  return (
    <div className="component">
      {/* JSX with accessibility attributes */}
    </div>
  );
}
```

### State Management Guidelines
- Use React Context for global state (user, workouts)
- Use useState for local component state
- Use Zustand for complex state if needed
- Always type state with TypeScript

### API Integration
```typescript
// Use Next.js API routes
// Example: app/api/workouts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.number(),
    reps: z.number(),
  })),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = schema.parse(body);
  // Process data
  return NextResponse.json({ success: true });
}
```

## Styling Guidelines

```typescript
// Use Tailwind CSS
// Follow utility-first approach
// Ensure responsive design

<div className="
  flex flex-col md:flex-row
  p-4 md:p-6
  bg-white dark:bg-gray-800
  rounded-lg shadow-md
">
  {/* Content */}
</div>
```

---

# 🧪 TESTING REQUIREMENTS

## Unit Tests (Jest + React Testing Library)

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { WorkoutForm } from './WorkoutForm';

describe('WorkoutForm', () => {
  it('renders workout input fields', () => {
    render(<WorkoutForm />);
    expect(screen.getByLabelText('Workout Name')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<WorkoutForm />);

    await user.type(screen.getByLabelText('Workout Name'), 'Morning Yoga');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Workout saved')).toBeInTheDocument();
  });
});
```

## E2E Tests (Playwright)

```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('user can create a workout', async ({ page }) => {
  // Navigate to app
  await page.goto('/workouts');

  // Click create button
  await page.click('button:has-text("Create Workout")');

  // Fill form
  await page.fill('[name="workoutName"]', 'Upper Body Strength');
  await page.selectOption('[name="difficulty"]', 'intermediate');

  // Submit
  await page.click('button:has-text("Save")');

  // Verify
  await expect(page.locator('text=Upper Body Strength')).toBeVisible();
});
```

---

# 🔒 SECURITY REQUIREMENTS

## Authentication & Authorization

- All API routes must validate JWT tokens
- Implement role-based access control (RBAC)
- Sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement CSRF protection for forms
- Rate limit API endpoints

## Data Protection

- Encrypt sensitive data at rest
- Use HTTPS in production
- Implement secure password hashing (bcrypt)
- Never expose API keys in client code
- Validate and sanitize all inputs

---

# 📊 PERFORMANCE REQUIREMENTS

## Bundle Size Limits
- Initial JS bundle: <200KB gzipped
- Each route chunk: <100KB gzipped
- Total page weight: <500KB

## Rendering Performance
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.5s
- Cumulative Layout Shift (CLS): <0.1

## Monitoring
```bash
# Run Lighthouse audit
npm run lighthouse

# Check bundle size
npm run analyze
```

---

# ♿ ACCESSIBILITY REQUIREMENTS

## WCAG 2.1 AA Compliance

- All interactive elements must be keyboard accessible
- Form inputs must have associated labels
- Images must have alt text
- Color contrast ratio ≥4.5:1
- Focus indicators must be visible
- ARIA labels for complex components

## Testing
```bash
# Run accessibility audit
npm run test:a11y

# Check with axe DevTools
# Install axe DevTools Chrome extension
```

---

# 🎨 DESIGN SYSTEM

## Colors
- Primary: `bg-blue-600`
- Secondary: `bg-purple-600`
- Success: `bg-green-600`
- Error: `bg-red-600`
- Warning: `bg-yellow-600`

## Typography
- Headings: `font-bold text-xl`
- Body: `text-base`
- Small: `text-sm`

## Spacing
- Container: `max-w-7xl mx-auto px-4`
- Sections: `py-8 md:py-12`
- Cards: `p-6`

---

# 📦 PROJECT STRUCTURE

```
EvoFitTrainer/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   ├── (workouts)/
│   ├── api/              # API routes
│   └── layout.tsx
├── components/
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   └── features/        # Feature-specific components
├── lib/
│   ├── db/              # Database utilities
│   ├── auth/            # Authentication
│   └── utils/           # Helper functions
├── tests/
│   ├── unit/            # Jest tests
│   └── e2e/             # Playwright tests
├── public/
│   └── images/
├── .auto-claude/
│   └── specs/           # Auto-Claude task specifications
└── CLAUDE.md            # This file
```

---

# 🚀 DEPLOYMENT

## Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Start production
npm start

# Run tests before deployment
npm run test:ci
```

## Environment Variables
```env
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# API Keys
OPENAI_API_KEY=
```

---

# 📝 DEVELOPMENT BEST PRACTICES

## Git Workflow
```bash
# Create feature branch
git checkout -b feature/workout-management

# Make changes
git add .
git commit -m "feat: add workout management"

# Push and create PR
git push origin feature/workout-management
```

## Commit Message Conventions
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

## Code Review Checklist (Superpowers-Powered)
- [ ] @verification-before-completion passed
- [ ] Tests pass (unit + E2E)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Accessibility verified
- [ ] Performance benchmarks met
- [ ] @security-auditor passed
- [ ] @requesting-code-review approved
- [ ] Documentation complete

---

# 🐛 SUPERPOWERS DEBUGGING

## Systematic Debugging (Superpowers)

When you encounter any issue in EvoFit, simply describe it:

```
"Workout form validation is not working"
"API returns 500 error on workout save"
"Tests failing in WorkoutForm.spec.ts"
```

Superpowers automatically:
1. **@systematic-debugging** activates
2. Investigates the issue systematically
3. Identifies root cause
4. Implements fix
5. Verifies solution
6. Runs tests to confirm

## Common Issues (Manual Debugging)

### Tests Failing
```bash
# Run tests in verbose mode
npm test -- --verbose

# Debug Playwright test
npx playwright test --debug

# Or just say: "Tests are failing"
# → Superpowers handles it
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Or just say: "Build is failing"
# → Superpowers handles it
```

### Type Errors
```bash
# Run type check
npm run type-check

# Generate type coverage
npm run type-coverage

# Or just say: "TypeScript errors in WorkoutForm"
# → Superpowers handles it
```

---

# 📚 LEARNING RESOURCES

## Internal Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Playwright Documentation](https://playwright.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Auto-Claude Resources
- Global CLAUDE.md: `C:\Users\drmwe\.claude\CLAUDE.md`
- Auto-Claude App: `C:\Users\drmwe\Auto-Claude`

---

# ⚡ SUPERPOWERS QUICK REFERENCE

## How to Talk to Your CTO (Superpowers-Powered)

| You Want | Say This | Superpowers Activates |
|---------|----------|---------------------|
| Implement feature | "Add user authentication" | @subagent-driven-development |
| Fix bug | "Login is broken" | @systematic-debugging |
| Code review | "Ready for review" | @requesting-code-review |
| Write tests | "Add tests for WorkoutForm" | @test-driven-development |
| Plan feature | "Plan workout tracking" | @writing-plans |
| Merge feature | "Feature is complete" | @finishing-development-branch |
| Verify work | "Check if this is done" | @verification-before-completion |

## Don't Say This ❌ | Do Say This ✅

| ❌ Don't Say | ✅ Do Say |
|-------------|----------|
| "Use agents to implement" | "Implement this feature" |
| "Debug this bug" | "There's a bug in X" |
| "Create BMAD story" | "Add this feature" |
| "Run code review" | "Ready for review" |
| "Write tests first" | "Add this feature with tests" |

---

**EvoFit Trainer CLAUDE.md - Superpowers Edition**

Last updated: 2025-01-25
**Version:** 2.0 - Superpowers-First Development
