/**
 * @jest-environment jsdom
 */

/**
 * Tests for useNotes and useNote hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotes, useNote } from '@/hooks/useNotes';
import { notesApi, ApiError } from '@/lib/api/clients';

jest.mock('@/lib/api/clients', () => ({
  notesApi: {
    getNotes: jest.fn(),
    addNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
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

const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const MockApiError = ApiError;

const mockNote1 = {
  id: 'n1',
  trainerId: 't1',
  clientId: 'c1',
  note: 'First note',
  createdAt: '2024-01-01',
};

const mockNote2 = {
  id: 'n2',
  trainerId: 't1',
  clientId: 'c1',
  note: 'Second note',
  createdAt: '2024-01-02',
};

const mockPagination = {
  page: 1,
  limit: 10,
  total: 2,
  totalPages: 1,
};

describe('useNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('fetches notes on mount', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1, mockNote2],
      pagination: mockPagination,
    });

    const { result } = renderHook(() => useNotes('c1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockNotesApi.getNotes).toHaveBeenCalledWith('c1', { page: 1, limit: 10 });
    expect(result.current.notes).toEqual([mockNote1, mockNote2]);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when clientId is empty', async () => {
    const { result } = renderHook(() => useNotes(''));

    await waitFor(() => {
      // No fetch should happen
      expect(mockNotesApi.getNotes).not.toHaveBeenCalled();
    });
  });

  it('uses custom initial pagination', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });

    renderHook(() => useNotes('c1', { page: 1, limit: 25 }));

    await waitFor(() => {
      expect(mockNotesApi.getNotes).toHaveBeenCalledWith('c1', { page: 1, limit: 25 });
    });
  });

  it('handles fetch error with ApiError', async () => {
    mockNotesApi.getNotes.mockRejectedValue(new MockApiError('Forbidden', 403));

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Forbidden');
  });

  it('handles fetch error with generic error', async () => {
    mockNotesApi.getNotes.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch notes');
  });

  it('refreshNotes re-fetches from page 1', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1],
      pagination: mockPagination,
    });

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshNotes();
    });

    expect(mockNotesApi.getNotes).toHaveBeenCalledTimes(2);
    // Both calls should be for page 1
    expect(mockNotesApi.getNotes).toHaveBeenLastCalledWith('c1', { page: 1, limit: 10 });
  });

  it('loadMore appends notes from next page', async () => {
    const paginationMultiPage = { page: 1, limit: 10, total: 15, totalPages: 2 };
    mockNotesApi.getNotes
      .mockResolvedValueOnce({
        notes: [mockNote1],
        pagination: paginationMultiPage,
      })
      .mockResolvedValueOnce({
        notes: [mockNote2],
        pagination: { ...paginationMultiPage, page: 2 },
      });

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notes).toHaveLength(1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockNotesApi.getNotes).toHaveBeenLastCalledWith('c1', { page: 2, limit: 10 });
    expect(result.current.notes).toHaveLength(2);
    expect(result.current.notes).toEqual([mockNote1, mockNote2]);
  });

  it('loadMore does nothing on last page', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    // Should not have fetched again
    expect(mockNotesApi.getNotes).toHaveBeenCalledTimes(1);
  });

  it('loadMore does nothing when pagination is null', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockNotesApi.getNotes).toHaveBeenCalledTimes(1);
  });

  it('addNote prepends note to local state', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1],
      pagination: mockPagination,
    });

    const newNote = { id: 'n3', trainerId: 't1', clientId: 'c1', note: 'New!', createdAt: '2024-01-03' };
    mockNotesApi.addNote.mockResolvedValue({ data: newNote } as any);

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let added: any;
    await act(async () => {
      added = await result.current.addNote('c1', 'New!');
    });

    expect(added).toEqual(newNote);
    expect(result.current.notes[0]).toEqual(newNote);
    expect(result.current.pagination!.total).toBe(3); // was 2, now 3
  });

  it('addNote returns null on error', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [],
      pagination: mockPagination,
    });
    mockNotesApi.addNote.mockRejectedValue(new MockApiError('Bad request', 400));

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let added: any;
    await act(async () => {
      added = await result.current.addNote('c1', 'test');
    });

    expect(added).toBeNull();
    expect(result.current.error).toBe('Bad request');
  });

  it('updateNote updates note in local state', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1],
      pagination: mockPagination,
    });

    const updatedNote = { ...mockNote1, note: 'Updated!' };
    mockNotesApi.updateNote.mockResolvedValue({ data: updatedNote } as any);

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateNote('n1', 'Updated!');
    });

    expect(updated).toEqual(updatedNote);
    expect(result.current.notes[0].note).toBe('Updated!');
  });

  it('updateNote returns null on error', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1],
      pagination: mockPagination,
    });
    mockNotesApi.updateNote.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateNote('n1', 'fail');
    });

    expect(updated).toBeNull();
    expect(result.current.error).toBe('Failed to update note');
  });

  it('deleteNote removes note from local state and decrements total', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1, mockNote2],
      pagination: mockPagination,
    });
    mockNotesApi.deleteNote.mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: boolean = false;
    await act(async () => {
      deleted = await result.current.deleteNote('n1');
    });

    expect(deleted).toBe(true);
    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].id).toBe('n2');
    expect(result.current.pagination!.total).toBe(1); // was 2, now 1
  });

  it('deleteNote returns false on error', async () => {
    mockNotesApi.getNotes.mockResolvedValue({
      notes: [mockNote1],
      pagination: mockPagination,
    });
    mockNotesApi.deleteNote.mockRejectedValue(new MockApiError('Not found', 404));

    const { result } = renderHook(() => useNotes('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deleted: boolean = true;
    await act(async () => {
      deleted = await result.current.deleteNote('n1');
    });

    expect(deleted).toBe(false);
    expect(result.current.error).toBe('Not found');
  });
});

describe('useNote', () => {
  it('initializes with empty string by default', () => {
    const { result } = renderHook(() => useNote());

    expect(result.current.note).toBe('');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initializes with provided initial note', () => {
    const { result } = renderHook(() => useNote('initial text'));

    expect(result.current.note).toBe('initial text');
    expect(result.current.isDirty).toBe(false);
  });

  it('tracks dirty state when note changes', () => {
    const { result } = renderHook(() => useNote('original'));

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setNote('modified');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setNote('original');
    });

    expect(result.current.isDirty).toBe(false);
  });

  it('saveNote returns true when not dirty', async () => {
    const onSave = jest.fn();
    const { result } = renderHook(() => useNote('text', onSave));

    let saved: boolean = false;
    await act(async () => {
      saved = await result.current.saveNote();
    });

    expect(saved).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saveNote returns true when no onSave handler', async () => {
    const { result } = renderHook(() => useNote('text'));

    act(() => {
      result.current.setNote('changed');
    });

    let saved: boolean = false;
    await act(async () => {
      saved = await result.current.saveNote();
    });

    expect(saved).toBe(true);
  });

  it('saveNote calls onSave and updates original on success', async () => {
    const savedNote = { id: 'n1', note: 'modified', trainerId: 't1', clientId: 'c1', createdAt: '2024-01-01' };
    const onSave = jest.fn().mockResolvedValue(savedNote);

    const { result } = renderHook(() => useNote('original', onSave));

    act(() => {
      result.current.setNote('modified');
    });

    expect(result.current.isDirty).toBe(true);

    let saved: boolean = false;
    await act(async () => {
      saved = await result.current.saveNote();
    });

    expect(saved).toBe(true);
    expect(onSave).toHaveBeenCalledWith('modified');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('saveNote returns false when onSave returns null', async () => {
    const onSave = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useNote('original', onSave));

    act(() => {
      result.current.setNote('modified');
    });

    let saved: boolean = true;
    await act(async () => {
      saved = await result.current.saveNote();
    });

    expect(saved).toBe(false);
    expect(result.current.isDirty).toBe(true); // Still dirty since save failed
  });

  it('saveNote handles error from onSave', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useNote('original', onSave));

    act(() => {
      result.current.setNote('modified');
    });

    let saved: boolean = true;
    await act(async () => {
      saved = await result.current.saveNote();
    });

    expect(saved).toBe(false);
    expect(result.current.error).toBe('Save failed');
    expect(result.current.loading).toBe(false);
  });

  it('saveNote handles non-Error thrown', async () => {
    const onSave = jest.fn().mockRejectedValue('string error');

    const { result } = renderHook(() => useNote('original', onSave));

    act(() => {
      result.current.setNote('modified');
    });

    let saved: boolean = true;
    await act(async () => {
      saved = await result.current.saveNote();
    });

    expect(saved).toBe(false);
    expect(result.current.error).toBe('Failed to save note');
  });

  it('updates when initialNote prop changes', () => {
    const { result, rerender } = renderHook(
      ({ initialNote }) => useNote(initialNote),
      { initialProps: { initialNote: 'first' } }
    );

    expect(result.current.note).toBe('first');

    rerender({ initialNote: 'second' });

    expect(result.current.note).toBe('second');
    expect(result.current.isDirty).toBe(false);
  });
});
