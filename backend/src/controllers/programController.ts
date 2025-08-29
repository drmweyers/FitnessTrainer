import { Request, Response } from 'express';
import { programService } from '@/services/programService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

// Create a new program
export const createProgram = asyncHandler(async (req: Request, res: Response) => {
  const trainerId = req.user!.id;
  const programData = req.body;

  const program = await programService.createProgram(trainerId, programData);

  logger.info(`Program created: ${program.id} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Program created successfully',
    data: program
  });
});

// Get all programs for a trainer
export const getTrainerPrograms = asyncHandler(async (req: Request, res: Response) => {
  const trainerId = req.user!.id;
  const includeTemplates = req.query.includeTemplates === 'true';

  const programs = await programService.getTrainerPrograms(trainerId, includeTemplates);

  res.json({
    success: true,
    data: programs,
    count: programs.length
  });
});

// Get a single program
export const getProgramById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;

  const program = await programService.getProgramById(id as string, trainerId);

  res.json({
    success: true,
    data: program
  });
});

// Update a program
export const updateProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;
  const updateData = req.body;

  const program = await programService.updateProgram(id as string, trainerId, updateData);

  logger.info(`Program updated: ${id} by trainer ${trainerId}`);

  res.json({
    success: true,
    message: 'Program updated successfully',
    data: program
  });
});

// Delete a program
export const deleteProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;

  const result = await programService.deleteProgram(id as string, trainerId);

  logger.info(`Program deleted: ${id} by trainer ${trainerId}`);

  res.json(result);
});

// Duplicate a program
export const duplicateProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;
  const { name } = req.body;

  const program = await programService.duplicateProgram(id as string, trainerId, name);

  logger.info(`Program duplicated: ${id} -> ${program?.id} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Program duplicated successfully',
    data: program
  });
});

// Assign program to client
export const assignProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;
  const { clientId, startDate } = req.body;

  const assignment = await programService.assignProgram(
    id as string, 
    clientId, 
    trainerId, 
    new Date(startDate)
  );

  logger.info(`Program assigned: ${id} to client ${clientId} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Program assigned successfully',
    data: assignment
  });
});

// Get client's programs
export const getClientPrograms = asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const trainerId = req.user!.id;

  const programs = await programService.getClientPrograms(clientId as string, trainerId);

  res.json({
    success: true,
    data: programs,
    count: programs.length
  });
});

// Get program templates
export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;

  const templates = await programService.getTemplates(category as string);

  res.json({
    success: true,
    data: templates,
    count: templates.length
  });
});