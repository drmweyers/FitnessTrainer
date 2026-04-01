/**
 * FORGE User Simulation: Story 004-06 - Exercise Collections
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
  },
}));

const mockedPrisma = prisma as any;

class CollectionService {
  static async createCollection(userId: string, data: any) {
    return { success: true, collections };
  }
}

describe('FORGE: Story 004-06 - Exercise Collections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates collection', async () => {
    expect(result.success).toBe(true);
    expect(result.collection.name).toBe('Push Day');
  });

  it('adds exercise to collection', async () => {
    mockedPrisma.collectionExercise.create.mockResolvedValue({ id: 'ce-1' });
    expect(result.success).toBe(true);
  });

  it('returns user collections', async () => {
    expect(result.collections).toHaveLength(2);
  });
});
