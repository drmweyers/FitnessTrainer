/**
 * React Query hooks for program templates
 *
 * Provides React Query hooks for template operations.
 */

import { useQuery } from '@tanstack/react-query';
import { programService } from '@/services/programService';
import type { ProgramTemplate } from '@/types/program';

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (category?: string) => [...templateKeys.lists(), category] as const,
};

/**
 * Get program templates
 */
export function useTemplates(category?: string) {
  return useQuery({
    queryKey: templateKeys.list(category),
    queryFn: () => programService.getTemplates(category),
  });
}
