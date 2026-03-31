/**
 * FORGE User Simulation: Story 003-05 - Client Status Management
 * Tests tracking and managing client status
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    trainerClient: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    statusChange: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class StatusService {
  static async updateStatus(trainerId: string, clientId: string, newStatus: string, reason?: string) {
    const connection = await mockedPrisma.trainerClient.findFirst({
      where: { trainerId, clientId },
    });

    if (!connection) {
      return { success: false, error: 'Client not found' };
    }

    const oldStatus = connection.status;

    await mockedPrisma.statusChange.create({
      data: {
        clientId,
        trainerId,
        oldStatus,
        newStatus,
        reason,
        changedAt: new Date(),
      },
    });

    const updated = await mockedPrisma.trainerClient.update({
      where: { id: connection.id },
      data: { status: newStatus },
    });

    return { success: true, status: updated.status };
  }

  static async bulkUpdateStatus(trainerId: string, clientIds: string[], status: string) {
    const result = await mockedPrisma.trainerClient.updateMany({
      where: {
        trainerId,
        clientId: { in: clientIds },
      },
      data: { status },
    });

    return { success: true, updatedCount: result.count };
  }

  static async getStatusHistory(clientId: string) {
    const history = await mockedPrisma.statusChange.findMany({
      where: { clientId },
      orderBy: { changedAt: 'desc' },
    });

    return { success: true, history };
  }

  static async getClientsByStatus(trainerId: string, status: string) {
    const clients = await mockedPrisma.trainerClient.findMany({
      where: { trainerId, status },
    });

    return { success: true, clients };
  }
}

describe('FORGE: Story 003-05 - Client Status Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Update Status', () => {
    it('updates client status with history tracking', async () => {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue({
        id: 'tc-001',
        status: 'ACTIVE',
      });
      mockedPrisma.statusChange.create.mockResolvedValue({ id: 'sc-001' });
      mockedPrisma.trainerClient.update.mockResolvedValue({ id: 'tc-001', status: 'OFFLINE' });

      const result = await StatusService.updateStatus('trainer-001', 'client-001', 'OFFLINE', 'Client on vacation');

      expect(result.success).toBe(true);
      expect(result.status).toBe('OFFLINE');
      expect(mockedPrisma.statusChange.create).toHaveBeenCalled();
    });

    it('tracks status change reason', async () => {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });
      mockedPrisma.statusChange.create.mockResolvedValue({ id: 'sc-001' });
      mockedPrisma.trainerClient.update.mockResolvedValue({ id: 'tc-001', status: 'NEED_PROGRAMMING' });

      const reason = 'No program assigned for 14 days';
      await StatusService.updateStatus('trainer-001', 'client-001', 'NEED_PROGRAMMING', reason);

      expect(mockedPrisma.statusChange.create).toHaveBeenCalledWith(
        expect.objectContaining({ reason })
      );
    });
  });

  describe('Bulk Status Update', () => {
    it('updates status for multiple clients', async () => {
      mockedPrisma.trainerClient.updateMany.mockResolvedValue({ count: 5 });

      const result = await StatusService.bulkUpdateStatus('trainer-001', ['c1', 'c2', 'c3', 'c4', 'c5'], 'ARCHIVED');

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(5);
    });
  });

  describe('Status History', () => {
    it('returns status change history', async () => {
      const mockHistory = [
        { id: 'sc-1', oldStatus: 'ACTIVE', newStatus: 'OFFLINE', changedAt: new Date() },
        { id: 'sc-2', oldStatus: 'PENDING', newStatus: 'ACTIVE', changedAt: new Date() },
      ];
      mockedPrisma.statusChange.findMany.mockResolvedValue(mockHistory);

      const result = await StatusService.getStatusHistory('client-001');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
    });
  });

  describe('Filter by Status', () => {
    it('returns clients filtered by status', async () => {
      const mockClients = [
        { id: 'tc-1', clientId: 'c1', status: 'ACTIVE' },
        { id: 'tc-2', clientId: 'c2', status: 'ACTIVE' },
      ];
      mockedPrisma.trainerClient.findMany.mockResolvedValue(mockClients);

      const result = await StatusService.getClientsByStatus('trainer-001', 'ACTIVE');

      expect(result.success).toBe(true);
      expect(result.clients).toHaveLength(2);
    });
  });

  describe('Status Types', () => {
    const validStatuses = ['ACTIVE', 'PENDING', 'OFFLINE', 'NEED_PROGRAMMING', 'ARCHIVED'];

    validStatuses.forEach(status => {
      it(`supports ${status} status`, async () => {
        mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });
        mockedPrisma.statusChange.create.mockResolvedValue({ id: 'sc-001' });
        mockedPrisma.trainerClient.update.mockResolvedValue({ id: 'tc-001', status });

        const result = await StatusService.updateStatus('trainer-001', 'client-001', status);

        expect(result.success).toBe(true);
        expect(result.status).toBe(status);
      });
    });
  });
});
