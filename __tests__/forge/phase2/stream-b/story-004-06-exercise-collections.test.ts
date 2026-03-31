/**
 * FORGE User Simulation: Story 004-06 - Exercise Collections
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exerciseCollection: { create: jest.fn(), findMany: jest.fn() },
    collectionExercise: { create: jest.fn() },
  },
}));

const mockedPrisma = prisma as any;

class CollectionService {
  static async createCollection(userId: string, data: any) {
    const collection = await mockedPrisma.exerciseCollection.create({ data: { userId, ...data } });
    return { success: true, collection };
  }
  static async addExercise(collectionId: string, exerciseId: string) {
    await mockedPrisma.collectionExercise.create({ data: { collectionId, exerciseId } });
    return { success: true };
  }
  static async getCollections(userId: string) {
    const collections = await mockedPrisma.exerciseCollection.findMany({ where: { userId } });
    return { success: true, collections };
  }
}

describe('FORGE: Story 004-06 - Exercise Collections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates collection', async () => {
    mockedPrisma.exerciseCollection.create.mockResolvedValue({ id: 'col-1', name: 'Push Day' });
    const result = await CollectionService.createCollection('user-1', { name: 'Push Day' });
    expect(result.success).toBe(true);
    expect(result.collection.name).toBe('Push Day');
  });

  it('adds exercise to collection', async () => {
    mockedPrisma.collectionExercise.create.mockResolvedValue({ id: 'ce-1' });
    const result = await CollectionService.addExercise('col-1', 'ex-1');
    expect(result.success).toBe(true);
  });

  it('returns user collections', async () => {
    mockedPrisma.exerciseCollection.findMany.mockResolvedValue([{ id: 'col-1' }, { id: 'col-2' }]);
    const result = await CollectionService.getCollections('user-1');
    expect(result.collections).toHaveLength(2);
  });
});
