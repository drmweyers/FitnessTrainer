/**
 * Story 002-06: Social Login
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-06: Social Login', () => {
  it('registers with Google OAuth', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        {
          action: 'register',
          data: {
            provider: 'google',
            idToken: 'google-id-token',
            email: trainer.email,
            role: 'trainer',
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.registrationSuccess).toBe(true);
  });

  it('registers with Apple Sign In', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        {
          action: 'register',
          data: {
            provider: 'apple',
            idToken: 'apple-id-token',
            email: client.email,
            role: 'client',
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.registrationSuccess).toBe(true);
  });

  it('links social account to existing user', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { email: trainer.email, password: trainer.password } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'updateProfile',
          data: {
            linkedAccounts: [{ provider: 'google', email: trainer.email }],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileUpdated).toBe(true);
  });
});
