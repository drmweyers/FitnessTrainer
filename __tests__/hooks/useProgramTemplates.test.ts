/**
 * @jest-environment jsdom
 */

/**
 * Tests for useProgramTemplates hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTemplates, templateKeys } from '@/hooks/useProgramTemplates';
import { programService } from '@/services/programService';

jest.mock('@/services/programService', () => ({
  programService: {
    getTemplates: jest.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('templateKeys', () => {
  it('generates correct key structures', () => {
    expect(templateKeys.all).toEqual(['templates']);
    expect(templateKeys.lists()).toEqual(['templates', 'list']);
    expect(templateKeys.list()).toEqual(['templates', 'list', undefined]);
    expect(templateKeys.list('strength')).toEqual(['templates', 'list', 'strength']);
  });
});

describe('useTemplates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches templates without category', async () => {
    const templates = [{ id: 't1', name: 'Template 1' }];
    (programService.getTemplates as jest.Mock).mockResolvedValue(templates);

    const { result } = renderHook(() => useTemplates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(templates);
    expect(programService.getTemplates).toHaveBeenCalledWith(undefined);
  });

  it('fetches templates with category filter', async () => {
    (programService.getTemplates as jest.Mock).mockResolvedValue([]);

    renderHook(() => useTemplates('cardio'), { wrapper: createWrapper() });

    await waitFor(() => expect(programService.getTemplates).toHaveBeenCalledWith('cardio'));
  });

  it('handles errors', async () => {
    (programService.getTemplates as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useTemplates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Fetch failed');
  });

  it('returns empty array when no templates exist', async () => {
    (programService.getTemplates as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useTemplates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
