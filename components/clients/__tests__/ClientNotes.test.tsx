/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientNotes from '../ClientNotes';

// Mock the API module
const mockGetNotes = jest.fn();
const mockAddNote = jest.fn();
const mockUpdateNote = jest.fn();
const mockDeleteNote = jest.fn();

jest.mock('@/lib/api/clients', () => ({
  notesApi: {
    getNotes: (...args: any[]) => mockGetNotes(...args),
    addNote: (...args: any[]) => mockAddNote(...args),
    updateNote: (...args: any[]) => mockUpdateNote(...args),
    deleteNote: (...args: any[]) => mockDeleteNote(...args),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
  Edit: (props: any) => <span data-testid="icon-edit" {...props} />,
  Trash2: (props: any) => <span data-testid="icon-trash" {...props} />,
  Save: (props: any) => <span data-testid="icon-save" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  MessageSquare: (props: any) => <span data-testid="icon-message" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

const mockNotes = [
  {
    id: 'note-1',
    trainerId: 'trainer-1',
    clientId: 'client-1',
    note: 'First session went well',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: undefined,
  },
  {
    id: 'note-2',
    trainerId: 'trainer-1',
    clientId: 'client-1',
    note: 'Working on form improvements',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockNotesResponse = {
  notes: mockNotes,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

describe('ClientNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotes.mockResolvedValue(mockNotesResponse);
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('shows loading skeleton initially', () => {
      mockGetNotes.mockReturnValue(new Promise(() => {})); // never resolves
      const { container } = render(<ClientNotes clientId="client-1" />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('After Loading', () => {
    it('renders header with title "Client Notes"', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Client Notes')).toBeInTheDocument();
      });
    });

    it('renders total notes count badge', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('renders Add Note button', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });
    });

    it('renders note content', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
        expect(screen.getByText('Working on form improvements')).toBeInTheDocument();
      });
    });

    it('renders edited indicator for updated notes', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        const editedText = screen.getByText(/edited/);
        expect(editedText).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no notes exist', async () => {
      mockGetNotes.mockResolvedValue({
        notes: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('No notes yet')).toBeInTheDocument();
        expect(screen.getByText('Add First Note')).toBeInTheDocument();
      });
    });
  });

  describe('Add Note', () => {
    it('shows add form when Add Note is clicked', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Note'));
      expect(screen.getByPlaceholderText('Add a note about this client...')).toBeInTheDocument();
      expect(screen.getByText('Save Note')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows character count', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Note'));
      expect(screen.getByText('0/2000 characters')).toBeInTheDocument();
    });

    it('hides add form when Cancel is clicked', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Note'));
      expect(screen.getByPlaceholderText('Add a note about this client...')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText('Add a note about this client...')).not.toBeInTheDocument();
    });

    it('submits note when Save Note is clicked', async () => {
      const newNote = {
        id: 'note-3',
        trainerId: 'trainer-1',
        clientId: 'client-1',
        note: 'New test note',
        createdAt: new Date().toISOString(),
      };
      mockAddNote.mockResolvedValue(newNote);

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Note'));

      const textarea = screen.getByPlaceholderText('Add a note about this client...');
      fireEvent.change(textarea, { target: { value: 'New test note' } });
      fireEvent.click(screen.getByText('Save Note'));

      await waitFor(() => {
        expect(mockAddNote).toHaveBeenCalledWith('client-1', 'New test note');
      });
    });

    it('disables Save Note when text is empty', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Add Note'));
      const saveBtn = screen.getByText('Save Note');
      expect(saveBtn.closest('button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error when fetching notes fails', async () => {
      mockGetNotes.mockRejectedValue(new Error('Network error'));
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch notes')).toBeInTheDocument();
      });
    });

    it('shows Try Again button on error', async () => {
      mockGetNotes.mockRejectedValue(new Error('Network error'));
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Note', () => {
    it('calls deleteNote API when deleting', async () => {
      mockDeleteNote.mockResolvedValue(undefined);
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      // Find delete buttons (icon-trash)
      const trashIcons = screen.getAllByTestId('icon-trash');
      fireEvent.click(trashIcons[0].closest('button')!);

      await waitFor(() => {
        expect(mockDeleteNote).toHaveBeenCalledWith('note-1');
      });
    });

    it('does not delete when confirm is cancelled', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const trashIcons = screen.getAllByTestId('icon-trash');
      fireEvent.click(trashIcons[0].closest('button')!);
      expect(mockDeleteNote).not.toHaveBeenCalled();
    });
  });

  describe('Edit Note', () => {
    it('shows edit form when edit button is clicked', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const editIcons = screen.getAllByTestId('icon-edit');
      fireEvent.click(editIcons[0].closest('button')!);

      // Edit form should show the text in a textarea
      const textareas = document.querySelectorAll('textarea');
      const editTextarea = Array.from(textareas).find(
        (ta) => ta.value === 'First session went well'
      );
      expect(editTextarea).toBeTruthy();
    });
  });

  describe('API Calls', () => {
    it('fetches notes on mount with clientId', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(mockGetNotes).toHaveBeenCalledWith('client-1', { page: 1, limit: 10 });
      });
    });

    it('does not fetch notes when clientId is empty', () => {
      render(<ClientNotes clientId="" />);
      expect(mockGetNotes).not.toHaveBeenCalled();
    });
  });

  describe('Add Note Error Handling', () => {
    it('shows error when adding note fails with ApiError', async () => {
      const ApiError = require('@/lib/api/clients').ApiError;
      mockAddNote.mockRejectedValue(new ApiError('Server error'));

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Note'));
      const textarea = screen.getByPlaceholderText('Add a note about this client...');
      fireEvent.change(textarea, { target: { value: 'New note' } });

      const saveBtn = screen.getByText('Save Note');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('shows generic error when adding note fails with unknown error', async () => {
      mockAddNote.mockRejectedValue(new Error('Unknown error'));

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Note'));
      const textarea = screen.getByPlaceholderText('Add a note about this client...');
      fireEvent.change(textarea, { target: { value: 'New note' } });

      const saveBtn = screen.getByText('Save Note');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Failed to add note')).toBeInTheDocument();
      });
    });

    it('does not submit if note text is empty or whitespace', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Note'));
      const textarea = screen.getByPlaceholderText('Add a note about this client...');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const saveBtn = screen.getByText('Save Note');
      fireEvent.click(saveBtn);

      expect(mockAddNote).not.toHaveBeenCalled();
    });
  });

  describe('Edit Note Error Handling', () => {
    it('shows error when updating note fails with ApiError', async () => {
      const ApiError = require('@/lib/api/clients').ApiError;
      mockUpdateNote.mockRejectedValue(new ApiError('Update failed'));

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const editIcons = screen.getAllByTestId('icon-edit');
      fireEvent.click(editIcons[0].closest('button')!);

      const textareas = document.querySelectorAll('textarea');
      const editTextarea = Array.from(textareas).find(
        (ta) => ta.value === 'First session went well'
      );

      fireEvent.change(editTextarea!, { target: { value: 'Updated note' } });

      const saveIcons = screen.getAllByTestId('icon-save');
      fireEvent.click(saveIcons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    it('shows generic error when updating note fails with unknown error', async () => {
      mockUpdateNote.mockRejectedValue(new Error('Network error'));

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const editIcons = screen.getAllByTestId('icon-edit');
      fireEvent.click(editIcons[0].closest('button')!);

      const textareas = document.querySelectorAll('textarea');
      const editTextarea = Array.from(textareas).find(
        (ta) => ta.value === 'First session went well'
      );

      fireEvent.change(editTextarea!, { target: { value: 'Updated note' } });

      const saveIcons = screen.getAllByTestId('icon-save');
      fireEvent.click(saveIcons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Failed to update note')).toBeInTheDocument();
      });
    });

    it('does not submit edit if text is empty or whitespace', async () => {
      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const editIcons = screen.getAllByTestId('icon-edit');
      fireEvent.click(editIcons[0].closest('button')!);

      const textareas = document.querySelectorAll('textarea');
      const editTextarea = Array.from(textareas).find(
        (ta) => ta.value === 'First session went well'
      );

      fireEvent.change(editTextarea!, { target: { value: '   ' } });

      const saveIcons = screen.getAllByTestId('icon-save');
      fireEvent.click(saveIcons[0].closest('button')!);

      expect(mockUpdateNote).not.toHaveBeenCalled();
    });
  });

  describe('Delete Note Error Handling', () => {
    it('shows error when deleting note fails with ApiError', async () => {
      const ApiError = require('@/lib/api/clients').ApiError;
      mockDeleteNote.mockRejectedValue(new ApiError('Delete failed'));

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const trashIcons = screen.getAllByTestId('icon-trash');
      fireEvent.click(trashIcons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });
    });

    it('shows generic error when deleting note fails with unknown error', async () => {
      mockDeleteNote.mockRejectedValue(new Error('Network error'));

      render(<ClientNotes clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('First session went well')).toBeInTheDocument();
      });

      const trashIcons = screen.getAllByTestId('icon-trash');
      fireEvent.click(trashIcons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete note')).toBeInTheDocument();
      });
    });
  });
});
