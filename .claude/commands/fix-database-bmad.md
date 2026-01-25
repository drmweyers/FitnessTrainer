# BMAD Multi-Agent Workflow: Fix EvoFit Database & Seed System

**Copy and paste this entire prompt into a new Claude Code terminal**

---

## MISSION

Fix the EvoFit Trainer database issues using BMAD methodology with multiple specialized agents working in parallel. Ensure the database is running, seeded with test credentials, and fully tested.

---

## PROJECT CONTEXT

**Project**: EvoFit Trainer - Full-Stack Fitness Platform
**Location**: `C:\Users\drmwe\claude_Code_Workspace\EvoFitTrainer`
**Tech Stack**: Next.js 14, TypeScript, PostgreSQL, Prisma, Express.js

**Current Issues**:
- PostgreSQL database not running at localhost:5432
- Seed script fails with "Can't reach database server"
- No test users available
- Port mismatch: frontend expects port 5000, backend on 4000
- Test credentials defined but not seeded

**Test Credentials** (already defined in `backend/src/config/testCredentials.ts`):
- Admin: `admin@fitmeal.pro` / `AdminPass123`
- Trainer: `trainer.test@evofitmeals.com` / `TestTrainer123!`
- Client: `customer.test@evofitmeals.com` / `TestCustomer123!`

---

## BMAD WORKFLOW PHASES

Execute these phases in order, using multiple agents in parallel where specified.

---

### PHASE 1: ASSESSMENT & PLANNING (Single Agent)

**Agent**: @debugger or explore agent

**Tasks**:
1. Verify PostgreSQL installation status
2. Check if Docker is available
3. Identify database connection issues
4. Create comprehensive diagnosis report

**Commands to Run**:
```bash
# Check PostgreSQL
psql --version
netstat -an | findstr "5432"

# Check Docker
docker --version
docker ps -a

# Check database configuration
type backend\.env
type backend\prisma\schema.prisma | findstr /C:"datasource"
```

**Deliverable**: Diagnosis report with:
- PostgreSQL status (installed/running?)
- Docker availability
- Recommended approach (Docker vs native PostgreSQL)
- Port conflicts analysis

---

### PHASE 2: DATABASE SETUP TESTS FIRST (TDD - RED)

**Agent**: @test-engineer

**Tasks**:
1. Write failing tests for database connection
2. Write tests for seed script execution
3. Write tests for test user creation
4. Write tests for API database connectivity

**Test Files to Create**:
```typescript
// backend/tests/integration/database.connection.test.ts
// backend/tests/integration/seed.script.test.ts
// backend/tests/integration/test.users.test.ts
```

**Test Structure**:
```typescript
describe('Database Connection', () => {
  it('should connect to PostgreSQL at localhost:5432', async () => {
    // This should FAIL initially (RED phase)
  });

  it('should have evofit_db database accessible', async () => {
    // This should FAIL initially
  });
});

describe('Seed Script', () => {
  it('should create admin user with correct credentials', async () => {
    // Expected: admin@fitmeal.pro / AdminPass123
  });

  it('should create trainer user with correct credentials', async () => {
    // Expected: trainer.test@evofitmeals.com / TestTrainer123!
  });

  it('should create client user with correct credentials', async () => {
    // Expected: customer.test@evofitmeals.com / TestCustomer123!
  });
});
```

**Run Tests** (Expect failures - RED):
```bash
cd backend
npm test -- tests/integration/database.connection.test.ts
```

**Deliverable**: Failing tests that document expected database behavior

---

### PHASE 3: PARALLEL DATABASE SETUP (Multiple Agents)

Launch these agents in parallel:

#### Agent 1: Database Server Setup
**Agent**: @architect + @devops-digitalocean (for infrastructure knowledge)

**Tasks**:
1. Choose best approach (Docker recommended)
2. Create database container/instance
3. Configure network (port 5432)
4. Set up credentials
5. Create database

**Docker Approach** (Preferred):
```bash
# Create PostgreSQL container
docker run --name evofit-db ^
  -e POSTGRES_USER=evofit ^
  -e POSTGRES_PASSWORD=evofit_dev_password ^
  -e POSTGRES_DB=evofit_db ^
  -p 5432:5432 ^
  -v evofit-db-data:/var/lib/postgresql/data ^
  --restart unless-stopped ^
  -d postgres:16

# Verify it's running
docker ps
docker logs evofit-db

# Test connection
docker exec -it evofit-db psql -U evofit -d evofit_db -c "SELECT version();"
```

#### Agent 2: Prisma Migrations
**Agent**: Backend developer

**Tasks**:
1. Generate Prisma client
2. Run database migrations
3. Verify schema creation

**Commands**:
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db push
npx prisma studio
```

#### Agent 3: Seed Script Enhancement
**Agent**: @test-engineer + @code-reviewer

**Tasks**:
1. Review existing seed script (`backend/prisma/seed.ts`)
2. Add idempotency checks (don't recreate if exists)
3. Add comprehensive logging
4. Add error recovery
5. Create verification function

**Enhancement Checklist**:
- [ ] Check if users exist before creating
- [ ] Log each step clearly
- [ ] Handle partial failures gracefully
- [ ] Return success/failure status
- [ ] Create test data beyond users (exercises, programs)

---

### PHASE 4: SEED EXECUTION & VERIFICATION (Sequential)

**Agent**: @test-engineer

**Tasks**:
1. Run seed script
2. Verify test users created
3. Test password authentication
4. Generate seed verification report

**Commands**:
```bash
cd backend

# Run seed
npm run db:seed

# Verify users in database
npx prisma studio # or use psql
```

**Verification Queries**:
```sql
-- Check users exist
SELECT email, role, "isActive", "isVerified" FROM "User";

-- Expected output:
-- admin@fitmeal.pro | admin | true | true
-- trainer.test@evofitmeals.com | trainer | true | true
-- customer.test@evofitmeals.com | client | true | true
```

**Deliverable**: Seed verification report with:
- Users created (3/3 expected)
- Password hashes verified
- Roles verified
- Any errors/warnings

---

### PHASE 5: GREEN PHASE - MAKE TESTS PASS

**Agent**: @test-engineer

**Tasks**:
1. Run integration tests
2. Fix any failing tests
3. Ensure all tests pass (GREEN)

**Commands**:
```bash
cd backend
npm test -- tests/integration/
```

**Expected Result**: All tests pass

---

### PHASE 6: API CONNECTIVITY TESTS (Parallel Agents)

#### Agent 1: Backend API Tests
**Agent**: @test-engineer

**Tasks**:
1. Test backend can connect to database
2. Test authentication endpoints
3. Test user retrieval
4. Test CRUD operations

**Commands**:
```bash
cd backend
npm run dev
# In another terminal
npm test
```

#### Agent 2: Port Configuration Fix
**Agent**: @debugger + @code-reviewer

**Tasks**:
1. Identify port mismatch (frontend: 5000, backend: 4000)
2. Fix configuration
3. Verify connectivity

**Files to Check**:
- `backend/.env` (PORT=4000)
- `src/lib/api.ts` or similar (API_URL)
- Frontend environment variables

**Fix Options**:
- Option A: Change backend to port 5000
- Option B: Update frontend to use port 4000

**Recommendation**: Standardize on port 4000 for backend, update frontend.

---

### PHASE 7: FRONTEND INTEGRATION TESTS (Parallel)

#### Agent 1: Frontend API Integration
**Agent**: @webapp-testing

**Tasks**:
1. Start frontend dev server
2. Test login with test credentials
3. Test dashboard access
4. Test API calls

**Commands**:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev

# Terminal 3: Tests
npm run test:e2e
```

#### Agent 2: Playwright E2E Tests
**Agent**: @test-engineer

**Tasks**:
1. Create E2E test for login flow
2. Create E2E test for dashboard access
3. Run E2E tests

**Test File**: `tests/e2e/database-seeded.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Database Seeded - Login Flow', () => {
  test('admin can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@fitmeal.pro');
    await page.fill('[name="password"]', 'AdminPass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard/admin');
  });

  test('trainer can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'trainer.test@evofitmeals.com');
    await page.fill('[name="password"]', 'TestTrainer123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard/trainer');
  });

  test('client can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'customer.test@evofitmeals.com');
    await page.fill('[name="password"]', 'TestCustomer123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard/client');
  });
});
```

---

### PHASE 8: QUALITY GATES (Parallel)

Launch all agents in parallel:

#### Agent 1: Code Review
**Agent**: @code-reviewer

**Tasks**:
- Review all database setup code
- Review seed script enhancements
- Review configuration changes
- Ensure security best practices

#### Agent 2: Security Audit
**Agent**: @security-auditor

**Tasks**:
- Verify credentials not exposed
- Check database connection security
- Verify password hashing
- Check for SQL injection vulnerabilities

#### Agent 3: Performance Check
**Agent**: @performance-tuner

**Tasks**:
- Test database query performance
- Check connection pooling
- Verify indexing on critical fields
- Benchmark seed script execution time

---

### PHASE 9: REFACTOR & DOCUMENT (Sequential)

**Agent**: @refactor-expert + @docs-writer

**Tasks**:
1. Refactor seed script for better maintainability
2. Create startup script for automatic database setup
3. Document test credentials
4. Create troubleshooting guide

**Documentation to Create**:
- `docs/DATABASE-SETUP.md` - Setup instructions
- `docs/TEST-CREDENTIALS.md` - Test credentials reference
- `docs/STARTUP-GUIDE.md` - How to start the app
- Update `README.md` with database info

**Startup Script**: `scripts/start-dev.bat`
```batch
@echo off
echo Starting EvoFit Trainer Development Environment...

echo Starting PostgreSQL database...
docker start evofit-db 2>nul || docker run --name evofit-db -e POSTGRES_USER=evofit -e POSTGRES_PASSWORD=evofit_dev_password -e POSTGRES_DB=evofit_db -p 5432:5432 -v evofit-db-data:/var/lib/postgresql/data --restart unless-stopped -d postgres:16

echo Waiting for database...
timeout /t 3 /nobreak >nul

echo Running database migrations...
cd backend
npx prisma migrate deploy

echo Seeding database...
npm run db:seed

echo Starting backend server...
start cmd /k "cd backend && npm run dev"

echo Starting frontend server...
cd ..
start cmd /k "npm run dev"

echo Development environment started!
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Test Credentials:
echo Admin: admin@fitmeal.pro / AdminPass123
echo Trainer: trainer.test@evofitmeals.com / TestTrainer123!
echo Client: customer.test@evofitmeals.com / TestCustomer123!
```

---

### PHASE 10: FINAL VERIFICATION

**Agent**: @test-engineer

**Tasks**:
1. Run ALL unit tests
2. Run ALL integration tests
3. Run ALL E2E tests
4. Generate coverage report
5. Create final verification report

**Commands**:
```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd ..
npm test
npm run test:e2e
npm run test:coverage
```

**Deliverable**: Final verification report with:
- All test results (should pass)
- Coverage metrics
- Known issues
- Next steps

---

## SUCCESS CRITERIA

✅ **Database**:
- PostgreSQL running on localhost:5432
- Database `evofit_db` accessible
- Prisma migrations applied
- Seed script runs successfully

✅ **Test Users**:
- Admin user created and verified
- Trainer user created and verified
- Client user created and verified
- All passwords hashed correctly
- All users active and verified

✅ **API Connectivity**:
- Backend connects to database
- Frontend connects to backend
- Authentication works
- CRUD operations work

✅ **Tests**:
- All unit tests pass
- All integration tests pass
- All E2E tests pass
- Coverage ≥ 60% (baseline)

✅ **Documentation**:
- Database setup guide
- Test credentials documented
- Startup script created
- Troubleshooting guide

---

## SKILLS TO CREATE

Create these skills in `.claude/skills/` if they don't exist:

### Skill 1: `database-setup`
**File**: `.claude/skills/database-setup/SKILL.md`

```markdown
# Database Setup Skill

Automated database setup for EvoFit Trainer using PostgreSQL + Docker.

## When to use
- Database not running
- Need to seed test data
- Fresh development environment

## Actions
1. Check PostgreSQL/Docker status
2. Start database container
3. Run Prisma migrations
4. Execute seed script
5. Verify connectivity

## Commands
```bash
docker start evofit-db
cd backend && npx prisma migrate deploy && npm run db:seed
```
```

### Skill 2: `test-credentials-helper`
**File**: `.claude/skills/test-credentials-helper/SKILL.md`

```markdown
# Test Credentials Helper

Manages test credentials for EvoFit Trainer development.

## Credentials
Admin: admin@fitmeal.pro / AdminPass123
Trainer: trainer.test@evofitmeals.com / TestTrainer123!
Client: customer.test@evofitmeals.com / TestCustomer123!

## Actions
- Display test credentials
- Verify users exist in database
- Recreate test users if needed
- Test authentication
```

---

## EXECUTION INSTRUCTIONS

1. **Copy this entire prompt**
2. **Open new terminal**
3. **Start Claude Code in that terminal**
4. **Paste the prompt**
5. **Claude will execute the BMAD workflow autonomously**

---

## AGENTS TO USE

- @architect - Design database setup approach
- @test-engineer - Write and run all tests
- @code-reviewer - Review code quality
- @security-auditor - Security verification
- @performance-tuner - Performance checks
- @debugger - Troubleshoot issues
- @refactor-expert - Code improvement
- @docs-writer - Documentation
- @webapp-testing - E2E testing
- @devops-digitalocean - Infrastructure setup

---

## ESTIMATED COMPLETION TIME

- Phase 1: 15 minutes
- Phase 2: 20 minutes
- Phase 3: 30 minutes (parallel)
- Phase 4: 15 minutes
- Phase 5: 15 minutes
- Phase 6: 20 minutes (parallel)
- Phase 7: 30 minutes (parallel)
- Phase 8: 20 minutes (parallel)
- Phase 9: 25 minutes
- Phase 10: 15 minutes

**Total**: ~3-4 hours with parallel agents

---

## FINAL DELIVERABLES

1. Running PostgreSQL database with seed data
2. Test users verified and working
3. All tests passing
4. Startup script created
5. Complete documentation
6. Troubleshooting guide

---

**Begin execution now. Work through all phases systematically. Report progress after each phase.**
