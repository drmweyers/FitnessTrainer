# FORGE: Fidelity-Oriented Regression & Growth Engine

**FORGE** is an actor-based user simulation system for comprehensive testing of multi-role platforms like EvoFit Trainer. It simulates realistic user workflows by orchestrating multiple actors (trainer, client, admin) through stateful interactions.

---

## Overview

FORGE enables:
- **Realistic User Simulations**: Actors perform workflows exactly like real users
- **Multi-Role Orchestration**: Trainer, client, and admin actors interact seamlessly
- **Stateful Workflows**: Actors maintain state across multiple steps
- **Race Condition Testing**: Parallel workflows detect timing issues
- **Regression Prevention**: Comprehensive test coverage catches breaking changes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FORGE System                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Actor     │    │   Actor     │    │   Actor     │     │
│  │  Factory    │───▶│   Roles     │    │   State     │     │
│  └─────────────┘    │  (Trainer)  │    │  (Context)  │     │
│                     │  (Client)   │    └─────────────┘     │
│                     │  (Admin)    │                        │
│                     └─────────────┘                        │
│                            │                               │
│                     ┌──────┴──────┐                        │
│                     ▼              ▼                       │
│              ┌──────────┐    ┌──────────┐                  │
│              │ Workflow │    │ Workflow │                  │
│              │ Runner   │───▶│ Steps    │                  │
│              └──────────┘    └──────────┘                  │
│                     │                                      │
│                     ▼                                      │
│              ┌──────────┐                                  │
│              │   API    │                                  │
│              │ Routes   │                                  │
│              └──────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. ActorFactory

Creates and manages actors with specific roles and authentication state.

```typescript
// lib/forge/actor-factory.ts
export class ActorFactory {
  static async createTrainer(overrides?: Partial<User>): Promise<Actor> {
    const user = await this.createUser({ role: 'trainer', ...overrides });
    const token = await this.authenticate(user);
    return new Actor(user, token, 'trainer');
  }

  static async createClient(overrides?: Partial<User>): Promise<Actor> {
    const user = await this.createUser({ role: 'client', ...overrides });
    const token = await this.authenticate(user);
    return new Actor(user, token, 'client');
  }

  static async createAdmin(overrides?: Partial<User>): Promise<Actor> {
    const user = await this.createUser({ role: 'admin', ...overrides });
    const token = await this.authenticate(user);
    return new Actor(user, token, 'admin');
  }
}
```

### 2. WorkflowRunner

Executes multi-step workflows with state management.

```typescript
// lib/forge/workflow-runner.ts
export class WorkflowRunner {
  async run(workflow: Workflow, context: WorkflowContext): Promise<Result> {
    for (const step of workflow.steps) {
      try {
        const result = await step.execute(context);
        context.setState(step.name, result);
      } catch (error) {
        await this.handleStepFailure(step, error, context);
        throw error;
      }
    }
    return { success: true, context };
  }
}
```

### 3. Actor State Management

Actors maintain state across workflow steps.

```typescript
// lib/forge/actor.ts
export class Actor {
  constructor(
    public user: User,
    public token: string,
    public role: string,
    private state: Map<string, any> = new Map()
  ) {}

  setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  getState(key: string): any {
    return this.state.get(key);
  }

  authenticatedRequest(method: string, path: string, body?: any): Request {
    return new Request(`http://localhost:3000${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
```

---

## Test Structure

### Phase 1: Core API Gap Workflows (69 tests)

Foundation tests covering basic API functionality:
- Authentication flows
- Profile management
- Exercise library CRUD
- Client management
- Program operations
- Workout tracking
- Analytics
- Scheduling
- Admin operations

### Phase 2: Multi-Actor Stories (1,000+ tests)

Organized into 5 parallel streams:

| Stream | Focus | Stories | Tests |
|--------|-------|---------|-------|
| **A** | Trainer Auth (Epics 001-002) | 14 | 80 |
| **B** | Client Exercise (Epics 003-004) | 15 | 167 |
| **C** | Program Workout (Epics 005-006) | 16 | 160+ |
| **D** | Analytics Chat (Epics 007-008) | 14 | 170+ |
| **E** | Schedule Admin (Epics 009-012) | 31 | 314 |

**Total: 108 stories, 1,069 FORGE tests**

---

## Usage Examples

### Single Actor Workflow

```typescript
// Test trainer creating a program
it('trainer creates a program', async () => {
  const trainer = await ActorFactory.createTrainer();
  const context = new WorkflowContext({ actor: trainer });

  const workflow = new Workflow([
    new CreateProgramStep({ name: 'Strength 101' }),
    new AddExerciseStep({ exerciseId: 'bench-press' }),
    new AssignProgramStep({ clientId: 'client-123' }),
  ]);

  const result = await workflowRunner.run(workflow, context);
  expect(result.success).toBe(true);
});
```

### Multi-Actor Workflow

```typescript
// Test trainer assigning program to client
it('trainer assigns program, client completes workout', async () => {
  const trainer = await ActorFactory.createTrainer();
  const client = await ActorFactory.createClient();

  // Trainer creates and assigns program
  const trainerContext = new WorkflowContext({ actor: trainer });
  const trainerWorkflow = new Workflow([
    new CreateProgramStep({ name: 'Cardio Blast' }),
    new AddWorkoutStep({ day: 1, exercises: [...] }),
    new InviteClientStep({ email: client.user.email }),
    new AssignProgramStep({ clientId: client.user.id }),
  ]);

  await workflowRunner.run(trainerWorkflow, trainerContext);

  // Client receives and completes workout
  const clientContext = new WorkflowContext({ actor: client });
  const clientWorkflow = new Workflow([
    new AcceptInvitationStep(),
    new ViewAssignedProgramStep(),
    new StartWorkoutStep({ programId: trainerContext.getState('programId') }),
    new LogExerciseStep({ exerciseId: 'treadmill', duration: 30 }),
    new CompleteWorkoutStep(),
  ]);

  const result = await workflowRunner.run(clientWorkflow, clientContext);
  expect(result.success).toBe(true);
});
```

### Race Condition Testing

```typescript
// Test concurrent booking attempts
it('handles concurrent session bookings', async () => {
  const trainer = await ActorFactory.createTrainer();
  const client1 = await ActorFactory.createClient();
  const client2 = await ActorFactory.createClient();

  // Both clients try to book the same slot
  const results = await Promise.allSettled([
    bookSession(client1, '2026-04-01T10:00:00Z'),
    bookSession(client2, '2026-04-01T10:00:00Z'),
  ]);

  // Only one should succeed
  const successes = results.filter(r => r.status === 'fulfilled');
  expect(successes.length).toBe(1);
});
```

---

## Integration with EvoFit Trainer

### File Locations

```
__tests__/forge/
├── phase1/                    # Core API gap workflows
│   ├── story-XXX-*.test.ts    # 69 foundation tests
│   └── README.md
├── phase2/
│   ├── stream-a/              # Trainer auth (14 stories)
│   ├── stream-b/              # Client exercise (15 stories)
│   ├── stream-c/              # Program workout (16 stories)
│   ├── stream-d/              # Analytics chat (14 stories)
│   └── stream-e/              # Schedule admin (31 stories)
└── README.md
```

### Running FORGE Tests

```bash
# Run all FORGE tests
npm test -- __tests__/forge/

# Run specific stream
npm test -- __tests__/forge/phase2/stream-a/

# Run specific story
npm test -- story-001-01-create-profile

# Run with coverage
npm run test:coverage -- __tests__/forge/
```

---

## Benefits

1. **Comprehensive Coverage**: 1,069 tests cover all 108 user stories
2. **Realistic Scenarios**: Actors behave like real users
3. **Early Bug Detection**: Catch issues before production
4. **Regression Prevention**: Prevent breaking changes
5. **Documentation**: Tests serve as executable documentation
6. **Confidence**: Ship with certainty

---

## Future Enhancements

- Visual regression testing with Playwright
- Performance benchmarks
- Chaos engineering (random failures)
- AI-driven exploration testing
- Cross-browser compatibility

---

## See Also

- [BMAD Workflow](./bmad-workflow.md)
- [Test Architecture](./test-architecture.md)
- [Epic Documentation](./epics/)
