import { useState, useEffect, useCallback } from 'react';
import { 
  ClientNote, 
  NotesResponse, 
  NotePagination 
} from '@/types/client';
import { notesApi, ApiError } from '@/lib/api/clients';

interface UseNotesReturn {
  notes: ClientNote[];
  loading: boolean;
  error: string | null;
  pagination: NotesResponse['pagination'] | null;
  addNote: (clientId: string, note: string) => Promise<ClientNote | null>;
  updateNote: (noteId: string, note: string) => Promise<ClientNote | null>;
  deleteNote: (noteId: string) => Promise<boolean>;
  refreshNotes: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useNotes = (
  clientId: string,
  initialPagination: NotePagination = { page: 1, limit: 10 }
): UseNotesReturn => {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<NotesResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination.page || 1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotes = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!clientId) return;

    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const response = await notesApi.getNotes(clientId, {
        page,
        limit: initialPagination.limit,
      });

      if (append) {
        setNotes(prev => [...prev, ...response.notes]);
      } else {
        setNotes(response.notes);
      }
      
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch notes';
      setError(errorMessage);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [clientId, initialPagination.limit]);

  useEffect(() => {
    fetchNotes(1, false);
  }, [fetchNotes]);

  const refreshNotes = useCallback(async () => {
    await fetchNotes(1, false);
    setCurrentPage(1);
  }, [fetchNotes]);

  const loadMore = useCallback(async () => {
    if (pagination && currentPage < pagination.totalPages && !loadingMore) {
      await fetchNotes(currentPage + 1, true);
    }
  }, [fetchNotes, pagination, currentPage, loadingMore]);

  const addNote = useCallback(async (clientId: string, note: string): Promise<ClientNote | null> => {
    try {
      const response = await notesApi.addNote(clientId, note);
      const newNote = response.data;
      
      // Add to the beginning of the list
      setNotes(prev => [newNote, ...prev]);
      
      // Update pagination total
      setPagination(prev => prev ? { ...prev, total: prev.total + 1 } : null);
      
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to add note';
      setError(errorMessage);
      console.error('Error adding note:', err);
      return null;
    }
  }, []);

  const updateNote = useCallback(async (noteId: string, note: string): Promise<ClientNote | null> => {
    try {
      const response = await notesApi.updateNote(noteId, note);
      const updatedNote = response.data;
      
      // Update in local state
      setNotes(prev => 
        prev.map(n => 
          n.id === noteId ? updatedNote : n
        )
      );
      
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update note';
      setError(errorMessage);
      console.error('Error updating note:', err);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      await notesApi.deleteNote(noteId);
      
      // Remove from local state
      setNotes(prev => prev.filter(n => n.id !== noteId));
      
      // Update pagination total
      setPagination(prev => prev ? { ...prev, total: prev.total - 1 } : null);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to delete note';
      setError(errorMessage);
      console.error('Error deleting note:', err);
      return false;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    pagination,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
    loadMore,
  };
};

// Hook for managing a single note
interface UseNoteReturn {
  note: string;
  loading: boolean;
  error: string | null;
  setNote: (note: string) => void;
  saveNote: () => Promise<boolean>;
  isDirty: boolean;
}

export const useNote = (
  initialNote: string = '',
  onSave?: (note: string) => Promise<ClientNote | null>
): UseNoteReturn => {
  const [note, setNote] = useState(initialNote);
  const [originalNote, setOriginalNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNote(initialNote);
    setOriginalNote(initialNote);
  }, [initialNote]);

  const isDirty = note !== originalNote;

  const saveNote = useCallback(async (): Promise<boolean> => {
    if (!onSave || !isDirty) return true;

    setLoading(true);
    setError(null);

    try {
      const result = await onSave(note);
      if (result) {
        setOriginalNote(note);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to save note';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [note, originalNote, onSave, isDirty]);

  return {
    note,
    loading,
    error,
    setNote,
    saveNote,
    isDirty,
  };
};