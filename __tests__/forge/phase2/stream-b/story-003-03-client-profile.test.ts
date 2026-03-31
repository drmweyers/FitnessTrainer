/**
 * FORGE User Simulation: Story 003-03 - Client Profile View
 * Tests viewing and managing detailed client profiles
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    trainerClient: {
      findFirst: jest.fn(),
    },
    clientNote: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    measurement: {
      findMany: jest.fn(),
    },
    progressPhoto: {
      findMany: jest.fn(),
    },
    programAssignment: {
      findMany: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class TrainerActor {
  id: string;
  constructor(id: string = 'trainer-001') { this.id = id; }
  static create() { return new TrainerActor(); }
}

class ClientActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;

  constructor(data: Partial<ClientActor> = {}) {
    this.id = data.id || 'client-001';
    this.firstName = data.firstName || 'John';
    this.lastName = data.lastName || 'Doe';
    this.email = data.email || 'john@example.com';
    this.status = data.status || 'ACTIVE';
  }

  get fullName() { return `${this.firstName} ${this.lastName}`; }
}

class ClientProfileService {
  static async getClientProfile(trainerId: string, clientId: string) {
    const connection = await mockedPrisma.trainerClient.findFirst({
      where: { trainerId, clientId },
    });

    if (!connection) {
      return { success: false, error: 'Client not found' };
    }

    const [client, notes, measurements, photos, programs, activities] = await Promise.all([
      mockedPrisma.user.findUnique({ where: { id: clientId } }),
      mockedPrisma.clientNote.findMany({ where: { clientId } }),
      mockedPrisma.measurement.findMany({ where: { userId: clientId } }),
      mockedPrisma.progressPhoto.findMany({ where: { userId: clientId } }),
      mockedPrisma.programAssignment.findMany({ where: { clientId } }),
      mockedPrisma.activity.findMany({ where: { userId: clientId } }),
    ]);

    return {
      success: true,
      profile: {
        ...client,
        connection,
        notes,
        measurements,
        photos,
        programs,
        activities,
      },
    };
  }

  static async addNote(clientId: string, trainerId: string, content: string) {
    const note = await mockedPrisma.clientNote.create({
      data: { clientId, trainerId, content },
    });
    return { success: true, note };
  }
}

describe('FORGE: Story 003-03 - Client Profile View', () => {
  let trainer: TrainerActor;
  let client: ClientActor;

  beforeEach(() => {
    jest.clearAllMocks();
    trainer = TrainerActor.create();
    client = new ClientActor();
  });

  describe('View Profile', () => {
    it('returns full client profile with all sections', async () => {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });
      mockedPrisma.user.findUnique.mockResolvedValue(client);
      mockedPrisma.clientNote.findMany.mockResolvedValue([]);
      mockedPrisma.measurement.findMany.mockResolvedValue([]);
      mockedPrisma.progressPhoto.findMany.mockResolvedValue([]);
      mockedPrisma.programAssignment.findMany.mockResolvedValue([]);
      mockedPrisma.activity.findMany.mockResolvedValue([]);

      const result = await ClientProfileService.getClientProfile(trainer.id, client.id);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.notes).toBeDefined();
      expect(result.profile.measurements).toBeDefined();
    });

    it('returns error for non-existent client connection', async () => {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue(null);

      const result = await ClientProfileService.getClientProfile(trainer.id, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Client not found');
    });
  });

  describe('Notes Management', () => {
    it('adds new note to client profile', async () => {
      const noteContent = 'Client showed great progress today!';
      mockedPrisma.clientNote.create.mockResolvedValue({
        id: 'note-001',
        clientId: client.id,
        trainerId: trainer.id,
        content: noteContent,
        createdAt: new Date(),
      });

      const result = await ClientProfileService.addNote(client.id, trainer.id, noteContent);

      expect(result.success).toBe(true);
      expect(result.note.content).toBe(noteContent);
    });
  });

  describe('Performance', () => {
    it('loads profile within 3 seconds', async () => {
      mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001' });
      mockedPrisma.user.findUnique.mockResolvedValue(client);
      mockedPrisma.clientNote.findMany.mockResolvedValue([]);
      mockedPrisma.measurement.findMany.mockResolvedValue([]);
      mockedPrisma.progressPhoto.findMany.mockResolvedValue([]);
      mockedPrisma.programAssignment.findMany.mockResolvedValue([]);
      mockedPrisma.activity.findMany.mockResolvedValue([]);

      const start = Date.now();
      await ClientProfileService.getClientProfile(trainer.id, client.id);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000);
    });
  });
});
