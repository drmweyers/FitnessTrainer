// src/types/index.ts

// Re-export all types for easy access
export * from './auth';
export * from './client';
export * from './exercise';
export * from './program';

// Workout types (with aliased Exercise to avoid conflicts)
export type {
  Exercise as WorkoutExercise,
  Workout
} from './workout';

// Legacy Level interface (keeping for backward compatibility)
export interface Level {
    id: string
    name: string
    description: string
    numChallenges: number
    thumbnailUrl: string
    thumbnailType?: number
    thumbnailAttachmentId?: string
    thumbnailAttachmentName?: string
    createdAt?: Date
    updatedAt?: Date
  }
  
  export interface PaginationMeta {
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
  
  export interface ApiResponse<T> {
    data: T
    meta?: PaginationMeta
    error?: string
  }