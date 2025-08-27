import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, trainerOnly } from '../middleware/auth';
import { clientService } from '../services/clientService';
import { ClientStatus, FitnessLevel } from '@prisma/client';

const router = express.Router();

// Validation schemas
const clientFiltersSchema = z.object({
  status: z.nativeEnum(ClientStatus).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'dateAdded', 'lastActivity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const inviteClientSchema = z.object({
  clientEmail: z.string().email('Invalid email format'),
  customMessage: z.string().max(500).optional()
});

const createClientSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  fitnessLevel: z.nativeEnum(FitnessLevel).optional(),
  goals: z.any().optional(),
  preferences: z.any().optional(),
  emergencyContact: z.any().optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional()
});

const updateClientSchema = z.object({
  status: z.nativeEnum(ClientStatus).optional(),
  fitnessLevel: z.nativeEnum(FitnessLevel).optional(),
  goals: z.any().optional(),
  preferences: z.any().optional(),
  emergencyContact: z.any().optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ClientStatus)
});

// Notes validation schemas
const addNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(2000, 'Note cannot exceed 2000 characters')
});

const updateNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(2000, 'Note cannot exceed 2000 characters')
});

const notePaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

// Tags validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name cannot exceed 50 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF5733)')
});

const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name cannot exceed 50 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF5733)').optional()
}).refine(data => data.name || data.color, {
  message: 'At least one field (name or color) must be provided'
});

const assignTagsSchema = z.object({
  tagIds: z.array(z.string().uuid('Invalid tag ID format')).min(1, 'At least one tag ID is required')
});

// GET /api/clients/invitations - Get all invitations for trainer
router.get('/invitations', trainerOnly, async (req: Request, res: Response) => {
  try {
    const invitations = await clientService.getInvitations(req.user!.id);

    return res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// POST /api/clients/invite - Send client invitation
router.post('/invite', trainerOnly, async (req: Request, res: Response) => {
  try {
    const validatedData = inviteClientSchema.parse(req.body);
    
    const invitation = await clientService.inviteClient({
      trainerId: req.user!.id,
      clientEmail: validatedData.clientEmail,
      customMessage: validatedData.customMessage
    });

    return res.status(201).json({
      success: true,
      data: invitation,
      message: 'Client invitation sent successfully'
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid invitation data',
        details: error.errors
      });
    }

    if (error instanceof Error && (
      error.message === 'Invitation already sent to this email' ||
      error.message === 'Client is already connected to trainer'
    )) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// POST /api/clients/invitations/:id/resend - Resend invitation
router.post('/invitations/:id/resend', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Invitation ID is required' });
    }
    const invitation = await clientService.resendInvitation(id);

    return res.json({
      success: true,
      data: invitation,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    
    if (error instanceof Error && (
      error.message === 'Invitation not found' ||
      error.message === 'Can only resend pending invitations'
    )) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

// POST /api/clients/invitations/accept - Accept invitation (for clients)
router.post('/invitations/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const trainerClient = await clientService.acceptInvitation(token, req.user!.id);

    return res.json({
      success: true,
      data: trainerClient,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof Error && (
      error.message === 'Invalid invitation token' ||
      error.message === 'Invitation has already been processed' ||
      error.message === 'Invitation has expired'
    )) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// GET /api/clients - Get all clients for trainer
router.get('/', trainerOnly, async (req: Request, res: Response) => {
  try {
    const filters = clientFiltersSchema.parse(req.query);
    const result = await clientService.getClients(req.user!.id, filters);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    return res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get specific client
router.get('/:id', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    const client = await clientService.getClientById(req.user!.id, id);

    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    
    if (error instanceof Error && error.message === 'Client not found or not associated with trainer') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create client directly (manual add)
router.post('/', trainerOnly, async (req: Request, res: Response) => {
  try {
    const validatedData = createClientSchema.parse(req.body);
    
    const client = await clientService.createClient({
      trainerId: req.user!.id,
      email: validatedData.email,
      ...(validatedData.firstName && { firstName: validatedData.firstName }),
      ...(validatedData.lastName && { lastName: validatedData.lastName }),
      ...(validatedData.fitnessLevel && { fitnessLevel: validatedData.fitnessLevel }),
      ...(validatedData.goals && { goals: validatedData.goals }),
      ...(validatedData.preferences && { preferences: validatedData.preferences }),
      ...(validatedData.emergencyContact && { emergencyContact: validatedData.emergencyContact }),
      ...(validatedData.medicalConditions && { medicalConditions: validatedData.medicalConditions }),
      ...(validatedData.medications && { medications: validatedData.medications }),
      ...(validatedData.allergies && { allergies: validatedData.allergies })
    });

    return res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error creating client:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid client data',
        details: error.errors
      });
    }

    return res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    const validatedData = updateClientSchema.parse(req.body);
    
    const client = await clientService.updateClient(req.user!.id, id, validatedData);

    return res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid update data',
        details: error.errors
      });
    }

    if (error instanceof Error && error.message === 'Client not found or not associated with trainer') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to update client' });
  }
});

// PUT /api/clients/:id/status - Update client status
router.put('/:id/status', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    const { status } = updateStatusSchema.parse(req.body);
    
    const client = await clientService.updateClientStatus(req.user!.id, id, status);

    return res.json({
      success: true,
      data: client,
      message: 'Client status updated successfully'
    });
  } catch (error) {
    console.error('Error updating client status:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid status data',
        details: error.errors
      });
    }

    return res.status(500).json({ error: 'Failed to update client status' });
  }
});

// DELETE /api/clients/:id - Archive client (soft delete)
router.delete('/:id', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    const client = await clientService.removeClient(req.user!.id, id);

    return res.json({
      success: true,
      data: client,
      message: 'Client archived successfully'
    });
  } catch (error) {
    console.error('Error archiving client:', error);
    return res.status(500).json({ error: 'Failed to archive client' });
  }
});

// =====================================
// NOTES ENDPOINTS
// =====================================

// POST /api/clients/:id/notes - Add note to client
router.post('/:id/notes', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const { note } = addNoteSchema.parse(req.body);
    const clientNote = await clientService.addNote(req.user!.id, id, note);

    return res.status(201).json({
      success: true,
      data: clientNote,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid note data',
        details: error.errors
      });
    }

    if (error instanceof Error && error.message === 'Client not found or not associated with trainer') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to add note' });
  }
});

// GET /api/clients/:id/notes - Get client notes
router.get('/:id/notes', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const pagination = notePaginationSchema.parse(req.query);
    const result = await clientService.getNotes(req.user!.id, id, pagination);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors
      });
    }

    if (error instanceof Error && error.message === 'Client not found or not associated with trainer') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// PUT /api/clients/notes/:noteId - Update note
router.put('/notes/:noteId', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    const { note } = updateNoteSchema.parse(req.body);
    const updatedNote = await clientService.updateNote(req.user!.id, noteId, note);

    return res.json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid note data',
        details: error.errors
      });
    }

    if (error instanceof Error && (
      error.message === 'Note not found' ||
      error.message === 'Not authorized to update this note'
    )) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/clients/notes/:noteId - Delete note
router.delete('/notes/:noteId', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }

    await clientService.deleteNote(req.user!.id, noteId);

    return res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    
    if (error instanceof Error && (
      error.message === 'Note not found' ||
      error.message === 'Not authorized to delete this note'
    )) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

// =====================================
// TAGS ENDPOINTS
// =====================================

// POST /api/clients/tags - Create new tag
router.post('/tags', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { name, color } = createTagSchema.parse(req.body);
    const tag = await clientService.createTag(req.user!.id, name, color);

    return res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid tag data',
        details: error.errors
      });
    }

    if (error instanceof Error && (
      error.message === 'Tag with this name already exists' ||
      error.message === 'Color must be a valid hex color (e.g., #FF5733)'
    )) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to create tag' });
  }
});

// GET /api/clients/tags - Get trainer's tags
router.get('/tags', trainerOnly, async (req: Request, res: Response) => {
  try {
    const tags = await clientService.getTags(req.user!.id);

    return res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// PUT /api/clients/tags/:tagId - Update tag
router.put('/tags/:tagId', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { tagId } = req.params;
    if (!tagId) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }

    const updateData = updateTagSchema.parse(req.body);
    const updatedTag = await clientService.updateTag(req.user!.id, tagId, updateData);

    return res.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid tag data',
        details: error.errors
      });
    }

    if (error instanceof Error && (
      error.message === 'Tag not found' ||
      error.message === 'Not authorized to update this tag'
    )) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof Error && (
      error.message === 'Tag with this name already exists' ||
      error.message === 'Color must be a valid hex color (e.g., #FF5733)'
    )) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/clients/tags/:tagId - Delete tag
router.delete('/tags/:tagId', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { tagId } = req.params;
    if (!tagId) {
      return res.status(400).json({ error: 'Tag ID is required' });
    }

    await clientService.deleteTag(req.user!.id, tagId);

    return res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    
    if (error instanceof Error && (
      error.message === 'Tag not found' ||
      error.message === 'Not authorized to delete this tag'
    )) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// PUT /api/clients/:id/tags - Assign/remove tags from client
router.put('/:id/tags', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const { tagIds } = assignTagsSchema.parse(req.body);
    const { action = 'assign' } = req.query;

    let result;
    let message;

    if (action === 'remove') {
      result = await clientService.removeTags(req.user!.id, id, tagIds);
      message = 'Tags removed from client successfully';
    } else {
      result = await clientService.assignTags(req.user!.id, id, tagIds);
      message = 'Tags assigned to client successfully';
    }

    return res.json({
      success: true,
      data: result,
      message
    });
  } catch (error) {
    console.error('Error managing client tags:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid tag data',
        details: error.errors
      });
    }

    if (error instanceof Error && (
      error.message === 'Client not found or not associated with trainer' ||
      error.message === 'One or more tags not found or not owned by trainer'
    )) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to manage client tags' });
  }
});

export { router as clientRoutes };