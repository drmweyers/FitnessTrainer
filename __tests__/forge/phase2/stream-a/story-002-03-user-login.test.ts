/**
 * Story 002-03: User Login
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-03: User Login', () => {
  it('logs in verified trainer successfully', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.loginSuccess).toBe(true);
    expect(result.data.accessToken).toBeDefined();
  });

  it('logs in verified client successfully', async () => {
    const client = ActorFactory.createClient({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'login', data: { email: client.email, password: client.password } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.loginSuccess).toBe(true);
  });

  it('rejects login for unverified user', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: false });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password } },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Email not verified');
  });

  it('rejects login with wrong password', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: 'wrongpassword' } },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Invalid credentials');
  });

  it('supports remember me option', async () => {
    const trainer = ActorFactory.createTrainer({ isVerified: true });
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'login', data: { email: trainer.email, password: trainer.password, rememberMe: true } },
      ],
    });
    expect(result.success).toBe(true);
  });
});
