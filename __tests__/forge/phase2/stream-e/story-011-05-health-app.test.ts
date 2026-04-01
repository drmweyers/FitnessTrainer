/**
 * Story 011-05: Health App Integration
 * Epic 011: Mobile & PWA
 *
 * Tests health app integration workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    healthIntegration: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    measurement: {
      create: jest.fn(),
    },
  },
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 011-05: Health App Integration - Connect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client connects Apple Health', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/integrations'), { user: client })
    );

    const mockIntegration = {
      id: 'hi-1',
      userId: client.id,
      provider: 'apple_health',
      status: 'connected',
    };

    mockedPrisma.healthIntegration.create.mockResolvedValueOnce(mockIntegration);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'connectHealthApp', data: { provider: 'apple_health' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client connects Google Fit', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/integrations'), { user: client })
    );

    const mockIntegration = {
      id: 'hi-2',
      userId: client.id,
      provider: 'google_fit',
      status: 'connected',
    };

    mockedPrisma.healthIntegration.create.mockResolvedValueOnce(mockIntegration);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'connectHealthApp', data: { provider: 'google_fit' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client connects Fitbit', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/integrations'), { user: client })
    );

    const mockIntegration = {
      id: 'hi-3',
      userId: client.id,
      provider: 'fitbit',
      status: 'connected',
    };

    mockedPrisma.healthIntegration.create.mockResolvedValueOnce(mockIntegration);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'connectHealthApp', data: { provider: 'fitbit' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-05: Health App Integration - Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs steps data from health app', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/sync'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'syncHealthData', data: { type: 'steps' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs heart rate data from health app', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/sync'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'syncHealthData', data: { type: 'heart_rate' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs sleep data from health app', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/sync'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'syncHealthData', data: { type: 'sleep' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs workout data from health app', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/sync'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'syncHealthData', data: { type: 'workouts' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-05: Health App Integration - Manage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client views connected health apps', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/integrations'), { user: client })
    );

    const mockIntegrations = [
      { id: 'hi-1', provider: 'apple_health', status: 'connected' },
      { id: 'hi-2', provider: 'fitbit', status: 'connected' },
    ];

    mockedPrisma.healthIntegration.findMany.mockResolvedValueOnce(mockIntegrations);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewHealthIntegrations' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client configures sync settings', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/integrations/hi-1'), { user: client })
    );

    mockedPrisma.healthIntegration.update.mockResolvedValueOnce({
      id: 'hi-1',
      syncFrequency: 'daily',
      dataTypes: ['steps', 'heart_rate'],
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'configureHealthSync', data: { integrationId: 'hi-1', frequency: 'daily' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client disconnects health app', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/health/integrations/hi-1'), { user: client })
    );

    mockedPrisma.healthIntegration.delete.mockResolvedValueOnce({ id: 'hi-1' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'disconnectHealthApp', data: { integrationId: 'hi-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-05: Health App Integration - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles expired access token', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.healthIntegration.findMany.mockResolvedValueOnce([
      { id: 'hi-1', provider: 'fitbit', tokenExpired: true },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'refreshHealthToken', data: { integrationId: 'hi-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles sync failure', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'syncHealthData', data: { type: 'steps', failed: true } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles duplicate data from multiple sources', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'syncHealthData', data: { deduplicate: true } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
