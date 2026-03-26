/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollectionDetail } from '../CollectionDetail';

jest.mock('@/hooks/useCollections', () => ({
  useCollections: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: (props: any) => <span data-testid="icon-arrow-left" {...props} />,
  Edit3: (props: any) => <span data-testid="icon-edit" {...props} />,
  Trash2: (props: any) => <span data-testid="icon-trash" {...props} />,
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Check: (props: any) => <span data-testid="icon-check" {...props} />,
  Hash: (props: any) => <span data-testid="icon-hash" {...props} />,
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  Search: (props: any) => <span data-testid="icon-search" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
  Lock: (props: any) => <span data-testid="icon-lock" {...props} />,
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
}));

import { useCollections } from '@/hooks/useCollections';

const mockUseCollections = useCollections as jest.Mock;

const mockCollection = {
  id: 'col-1',
  name: 'Chest Day',
  description: 'All chest exercises',
  exerciseIds: ['ex-1', 'ex-2'],
  isPublic: false,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

const defaultHookReturn = {
  collections: [mockCollection],
  isLoading: false,
  error: null,
  updateCollection: jest.fn(),
  deleteCollection: jest.fn(),
  removeFromCollection: jest.fn(),
  getCollection: jest.fn((id: string) => (id === 'col-1' ? mockCollection : undefined)),
  refreshCollections: jest.fn(),
};

const mockExercises = [
  {
    id: 'ex-1',
    exerciseId: 'EX001',
    name: 'Bench Press',
    bodyParts: ['chest'],
    targetMuscles: ['pectorals'],
    equipments: ['barbell'],
    gifUrl: '/bench.gif',
    isFavorited: false,
    usageCount: 0,
  },
  {
    id: 'ex-2',
    exerciseId: 'EX002',
    name: 'Push Up',
    bodyParts: ['chest'],
    targetMuscles: ['pectorals'],
    equipments: ['body weight'],
    gifUrl: '/pushup.gif',
    isFavorited: true,
    usageCount: 2,
  },
];

const defaultProps = {
  collectionId: 'col-1',
  exercises: mockExercises as any,
  isLoadingExercises: false,
  onDeleteCollection: jest.fn(),
  onRemoveExercise: jest.fn(),
  onUpdateCollection: jest.fn(),
};

describe('CollectionDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCollections.mockReturnValue(defaultHookReturn);
  });

  describe('loading state', () => {
    it('renders skeleton when isLoadingExercises is true', () => {
      render(<CollectionDetail {...defaultProps} isLoadingExercises={true} exercises={[]} />);
      expect(screen.getByTestId('collection-detail-loading')).toBeInTheDocument();
    });
  });

  describe('collection not found', () => {
    it('renders not found message when collection is missing', () => {
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        getCollection: jest.fn(() => undefined),
      });
      render(<CollectionDetail {...defaultProps} collectionId="unknown" />);
      expect(screen.getByText(/collection not found/i)).toBeInTheDocument();
    });
  });

  describe('collection header', () => {
    it('renders collection name', () => {
      render(<CollectionDetail {...defaultProps} />);
      expect(screen.getByText('Chest Day')).toBeInTheDocument();
    });

    it('renders collection description', () => {
      render(<CollectionDetail {...defaultProps} />);
      expect(screen.getByText('All chest exercises')).toBeInTheDocument();
    });

    it('renders exercise count', () => {
      render(<CollectionDetail {...defaultProps} />);
      expect(screen.getByText(/2 exercise/i)).toBeInTheDocument();
    });

    it('renders back link to collections page', () => {
      render(<CollectionDetail {...defaultProps} />);
      const backLink = screen.getByRole('link', { name: /back/i });
      expect(backLink).toHaveAttribute('href', '/dashboard/exercises/collections');
    });
  });

  describe('exercise list', () => {
    it('renders exercise names', () => {
      render(<CollectionDetail {...defaultProps} />);
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Push Up')).toBeInTheDocument();
    });

    it('renders empty state when no exercises', () => {
      render(<CollectionDetail {...defaultProps} exercises={[]} />);
      expect(screen.getByText(/no exercises in this collection/i)).toBeInTheDocument();
    });

    it('renders add exercises link/button', () => {
      render(<CollectionDetail {...defaultProps} exercises={[]} />);
      expect(screen.getByRole('link', { name: /add exercises/i })).toBeInTheDocument();
    });

    it('renders remove buttons for each exercise', () => {
      render(<CollectionDetail {...defaultProps} />);
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(2);
    });

    it('calls onRemoveExercise when remove button is clicked', async () => {
      const onRemove = jest.fn();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      render(<CollectionDetail {...defaultProps} onRemoveExercise={onRemove} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await act(async () => { fireEvent.click(removeButtons[0]); });

      expect(onRemove).toHaveBeenCalledWith('ex-1');
      confirmSpy.mockRestore();
    });
  });

  describe('search', () => {
    it('renders search input', () => {
      render(<CollectionDetail {...defaultProps} />);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('filters exercises by search query', async () => {
      render(<CollectionDetail {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'bench' } });

      await waitFor(() => {
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.queryByText('Push Up')).not.toBeInTheDocument();
      });
    });
  });

  describe('inline edit', () => {
    it('renders edit button', () => {
      render(<CollectionDetail {...defaultProps} />);
      expect(screen.getByTestId('icon-edit')).toBeInTheDocument();
    });

    it('shows name edit field when edit is clicked', async () => {
      render(<CollectionDetail {...defaultProps} />);
      const editBtn = screen.getByTestId('icon-edit').closest('button')!;
      await act(async () => { fireEvent.click(editBtn); });
      expect(screen.getByDisplayValue('Chest Day')).toBeInTheDocument();
    });

    it('calls onUpdateCollection when edit is saved', async () => {
      const onUpdate = jest.fn().mockResolvedValue(undefined);
      render(<CollectionDetail {...defaultProps} onUpdateCollection={onUpdate} />);

      const editBtn = screen.getByTestId('icon-edit').closest('button')!;
      await act(async () => { fireEvent.click(editBtn); });

      const nameInput = screen.getByDisplayValue('Chest Day');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await act(async () => { fireEvent.click(saveBtn); });

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
      });
    });
  });

  describe('delete collection', () => {
    it('renders delete button', () => {
      render(<CollectionDetail {...defaultProps} />);
      const deleteBtn = screen.getByTestId('icon-trash').closest('button')!;
      expect(deleteBtn).toBeInTheDocument();
    });

    it('calls onDeleteCollection when delete confirmed', async () => {
      const onDelete = jest.fn().mockResolvedValue(undefined);
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      render(<CollectionDetail {...defaultProps} onDeleteCollection={onDelete} />);

      const deleteBtn = screen.getByTestId('icon-trash').closest('button')!;
      await act(async () => { fireEvent.click(deleteBtn); });

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
      confirmSpy.mockRestore();
    });
  });
});
