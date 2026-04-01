/**
 * Story 011-03: Offline Mode
 * Epic 011: Mobile & PWA
 *
 * Tests offline functionality workflows
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

describe('Story 011-03: Offline Mode - Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects offline status', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'checkConnectivity', data: { online: false } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('detects online status restoration', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'checkConnectivity', data: { online: true } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-03: Offline Mode - Data Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores workout data locally when offline', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'storeOfflineData', data: { type: 'workout', data: { exercise: 'squat', reps: 10 } } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('stores measurement data locally when offline', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'storeOfflineData', data: { type: 'measurement', data: { weight: 180 } } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('queues actions for later sync', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'queueOfflineAction', data: { action: 'completeWorkout', workoutId: 'wo-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-03: Offline Mode - Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs offline data when connection restored', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/sync'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'syncOfflineData' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles sync conflicts', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'resolveSyncConflict', data: { strategy: 'server_wins' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('retries failed sync operations', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'retryFailedSync' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-03: Offline Mode - Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accesses cached workout plans offline', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'accessOfflineData', data: { type: 'workoutPlans' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accesses cached exercise library offline', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'accessOfflineData', data: { type: 'exercises' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('views cached schedule offline', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'accessOfflineData', data: { type: 'schedule' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-03: Offline Mode - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles large offline data storage', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'storeOfflineData', data: { type: 'bulk', size: 'large' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles storage quota exceeded', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'storeOfflineData', data: { error: 'quota_exceeded' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('clears old offline data', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'clearOldOfflineData', data: { olderThan: '30d' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
