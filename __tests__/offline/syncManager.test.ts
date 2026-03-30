/** @jest-environment node */

import { syncOfflineData, SyncResult } from '@/lib/offline/syncManager';

// Mock indexedDB module
jest.mock('@/lib/offline/indexedDB', () => ({
  getWorkoutQueue: jest.fn(),
  clearWorkoutQueue: jest.fn().mockResolvedValue(undefined),
}));

// Mock setTimeout to make backoff delays instant
jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
  fn();
  return 0 as any;
});

import { getWorkoutQueue, clearWorkoutQueue } from '@/lib/offline/indexedDB';

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(global, 'window', { value: global, writable: true });
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

describe('syncOfflineData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (clearWorkoutQueue as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns empty result when queue is empty', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([]);
    const result = await syncOfflineData();
    expect(result).toEqual({ synced: 0, failed: 0, conflicts: 0, errors: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns failed result when no auth token', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: { workoutId: 'w1' }, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue(null);

    const result = await syncOfflineData();
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('authentication');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('syncs items successfully', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: { workoutId: 'w1' }, createdAt: Date.now() },
      { id: '2', action: 'workouts/complete', data: { workoutId: 'w2' }, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue('test-token');
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await syncOfflineData();
    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.conflicts).toBe(0);
    expect(clearWorkoutQueue).toHaveBeenCalled();
  });

  it('counts failed items when API returns 4xx', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: {}, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue('test-token');
    mockFetch.mockResolvedValue({ ok: false, status: 400 });

    const result = await syncOfflineData();
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('400');
  });

  it('handles conflict (409 response) - server wins', async () => {
    const serverData = { data: { updatedAt: new Date(Date.now() + 10000).toISOString() } };
    const queueItem = {
      id: '1',
      action: 'workouts/complete',
      data: { workoutId: 'w1', updatedAt: new Date(Date.now() - 10000).toISOString() },
      createdAt: Date.now(),
    };
    (getWorkoutQueue as jest.Mock).mockResolvedValue([queueItem]);
    localStorageMock.getItem.mockReturnValue('test-token');

    // Return 409 with server having newer timestamp
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      clone: jest.fn().mockReturnValue({
        json: jest.fn().mockResolvedValue(serverData),
      }),
    });

    const result = await syncOfflineData();
    expect(result.conflicts).toBe(1);
    expect(result.synced).toBe(0);
    expect(clearWorkoutQueue).toHaveBeenCalled();
  });

  it('handles conflict (409 response) - local wins, force syncs', async () => {
    const queueItem = {
      id: '1',
      action: 'workouts/complete',
      data: { workoutId: 'w1', updatedAt: new Date(Date.now() + 10000).toISOString() },
      createdAt: Date.now(),
    };
    (getWorkoutQueue as jest.Mock).mockResolvedValue([queueItem]);
    localStorageMock.getItem.mockReturnValue('test-token');

    const serverData = { data: { updatedAt: new Date(Date.now() - 10000).toISOString() } };
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 409,
          clone: jest.fn().mockReturnValue({
            json: jest.fn().mockResolvedValue(serverData),
          }),
        });
      }
      // Force sync succeeds
      return Promise.resolve({ ok: true, status: 200 });
    });

    const result = await syncOfflineData();
    expect(result.synced).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Second call should have X-Force-Overwrite header
    const secondCall = mockFetch.mock.calls[1][1];
    expect(secondCall.headers['X-Force-Overwrite']).toBe('true');
  });

  it('handles conflict where force sync fails', async () => {
    const queueItem = {
      id: '1',
      action: 'workouts/complete',
      data: { workoutId: 'w1', updatedAt: new Date(Date.now() + 10000).toISOString() },
      createdAt: Date.now(),
    };
    (getWorkoutQueue as jest.Mock).mockResolvedValue([queueItem]);
    localStorageMock.getItem.mockReturnValue('test-token');

    const serverData = { data: { updatedAt: new Date(Date.now() - 10000).toISOString() } };
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 409,
          clone: jest.fn().mockReturnValue({
            json: jest.fn().mockResolvedValue(serverData),
          }),
        });
      }
      // Use 4xx so fetchWithRetry returns immediately without retries
      return Promise.resolve({ ok: false, status: 422 });
    });

    const result = await syncOfflineData();
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('Force sync failed');
  });

  it('handles multiple queue items - mixed results', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: {}, createdAt: Date.now() },
      { id: '2', action: 'workouts/complete', data: {}, createdAt: Date.now() },
      { id: '3', action: 'workouts/complete', data: {}, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue('test-token');
    // First 2 succeed, last one returns 400
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 400 });

    const result = await syncOfflineData();
    expect(result.synced).toBe(2);
    expect(result.failed).toBe(1);
    expect(clearWorkoutQueue).toHaveBeenCalled();
  });

  it('handles network error (fetch rejects) - counts as failed', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: {}, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue('test-token');
    // After retries exhaust (all rejections), syncOfflineData catches and counts as failed
    // To avoid 6 retries timing out, return 4xx on all retries after first rejection
    mockFetch
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValue({ ok: false, status: 400 }); // 4xx does NOT trigger retry

    const result = await syncOfflineData();
    expect(result.failed).toBe(1);
  });

  it('does not clear queue when nothing synced or conflicts', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: {}, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue('test-token');
    mockFetch.mockResolvedValue({ ok: false, status: 400 });

    await syncOfflineData();
    expect(clearWorkoutQueue).not.toHaveBeenCalled();
  });

  it('sends request with auth header', async () => {
    (getWorkoutQueue as jest.Mock).mockResolvedValue([
      { id: '1', action: 'workouts/complete', data: { x: 1 }, createdAt: Date.now() },
    ]);
    localStorageMock.getItem.mockReturnValue('my-jwt-token');
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await syncOfflineData();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/workouts/complete',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt-token',
        }),
      })
    );
  });

  it('handles conflict where server JSON parse fails - server wins by default', async () => {
    const queueItem = {
      id: '1',
      action: 'workouts/complete',
      data: { workoutId: 'w1', updatedAt: new Date(Date.now() + 10000).toISOString() },
      createdAt: Date.now(),
    };
    (getWorkoutQueue as jest.Mock).mockResolvedValue([queueItem]);
    localStorageMock.getItem.mockReturnValue('test-token');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      clone: jest.fn().mockReturnValue({
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      }),
    });

    const result = await syncOfflineData();
    // Server wins when can't parse - conflict counted
    expect(result.conflicts).toBe(1);
  });
});
