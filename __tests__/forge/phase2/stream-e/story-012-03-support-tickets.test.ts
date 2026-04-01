/**
 * Story 012-03: Handle Support Tickets
 * Epic 012: Admin Dashboard
 *
 * Tests admin support ticket workflows
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

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    supportTicket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketReply: {
      create: jest.fn(),
    },
  },
}));

import { authenticateAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 012-03: Support Tickets - List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views all support tickets', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets'), { user: admin })
    );

    const mockTickets = [
      { id: 't1', subject: 'Login issue', status: 'OPEN', priority: 'HIGH' },
      { id: 't2', subject: 'Payment question', status: 'IN_PROGRESS', priority: 'MEDIUM' },
    ];

    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce(mockTickets);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSupportTickets' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin filters tickets by status', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets?status=OPEN'), { user: admin })
    );

    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce([
      { id: 't1', status: 'OPEN' },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSupportTickets', data: { filter: { status: 'OPEN' } } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin filters tickets by priority', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets?priority=URGENT'), { user: admin })
    );

    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce([
      { id: 't3', priority: 'URGENT' },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSupportTickets', data: { filter: { priority: 'URGENT' } } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-03: Support Tickets - Respond', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views ticket details', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/t1'), { user: admin })
    );

    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce({
      id: 't1',
      subject: 'Login issue',
      message: 'Cannot login to my account',
      status: 'OPEN',
      replies: [],
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewTicketDetails', data: { ticketId: 't1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin replies to ticket', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/t1'), { user: admin })
    );

    mockedPrisma.ticketReply.create.mockResolvedValueOnce({
      id: 'r1',
      ticketId: 't1',
      message: 'We are looking into this issue',
      isAdmin: true,
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'replyToTicket', data: { ticketId: 't1', message: 'We are looking into this issue' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin assigns ticket to themselves', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/t1'), { user: admin })
    );

    mockedPrisma.supportTicket.update.mockResolvedValueOnce({
      id: 't1',
      assignedTo: admin.id,
      status: 'IN_PROGRESS',
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'assignTicket', data: { ticketId: 't1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin closes resolved ticket', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/t1'), { user: admin })
    );

    mockedPrisma.supportTicket.update.mockResolvedValueOnce({
      id: 't1',
      status: 'CLOSED',
      resolvedAt: new Date(),
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'closeTicket', data: { ticketId: 't1', resolution: 'Issue resolved' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-03: Support Tickets - Escalation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin escalates ticket priority', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/t1'), { user: admin })
    );

    mockedPrisma.supportTicket.update.mockResolvedValueOnce({
      id: 't1',
      priority: 'URGENT',
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'escalateTicket', data: { ticketId: 't1', priority: 'URGENT' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin escalates to developer', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/t1/escalate'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'escalateToDev', data: { ticketId: 't1', reason: 'Bug report' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-03: Support Tickets - Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views ticket metrics', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/metrics'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewTicketMetrics' },
      ],
    });

    expect(result.success).toBe(true);
  });
});
