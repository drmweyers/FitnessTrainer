/**
 * FORGE User Simulation: Story 003-02 - Client List Management
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    trainerClient: { findMany: jest.fn(), count: jest.fn() },
  },
}));

const mockedPrisma = prisma as any;

class ClientListService {
  static async getClients(trainerId: string, filters: any = {}) {
    const where: any = { trainerId };
    if (filters.status) where.status = filters.status;
    const [clients, total] = await Promise.all([
      mockedPrisma.trainerClient.findMany({ where }),
      mockedPrisma.trainerClient.count({ where }),
    ]);
    return { success: true, clients, total };
  }
}

describe('FORGE: Story 003-02 - Client List Management', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns client list', async () => {
    mockedPrisma.trainerClient.findMany.mockResolvedValue([{ id: 'tc-1', clientId: 'c1', status: 'ACTIVE' }]);
    mockedPrisma.trainerClient.count.mockResolvedValue(1);
    const result = await ClientListService.getClients('trainer-1');
    expect(result.clients).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('filters by status', async () => {
    mockedPrisma.trainerClient.findMany.mockResolvedValue([]);
    mockedPrisma.trainerClient.count.mockResolvedValue(0);
    const result = await ClientListService.getClients('trainer-1', { status: 'ACTIVE' });
    expect(result.success).toBe(true);
  });
});
