/**
 * @jest-environment node
 */

import { syncOfflineData } from '@/lib/offline/syncManager';

// Mock indexedDB module
jest.mock('@/lib/offline/indexedDB', () => ({
  getWorkoutQueue: jest.fn(),
  clearWorkoutQueue: jest.fn().mockResolvedValue(undefined),
}));

const { getWorkoutQueue, clearWorkoutQueue } = jest.requireMock('@/lib/offline/indexedDB');

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
  },
  writable: true,
});

// Mock window for typeof check
Object.defineProperty(global, 'window', {
  value: global,
  writable: true,
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('syncManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockLocalStorage['accessToken'] = 'test-token';
    getWorkoutQueue.mockResolvedValue([]);
    clearWorkoutQueue.mockResolvedValue(undefined);
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns zero counts when queue is empty', async () => {
    getWorkoutQueue.mockResolvedValue([]);
    const result = await syncOfflineData();
    expect(result).toEqual({ synced: 0, failed: 0, conflicts: 0, errors: [] });
  });

  it('returns failed count when no auth token', async () => {
    delete mockLocalStorage['accessToken'];
    getWorkoutQueue.mockResolvedValue([
      { action: 'workouts', data: { id: '1' }, createdAt: Date.now() },
      { action: 'workouts', data: { id: '2' }, createdAt: Date.now() },
    ]);

    const result = await syncOfflineData();
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.errors).toContain('No authentication token available');
  });

  it('syncs items successfully and returns correct counts', async () => {
    getWorkoutQueue.mockResolvedValue([
      { action: 'workouts', data: { id: '1' }, createdAt: Date.now() },
      { action: 'workouts', data: { id: '2' }, createdAt: Date.now() },
      { action: 'workouts', data: { id: '3' }, createdAt: Date.now() },
    ]);

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await syncOfflineData();
    expect(result.synced).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.conflicts).toBe(0);
    expect(result.errors).toEqual([]);
    expect(clearWorkoutQueue).toHaveBeenCalled();
  });

  it('retries on server error with backoff', async () => {
    getWorkoutQueue.mockResolvedValue([
      { action: 'workouts', data: { id: '1' }, createdAt: Date.now() },
    ]);

    // First two calls fail with 500, third succeeds
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    // Run syncOfflineData but let timers advance for backoff delays
    const syncPromise = syncOfflineData();

    // Advance timers for first backoff (1000ms)
    await jest.advanceTimersByTimeAsync(1000);
    // Advance timers for second backoff (2000ms)
    await jest.advanceTimersByTimeAsync(2000);

    const result = await syncPromise;
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(callCount).toBe(3);
  });

  it('fails after max retries (7 attempts total)', async () => {
    getWorkoutQueue.mockResolvedValue([
      { action: 'workouts', data: { id: '1' }, createdAt: Date.now() },
    ]);

    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const syncPromise = syncOfflineData();

    // Advance through all 6 backoff delays
    for (const delayMs of [1000, 2000, 4000, 8000, 16000, 30000]) {
      await jest.advanceTimersByTimeAsync(delayMs);
    }

    const result = await syncPromise;
    expect(result.failed).toBe(1);
    expect(result.synced).toBe(0);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain('Server error');
  });

  it('detects conflict (409) and skips when server data is newer', async () => {
    const oldLocalTime = new Date('2024-01-01').toISOString();
    const newServerTime = new Date('2024-06-01').toISOString();

    getWorkoutQueue.mockResolvedValue([
      {
        action: 'workouts',
        data: { id: '1', updatedAt: oldLocalTime },
        createdAt: new Date('2024-01-01').getTime(),
      },
    ]);

    const conflictResponse = {
      ok: false,
      status: 409,
      clone: () => ({
        json: () => Promise.resolve({ data: { updatedAt: newServerTime } }),
      }),
    };
    mockFetch.mockResolvedValue(conflictResponse);

    const result = await syncOfflineData();
    expect(result.conflicts).toBe(1);
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
    // Conflicts still trigger clearWorkoutQueue
    expect(clearWorkoutQueue).toHaveBeenCalled();
  });

  it('handles partial failure - some items sync, some fail', async () => {
    getWorkoutQueue.mockResolvedValue([
      { action: 'workouts', data: { id: '1' }, createdAt: Date.now() },
      { action: 'workouts', data: { id: '2' }, createdAt: Date.now() },
      { action: 'workouts', data: { id: '3' }, createdAt: Date.now() },
    ]);

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        // Second item fails with client error (no retry)
        return Promise.resolve({ ok: false, status: 400 });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    const result = await syncOfflineData();
    expect(result.synced).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(clearWorkoutQueue).toHaveBeenCalled();
  });

  it('handles network errors (fetch throws)', async () => {
    getWorkoutQueue.mockResolvedValue([
      { action: 'workouts', data: { id: '1' }, createdAt: Date.now() },
    ]);

    mockFetch.mockRejectedValue(new Error('Network error'));

    const syncPromise = syncOfflineData();

    // Advance through all backoff delays for the retry loop
    for (const delayMs of [1000, 2000, 4000, 8000, 16000, 30000]) {
      await jest.advanceTimersByTimeAsync(delayMs);
    }

    const result = await syncPromise;
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('Network error');
  });
});
