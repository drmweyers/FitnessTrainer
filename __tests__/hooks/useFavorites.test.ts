/**
 * Tests for useFavorites hook
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFavorites } from '@/hooks/useFavorites';

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useFavorites', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
    localStorageMock.setItem('accessToken', 'test-token');
  });

  it('loads favorites on mount with autoSync=true (default)', async () => {
    const mockData = [
      { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].exerciseId).toBe('ex-1');
    expect(result.current.favoriteExerciseIds.has('ex-1')).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('does not load favorites when autoSync=false', async () => {
    const { result } = renderHook(() => useFavorites({ autoSync: false }));

    // fetch should not have been called for initial load
    // but loading is still initially true; the hook sets it in the effect
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sets empty favorites on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.favorites).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch favorites');
  });

  it('sets error on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network down');
  });

  it('isFavorited returns correct status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
        ],
      }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFavorited('ex-1')).toBe(true);
    expect(result.current.isFavorited('ex-999')).toBe(false);
  });

  it('addFavorite adds to local state', async () => {
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add favorite
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: 'fav-new', userId: 'user-1', exerciseId: 'ex-2', favoritedAt: '2024-06-01' },
      }),
    });

    await act(async () => {
      await result.current.addFavorite('ex-2');
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.isFavorited('ex-2')).toBe(true);
  });

  it('addFavorite throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Already exists' }),
    });

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.addFavorite('ex-2');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).toBeDefined();
    expect(thrownError!.message).toBe('Already exists');
    expect(result.current.error).toBe('Already exists');
  });

  it('removeFavorite removes from local state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
        ],
      }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.favorites).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.removeFavorite('ex-1');
    });

    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.isFavorited('ex-1')).toBe(false);
  });

  it('removeFavorite throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
        ],
      }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.favorites).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.removeFavorite('ex-1');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).toBeDefined();
    expect(thrownError!.message).toBe('Not found');
    expect(result.current.error).toBe('Not found');
  });

  it('toggleFavorite adds if not favorited', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: 'fav-new', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-06-01' },
      }),
    });

    await act(async () => {
      await result.current.toggleFavorite('ex-1');
    });

    expect(result.current.isFavorited('ex-1')).toBe(true);
  });

  it('toggleFavorite removes if already favorited', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
        ],
      }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isFavorited('ex-1')).toBe(true);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.toggleFavorite('ex-1');
    });

    expect(result.current.isFavorited('ex-1')).toBe(false);
  });

  it('clearFavorites removes all favorites', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
          { id: 'fav-2', userId: 'user-1', exerciseId: 'ex-2', favoritedAt: '2024-01-02' },
        ],
      }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.favorites).toHaveLength(2);
    });

    // Mock DELETE calls for each favorite
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.clearFavorites();
    });

    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.favoriteExerciseIds.size).toBe(0);
  });

  it('refreshFavorites reloads from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', favoritedAt: '2024-01-01' },
        ],
      }),
    });

    await act(async () => {
      await result.current.refreshFavorites();
    });

    expect(result.current.favorites).toHaveLength(1);
  });

  it('handles null data from API response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // data: null should be treated as empty via `|| []`
    expect(result.current.favorites).toEqual([]);
  });

  it('includes auth token in request headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers.Authorization).toBe('Bearer test-token');
  });
});
