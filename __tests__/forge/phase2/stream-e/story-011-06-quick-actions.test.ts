/**
 * Story 011-06: Quick Actions
 * Epic 011: Mobile & PWA
 *
 * Tests quick action workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

import { authenticate } from '@/lib/middleware/auth';

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 011-06: Quick Actions - Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client uses quick start workout action', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'quickAction', data: { type: 'start_workout' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses log weight quick action', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'quickAction', data: { type: 'log_weight' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses log meal quick action', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'quickAction', data: { type: 'log_meal' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses message trainer quick action', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'quickAction', data: { type: 'message_trainer' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses view schedule quick action', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'quickAction', data: { type: 'view_schedule' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-06: Quick Actions - Trainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer uses quick schedule session action', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'quickAction', data: { type: 'schedule_session' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer uses message client quick action', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'quickAction', data: { type: 'message_client' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer uses view client progress quick action', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'quickAction', data: { type: 'view_client_progress' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer uses create program quick action', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'quickAction', data: { type: 'create_program' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-06: Quick Actions - Widget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client uses home screen widget', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'widgetAction', data: { widget: 'home', action: 'log_workout' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses lock screen widget', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'widgetAction', data: { widget: 'lock_screen', action: 'start_timer' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses watch complication', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'widgetAction', data: { widget: 'watch', action: 'start_workout' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-06: Quick Actions - Customization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client customizes quick actions', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'customizeQuickActions', data: { actions: ['start_workout', 'log_weight', 'message_trainer'] } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer customizes quick actions', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'customizeQuickActions', data: { actions: ['schedule_session', 'message_client', 'view_analytics'] } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
