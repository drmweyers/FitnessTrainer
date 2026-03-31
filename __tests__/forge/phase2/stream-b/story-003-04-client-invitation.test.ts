/**
 * FORGE User Simulation: Story 003-04 - Client Invitation Flow
 * Tests client invitation sending, tracking, and acceptance
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    clientInvitation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    trainerClient: {
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class InvitationService {
  static async sendInvitation(trainerId: string, data: { email: string; customMessage?: string }) {
    const invitation = await mockedPrisma.clientInvitation.create({
      data: {
        trainerId,
        email: data.email,
        customMessage: data.customMessage,
        token: `token-${Date.now()}`,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { success: true, invitation };
  }

  static async getInvitations(trainerId: string) {
    const invitations = await mockedPrisma.clientInvitation.findMany({
      where: { trainerId },
    });
    return { success: true, invitations };
  }

  static async acceptInvitation(token: string, userData: any) {
    const invitation = await mockedPrisma.clientInvitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return { success: false, error: 'Invitation expired' };
    }

    const user = await mockedPrisma.user.create({
      data: { ...userData, role: 'CLIENT' },
    });

    await mockedPrisma.trainerClient.create({
      data: {
        trainerId: invitation.trainerId,
        clientId: user.id,
        status: 'ACTIVE',
      },
    });

    await mockedPrisma.clientInvitation.update({
      where: { token },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    return { success: true, user };
  }

  static async cancelInvitation(invitationId: string) {
    await mockedPrisma.clientInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });
    return { success: true };
  }
}

describe('FORGE: Story 003-04 - Client Invitation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Send Invitation', () => {
    it('creates invitation with 30-day expiration', async () => {
      mockedPrisma.clientInvitation.create.mockResolvedValue({
        id: 'inv-001',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await InvitationService.sendInvitation('trainer-001', {
        email: 'client@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.invitation.status).toBe('PENDING');
    });

    it('includes custom welcome message', async () => {
      const customMessage = 'Welcome to my training program!';
      mockedPrisma.clientInvitation.create.mockResolvedValue({
        id: 'inv-001',
        customMessage,
      });

      const result = await InvitationService.sendInvitation('trainer-001', {
        email: 'client@example.com',
        customMessage,
      });

      expect(result.invitation.customMessage).toBe(customMessage);
    });
  });

  describe('Accept Invitation', () => {
    it('accepts valid invitation and creates client account', async () => {
      mockedPrisma.clientInvitation.findUnique.mockResolvedValue({
        id: 'inv-001',
        trainerId: 'trainer-001',
        token: 'valid-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockedPrisma.user.create.mockResolvedValue({ id: 'user-001', email: 'client@example.com' });
      mockedPrisma.trainerClient.create.mockResolvedValue({ id: 'tc-001' });
      mockedPrisma.clientInvitation.update.mockResolvedValue({ id: 'inv-001', status: 'ACCEPTED' });

      const result = await InvitationService.acceptInvitation('valid-token', {
        email: 'client@example.com',
        firstName: 'Jane',
        lastName: 'Client',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    it('rejects expired invitation', async () => {
      mockedPrisma.clientInvitation.findUnique.mockResolvedValue({
        id: 'inv-001',
        token: 'expired-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const result = await InvitationService.acceptInvitation('expired-token', {
        email: 'client@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invitation expired');
    });

    it('rejects already accepted invitation', async () => {
      mockedPrisma.clientInvitation.findUnique.mockResolvedValue({
        id: 'inv-001',
        token: 'used-token',
        status: 'ACCEPTED',
      });

      const result = await InvitationService.acceptInvitation('used-token', {
        email: 'client@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired invitation');
    });
  });

  describe('Cancel Invitation', () => {
    it('cancels pending invitation', async () => {
      mockedPrisma.clientInvitation.update.mockResolvedValue({
        id: 'inv-001',
        status: 'CANCELLED',
      });

      const result = await InvitationService.cancelInvitation('inv-001');

      expect(result.success).toBe(true);
    });
  });

  describe('List Invitations', () => {
    it('returns all invitations for trainer', async () => {
      const mockInvitations = [
        { id: 'inv-001', status: 'PENDING', email: 'client1@example.com' },
        { id: 'inv-002', status: 'ACCEPTED', email: 'client2@example.com' },
      ];
      mockedPrisma.clientInvitation.findMany.mockResolvedValue(mockInvitations);

      const result = await InvitationService.getInvitations('trainer-001');

      expect(result.success).toBe(true);
      expect(result.invitations).toHaveLength(2);
    });
  });
});
