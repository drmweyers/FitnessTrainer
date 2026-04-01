/**
 * Story 012-04: Monitor System Health
 * Epic 012: Admin Dashboard
 *
 * Tests admin system health monitoring workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/middleware/admin', () => ({
  authenticateAdmin: jest.fn(),
}));

import { authenticateAdmin } from '@/lib/middleware/admin';

const mockedAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 012-04: System Health - Overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views system health status', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSystemHealth' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views database health', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health/database'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewDatabaseHealth' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views API health', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health/api'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewApiHealth' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-04: System Health - Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views response times', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health/performance'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewResponseTimes' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views error rates', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health/errors'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewErrorRates' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views resource usage', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health/resources'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewResourceUsage' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-04: System Health - Alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views active alerts', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/alerts'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewActiveAlerts' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin acknowledges alert', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/alerts/alert-1'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'acknowledgeAlert', data: { alertId: 'alert-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin configures alert thresholds', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/alerts/config'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'configureAlerts', data: { cpuThreshold: 80, memoryThreshold: 90 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-04: System Health - Logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views system logs', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/logs'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSystemLogs' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin searches logs', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/logs?search=error'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'searchLogs', data: { query: 'error' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin exports logs', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/logs/export'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'exportLogs', data: { format: 'json', startDate: '2026-04-01' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-04: System Health - Maintenance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin schedules maintenance window', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/maintenance'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'scheduleMaintenance', data: { start: '2026-04-10T02:00:00Z', duration: 120 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin runs health check', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/health/check'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'runHealthCheck' },
      ],
    });

    expect(result.success).toBe(true);
  });
});
