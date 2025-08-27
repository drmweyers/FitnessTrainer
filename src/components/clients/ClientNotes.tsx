'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Textarea } from '@/components/shared/Textarea';
import { Card } from '@/components/shared/Card';
import { notesApi, ApiError } from '@/lib/api/clients';
import { ClientNote, NotesResponse } from '@/types/client';

interface ClientNotesProps {
  clientId: string;
}

export default function ClientNotes({ clientId }: ClientNotesProps) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notesApi.getNotes(clientId, { page, limit: pagination.limit });
      setNotes(response.notes);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch notes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchNotes();
    }
  }, [clientId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const addedNote = await notesApi.addNote(clientId, newNote.trim());
      setNotes(prev => [addedNote, ...prev]);
      setNewNote('');
      setShowAddForm(false);
      // Update pagination total
      setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to add note';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editText.trim()) return;

    setSubmitting(true);
    try {
      const updatedNote = await notesApi.updateNote(noteId, editText.trim());
      setNotes(prev => 
        prev.map(note => 
          note.id === noteId ? updatedNote : note
        )
      );
      setEditingNote(null);
      setEditText('');
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update note';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesApi.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      // Update pagination total
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to delete note';
      setError(errorMessage);
    }
  };

  const startEditing = (note: ClientNote) => {
    setEditingNote(note.id);
    setEditText(note.note);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditText('');
  };

  const handlePageChange = (page: number) => {
    fetchNotes(page);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <Card.Content className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Client Notes
          </h3>
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {pagination.total}
          </span>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          size="sm"
        >
          Add Note
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotes(pagination.page)}
            className="mt-2 border-red-300 text-red-700"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Add Note Form */}
      {showAddForm && (
        <Card>
          <Card.Content className="p-4">
            <div className="space-y-4">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this client..."
                rows={3}
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {newNote.length}/2000 characters
                </span>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewNote('');
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddNote}
                    size="sm"
                    isLoading={submitting}
                    disabled={!newNote.trim() || submitting}
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Notes List */}
      {notes.length === 0 && !loading ? (
        <Card>
          <Card.Content className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notes yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start documenting your observations, progress, and important information about this client.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add First Note
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <Card.Content className="p-4">
                <div className="flex items-start space-x-3">
                  {/* Avatar/Icon */}
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(note.createdAt)}</span>
                        {note.updatedAt && note.updatedAt !== note.createdAt && (
                          <span>(edited {formatDate(note.updatedAt)})</span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                          disabled={submitting}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={submitting}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    {editingNote === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {editText.length}/2000 characters
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              disabled={submitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleEditNote(note.id)}
                              size="sm"
                              isLoading={submitting}
                              disabled={!editText.trim() || submitting}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {note.note}
                      </p>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
          >
            Previous
          </Button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={loading}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}