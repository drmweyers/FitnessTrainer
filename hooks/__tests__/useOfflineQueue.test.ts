/** @jest-environment jsdom */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineQueue } from '../useOfflineQueue';
import * as indexedDB from '@/lib/offline/indexedDB';
import * as syncManager from '@/lib/offline/syncManager';

jest.mock('@/lib/offline/indexedDB');
jest.mock('@/lib/offline/syncManager');

describe('useOfflineQueue', () => {
  const mockGetWorkoutQueue = indexedDB.getWorkoutQueue as jest.MockedFunction<typeof indexedDB.getWorkoutQueue>;
  const mockAddToWorkoutQueue = indexedDB.addToWorkoutQueue as jest.MockedFunction<typeof indexedDB.addToWorkoutQueue>;
  const mockSyncOfflineData = syncManager.syncOfflineData as jest.MockedFunction<typeof syncManager.syncOfflineData>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with queue length 0', async () => {
    mockGetWorkoutQueue.mockResolvedValue([]);

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });
    expect(result.current.isSyncing).toBe(false);
  });

  it('should load initial queue length', async () => {
    mockGetWorkoutQueue.mockResolvedValue([
      { id: 1, action: 'test', data: {}, createdAt: Date.now() },
      { id: 2, action: 'test', data: {}, createdAt: Date.now() },
    ]);

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(2);
    });
  });

  it('should handle IndexedDB errors gracefully', async () => {
    mockGetWorkoutQueue.mockRejectedValue(new Error('IndexedDB not available'));

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });
  });

  it('should add items to queue and update length', async () => {
    mockGetWorkoutQueue
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() }]);
    mockAddToWorkoutQueue.mockResolvedValue();

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });

    await act(async () => {
      await result.current.addToQueue('workouts/log', { test: 1 });
    });

    await waitFor(() => {
      expect(result.current.queueLength).toBe(1);
    });
    expect(mockAddToWorkoutQueue).toHaveBeenCalledWith('workouts/log', { test: 1 });
  });

  it('should sync queue and update status', async () => {
    mockGetWorkoutQueue
      .mockResolvedValueOnce([
        { id: 1, action: 'test', data: {}, createdAt: Date.now() },
        { id: 2, action: 'test', data: {}, createdAt: Date.now() },
      ])
      .mockResolvedValueOnce([]);
    mockSyncOfflineData.mockResolvedValue({ synced: 2, failed: 0 });

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(2);
    });

    let syncResult;
    await act(async () => {
      syncResult = await result.current.sync();
    });

    expect(syncResult).toEqual({ synced: 2, failed: 0 });
    expect(result.current.isSyncing).toBe(false);
    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });
  });

  it('should set isSyncing during sync operation', async () => {
    mockGetWorkoutQueue.mockResolvedValue([]);
    mockSyncOfflineData.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ synced: 0, failed: 0 }), 100))
    );

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });

    act(() => {
      result.current.sync();
    });

    // Should be syncing immediately
    expect(result.current.isSyncing).toBe(true);

    // Wait for sync to complete
    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });
  });

  it('should reset isSyncing even if sync fails', async () => {
    mockGetWorkoutQueue.mockResolvedValue([]);
    mockSyncOfflineData.mockRejectedValue(new Error('Sync failed'));

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });

    await act(async () => {
      try {
        await result.current.sync();
      } catch {
        // Expected to fail
      }
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it('should handle multiple queue operations', async () => {
    mockGetWorkoutQueue
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1, action: 'test1', data: {}, createdAt: Date.now() }])
      .mockResolvedValueOnce([
        { id: 1, action: 'test1', data: {}, createdAt: Date.now() },
        { id: 2, action: 'test2', data: {}, createdAt: Date.now() },
      ]);
    mockAddToWorkoutQueue.mockResolvedValue();

    const { result } = renderHook(() => useOfflineQueue());

    await waitFor(() => {
      expect(result.current.queueLength).toBe(0);
    });

    await act(async () => {
      await result.current.addToQueue('test1', { data: 1 });
    });

    await waitFor(() => {
      expect(result.current.queueLength).toBe(1);
    });

    await act(async () => {
      await result.current.addToQueue('test2', { data: 2 });
    });

    await waitFor(() => {
      expect(result.current.queueLength).toBe(2);
    });
  });
});
