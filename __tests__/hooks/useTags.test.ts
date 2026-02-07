/**
 * @jest-environment jsdom
 */

/**
 * Tests for useTags and useClientTags hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTags, useClientTags } from '@/hooks/useTags';
import { tagsApi, ApiError } from '@/lib/api/clients';

jest.mock('@/lib/api/clients', () => ({
  tagsApi: {
    getTags: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
    assignTags: jest.fn(),
    removeTags: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));

const mockTagsApi = tagsApi as jest.Mocked<typeof tagsApi>;
const MockApiError = ApiError;

const mockTag1 = { id: 'tag1', name: 'VIP', color: '#ff0000', trainerId: 't1' };
const mockTag2 = { id: 'tag2', name: 'New', color: '#00ff00', trainerId: 't1' };
const mockTag3 = { id: 'tag3', name: 'Premium', color: '#0000ff', trainerId: 't1' };

describe('useTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('fetches tags on mount', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2] as any);

    const { result } = renderHook(() => useTags());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tags).toEqual([mockTag1, mockTag2]);
    expect(result.current.error).toBeNull();
  });

  it('sets empty array when response is falsy', async () => {
    mockTagsApi.getTags.mockResolvedValue(null as any);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tags).toEqual([]);
  });

  it('handles fetch error with ApiError', async () => {
    mockTagsApi.getTags.mockRejectedValue(new MockApiError('Unauthorized', 401));

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Unauthorized');
  });

  it('handles fetch error with generic error', async () => {
    mockTagsApi.getTags.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch tags');
  });

  it('refreshTags re-fetches data', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshTags();
    });

    expect(mockTagsApi.getTags).toHaveBeenCalledTimes(2);
  });

  it('createTag adds tag to local state', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.createTag.mockResolvedValue({ data: mockTag2 } as any);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let created: any;
    await act(async () => {
      created = await result.current.createTag({ name: 'New', color: '#00ff00' });
    });

    expect(created).toEqual(mockTag2);
    expect(result.current.tags).toHaveLength(2);
    expect(result.current.tags).toContainEqual(mockTag2);
  });

  it('createTag returns null on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([]);
    mockTagsApi.createTag.mockRejectedValue(new MockApiError('Duplicate', 409));

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let created: any;
    await act(async () => {
      created = await result.current.createTag({ name: 'VIP', color: '#ff0000' });
    });

    expect(created).toBeNull();
    expect(result.current.error).toBe('Duplicate');
  });

  it('updateTag updates tag in local state', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    const updatedTag = { ...mockTag1, name: 'SuperVIP' };
    mockTagsApi.updateTag.mockResolvedValue({ data: updatedTag } as any);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateTag('tag1', { name: 'SuperVIP' });
    });

    expect(updated).toEqual(updatedTag);
    expect(result.current.tags[0].name).toBe('SuperVIP');
  });

  it('updateTag returns null on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.updateTag.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateTag('tag1', { name: 'fail' });
    });

    expect(updated).toBeNull();
    expect(result.current.error).toBe('Failed to update tag');
  });

  it('deleteTag removes tag from local state', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2]);
    mockTagsApi.deleteTag.mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: boolean = false;
    await act(async () => {
      deleted = await result.current.deleteTag('tag1');
    });

    expect(deleted).toBe(true);
    expect(result.current.tags).toHaveLength(1);
    expect(result.current.tags[0].id).toBe('tag2');
  });

  it('deleteTag returns false on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.deleteTag.mockRejectedValue(new MockApiError('Not found', 404));

    const { result } = renderHook(() => useTags());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: boolean = true;
    await act(async () => {
      deleted = await result.current.deleteTag('tag1');
    });

    expect(deleted).toBe(false);
    expect(result.current.error).toBe('Not found');
  });
});

describe('useClientTags', () => {
  // Stable references to avoid infinite re-render from useEffect([initialClientTags])
  const emptyTags: any[] = [];
  const tag1Only = [mockTag1];
  const tags12 = [mockTag1, mockTag2];
  const tags123 = [mockTag1, mockTag2, mockTag3];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('initializes with provided client tags', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2, mockTag3]);

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: tag1Only } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clientTags).toEqual([mockTag1]);
    expect(result.current.availableTags).toEqual([mockTag2, mockTag3]);
  });

  it('assignTag adds tag to client tags', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2]);
    mockTagsApi.assignTags.mockResolvedValue({} as any);

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: emptyTags } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let assigned: boolean = false;
    await act(async () => {
      assigned = await result.current.assignTag('tag1');
    });

    expect(assigned).toBe(true);
    expect(mockTagsApi.assignTags).toHaveBeenCalledWith('c1', ['tag1']);
    expect(result.current.clientTags).toContainEqual(mockTag1);
  });

  it('assignTag returns false on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.assignTags.mockRejectedValue(new MockApiError('Failed', 500));

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: emptyTags } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let assigned: boolean = true;
    await act(async () => {
      assigned = await result.current.assignTag('tag1');
    });

    expect(assigned).toBe(false);
    expect(result.current.error).toBe('Failed');
  });

  it('removeTag removes tag from client tags', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2]);
    mockTagsApi.removeTags.mockResolvedValue({} as any);

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: tags12 } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let removed: boolean = false;
    await act(async () => {
      removed = await result.current.removeTag('tag1');
    });

    expect(removed).toBe(true);
    expect(mockTagsApi.removeTags).toHaveBeenCalledWith('c1', ['tag1']);
    expect(result.current.clientTags).toHaveLength(1);
    expect(result.current.clientTags[0].id).toBe('tag2');
  });

  it('removeTag returns false on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.removeTags.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: tag1Only } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let removed: boolean = true;
    await act(async () => {
      removed = await result.current.removeTag('tag1');
    });

    expect(removed).toBe(false);
    expect(result.current.error).toBe('Failed to remove tag');
  });

  it('assignMultipleTags adds multiple tags', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2, mockTag3]);
    mockTagsApi.assignTags.mockResolvedValue({} as any);

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: emptyTags } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let assigned: boolean = false;
    await act(async () => {
      assigned = await result.current.assignMultipleTags(['tag1', 'tag2']);
    });

    expect(assigned).toBe(true);
    expect(mockTagsApi.assignTags).toHaveBeenCalledWith('c1', ['tag1', 'tag2']);
    expect(result.current.clientTags).toHaveLength(2);
  });

  it('assignMultipleTags returns false on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.assignTags.mockRejectedValue(new MockApiError('Bad request', 400));

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: emptyTags } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let assigned: boolean = true;
    await act(async () => {
      assigned = await result.current.assignMultipleTags(['tag1']);
    });

    expect(assigned).toBe(false);
    expect(result.current.error).toBe('Bad request');
  });

  it('removeMultipleTags removes multiple tags', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1, mockTag2, mockTag3]);
    mockTagsApi.removeTags.mockResolvedValue({} as any);

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: tags123 } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let removed: boolean = false;
    await act(async () => {
      removed = await result.current.removeMultipleTags(['tag1', 'tag3']);
    });

    expect(removed).toBe(true);
    expect(result.current.clientTags).toHaveLength(1);
    expect(result.current.clientTags[0].id).toBe('tag2');
  });

  it('removeMultipleTags returns false on error', async () => {
    mockTagsApi.getTags.mockResolvedValue([mockTag1]);
    mockTagsApi.removeTags.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: tag1Only } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let removed: boolean = true;
    await act(async () => {
      removed = await result.current.removeMultipleTags(['tag1']);
    });

    expect(removed).toBe(false);
    expect(result.current.error).toBe('Failed to remove tags');
  });

  it('refreshClientTags resolves without error', async () => {
    mockTagsApi.getTags.mockResolvedValue([]);

    const { result } = renderHook(
      ({ clientId, initTags }) => useClientTags(clientId, initTags),
      { initialProps: { clientId: 'c1', initTags: emptyTags } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshClientTags();
    });

    // No error - just verifying it resolves
    expect(result.current.error).toBeNull();
  });
});
