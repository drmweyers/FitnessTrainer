/**
 * Tests for useWorkouts hooks
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useWorkouts,
  useWorkout,
  useActiveWorkout,
  useStartWorkout,
  useUpdateWorkout,
  useLogSet,
  useCompleteWorkout,
  useWorkoutProgress,
  workoutKeys,
} from '@/hooks/useWorkouts';
import { workoutService } from '@/services/workoutService';

jest.mock('@/services/workoutService');

const mockedService = workoutService as jest.Mocked<typeof workoutService>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('workoutKeys', () => {
  it('generates correct key patterns', () => {
    expect(workoutKeys.all).toEqual(['workouts']);
    expect(workoutKeys.lists()).toEqual(['workouts', 'list']);
    expect(workoutKeys.list({ status: 'completed' })).toEqual([
      'workouts',
      'list',
      { status: 'completed' },
    ]);
    expect(workoutKeys.details()).toEqual(['workouts', 'detail']);
    expect(workoutKeys.detail('sess-1')).toEqual(['workouts', 'detail', 'sess-1']);
    expect(workoutKeys.active()).toEqual(['workouts', 'active']);
  });
});

describe('useWorkouts', () => {
  it('fetches workouts', async () => {
    const workouts = [{ id: '1' }, { id: '2' }];
    mockedService.getAll.mockResolvedValue(workouts as any);

    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(workouts);
    expect(mockedService.getAll).toHaveBeenCalledWith(undefined);
  });

  it('passes filters', async () => {
    mockedService.getAll.mockResolvedValue([]);

    const filters = { status: 'completed' as const };
    const { result } = renderHook(() => useWorkouts(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedService.getAll).toHaveBeenCalledWith(filters);
  });
});

describe('useWorkout', () => {
  it('fetches workout by ID', async () => {
    const workout = { id: 'sess-1' };
    mockedService.getById.mockResolvedValue(workout as any);

    const { result } = renderHook(() => useWorkout('sess-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(workout);
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useWorkout(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useActiveWorkout', () => {
  it('fetches active workout', async () => {
    const session = { id: 'active-1', status: 'in_progress' };
    mockedService.getActiveSession.mockResolvedValue(session as any);

    const { result } = renderHook(() => useActiveWorkout(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(session);
  });

  it('does not retry on failure', async () => {
    mockedService.getActiveSession.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useActiveWorkout(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockedService.getActiveSession).toHaveBeenCalledTimes(1);
  });
});

describe('useStartWorkout', () => {
  it('calls startSession on mutate', async () => {
    const session = { id: 'new-sess' };
    mockedService.startSession.mockResolvedValue(session as any);

    const { result } = renderHook(() => useStartWorkout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ programId: 'prog-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedService.startSession).toHaveBeenCalledWith({ programId: 'prog-1' });
  });
});

describe('useUpdateWorkout', () => {
  it('calls updateSession on mutate', async () => {
    const updated = { id: 'sess-1', status: 'in_progress' };
    mockedService.updateSession.mockResolvedValue(updated as any);

    const { result } = renderHook(() => useUpdateWorkout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'sess-1', data: { status: 'in_progress' } as any });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedService.updateSession).toHaveBeenCalledWith('sess-1', {
      status: 'in_progress',
    });
  });
});

describe('useLogSet', () => {
  it('calls logSet on mutate', async () => {
    mockedService.logSet.mockResolvedValue({});

    const { result } = renderHook(() => useLogSet(), {
      wrapper: createWrapper(),
    });

    const setData = { exerciseId: 'ex-1', setNumber: 1, completed: true };
    result.current.mutate({ sessionId: 'sess-1', setData: setData as any });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedService.logSet).toHaveBeenCalledWith('sess-1', setData);
  });
});

describe('useCompleteWorkout', () => {
  it('calls completeSession on mutate', async () => {
    mockedService.completeSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCompleteWorkout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ sessionId: 'sess-1', notes: 'Good workout' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedService.completeSession).toHaveBeenCalledWith('sess-1', 'Good workout');
  });
});

describe('useWorkoutProgress', () => {
  it('fetches progress data', async () => {
    const progress = { totalWorkouts: 10 };
    mockedService.getProgress.mockResolvedValue(progress as any);

    const { result } = renderHook(() => useWorkoutProgress('ex-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(progress);
    expect(mockedService.getProgress).toHaveBeenCalledWith('ex-1');
  });

  it('is disabled when exerciseId is undefined', () => {
    const { result } = renderHook(() => useWorkoutProgress(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
