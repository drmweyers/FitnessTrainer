import { Response } from 'express';
import { exerciseFilterService } from '@/services/exerciseFilterService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

// Get available filter options (body parts, equipment, target muscles)
export const getAvailableFilters = asyncHandler(async (req: any, res: Response) => {
  const filters = await exerciseFilterService.getAvailableFilters();

  res.json({
    success: true,
    data: filters,
  });
});

// Filter exercises by provided criteria
export const filterExercises = asyncHandler(async (req: any, res: Response) => {
  const { bodyPart, equipment, targetMuscle, limit, offset } = req.query;

  // Build filters object from query params
  const filters: any = {};

  if (bodyPart) {
    filters.bodyParts = Array.isArray(bodyPart) ? bodyPart : [bodyPart];
  }

  if (equipment) {
    filters.equipment = Array.isArray(equipment) ? equipment : [equipment];
  }

  if (targetMuscle) {
    filters.targetMuscles = Array.isArray(targetMuscle) ? targetMuscle : [targetMuscle];
  }

  const pagination = {
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  };

  const result = await exerciseFilterService.filterExercises(filters, pagination);

  logger.info(`Exercise filter applied - ${result.total} results`);

  res.json({
    success: true,
    data: result,
  });
});

// Get default filter presets
export const getFilterPresets = asyncHandler(async (req: any, res: Response) => {
  const presets = exerciseFilterService.getDefaultPresets();

  res.json({
    success: true,
    data: presets,
  });
});

// Apply a specific filter preset
export const applyPreset = asyncHandler(async (req: any, res: Response) => {
  const { presetId } = req.params;
  const { limit, offset } = req.query;

  const pagination = {
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  };

  const result = await exerciseFilterService.applyPreset(presetId, pagination);

  logger.info(`Applied filter preset: ${presetId} - ${result.total} results`);

  res.json({
    success: true,
    data: result,
  });
});
