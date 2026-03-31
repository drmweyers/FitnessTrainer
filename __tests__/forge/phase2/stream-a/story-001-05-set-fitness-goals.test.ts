/**
 * Story 001-05: Set Fitness Goals
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-05: Set Fitness Goals', () => {
  it('creates single fitness goal', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'setFitnessGoals',
          data: {
            goalType: 'WEIGHT_LOSS',
            specificGoal: 'Lose 20 lbs',
            targetValue: 20,
            unit: 'lbs',
            targetDate: '2026-12-31',
            priority: 1,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.goalsSet).toBe(true);
    expect(result.data.goalCount).toBe(1);
  });

  it('creates multiple fitness goals', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'setFitnessGoals',
          data: {
            goals: [
              { goalType: 'WEIGHT_LOSS', specificGoal: 'Lose 20 lbs', targetValue: 20, unit: 'lbs', priority: 1 },
              { goalType: 'MUSCLE_GAIN', specificGoal: 'Gain 10 lbs muscle', targetValue: 10, unit: 'lbs', priority: 2 },
              { goalType: 'ENDURANCE', specificGoal: 'Run 5K', targetValue: 5, unit: 'km', priority: 3 },
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.goalCount).toBe(3);
  });

  it('assigns goal priorities correctly', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'setFitnessGoals',
          data: {
            goals: [
              { goalType: 'STRENGTH', specificGoal: 'Bench 200', targetValue: 200, unit: 'lbs', priority: 1 },
              { goalType: 'FLEXIBILITY', specificGoal: 'Touch toes', targetValue: 1, unit: 'boolean', priority: 2 },
            ],
          },
        },
      ],
    });
    expect(result.data.goals[0].priority).toBe(1);
    expect(result.data.goals[1].priority).toBe(2);
  });

  it('initializes goal progress at 0%', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'setFitnessGoals',
          data: { goalType: 'GENERAL_FITNESS', specificGoal: 'Get fit', targetValue: 100, unit: 'percent', priority: 1 },
        },
      ],
    });
    expect(result.data.goals[0].progressPercentage).toBe(0);
    expect(result.data.goals[0].isActive).toBe(true);
  });

  it('accepts custom goal types', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'setFitnessGoals',
          data: { goalType: 'CUSTOM', specificGoal: 'Climb Mount Everest', targetValue: 1, unit: 'achievement', priority: 1 },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.goals[0].goalType).toBe('CUSTOM');
  });
});
