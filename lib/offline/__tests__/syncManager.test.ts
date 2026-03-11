/** @jest-environment jsdom */
import { syncOfflineData } from '../syncManager';
import * as indexedDB from '../indexedDB';

jest.mock('../indexedDB');

describe('syncManager', () => {
  const mockGetWorkoutQueue = indexedDB.getWorkoutQueue as jest.MockedFunction<typeof indexedDB.getWorkoutQueue>;
  const mockClearWorkoutQueue = indexedDB.clearWorkoutQueue as jest.MockedFunction<typeof indexedDB.clearWorkoutQueue>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('syncOfflineData', () => {
    it('should return synced: 0 when queue is empty', async () => {
      mockGetWorkoutQueue.mockResolvedValue([]);

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 0, failed: 0, conflicts: 0, errors: [] });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return failed count when no access token', async () => {
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
        { id: 2, action: 'workouts/log', data: { test: 2 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = await syncOfflineData();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(2);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should sync all items successfully', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { exerciseId: 'ex-1' }, createdAt: Date.now() },
        { id: 2, action: 'workouts/complete', data: { workoutId: 'w-1' }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

      const result = await syncOfflineData();

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.conflicts).toBe(0);
      expect(result.errors).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith('/api/workouts/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ exerciseId: 'ex-1' }),
      });
      expect(mockClearWorkoutQueue).toHaveBeenCalled();
    });

    it('should handle partial sync failures (client errors, no retry)', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
        { id: 2, action: 'workouts/log', data: { test: 2 }, createdAt: Date.now() },
        { id: 3, action: 'workouts/log', data: { test: 3 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 400 })  // Client error - no retry
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await syncOfflineData();

      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
      expect(mockClearWorkoutQueue).toHaveBeenCalled();
    });

    it('should handle network errors with retry', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      // All fetch attempts throw network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const syncPromise = syncOfflineData();

      // Advance through all backoff delays
      for (const delayMs of [1000, 2000, 4000, 8000, 16000, 30000]) {
        await jest.advanceTimersByTimeAsync(delayMs);
      }

      const result = await syncPromise;

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Network error');
    });

    it('should not clear queue when all syncs fail', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      // Return client error (400) - no retry, immediate failure
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 400 });

      const result = await syncOfflineData();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockClearWorkoutQueue).not.toHaveBeenCalled();
    });
  });
});
