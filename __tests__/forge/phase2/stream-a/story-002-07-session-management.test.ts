/**
 * Story 002-07: Session Management
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-07: Session Management', () => {
  it('creates session on login', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBeDefined();
  });

  it('refreshes access token', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
        { action: 'refreshToken', data: {} },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.tokenRefreshed).toBe(true);
  });

  it('logs out and clears session', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
        { action: 'logout', data: {} },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.loggedOut).toBe(true);
  });

  it('maintains session across multiple requests', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test' } },
        { action: 'updateProfile', data: { bio: 'Updated' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.stepsCompleted).toBe(3);
  });

  it('handles concurrent session operations', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
        { action: 'refreshToken', data: {} },
        { action: 'refreshToken', data: {} },
      ],
    });
    expect(result.success).toBe(true);
  });
});
