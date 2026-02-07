/**
 * @jest-environment jsdom
 */

/**
 * Tests for usePrograms, useProgram, and program mutation hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  usePrograms,
  useProgram,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
  useDuplicateProgram,
  useAssignProgram,
  programKeys,
} from '@/hooks/usePrograms';
import { programService } from '@/services/programService';

jest.mock('@/services/programService', () => ({
  programService: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    duplicate: jest.fn(),
    assignToClient: jest.fn(),
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

describe('programKeys', () => {
  it('generates correct key structures', () => {
    expect(programKeys.all).toEqual(['programs']);
    expect(programKeys.lists()).toEqual(['programs', 'list']);
    expect(programKeys.list({ search: 'test' })).toEqual(['programs', 'list', { search: 'test' }]);
    expect(programKeys.details()).toEqual(['programs', 'detail']);
    expect(programKeys.detail('p1')).toEqual(['programs', 'detail', 'p1']);
  });
});

describe('usePrograms', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches programs and extracts programs array from response', async () => {
    const programs = [{ id: 'p1', name: 'Program 1' }];
    (programService.getAll as jest.Mock).mockResolvedValue({ programs });

    const { result } = renderHook(() => usePrograms(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(programs);
    expect(programService.getAll).toHaveBeenCalledWith(undefined);
  });

  it('passes filters to service', async () => {
    (programService.getAll as jest.Mock).mockResolvedValue({ programs: [] });

    const filters = { search: 'strength', page: 1 };
    renderHook(() => usePrograms(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(programService.getAll).toHaveBeenCalledWith(filters));
  });

  it('handles errors', async () => {
    (programService.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePrograms(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('useProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches a single program by ID', async () => {
    const program = { id: 'p1', name: 'My Program' };
    (programService.getById as jest.Mock).mockResolvedValue(program);

    const { result } = renderHook(() => useProgram('p1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(program);
    expect(programService.getById).toHaveBeenCalledWith('p1');
  });

  it('is disabled when id is empty string', async () => {
    const { result } = renderHook(() => useProgram(''), { wrapper: createWrapper() });

    // Should not fetch
    expect(result.current.fetchStatus).toBe('idle');
    expect(programService.getById).not.toHaveBeenCalled();
  });
});

describe('useCreateProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a program and invalidates list queries', async () => {
    const created = { id: 'new', name: 'New Program' };
    (programService.create as jest.Mock).mockResolvedValue(created);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateProgram(), { wrapper });

    result.current.mutate({ name: 'New Program', programType: 'strength' as any, difficultyLevel: 'beginner' as any, durationWeeks: 4 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(programService.create).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ queryKey: programKeys.lists() });
  });
});

describe('useUpdateProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates a program and invalidates relevant queries', async () => {
    const updated = { id: 'p1', name: 'Updated' };
    (programService.update as jest.Mock).mockResolvedValue(updated);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpdateProgram(), { wrapper });

    result.current.mutate({ id: 'p1', data: { name: 'Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(programService.update).toHaveBeenCalledWith('p1', { name: 'Updated' });
    expect(spy).toHaveBeenCalledWith({ queryKey: programKeys.detail('p1') });
    expect(spy).toHaveBeenCalledWith({ queryKey: programKeys.lists() });
  });
});

describe('useDeleteProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a program and invalidates list queries', async () => {
    (programService.delete as jest.Mock).mockResolvedValue(undefined);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteProgram(), { wrapper });

    result.current.mutate('p1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(programService.delete).toHaveBeenCalledWith('p1');
    expect(spy).toHaveBeenCalledWith({ queryKey: programKeys.lists() });
  });
});

describe('useDuplicateProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('duplicates a program and invalidates list queries', async () => {
    const duplicated = { id: 'p2', name: 'Copy' };
    (programService.duplicate as jest.Mock).mockResolvedValue(duplicated);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDuplicateProgram(), { wrapper });

    result.current.mutate({ id: 'p1', name: 'Copy' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(programService.duplicate).toHaveBeenCalledWith('p1', 'Copy');
    expect(spy).toHaveBeenCalledWith({ queryKey: programKeys.lists() });
  });

  it('works without custom name', async () => {
    (programService.duplicate as jest.Mock).mockResolvedValue({ id: 'p2' });

    const { result } = renderHook(() => useDuplicateProgram(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'p1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(programService.duplicate).toHaveBeenCalledWith('p1', undefined);
  });
});

describe('useAssignProgram', () => {
  beforeEach(() => jest.clearAllMocks());

  it('assigns a program and invalidates list queries', async () => {
    const assignment = { id: 'a1', programId: 'p1', clientId: 'c1' };
    (programService.assignToClient as jest.Mock).mockResolvedValue(assignment);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useAssignProgram(), { wrapper });

    result.current.mutate({
      id: 'p1',
      data: { clientId: 'c1', startDate: '2024-06-01' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(programService.assignToClient).toHaveBeenCalledWith('p1', {
      clientId: 'c1',
      startDate: '2024-06-01',
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: programKeys.lists() });
  });
});
