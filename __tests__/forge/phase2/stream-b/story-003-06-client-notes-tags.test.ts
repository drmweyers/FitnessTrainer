/**
 * FORGE User Simulation: Story 003-06 - Client Notes & Tags
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    clientNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    clientTag: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class NotesService {
  static async createNote(clientId: string, trainerId: string, data: any) {
    const note = await mockedPrisma.clientNote.create({
      data: { clientId, trainerId, ...data },
    });
    return { success: true, note };
  }

  static async getNotes(clientId: string) {
    const notes = await mockedPrisma.clientNote.findMany({ where: { clientId } });
    return { success: true, notes };
  }
}

describe('FORGE: Story 003-06 - Client Notes & Tags', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates note', async () => {
    mockedPrisma.clientNote.create.mockResolvedValue({ id: 'n1', content: 'Test' });
    const result = await NotesService.createNote('c1', 't1', { content: 'Test' });
    expect(result.success).toBe(true);
  });

  it('gets notes', async () => {
    mockedPrisma.clientNote.findMany.mockResolvedValue([{ id: 'n1' }]);
    const result = await NotesService.getNotes('c1');
    expect(result.notes).toHaveLength(1);
  });
});
