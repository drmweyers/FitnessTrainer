/**
 * FORGE User Simulation: Story 003-05 - Client Status Management
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    trainerClient: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
    statusChange: { create: jest.fn(), findMany: jest.fn() },
  },
}));

const mockedPrisma = prisma as any;

class StatusService {
  static async updateStatus(trainerId: string, clientId: string, newStatus: string, reason?: string) {
    const connection = await mockedPrisma.trainerClient.findFirst({ where: { trainerId, clientId } });
    if (!connection) return { success: false, error: 'Client not found' };
    const oldStatus = connection.status;
    await mockedPrisma.statusChange.create({
      data: { clientId, trainerId, oldStatus, newStatus, reason, changedAt: new Date() },
    });
    const updated = await mockedPrisma.trainerClient.update({ where: { id: connection.id }, data: { status: newStatus } });
    return { success: true, status: updated.status };
  }

  static async bulkUpdateStatus(trainerId: string, clientIds: string[], status: string) {
    const result = await mockedPrisma.trainerClient.updateMany({
      where: { trainerId, clientId: { in: clientIds } },
      data: { status },
    });
    return { success: true, updatedCount: result.count };
  }

  static async getStatusHistory(clientId: string) {
    const history = await mockedPrisma.statusChange.findMany({ where: { clientId }, orderBy: { changedAt: 'desc' } });
    return { success: true, history };
  }
}

describe('FORGE: Story 003-05 - Client Status Management', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates client status with history', async () => {
    mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });
    mockedPrisma.statusChange.create.mockResolvedValue({ id: 'sc-001' });
    mockedPrisma.trainerClient.update.mockResolvedValue({ id: 'tc-001', status: 'OFFLINE' });

    const result = await StatusService.updateStatus('trainer-001', 'client-001', 'OFFLINE', 'On vacation');

    expect(result.success).toBe(true);
    expect(result.status).toBe('OFFLINE');
    expect(mockedPrisma.statusChange.create).toHaveBeenCalled();
  });

  it('tracks status change reason', async () => {
    mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });
    mockedPrisma.statusChange.create.mockResolvedValue({ id: 'sc-001' });
    mockedPrisma.trainerClient.update.mockResolvedValue({ id: 'tc-001', status: 'NEED_PROGRAMMING' });

    const reason = 'No program assigned';
    await StatusService.updateStatus('trainer-001', 'client-001', 'NEED_PROGRAMMING', reason);

    const createCall = mockedPrisma.statusChange.create.mock.calls[0][0];
    expect(createCall.data.reason).toBe(reason);
  });

  it('bulk updates status', async () => {
    mockedPrisma.trainerClient.updateMany.mockResolvedValue({ count: 5 });

    const result = await StatusService.bulkUpdateStatus('trainer-001', ['c1', 'c2', 'c3', 'c4', 'c5'], 'ARCHIVED');

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(5);
  });

  it('returns status history', async () => {
    mockedPrisma.statusChange.findMany.mockResolvedValue([
      { id: 'sc-1', oldStatus: 'ACTIVE', newStatus: 'OFFLINE' },
      { id: 'sc-2', oldStatus: 'PENDING', newStatus: 'ACTIVE' },
    ]);

    const result = await StatusService.getStatusHistory('client-001');

    expect(result.history).toHaveLength(2);
  });

  const statuses = ['ACTIVE', 'PENDING', 'OFFLINE', 'NEED_PROGRAMMING', 'ARCHIVED'];
  statuses.forEach(status => {
    it(`supports ${status} status`, async () => {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });
      mockedPrisma.statusChange.create.mockResolvedValue({ id: 'sc-001' });
      mockedPrisma.trainerClient.update.mockResolvedValue({ id: 'tc-001', status });

      const result = await StatusService.updateStatus('trainer-001', 'client-001', status);

      expect(result.status).toBe(status);
    });
  });
});
