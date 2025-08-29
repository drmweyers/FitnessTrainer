import { PrismaClient, ClientStatus, InvitationStatus, FitnessLevel } from '@prisma/client';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { emailService } from './emailService';

const prisma = new PrismaClient();

export interface ClientInviteData {
  trainerId: string;
  clientEmail: string;
  customMessage?: string;
}

export interface ClientCreateData {
  trainerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fitnessLevel?: FitnessLevel;
  goals?: any;
  preferences?: any;
  emergencyContact?: any;
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
}

export interface ClientUpdateData {
  status?: ClientStatus;
  fitnessLevel?: FitnessLevel;
  goals?: any;
  preferences?: any;
  emergencyContact?: any;
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
}

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'dateAdded' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ClientService {
  /**
   * Get all clients for a trainer with filtering and pagination
   */
  async getClients(trainerId: string, filters: ClientFilters = {}) {
    const {
      status,
      search,
      tags,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      trainerId,
      ...(status && { status })
    };

    // Add search filter
    if (search) {
      whereClause.client = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          {
            userProfile: {
              OR: [
                { bio: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        ]
      };
    }

    // Add tag filter
    if (tags && tags.length > 0) {
      whereClause.client = {
        ...whereClause.client,
        tagAssignments: {
          some: {
            tagId: { in: tags }
          }
        }
      };
    }

    // Build order clause
    const orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy.client = { email: sortOrder };
        break;
      case 'dateAdded':
        orderBy.connectedAt = sortOrder;
        break;
      case 'lastActivity':
        orderBy.client = { lastLoginAt: sortOrder };
        break;
    }

    const [clients, totalCount] = await Promise.all([
      prisma.trainerClient.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              userProfile: true,
              clientProfile: true,
              tagAssignments: {
                include: {
                  tag: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.trainerClient.count({ where: whereClause })
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Get a specific client by ID
   */
  async getClientById(trainerId: string, clientId: string) {
    const trainerClient = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      },
      include: {
        client: {
          include: {
            userProfile: true,
            clientProfile: true,
            userMeasurements: {
              orderBy: { recordedAt: 'desc' },
              take: 10
            },
            userGoals: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' }
            },
            progressPhotos: {
              where: { isPrivate: false },
              orderBy: { takenAt: 'desc' },
              take: 20
            },
            tagAssignments: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    });

    if (!trainerClient) {
      throw new Error('Client not found or not associated with trainer');
    }

    return trainerClient;
  }

  /**
   * Create a new client invitation
   */
  async inviteClient(inviteData: ClientInviteData) {
    const { trainerId, clientEmail, customMessage } = inviteData;

    // Check if invitation already exists
    const existingInvite = await prisma.clientInvitation.findFirst({
      where: {
        trainerId,
        clientEmail,
        status: InvitationStatus.pending
      }
    });

    if (existingInvite) {
      throw new Error('Invitation already sent to this email');
    }

    // Check if client already exists and is connected
    const existingClient = await prisma.user.findUnique({
      where: { email: clientEmail }
    });

    if (existingClient) {
      const existingRelation = await prisma.trainerClient.findUnique({
        where: {
          trainerId_clientId: {
            trainerId,
            clientId: existingClient.id
          }
        }
      });

      if (existingRelation) {
        throw new Error('Client is already connected to trainer');
      }
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = addDays(new Date(), 30); // 30 days expiry

    const invitation = await prisma.clientInvitation.create({
      data: {
        trainerId,
        clientEmail,
        token,
        customMessage,
        status: InvitationStatus.pending,
        expiresAt
      },
      include: {
        trainer: {
          include: {
            userProfile: true
          }
        }
      }
    });

    // Send invitation email
    try {
      const trainerName = invitation.trainer.userProfile?.bio || 
                         invitation.trainer.email.split('@')[0] || 
                         'Your Trainer';
      
      await emailService.sendClientInvitation(
        clientEmail,
        trainerName,
        invitation.trainer.email,
        token
      );
    } catch (error) {
      // Log error but don't fail the invitation creation
      console.error('Failed to send invitation email:', error);
      // You might want to mark the invitation as needing manual follow-up
    }

    return invitation;
  }

  /**
   * Manually add a client (direct add without invitation)
   */
  async createClient(clientData: ClientCreateData) {
    const { trainerId, email, ...profileData } = clientData;

    // Check if client already exists
    let client = await prisma.user.findUnique({
      where: { email }
    });

    // Create client if doesn't exist
    if (!client) {
      client = await prisma.user.create({
        data: {
          email,
          role: 'client',
          isActive: true,
          isVerified: false
        }
      });

      // Create client profile if provided
      if (Object.keys(profileData).length > 0) {
        await prisma.clientProfile.create({
          data: {
            userId: client.id,
            fitnessLevel: profileData.fitnessLevel || FitnessLevel.beginner,
            goals: profileData.goals,
            preferences: profileData.preferences,
            emergencyContact: profileData.emergencyContact,
            medicalConditions: profileData.medicalConditions || [],
            medications: profileData.medications || [],
            allergies: profileData.allergies || []
          }
        });
      }
    }

    // Create trainer-client relationship
    const trainerClient = await prisma.trainerClient.create({
      data: {
        trainerId,
        clientId: client.id,
        status: ClientStatus.active,
        connectedAt: new Date()
      },
      include: {
        client: {
          include: {
            userProfile: true,
            clientProfile: true
          }
        }
      }
    });

    return trainerClient;
  }

  /**
   * Update client status
   */
  async updateClientStatus(trainerId: string, clientId: string, status: ClientStatus) {
    const updateData: any = { status };

    if (status === ClientStatus.archived) {
      updateData.archivedAt = new Date();
    }

    const trainerClient = await prisma.trainerClient.update({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      },
      data: updateData,
      include: {
        client: {
          include: {
            userProfile: true,
            clientProfile: true
          }
        }
      }
    });

    return trainerClient;
  }

  /**
   * Update client profile information
   */
  async updateClient(trainerId: string, clientId: string, updateData: ClientUpdateData) {
    // Verify trainer-client relationship
    const trainerClient = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      }
    });

    if (!trainerClient) {
      throw new Error('Client not found or not associated with trainer');
    }

    // Update trainer-client status if provided
    if (updateData.status) {
      await this.updateClientStatus(trainerId, clientId, updateData.status);
    }

    // Update client profile
    const { status, ...profileData } = updateData;
    if (Object.keys(profileData).length > 0) {
      await prisma.clientProfile.upsert({
        where: { userId: clientId },
        update: profileData,
        create: {
          userId: clientId,
          fitnessLevel: profileData.fitnessLevel || FitnessLevel.beginner,
          ...profileData
        }
      });
    }

    // Return updated client
    return this.getClientById(trainerId, clientId);
  }

  /**
   * Remove client (archive relationship)
   */
  async removeClient(trainerId: string, clientId: string) {
    return this.updateClientStatus(trainerId, clientId, ClientStatus.archived);
  }

  /**
   * Get client invitations for a trainer
   */
  async getInvitations(trainerId: string) {
    return prisma.clientInvitation.findMany({
      where: { trainerId },
      orderBy: { sentAt: 'desc' },
      include: {
        trainer: {
          include: {
            userProfile: true
          }
        }
      }
    });
  }

  /**
   * Resend client invitation
   */
  async resendInvitation(invitationId: string) {
    const invitation = await prisma.clientInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.pending) {
      throw new Error('Can only resend pending invitations');
    }

    // Extend expiry date
    const expiresAt = addDays(new Date(), 30);

    const updatedInvitation = await prisma.clientInvitation.update({
      where: { id: invitationId },
      data: {
        expiresAt,
        sentAt: new Date()
      },
      include: {
        trainer: {
          include: {
            userProfile: true
          }
        }
      }
    });

    // Send invitation email
    try {
      const trainerName = updatedInvitation.trainer.userProfile?.bio || 
                         updatedInvitation.trainer.email.split('@')[0] || 
                         'Your Trainer';
      
      await emailService.sendClientInvitation(
        invitation.clientEmail,
        trainerName,
        updatedInvitation.trainer.email,
        invitation.token
      );
    } catch (error) {
      // Log error but don't fail the resend operation
      console.error('Failed to resend invitation email:', error);
      // You might want to mark the invitation as needing manual follow-up
    }

    return updatedInvitation;
  }

  /**
   * Accept client invitation
   */
  async acceptInvitation(token: string, clientUserId: string) {
    const invitation = await prisma.clientInvitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status !== InvitationStatus.pending) {
      throw new Error('Invitation has already been processed');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Update invitation status
    await prisma.clientInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.accepted,
        acceptedAt: new Date()
      }
    });

    // Create trainer-client relationship
    const trainerClient = await prisma.trainerClient.create({
      data: {
        trainerId: invitation.trainerId,
        clientId: clientUserId,
        status: ClientStatus.active,
        connectedAt: new Date()
      },
      include: {
        client: {
          include: {
            userProfile: true,
            clientProfile: true
          }
        },
        trainer: {
          include: {
            userProfile: true
          }
        }
      }
    });

    return trainerClient;
  }

  // =====================================
  // NOTES MANAGEMENT
  // =====================================

  /**
   * Add note to client
   */
  async addNote(trainerId: string, clientId: string, note: string) {
    // Verify trainer-client relationship
    const trainerClient = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      }
    });

    if (!trainerClient) {
      throw new Error('Client not found or not associated with trainer');
    }

    const clientNote = await prisma.clientNote.create({
      data: {
        trainerId,
        clientId,
        note
      }
    });

    return clientNote;
  }

  /**
   * Get client notes with pagination
   */
  async getNotes(trainerId: string, clientId: string, pagination: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Verify trainer-client relationship
    const trainerClient = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      }
    });

    if (!trainerClient) {
      throw new Error('Client not found or not associated with trainer');
    }

    const [notes, totalCount] = await Promise.all([
      prisma.clientNote.findMany({
        where: {
          trainerId,
          clientId
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.clientNote.count({
        where: {
          trainerId,
          clientId
        }
      })
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Update note
   */
  async updateNote(trainerId: string, noteId: string, note: string) {
    // Verify the note belongs to the trainer
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId }
    });

    if (!existingNote) {
      throw new Error('Note not found');
    }

    if (existingNote.trainerId !== trainerId) {
      throw new Error('Not authorized to update this note');
    }

    const updatedNote = await prisma.clientNote.update({
      where: { id: noteId },
      data: { note }
    });

    return updatedNote;
  }

  /**
   * Delete note
   */
  async deleteNote(trainerId: string, noteId: string) {
    // Verify the note belongs to the trainer
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId }
    });

    if (!existingNote) {
      throw new Error('Note not found');
    }

    if (existingNote.trainerId !== trainerId) {
      throw new Error('Not authorized to delete this note');
    }

    await prisma.clientNote.delete({
      where: { id: noteId }
    });

    return { success: true };
  }

  // =====================================
  // TAGS MANAGEMENT
  // =====================================

  /**
   * Create new tag
   */
  async createTag(trainerId: string, name: string, color: string) {
    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error('Color must be a valid hex color (e.g., #FF5733)');
    }

    // Check if tag with same name already exists for this trainer
    const existingTag = await prisma.clientTag.findFirst({
      where: {
        trainerId,
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingTag) {
      throw new Error('Tag with this name already exists');
    }

    const tag = await prisma.clientTag.create({
      data: {
        name: name.trim(),
        color: color.toUpperCase(),
        trainerId
      }
    });

    return tag;
  }

  /**
   * Get all tags for trainer
   */
  async getTags(trainerId: string) {
    const tags = await prisma.clientTag.findMany({
      where: { trainerId },
      orderBy: { name: 'asc' },
      include: {
        assignments: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                userProfile: {
                  select: {
                    bio: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return tags;
  }

  /**
   * Update tag
   */
  async updateTag(trainerId: string, tagId: string, data: { name?: string; color?: string }) {
    // Verify the tag belongs to the trainer
    const existingTag = await prisma.clientTag.findUnique({
      where: { id: tagId }
    });

    if (!existingTag) {
      throw new Error('Tag not found');
    }

    if (existingTag.trainerId !== trainerId) {
      throw new Error('Not authorized to update this tag');
    }

    // Validate color if provided
    if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
      throw new Error('Color must be a valid hex color (e.g., #FF5733)');
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name.trim() !== existingTag.name) {
      const duplicateTag = await prisma.clientTag.findFirst({
        where: {
          trainerId,
          name: {
            equals: data.name.trim(),
            mode: 'insensitive'
          },
          id: { not: tagId }
        }
      });

      if (duplicateTag) {
        throw new Error('Tag with this name already exists');
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.color) updateData.color = data.color.toUpperCase();

    const updatedTag = await prisma.clientTag.update({
      where: { id: tagId },
      data: updateData
    });

    return updatedTag;
  }

  /**
   * Delete tag
   */
  async deleteTag(trainerId: string, tagId: string) {
    // Verify the tag belongs to the trainer
    const existingTag = await prisma.clientTag.findUnique({
      where: { id: tagId }
    });

    if (!existingTag) {
      throw new Error('Tag not found');
    }

    if (existingTag.trainerId !== trainerId) {
      throw new Error('Not authorized to delete this tag');
    }

    // Delete tag (assignments will be deleted automatically due to cascade)
    await prisma.clientTag.delete({
      where: { id: tagId }
    });

    return { success: true };
  }

  /**
   * Assign tags to client
   */
  async assignTags(trainerId: string, clientId: string, tagIds: string[]) {
    // Verify trainer-client relationship
    const trainerClient = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      }
    });

    if (!trainerClient) {
      throw new Error('Client not found or not associated with trainer');
    }

    // Verify all tags belong to the trainer
    const tags = await prisma.clientTag.findMany({
      where: {
        id: { in: tagIds },
        trainerId
      }
    });

    if (tags.length !== tagIds.length) {
      throw new Error('One or more tags not found or not owned by trainer');
    }

    // Create tag assignments (ignore duplicates)
    const assignments = tagIds.map(tagId => ({
      clientId,
      tagId
    }));

    await prisma.clientTagAssignment.createMany({
      data: assignments,
      skipDuplicates: true
    });

    // Return updated client with tags
    return this.getClientById(trainerId, clientId);
  }

  /**
   * Remove tags from client
   */
  async removeTags(trainerId: string, clientId: string, tagIds: string[]) {
    // Verify trainer-client relationship
    const trainerClient = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId
        }
      }
    });

    if (!trainerClient) {
      throw new Error('Client not found or not associated with trainer');
    }

    // Verify all tags belong to the trainer
    const tags = await prisma.clientTag.findMany({
      where: {
        id: { in: tagIds },
        trainerId
      }
    });

    if (tags.length !== tagIds.length) {
      throw new Error('One or more tags not found or not owned by trainer');
    }

    // Remove tag assignments
    await prisma.clientTagAssignment.deleteMany({
      where: {
        clientId,
        tagId: { in: tagIds }
      }
    });

    // Return updated client with tags
    return this.getClientById(trainerId, clientId);
  }

  // =====================================
  // CLIENT-FACING METHODS
  // =====================================

  /**
   * Get client's trainer information
   */
  async getClientTrainer(clientId: string) {
    const trainerClient = await prisma.trainerClient.findFirst({
      where: {
        clientId,
        status: { in: [ClientStatus.active, ClientStatus.pending] }
      },
      include: {
        trainer: {
          include: {
            userProfile: true,
            trainerCertifications: true,
            trainerSpecializations: true
          }
        }
      },
      orderBy: { connectedAt: 'desc' }
    });

    if (!trainerClient) {
      throw new Error('No trainer found for this client');
    }

    return trainerClient;
  }

  /**
   * Get pending invitations for a client by email
   */
  async getClientInvitations(clientEmail: string) {
    return prisma.clientInvitation.findMany({
      where: {
        clientEmail,
        status: InvitationStatus.pending,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        trainer: {
          include: {
            userProfile: true
          }
        }
      },
      orderBy: { sentAt: 'desc' }
    });
  }

  /**
   * Decline client invitation
   */
  async declineInvitation(invitationId: string, clientEmail: string) {
    const invitation = await prisma.clientInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.clientEmail !== clientEmail) {
      throw new Error('Not authorized to decline this invitation');
    }

    if (invitation.status !== InvitationStatus.pending) {
      throw new Error('Invitation has already been processed');
    }

    // Update invitation status
    const updatedInvitation = await prisma.clientInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.expired // Using expired status for declined
      }
    });

    return updatedInvitation;
  }

  /**
   * Disconnect trainer from client (client-initiated)
   */
  async disconnectTrainer(clientId: string) {
    const trainerClient = await prisma.trainerClient.findFirst({
      where: {
        clientId,
        status: { in: [ClientStatus.active, ClientStatus.pending] }
      }
    });

    if (!trainerClient) {
      throw new Error('No trainer connection found');
    }

    // Update status to archived instead of deleting
    const disconnectedRelation = await prisma.trainerClient.update({
      where: {
        trainerId_clientId: {
          trainerId: trainerClient.trainerId,
          clientId
        }
      },
      data: {
        status: ClientStatus.archived,
        archivedAt: new Date()
      },
      include: {
        trainer: {
          include: {
            userProfile: true
          }
        }
      }
    });

    return disconnectedRelation;
  }
}

export const clientService = new ClientService();