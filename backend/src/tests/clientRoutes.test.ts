import request from 'supertest';
import express from 'express';
import { clientRoutes } from '../routes/clientRoutes';

// Mock token service - must be declared before jest.mock
const mockTokenService = {
  verifyAccessToken: jest.fn(),
  isTokenBlacklisted: jest.fn(),
};

// Mock Prisma
const mockPrismaClientClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  trainerClient: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  clientInvitation: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  clientProfile: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
};

// Mock the Prisma client instance
jest.mock('../index', () => ({
  prisma: mockPrismaClientClient,
  redis: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

// Mock token service
jest.mock('../services/tokenService', () => ({
  tokenService: mockTokenService,
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/clients', clientRoutes);

describe('Client Routes', () => {
  let trainerToken: string;
  let clientToken: string;
  const trainerId = 'trainer-123';
  const clientId = 'client-123';

  beforeAll(() => {
    // Create mock tokens
    trainerToken = 'Bearer valid-trainer-token';
    clientToken = 'Bearer valid-client-token';

    // Mock token verification
    mockTokenService.verifyAccessToken.mockImplementation((token: string) => {
      if (token === 'valid-trainer-token') {
        return {
          sub: trainerId,
          email: 'trainer@test.com',
          role: 'trainer' as const,
          jti: 'token-id-123',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 900 // 15 minutes
        };
      }
      if (token === 'valid-client-token') {
        return {
          sub: clientId,
          email: 'client@test.com',
          role: 'client' as const,
          jti: 'token-id-456',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 900
        };
      }
      throw new Error('Invalid token');
    });

    mockTokenService.isTokenBlacklisted.mockResolvedValue(false);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user lookups for authentication
    mockPrismaClientClient.user.findUnique.mockImplementation((args: any) => {
      if (args.where.id === trainerId) {
        return Promise.resolve({
          id: trainerId,
          email: 'trainer@test.com',
          role: 'trainer',
          isActive: true,
          isVerified: true,
          deletedAt: null
        });
      }
      if (args.where.id === clientId) {
        return Promise.resolve({
          id: clientId,
          email: 'client@test.com',
          role: 'client',
          isActive: true,
          isVerified: true,
          deletedAt: null
        });
      }
      return Promise.resolve(null);
    });
  });

  describe('GET /api/clients', () => {
    it('should return all clients for trainer', async () => {
      // Mock trainer-client relationships
      mockPrismaClientClient.trainerClient.findMany.mockResolvedValue([
        {
          id: 'relation-1',
          trainerId,
          clientId: 'client-1',
          status: 'active',
          connectedAt: new Date(),
          client: {
            id: 'client-1',
            email: 'client1@test.com',
            userProfile: null,
            clientProfile: null,
            tagAssignments: []
          }
        }
      ]);

      mockPrismaClientClient.trainerClient.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', trainerToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(1);
      expect(response.body.data.pagination.totalCount).toBe(1);
    });

    it('should filter clients by status', async () => {
      mockPrismaClientClient.trainerClient.findMany.mockResolvedValue([]);
      mockPrismaClientClient.trainerClient.count.mockResolvedValue(0);

      await request(app)
        .get('/api/clients?status=active')
        .set('Authorization', trainerToken)
        .expect(200);

      expect(mockPrismaClientClient.trainerClient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            trainerId,
            status: 'active'
          })
        })
      );
    });

    it('should require trainer authentication', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(401);

      expect(response.body.error).toContain('Access token required');
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return specific client details', async () => {
      const mockClient = {
        id: 'relation-1',
        trainerId,
        clientId: 'client-1',
        status: 'active',
        client: {
          id: 'client-1',
          email: 'client1@test.com',
          userProfile: { bio: 'Test bio' },
          clientProfile: { fitnessLevel: 'intermediate' },
          userMeasurements: [],
          userGoals: [],
          progressPhotos: [],
          tagAssignments: []
        }
      };

      mockPrismaClientClient.trainerClient.findUnique.mockResolvedValue(mockClient);

      const response = await request(app)
        .get('/api/clients/client-1')
        .set('Authorization', trainerToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client.id).toBe('client-1');
    });

    it('should return 404 for non-existent client', async () => {
      mockPrismaClientClient.trainerClient.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/clients/non-existent')
        .set('Authorization', trainerToken)
        .expect(404);

      expect(response.body.error).toBe('Client not found');
    });
  });

  describe('POST /api/clients/invite', () => {
    it('should send client invitation', async () => {
      const mockInvitation = {
        id: 'invite-123',
        trainerId,
        clientEmail: 'newclient@test.com',
        token: 'invite-token-123',
        status: 'pending',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        trainer: {
          id: trainerId,
          userProfile: { bio: 'Trainer bio' }
        }
      };

      // Mock no existing invitation
      mockPrismaClientClient.clientInvitation.findFirst.mockResolvedValue(null);
      // Mock no existing client
      mockPrismaClientClient.user.findUnique.mockResolvedValue(null);
      // Mock no existing relationship
      mockPrismaClientClient.trainerClient.findUnique.mockResolvedValue(null);
      // Mock invitation creation
      mockPrismaClientClient.clientInvitation.create.mockResolvedValue(mockInvitation);

      const response = await request(app)
        .post('/api/clients/invite')
        .set('Authorization', trainerToken)
        .send({
          clientEmail: 'newclient@test.com',
          customMessage: 'Welcome to my training program!'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientEmail).toBe('newclient@test.com');
      expect(response.body.message).toBe('Client invitation sent successfully');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/clients/invite')
        .set('Authorization', trainerToken)
        .send({
          clientEmail: 'invalid-email',
          customMessage: 'Test'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid invitation data');
    });
  });

  describe('POST /api/clients', () => {
    it('should create new client directly', async () => {
      const mockClient = {
        id: 'client-new',
        email: 'directclient@test.com',
        role: 'client',
        isActive: true,
        isVerified: false
      };

      const mockTrainerClient = {
        id: 'relation-new',
        trainerId,
        clientId: 'client-new',
        status: 'active',
        connectedAt: new Date(),
        client: {
          ...mockClient,
          userProfile: null,
          clientProfile: {
            fitnessLevel: 'beginner'
          }
        }
      };

      // Mock no existing client
      mockPrismaClientClient.user.findUnique.mockResolvedValue(null);
      // Mock client creation
      mockPrismaClientClient.user.create.mockResolvedValue(mockClient);
      // Mock client profile creation
      mockPrismaClientClient.clientProfile.create.mockResolvedValue({});
      // Mock trainer-client relationship creation
      mockPrismaClientClient.trainerClient.create.mockResolvedValue(mockTrainerClient);

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', trainerToken)
        .send({
          email: 'directclient@test.com',
          fitnessLevel: 'beginner'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.client.email).toBe('directclient@test.com');
      expect(response.body.message).toBe('Client created successfully');
    });

    it('should validate required email field', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', trainerToken)
        .send({
          firstName: 'John'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid client data');
    });
  });

  describe('PUT /api/clients/:id/status', () => {
    it('should update client status', async () => {
      const mockUpdatedClient = {
        id: 'relation-1',
        trainerId,
        clientId: 'client-1',
        status: 'archived',
        archivedAt: new Date(),
        client: {
          id: 'client-1',
          email: 'client1@test.com',
          userProfile: null,
          clientProfile: null
        }
      };

      mockPrismaClientClient.trainerClient.update.mockResolvedValue(mockUpdatedClient);

      const response = await request(app)
        .put('/api/clients/client-1/status')
        .set('Authorization', trainerToken)
        .send({
          status: 'archived'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('archived');
      expect(response.body.message).toBe('Client status updated successfully');
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .put('/api/clients/client-1/status')
        .set('Authorization', trainerToken)
        .send({
          status: 'invalid-status'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid status data');
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should archive client (soft delete)', async () => {
      const mockArchivedClient = {
        id: 'relation-1',
        trainerId,
        clientId: 'client-1',
        status: 'archived',
        archivedAt: new Date(),
        client: {
          id: 'client-1',
          email: 'client1@test.com'
        }
      };

      mockPrismaClientClient.trainerClient.update.mockResolvedValue(mockArchivedClient);

      const response = await request(app)
        .delete('/api/clients/client-1')
        .set('Authorization', trainerToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('archived');
      expect(response.body.message).toBe('Client archived successfully');
    });
  });

  describe('POST /api/clients/invitations/accept', () => {
    it('should allow client to accept invitation', async () => {
      const mockInvitation = {
        id: 'invite-123',
        trainerId: 'trainer-456',
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      const mockTrainerClient = {
        id: 'relation-new',
        trainerId: 'trainer-456',
        clientId,
        status: 'active',
        connectedAt: new Date(),
        client: {
          id: clientId,
          email: 'client@test.com',
          userProfile: null,
          clientProfile: null
        },
        trainer: {
          id: 'trainer-456',
          userProfile: { bio: 'Trainer' }
        }
      };

      // Mock invitation lookup
      mockPrismaClientClient.clientInvitation.findUnique.mockResolvedValue(mockInvitation);
      // Mock invitation update
      mockPrismaClientClient.clientInvitation.update.mockResolvedValue({});
      // Mock trainer-client relationship creation
      mockPrismaClientClient.trainerClient.create.mockResolvedValue(mockTrainerClient);

      const response = await request(app)
        .post('/api/clients/invitations/accept')
        .set('Authorization', clientToken)
        .send({
          token: 'valid-invite-token'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Invitation accepted successfully');
    });

    it('should reject invalid invitation token', async () => {
      // Mock no invitation found
      mockPrismaClientClient.clientInvitation.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/clients/invitations/accept')
        .set('Authorization', clientToken)
        .send({
          token: 'invalid-token'
        })
        .expect(500);

      expect(response.body.error).toBe('Failed to accept invitation');
    });
  });

  describe('Authorization', () => {
    it('should deny access to clients trying to manage other clients', async () => {
      // Mock client user lookup
      mockPrismaClientClient.user.findUnique.mockImplementation((args) => {
        if (args.where.id === clientId) {
          return Promise.resolve({
            id: clientId,
            email: 'client@test.com',
            role: 'client',
            isActive: true,
            isVerified: true,
            deletedAt: null
          });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', clientToken)
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny access without authentication token', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(401);

      expect(response.body.error).toContain('Access token required');
    });
  });
});