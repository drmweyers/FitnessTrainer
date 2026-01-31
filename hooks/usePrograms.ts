/**
 * React Query hooks for programs
 *
 * Provides React Query hooks for program operations with caching and invalidation.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { programService } from '@/services/programService';
import type { Program, ProgramData, ProgramFilters, AssignProgramData } from '@/types/program';

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (filters: ProgramFilters) => [...programKeys.lists(), filters] as const,
  details: () => [...programKeys.all, 'detail'] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
};

/**
 * Get all programs
 */
export function usePrograms(
  filters?: ProgramFilters,
  options?: Omit<UseQueryOptions<Program[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: programKeys.list(filters || {}),
    queryFn: async () => {
      const response = await programService.getAll(filters);
      return response.programs;
    },
    ...options,
  });
}

/**
 * Get program by ID
 */
export function useProgram(
  id: string,
  options?: Omit<UseQueryOptions<Program>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => programService.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Create program mutation
 */
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProgramData) => programService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}

/**
 * Update program mutation
 */
export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProgramData> }) =>
      programService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}

/**
 * Delete program mutation
 */
export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => programService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}

/**
 * Duplicate program mutation
 */
export function useDuplicateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      programService.duplicate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}

/**
 * Assign program to client mutation
 */
export function useAssignProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignProgramData }) =>
      programService.assignToClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
  });
}
