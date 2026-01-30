/**
 * Exercise Library Types
 * Epic 004: Exercise Library
 */

import { DifficultyLevel } from '@prisma/client';

// Raw exercise data from JSON import
export interface RawExerciseData {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

// Exercise API response types
export interface Exercise {
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

// Exercise detail response with metadata
export interface ExerciseDetail extends Exercise {
  isFavorite?: boolean;
  usageCount?: number;
}

// Exercise list query parameters
export interface ExerciseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  bodyPart?: string;
  equipment?: string;
  targetMuscle?: string;
  difficulty?: DifficultyLevel;
  sortBy?: 'name' | 'createdAt' | 'targetMuscle';
  sortOrder?: 'asc' | 'desc';
}

// Exercise list response
export interface ExerciseListResponse {
  exercises: Exercise[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    bodyParts: string[];
    equipments: string[];
    targetMuscles: string[];
  };
}

// Exercise creation payload
export interface CreateExerciseDTO {
  exerciseId?: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty?: DifficultyLevel;
}

// Exercise update payload
export interface UpdateExerciseDTO {
  name?: string;
  gifUrl?: string;
  bodyPart?: string;
  equipment?: string;
  targetMuscle?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  difficulty?: DifficultyLevel;
  isActive?: boolean;
}

// Exercise import stats
export interface ExerciseImportStats {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ exerciseId: string; error: string }>;
}

// Exercise filter options
export interface ExerciseFilterOptions {
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  difficulties: DifficultyLevel[];
}

// API Error response
export interface ExerciseAPIError {
  error: string;
  message: string;
  details?: unknown;
}
