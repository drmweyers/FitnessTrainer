/**
 * React Query hooks for workouts
 *
 * Provides React Query hooks for workout operations with caching and invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutService } from '@/services/workoutService';
import type { WorkoutSession, WorkoutFilters, LogSetDTO } from '@/types/workout';

// Query keys
export const workoutKeys = {
  all: ['workouts'] as const,
  lists: () => [...workoutKeys.all, 'list'] as const,
  list: (filters?: WorkoutFilters) => [...workoutKeys.lists(), filters] as const,
  details: () => [...workoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutKeys.details(), id] as const,
  active: () => [...workoutKeys.all, 'active'] as const,
};

/**
 * Get all workouts
 */
export function useWorkouts(filters?: WorkoutFilters) {
  return useQuery({
    queryKey: workoutKeys.list(filters),
    queryFn: () => workoutService.getAll(filters),
  });
}

/**
 * Get workout by ID
 */
export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => workoutService.getById(id),
    enabled: !!id,
  });
}

/**
 * Get active workout session
 */
export function useActiveWorkout() {
  return useQuery({
    queryKey: workoutKeys.active(),
    queryFn: () => workoutService.getActiveSession(),
    retry: false,
  });
}

/**
 * Start workout mutation
 */
export function useStartWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      programId?: string;
      programWorkoutId?: string;
      clientId?: string;
    }) => workoutService.startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.active() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
}

/**
 * Update workout mutation
 */
export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutSession> }) =>
      workoutService.updateSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
}

/**
 * Log set mutation
 */
export function useLogSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, setData }: { sessionId: string; setData: LogSetDTO }) =>
      workoutService.logSet(sessionId, setData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.detail(variables.sessionId) });
    },
  });
}

/**
 * Complete workout mutation
 */
export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes?: string }) =>
      workoutService.completeSession(sessionId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKeys: workoutKeys.active() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
}

/**
 * Get workout progress
 */
export function useWorkoutProgress(exerciseId?: string) {
  return useQuery({
    queryKey: ['workout', 'progress', exerciseId],
    queryFn: () => workoutService.getProgress(exerciseId),
    enabled: !!exerciseId,
  });
}
