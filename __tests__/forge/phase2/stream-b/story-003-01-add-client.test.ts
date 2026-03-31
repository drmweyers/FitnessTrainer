/**
 * FORGE User Simulation: Story 003-01 - Add New Client
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    trainerClient: { findFirst: jest.fn(), create: jest.fn() },
    clientInvitation: { create: jest.fn() },
  },
}));

jest.mock('@/lib/services/email', () => ({ sendEmail: jest.fn() }));

const mockedPrisma = prisma as any;
const { sendEmail } = require('@/lib/services/email');

class WorkflowRunner {
  static async runInviteClientWorkflow(trainer: any, clientData: any) {
    const existingUser = await mockedPrisma.user.findUnique({ where: { email: clientData.email } });
    if (existingUser) {
      const existingConnection = await mockedPrisma.trainerClient.findFirst({
        where: { trainerId: trainer.id, clientId: existingUser.id },
      });
      if (existingConnection) return { success: false, error: 'Client already connected' };
    }
    const invitation = await mockedPrisma.clientInvitation.create({
      data: { trainerId: trainer.id, clientEmail: clientData.email, status: 'PENDING' },
    });
    await sendEmail({ to: clientData.email, subject: 'Invitation', body: 'Join us!' });
    return { success: true, invitation };
  }

  static async runManualAddWorkflow(trainer: any, clientData: any) {
    const existingUser = await mockedPrisma.user.findUnique({ where: { email: clientData.email } });
    if (existingUser) return { success: false, error: 'Email already registered' };
    const newClient = await mockedPrisma.user.create({ data: { ...clientData, role: 'CLIENT' } });
    const connection = await mockedPrisma.trainerClient.create({
      data: { trainerId: trainer.id, clientId: newClient.id, status: 'ACTIVE' },
    });
    return { success: true, client: newClient, connection };
  }
}

describe('FORGE: Story 003-01 - Add New Client', () => {
  const trainer = { id: 'trainer-001', email: 'trainer@test.com', fullName: 'Test Trainer' };

  beforeEach(() => jest.clearAllMocks());

  it('sends invitation to new client', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.clientInvitation.create.mockResolvedValue({ id: 'inv-001', status: 'PENDING' });
    sendEmail.mockResolvedValue({ success: true });

    const result = await WorkflowRunner.runInviteClientWorkflow(trainer, { email: 'new@test.com' });

    expect(result.success).toBe(true);
    expect(result.invitation).toBeDefined();
  });

  it('prevents duplicate invitation', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'client-001' });
    mockedPrisma.trainerClient.findFirst.mockResolvedValue({ id: 'tc-001' });

    const result = await WorkflowRunner.runInviteClientWorkflow(trainer, { email: 'existing@test.com' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Client already connected');
  });

  it('creates client manually', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({ id: 'client-001', email: 'manual@test.com' });
    mockedPrisma.trainerClient.create.mockResolvedValue({ id: 'tc-001', status: 'ACTIVE' });

    const result = await WorkflowRunner.runManualAddWorkflow(trainer, {
      firstName: 'Manual', lastName: 'Client', email: 'manual@test.com'
    });

    expect(result.success).toBe(true);
    expect(result.client).toBeDefined();
    expect(result.connection.status).toBe('ACTIVE');
  });

  it('prevents manual add with duplicate email', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'existing-001' });

    const result = await WorkflowRunner.runManualAddWorkflow(trainer, {
      firstName: 'Duplicate', lastName: 'Client', email: 'exists@test.com'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email already registered');
  });
});
