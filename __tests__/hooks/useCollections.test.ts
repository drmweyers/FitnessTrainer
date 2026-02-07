/**
 * Tests for useCollections hook
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCollections } from '@/hooks/useCollections';

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

const mockCollectionList = [
  {
    id: 'col-1',
    name: 'Chest Day',
    description: 'Chest exercises',
    isPublic: false,
    exerciseCount: 3,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const mockCollectionDetail = {
  id: 'col-1',
  name: 'Chest Day',
  description: 'Chest exercises',
  userId: 'user-1',
  isPublic: false,
  exercises: [
    { exerciseId: 'ex-1' },
    { exerciseId: 'ex-2' },
  ],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('useCollections', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorageMock.clear();
    localStorageMock.setItem('accessToken', 'test-token');
  });

  it('loads collections on mount with autoLoad=true (default)', async () => {
    // List response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    // Detail response for col-1
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toHaveLength(1);
    expect(result.current.collections[0].name).toBe('Chest Day');
    expect(result.current.collections[0].exerciseIds).toEqual(['ex-1', 'ex-2']);
    expect(result.current.error).toBeNull();
  });

  it('does not load when autoLoad=false', async () => {
    renderHook(() => useCollections({ autoLoad: false }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sets empty collections on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toEqual([]);
  });

  it('falls back when detail fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    // Detail fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toHaveLength(1);
    expect(result.current.collections[0].exerciseIds).toEqual([]);
  });

  it('sets error on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch collections');
  });

  it('createCollection creates and adds to state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'col-new',
          name: 'New Col',
          description: 'desc',
          userId: 'user-1',
          isPublic: false,
          createdAt: '2024-06-01',
          updatedAt: '2024-06-01',
        },
      }),
    });

    let created: any;
    await act(async () => {
      created = await result.current.createCollection('New Col', 'desc');
    });

    expect(created.name).toBe('New Col');
    expect(result.current.collections).toHaveLength(1);
  });

  it('createCollection adds initial exercises', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Create collection response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'col-new',
          name: 'New',
          description: '',
          userId: 'user-1',
          isPublic: false,
          createdAt: '2024-06-01',
          updatedAt: '2024-06-01',
        },
      }),
    });
    // Add exercise responses
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    let created: any;
    await act(async () => {
      created = await result.current.createCollection('New', '', ['ex-1', 'ex-2']);
    });

    expect(created.exerciseIds).toEqual(['ex-1', 'ex-2']);
    // Verify the exercise add calls were made
    expect(mockFetch).toHaveBeenCalledTimes(4); // load + create + 2 adds
  });

  it('createCollection throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Duplicate name' }),
    });

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.createCollection('Dup', '');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).toBeDefined();
    expect(thrownError!.message).toBe('Duplicate name');
    expect(result.current.error).toBe('Duplicate name');
  });

  it('updateCollection updates local state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'col-1', name: 'Updated Name' } }),
    });

    await act(async () => {
      await result.current.updateCollection('col-1', { name: 'Updated Name' });
    });

    expect(result.current.collections[0].name).toBe('Updated Name');
  });

  it('updateCollection throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.updateCollection('col-1', { name: 'New' });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).toBeDefined();
    expect(thrownError!.message).toBe('Not found');
  });

  it('deleteCollection removes from local state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.deleteCollection('col-1');
    });

    expect(result.current.collections).toHaveLength(0);
  });

  it('deleteCollection throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Forbidden' }),
    });

    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.deleteCollection('col-1');
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError).toBeDefined();
    expect(thrownError!.message).toBe('Forbidden');
  });

  it('addToCollection updates exerciseIds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.addToCollection('col-1', 'ex-3');
    });

    expect(result.current.collections[0].exerciseIds).toContain('ex-3');
  });

  it('addToCollection does not duplicate existing exerciseId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.addToCollection('col-1', 'ex-1'); // already in collection
    });

    const exIds = result.current.collections[0].exerciseIds;
    expect(exIds.filter((id: string) => id === 'ex-1')).toHaveLength(1);
  });

  it('removeFromCollection removes exerciseId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      await result.current.removeFromCollection('col-1', 'ex-1');
    });

    expect(result.current.collections[0].exerciseIds).not.toContain('ex-1');
  });

  it('getCollection returns collection by id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    const found = result.current.getCollection('col-1');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Chest Day');

    const notFound = result.current.getCollection('nonexistent');
    expect(notFound).toBeUndefined();
  });

  it('isInCollection checks if exercise is in collection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    expect(result.current.isInCollection('col-1', 'ex-1')).toBe(true);
    expect(result.current.isInCollection('col-1', 'ex-999')).toBe(false);
    expect(result.current.isInCollection('nonexistent', 'ex-1')).toBe(false);
  });

  it('getExerciseCollections returns collections containing exercise', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.collections).toHaveLength(1);
    });

    const cols = result.current.getExerciseCollections('ex-1');
    expect(cols).toHaveLength(1);
    expect(cols[0].name).toBe('Chest Day');

    const noCols = result.current.getExerciseCollections('ex-999');
    expect(noCols).toHaveLength(0);
  });

  it('refreshCollections reloads from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionList }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockCollectionDetail }),
    });

    await act(async () => {
      await result.current.refreshCollections();
    });

    expect(result.current.collections).toHaveLength(1);
  });
});
