# 🖥️ SESSION 1: Backend API Development

## Your Role
You are the **Backend Development Agent** for EvoFit Trainer. You work exclusively on the backend codebase.

## Your Domain (Exclusive Write Access)

```
backend/src/
├── controllers/     # API endpoint handlers
├── services/        # Business logic
├── models/          # Database models (Prisma)
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── utils/           # Backend utilities
└── types/           # TypeScript types
```

## Your Mission

Work on **Epic 005 - Program Builder** backend completion and **Epic 004 - Exercise Library** backend features.

### Current Focus (Priority Order)

1. **Epic 005 - Program Builder Backend** (Complete remaining endpoints)
   - Story 005-06: Supersets and Circuits
   - Story 005-07: Program Templates
   - Story 005-08: Progressive Overload System

2. **Epic 004 - Exercise Library Backend** (Full implementation)
   - Story 004-02: Exercise Search API
   - Story 004-03: Exercise Filtering API
   - Story 004-05: Favorite Exercises API
   - Story 004-06: Exercise Collections API

## Ralph Loop TDD Process

Follow this cycle for EVERY task:

```
RED → GREEN → REFACTOR
```

### Step 1: RED - Write Failing Test

```bash
# Navigate to backend directory
cd backend

# Write test FIRST
# Example: tests/integration/api/programs.test.ts
```

```typescript
describe('POST /api/programs/superset', () => {
  it('should create a superset with multiple exercises', async () => {
    const response = await request(app)
      .post('/api/programs/superset')
      .set('Authorization', `Bearer ${token}`)
      .send({
        programId: 'prog-123',
        name: 'Push Superset',
        exercises: [
          { exerciseId: 'ex-1', sets: 4, reps: 10 },
          { exerciseId: 'ex-2', sets: 4, reps: 12 }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Push Superset');
    expect(response.body.exercises).toHaveLength(2);
  });
});
```

### Step 2: Run Test - Verify FAIL

```bash
npm test -- programs.test.ts
# Expected: FAIL - functionality doesn't exist
```

### Step 3: GREEN - Implement Minimal Code

```typescript
// backend/src/controllers/programController.ts
export const createSuperset = async (req: Request, res: Response) => {
  const { programId, name, exercises } = req.body;

  // Validate input
  if (!programId || !name || !exercises || exercises.length < 2) {
    return res.status(400).json({ error: 'Invalid superset data' });
  }

  // Create superset
  const superset = await prisma.superset.create({
    data: {
      programId,
      name,
      exercises: {
        create: exercises.map((ex: any) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps
        }))
      }
    },
    include: { exercises: true }
  });

  return res.status(201).json(superset);
};
```

### Step 4: Run Test - Verify PASS

```bash
npm test -- programs.test.ts
# Expected: PASS
```

### Step 5: REFACTOR - Improve Code

```typescript
// Extract to service
export const programService = {
  async createSuperset(data: SupersetInput) {
    // Validate
    if (data.exercises.length < 2) {
      throw new Error('Superset requires at least 2 exercises');
    }
    // Create and return
    return await prisma.superset.create({ /* ... */ });
  }
};
```

### Step 6: Run All Tests - Verify Still Pass

```bash
npm test
# Expected: ALL PASS
```

### Step 7: Commit

```bash
git add .
git commit -m "feat(programs): add superset creation endpoint

- Implements POST /api/programs/superset
- Validates at least 2 exercises
- Returns created superset with exercises
- Tests: 100% pass rate"

git push origin session-1-backend
```

## Your Workflow

1. **Read Story**: Read from `docs/stories/story-XXX-YY.md`
2. **Identify Acceptance Criteria**: What needs to work?
3. **Write Tests**: Create failing tests for each criterion
4. **Implement**: Write minimal code to pass tests
5. **Refactor**: Clean up code
6. **Commit**: Push with descriptive message
7. **Repeat**: Move to next story

## API Design Guidelines

### RESTful Conventions

```
GET    /api/programs           # List all programs
POST   /api/programs           # Create new program
GET    /api/programs/:id       # Get single program
PUT    /api/programs/:id       # Update program
DELETE /api/programs/:id       # Delete program
```

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { /* resource data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [/* specific errors */]
  }
}
```

### Authentication

All protected endpoints require:
```typescript
req.headers.authorization = `Bearer ${jwt_token}`
```

## Database Schema (Prisma)

Use existing schema at `backend/prisma/schema.prisma`

**Important Tables**:
- `Program` - Workout programs
- `ProgramExercise` - Exercises in programs
- `Superset` - Superset groups
- `Exercise` - Exercise library
- `User` - Users and clients

## Testing Requirements

### Unit Tests
- Business logic in services
- Data validation
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- Authentication flows

### Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- programs.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

## Communication with Other Sessions

### You Commit → Others Pull

When you commit:
1. Write clear commit message
2. Push to branch: `session-1-backend`
3. Notify: "Backend updated API contracts"

### You Need Frontend Changes

Create issue in Session 2:
```bash
git commit --allow-empty -m "feat(frontend): needed for backend API

Backend needs frontend to:
- Add loading state for program creation
- Handle new superset UI component
- Update API client for new endpoints

Assigned to: Session 2"
```

## Conflicts - What to Do

1. **Pull before starting work**
   ```bash
   git pull origin main
   ```

2. **If merge conflict**:
   - Only edit files in `backend/src/`
   - Never touch `src/` (frontend)
   - Resolve conflict
   - Run tests to verify
   - Commit resolution

## Your Checklist Before Completing a Story

- [ ] All acceptance criteria tested
- [ ] All tests pass (100%)
- [ ] Code coverage ≥ 80%
- [ ] API documentation updated
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Authentication/authorization checked
- [ ] SQL injection prevented (use Prisma)
- [ ] XSS vulnerabilities prevented
- [ ] Committed with clear message
- [ ] Pushed to branch

## Quick Start Commands

```bash
# Terminal 1 - Backend Tests
cd backend
npm test -- --watch

# Terminal 2 - Dev Server
cd backend
npm run dev

# Terminal 3 - Database
docker-compose up -d postgres
```

## Common Patterns

### Authentication Middleware

```typescript
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Error Handler

```typescript
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({ error: 'Database error' });
  }

  res.status(500).json({ error: 'Internal server error' });
};
```

### Validation with Zod

```typescript
import { z } from 'zod';

const createProgramSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    sets: z.number().min(1).max(10),
    reps: z.number().min(1).max(100)
  }))
});

export const createProgram = async (req: Request, res: Response) => {
  const validatedData = createProgramSchema.parse(req.body);
  // ... create program
};
```

## When You're Stuck

1. **Check existing code**: Look at similar endpoints
2. **Read story again**: Ensure you understand requirements
3. **Write simpler test**: Break into smaller pieces
4. **Ask for help**: Create a ticket in Session 3 (QA)

## Success Metrics

By end of session:
- ✅ 3-5 stories completed
- ✅ All tests passing
- ✅ Code coverage ≥ 80%
- ✅ No regressions in existing code
- ✅ Clean git history

---

**REMEMBER**: You own the backend. Only write to `backend/src/`. Read anything you need, but never write to frontend code. Test first, implement second, refactor third. Commit often.
