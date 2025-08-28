import { z } from 'zod';
import { DifficultyLevel } from '@prisma/client';

// Exercise search and filtering schemas
export const exerciseSearchSchema = z.object({
  query: z.string().optional(),
  bodyPart: z.string().optional(),
  equipment: z.string().optional(),
  targetMuscle: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: z.enum(['name', 'difficulty', 'popularity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Exercise categories schema  
export const exerciseCategoriesSchema = z.object({
  type: z.enum(['bodyParts', 'equipment', 'targetMuscles', 'difficulties']).optional(),
});

// Exercise favorite schema
export const exerciseFavoriteSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
});

// Collection schemas
export const createCollectionSchema = z.object({
  name: z.string()
    .min(1, 'Collection name is required')
    .max(255, 'Collection name must not exceed 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  isPublic: z.boolean().default(false),
});

export const updateCollectionSchema = z.object({
  name: z.string()
    .min(1, 'Collection name is required')
    .max(255, 'Collection name must not exceed 255 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  isPublic: z.boolean().optional(),
});

export const addExerciseToCollectionSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  position: z.number().int().min(0).optional(),
});

// Exercise usage tracking schema
export const exerciseUsageSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  context: z.enum(['program', 'workout', 'viewed']),
});

// Type exports for use in controllers
export type ExerciseSearchQuery = z.infer<typeof exerciseSearchSchema>;
export type ExerciseCategoriesQuery = z.infer<typeof exerciseCategoriesSchema>;
export type ExerciseFavoriteRequest = z.infer<typeof exerciseFavoriteSchema>;
export type CreateCollectionRequest = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionRequest = z.infer<typeof updateCollectionSchema>;
export type AddExerciseToCollectionRequest = z.infer<typeof addExerciseToCollectionSchema>;
export type ExerciseUsageRequest = z.infer<typeof exerciseUsageSchema>;

// Response type definitions
export interface ExerciseResponse {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty: DifficultyLevel;
  isFavorite?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ExerciseSearchResponse {
  exercises: ExerciseResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    bodyPart?: string;
    equipment?: string;
    targetMuscle?: string;
    difficulty?: string;
    query?: string;
  };
}

export interface ExerciseCategoriesResponse {
  bodyParts: string[];
  equipment: string[];
  targetMuscles: string[];
  difficulties: DifficultyLevel[];
}

export interface ExerciseCollectionResponse {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  exerciseCount: number;
  createdAt: Date;
  updatedAt: Date | null;
  exercises?: ExerciseResponse[];
}