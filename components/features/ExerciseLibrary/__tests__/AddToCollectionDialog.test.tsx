/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddToCollectionDialog } from '../AddToCollectionDialog';

jest.mock('@/hooks/useCollections', () => ({
  useCollections: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
  Check: (props: any) => <span data-testid="icon-check" {...props} />,
  Folder: (props: any) => <span data-testid="icon-folder" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  BookOpen: (props: any) => <span data-testid="icon-book" {...props} />,
}));

import { useCollections } from '@/hooks/useCollections';

const mockUseCollections = useCollections as jest.Mock;

const mockCollections = [
  {
    id: 'col-1',
    name: 'Chest Day',
    description: 'Chest exercises',
    exerciseIds: ['ex-existing'],
    isPublic: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-2',
    name: 'Full Body',
    description: '',
    exerciseIds: [],
    isPublic: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const defaultHookReturn = {
  collections: mockCollections,
  isLoading: false,
  error: null,
  createCollection: jest.fn(),
  addToCollection: jest.fn(),
  removeFromCollection: jest.fn(),
  isInCollection: jest.fn((colId: string, exId: string) =>
    mockCollections.find(c => c.id === colId)?.exerciseIds.includes(exId) ?? false
  ),
  getCollection: jest.fn(),
  getExerciseCollections: jest.fn(),
  refreshCollections: jest.fn(),
};

const defaultProps = {
  exerciseId: 'ex-new',
  exerciseName: 'Push Up',
  isOpen: true,
  onClose: jest.fn(),
};

describe('AddToCollectionDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCollections.mockReturnValue(defaultHookReturn);
  });

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(<AddToCollectionDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when isOpen is true', () => {
      render(<AddToCollectionDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows exercise name in dialog title', () => {
      render(<AddToCollectionDialog {...defaultProps} />);
      expect(screen.getByText(/Push Up/i)).toBeInTheDocument();
    });
  });

  describe('collection list', () => {
    it('renders all collection names as checkboxes', () => {
      render(<AddToCollectionDialog {...defaultProps} />);
      expect(screen.getByLabelText('Chest Day')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Body')).toBeInTheDocument();
    });

    it('pre-checks collections that already contain the exercise', () => {
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        isInCollection: jest.fn((colId: string, exId: string) => colId === 'col-1' && exId === 'ex-new'),
      });
      render(<AddToCollectionDialog {...defaultProps} exerciseId="ex-new" />);
      const chestDayCheckbox = screen.getByLabelText('Chest Day') as HTMLInputElement;
      expect(chestDayCheckbox.checked).toBe(true);
    });

    it('shows empty state when no collections exist', () => {
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, collections: [] });
      render(<AddToCollectionDialog {...defaultProps} />);
      expect(screen.getByText(/no collections yet/i)).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when X button is clicked', async () => {
      const onClose = jest.fn();
      render(<AddToCollectionDialog {...defaultProps} onClose={onClose} />);
      const closeBtn = screen.getByTestId('icon-x').closest('button')!;
      await act(async () => { fireEvent.click(closeBtn); });
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();
      render(<AddToCollectionDialog {...defaultProps} onClose={onClose} />);
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await act(async () => { fireEvent.click(cancelBtn); });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('add to collection', () => {
    it('calls addToCollection for newly checked collections on save', async () => {
      const mockAdd = jest.fn().mockResolvedValue(undefined);
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        addToCollection: mockAdd,
        isInCollection: jest.fn(() => false),
      });

      render(<AddToCollectionDialog {...defaultProps} />);

      // Check a collection
      fireEvent.click(screen.getByLabelText('Chest Day'));

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await act(async () => { fireEvent.click(saveBtn); });

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith('col-1', 'ex-new');
      });
    });

    it('calls removeFromCollection for unchecked collections on save', async () => {
      const mockRemove = jest.fn().mockResolvedValue(undefined);
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        removeFromCollection: mockRemove,
        isInCollection: jest.fn((colId: string) => colId === 'col-1'),
      });

      render(<AddToCollectionDialog {...defaultProps} />);

      // Uncheck col-1 (which is pre-checked)
      fireEvent.click(screen.getByLabelText('Chest Day'));

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await act(async () => { fireEvent.click(saveBtn); });

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith('col-1', 'ex-new');
      });
    });

    it('calls onClose after successful save', async () => {
      const onClose = jest.fn();
      const mockAdd = jest.fn().mockResolvedValue(undefined);
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        addToCollection: mockAdd,
        isInCollection: jest.fn(() => false),
      });

      render(<AddToCollectionDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Chest Day'));

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await act(async () => { fireEvent.click(saveBtn); });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('create new collection', () => {
    it('shows create new collection option', () => {
      render(<AddToCollectionDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create new collection/i })).toBeInTheDocument();
    });

    it('shows input form when create new is clicked', async () => {
      render(<AddToCollectionDialog {...defaultProps} />);
      const createBtn = screen.getByRole('button', { name: /create new collection/i });
      await act(async () => { fireEvent.click(createBtn); });
      expect(screen.getByPlaceholderText(/collection name/i)).toBeInTheDocument();
    });

    it('creates collection and adds exercise on create submit', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ id: 'col-new', name: 'Arms Day' });
      const mockAdd = jest.fn().mockResolvedValue(undefined);
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        createCollection: mockCreate,
        addToCollection: mockAdd,
        isInCollection: jest.fn(() => false),
      });

      render(<AddToCollectionDialog {...defaultProps} />);

      const createBtn = screen.getByRole('button', { name: /create new collection/i });
      await act(async () => { fireEvent.click(createBtn); });

      fireEvent.change(screen.getByPlaceholderText(/collection name/i), {
        target: { value: 'Arms Day' },
      });

      const addBtn = screen.getByRole('button', { name: /^add$/i });
      await act(async () => { fireEvent.click(addBtn); });

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith('Arms Day', '');
        expect(mockAdd).toHaveBeenCalledWith('col-new', 'ex-new');
      });
    });
  });
});
