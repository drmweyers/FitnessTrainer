/** @jest-environment jsdom */
import { syncOfflineData } from '../syncManager';
import * as indexedDB from '../indexedDB';

jest.mock('../indexedDB');

describe('syncManager', () => {
  const mockGetWorkoutQueue = indexedDB.getWorkoutQueue as jest.MockedFunction<typeof indexedDB.getWorkoutQueue>;
  const mockClearWorkoutQueue = indexedDB.clearWorkoutQueue as jest.MockedFunction<typeof indexedDB.clearWorkoutQueue>;

  beforeEach(() => {
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

  describe('syncOfflineData', () => {
    it('should return synced: 0 when queue is empty', async () => {
      mockGetWorkoutQueue.mockResolvedValue([]);

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 0, failed: 0 });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return failed count when no access token', async () => {
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
        { id: 2, action: 'workouts/log', data: { test: 2 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 0, failed: 2 });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should sync all items successfully', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { exerciseId: 'ex-1' }, createdAt: Date.now() },
        { id: 2, action: 'workouts/complete', data: { workoutId: 'w-1' }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 2, failed: 0 });
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

    it('should handle partial sync failures', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
        { id: 2, action: 'workouts/log', data: { test: 2 }, createdAt: Date.now() },
        { id: 3, action: 'workouts/log', data: { test: 3 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true });

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 2, failed: 1 });
      expect(mockClearWorkoutQueue).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
        { id: 2, action: 'workouts/log', data: { test: 2 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 1, failed: 1 });
      expect(mockClearWorkoutQueue).toHaveBeenCalled();
    });

    it('should not clear queue when all syncs fail', async () => {
      const mockToken = 'test-token-123';
      mockGetWorkoutQueue.mockResolvedValue([
        { id: 1, action: 'workouts/log', data: { test: 1 }, createdAt: Date.now() },
      ]);
      (window.localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const result = await syncOfflineData();

      expect(result).toEqual({ synced: 0, failed: 1 });
      expect(mockClearWorkoutQueue).not.toHaveBeenCalled();
    });
  });
});
