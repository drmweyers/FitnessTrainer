---
name: user-simulation
description: This skill enables actor-based user simulation testing for multi-role platforms. It provides ActorFactory, WorkflowRunner, and stateful workflow patterns for simulating realistic user interactions between admins, trainers, clients, and other roles. Use this skill when implementing comprehensive end-to-end tests that involve multiple actors with different roles interacting through the system.
---

# User Simulation Skill

This skill provides an actor-based testing framework for simulating realistic user workflows on multi-role platforms (e.g., fitness platforms with trainers and clients, marketplaces with buyers and sellers, SaaS with admins and users).

## When to Use This Skill

Use this skill when:
- Testing multi-role interactions (admin/user, trainer/client, etc.)
- Simulating realistic user workflows end-to-end
- Testing race conditions with concurrent actors
- Creating regression test suites for complex user journeys
- Validating stateful multi-step processes

## Core Components

### 1. ActorFactory

Creates authenticated actors with specific roles.

```typescript
// lib/testing/actor-factory.ts
export class ActorFactory {
  static async createActor(role: string, overrides?: Partial<User>): Promise<Actor> {
    const user = await this.createUser({ role, ...overrides });
    const token = await this.authenticate(user);
    return new Actor(user, token, role);
  }
}
```

**Usage:**
```typescript
const admin = await ActorFactory.createActor('admin');
const trainer = await ActorFactory.createActor('trainer');
const client = await ActorFactory.createActor('client');
```

### 2. Actor

Represents a user with authentication state.

```typescript
// lib/testing/actor.ts
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
    return new Request(`${BASE_URL}${path}`, {
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

### 3. WorkflowRunner

Executes multi-step workflows with actors.

```typescript
// lib/testing/workflow-runner.ts
export class WorkflowRunner {
  async run(workflow: Workflow, context: WorkflowContext): Promise<Result> {
    for (const step of workflow.steps) {
      const result = await step.execute(context);
      context.setState(step.name, result);
    }
    return { success: true };
  }
}
```

### 4. Workflow Steps

Define reusable workflow steps.

```typescript
// lib/testing/workflow-step.ts
export abstract class WorkflowStep {
  constructor(public name: string, public config: any) {}
  abstract execute(context: WorkflowContext): Promise<any>;
}

// Example: Create a resource
export class CreateResourceStep extends WorkflowStep {
  async execute(context: WorkflowContext): Promise<any> {
    const actor = context.getActor();
    const response = await fetch(
      actor.authenticatedRequest('POST', this.config.endpoint, this.config.data)
    );
    const result = await response.json();
    return result.data;
  }
}
```

## Implementation Guide

### Step 1: Create Actor Infrastructure

```bash
# Create actor files
mkdir -p lib/testing/
touch lib/testing/actor.ts
touch lib/testing/actor-factory.ts
touch lib/testing/workflow-runner.ts
touch lib/testing/workflow-step.ts
```

### Step 2: Implement Actor Factory

See references/actor-factory-implementation.ts for complete implementation.

### Step 3: Define Platform-Specific Workflows

Create workflow steps specific to your platform:

```typescript
// __tests__/workflows/trainer-workflows.ts
export class CreateProgramStep extends WorkflowStep {
  async execute(context: WorkflowContext): Promise<any> {
    const trainer = context.getActor('trainer');
    const response = await POST(trainer.authenticatedRequest(
      '/api/programs',
      { name: this.config.name }
    ));
    const program = (await response.json()).data;
    context.setState('programId', program.id);
    return program;
  }
}

export class AssignProgramStep extends WorkflowStep {
  async execute(context: WorkflowContext): Promise<any> {
    const trainer = context.getActor('trainer');
    const programId = context.getState('programId');
    const clientId = this.config.clientId || context.getState('clientId');

    const response = await POST(trainer.authenticatedRequest(
      `/api/programs/${programId}/assign`,
      { clientId }
    ));
    return (await response.json()).data;
  }
}
```

### Step 4: Write Multi-Actor Tests

```typescript
// __tests__/workflows/program-assignment.test.ts
it('trainer assigns program, client completes workout', async () => {
  // Create actors
  const trainer = await ActorFactory.createActor('trainer');
  const client = await ActorFactory.createActor('client');

  // Trainer workflow
  const trainerContext = new WorkflowContext({ actor: trainer });
  const trainerWorkflow = new Workflow([
    new CreateProgramStep({ name: 'Strength 101' }),
    new AddWorkoutStep({ day: 1, exercises: [...] }),
    new InviteClientStep({ email: client.user.email }),
    new AssignProgramStep(),
  ]);

  await workflowRunner.run(trainerWorkflow, trainerContext);

  // Client workflow
  const clientContext = new WorkflowContext({ actor: client });
  const clientWorkflow = new Workflow([
    new AcceptInvitationStep(),
    new ViewAssignedProgramStep(),
    new StartWorkoutStep({
      programId: trainerContext.getState('programId')
    }),
    new CompleteWorkoutStep(),
  ]);

  const result = await workflowRunner.run(clientWorkflow, clientContext);
  expect(result.success).toBe(true);
});
```

## Advanced Patterns

### Race Condition Testing

```typescript
it('handles concurrent bookings', async () => {
  const slotId = 'slot-123';
  const client1 = await ActorFactory.createActor('client');
  const client2 = await ActorFactory.createActor('client');

  const results = await Promise.allSettled([
    bookSlot(client1, slotId),
    bookSlot(client2, slotId),
  ]);

  const successes = results.filter(r => r.status === 'fulfilled');
  expect(successes.length).toBe(1);
});
```

### Stateful Workflows

```typescript
class StatefulWorkflow {
  async execute(context: WorkflowContext): Promise<void> {
    // Step 1: Create resource
    const resource = await this.createResource(context);
    context.setState('resource', resource);

    // Step 2: Share with another actor
    const otherActor = context.getActor('other');
    await this.shareResource(context, otherActor, resource.id);

    // Step 3: Verify other actor can access
    const shared = await this.verifyAccess(otherActor, resource.id);
    expect(shared).toBe(true);
  }
}
```

### Error Recovery

```typescript
class ResilientWorkflowStep extends WorkflowStep {
  async execute(context: WorkflowContext): Promise<any> {
    try {
      return await this.attempt(context);
    } catch (error) {
      if (this.config.fallback) {
        return await this.config.fallback(context, error);
      }
      throw error;
    }
  }
}
```

## References

- `references/actor-factory-implementation.ts` - Complete ActorFactory implementation
- `references/workflow-runner-implementation.ts` - WorkflowRunner with error handling
- `references/example-test-suite.ts` - Full example test suite

## Best Practices

1. **One Actor Per Role**: Create separate actors for each role in the test
2. **Stateful Context**: Pass state between steps via WorkflowContext
3. **Cleanup**: Always clean up created resources in `afterEach`
4. **Idempotency**: Steps should be runnable multiple times without side effects
5. **Realistic Delays**: Add small delays between steps to simulate real user timing
