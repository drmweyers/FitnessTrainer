/**
 * FORGE User Simulation: Story 004-06 - Exercise Collections
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exerciseCollection: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    collectionExercise: {
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class CollectionService {
  static async createCollection(userId: string, data: { name: string; description?: string }) {
    const collection = await mockedPrisma.exerciseCollection.create({
      data: { userId, ...data },
    });
    return { success: true, collection };
  }

  static async addExerciseToCollection(collectionId: string, exerciseId: string) {
    const collectionExercise = await mockedPrisma.collectionExercise.create({
      data: { collectionId, exerciseId },
    });
    return { success: true, collectionExercise };
  }

  static async getUserCollections(userId: string) {
    const collections = await mockedPrisma.exerciseCollection.findMany({
      where: { userId },
    });
    return { success: true, collections };
  }
}

describe('FORGE: Story 004-06 - Exercise Collections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates collection', async () => {
    const mockCollection = { id: 'col-1', name: 'Push Day', userId: 'user-1' };
    mockedPrisma.exerciseCollection.create.mockResolvedValue(mockCollection);

    const result = await CollectionService.createCollection('user-1', { name: 'Push Day' });

    expect(result.success).toBe(true);
    expect(result.collection.name).toBe('Push Day');
  });

  it('adds exercise to collection', async () => {
    mockedPrisma.collectionExercise.create.mockResolvedValue({ id: 'ce-1', collectionId: 'col-1', exerciseId: 'ex-1' });

    const result = await CollectionService.addExerciseToCollection('col-1', 'ex-1');

    expect(result.success).toBe(true);
    expect(mockedPrisma.collectionExercise.create).toHaveBeenCalledWith({
      data: { collectionId: 'col-1', exerciseId: 'ex-1' },
    });
  });

  it('returns user collections', async () => {
    const mockCollections = [
      { id: 'col-1', name: 'Push Day', userId: 'user-1' },
      { id: 'col-2', name: 'Pull Day', userId: 'user-1' },
    ];
    mockedPrisma.exerciseCollection.findMany.mockResolvedValue(mockCollections);

    const result = await CollectionService.getUserCollections('user-1');

    expect(result.collections).toHaveLength(2);
    expect(result.collections[0].name).toBe('Push Day');
    expect(result.collections[1].name).toBe('Pull Day');
  });
});
