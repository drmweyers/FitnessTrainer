/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CollectionManager } from '../CollectionManager';

// Mock useCollections hook
jest.mock('@/hooks/useCollections', () => ({
  useCollections: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BookOpen: (props: any) => <span data-testid="icon-book" {...props} />,
  Plus: (props: any) => <span data-testid="icon-plus" {...props} />,
  Folder: (props: any) => <span data-testid="icon-folder" {...props} />,
  FolderOpen: (props: any) => <span data-testid="icon-folder-open" {...props} />,
  Hash: (props: any) => <span data-testid="icon-hash" {...props} />,
  Trash2: (props: any) => <span data-testid="icon-trash" {...props} />,
  Edit3: (props: any) => <span data-testid="icon-edit" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  ChevronRight: (props: any) => <span data-testid="icon-chevron" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

import { useCollections } from '@/hooks/useCollections';

const mockUseCollections = useCollections as jest.Mock;

const mockCollections = [
  {
    id: 'col-1',
    name: 'Chest Day',
    description: 'All chest exercises',
    exerciseIds: ['ex-1', 'ex-2', 'ex-3'],
    isPublic: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'col-2',
    name: 'Leg Day',
    description: '',
    exerciseIds: ['ex-4'],
    isPublic: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const defaultHookReturn = {
  collections: mockCollections,
  isLoading: false,
  error: null,
  createCollection: jest.fn(),
  updateCollection: jest.fn(),
  deleteCollection: jest.fn(),
  addToCollection: jest.fn(),
  removeFromCollection: jest.fn(),
  getCollection: jest.fn(),
  isInCollection: jest.fn(),
  getExerciseCollections: jest.fn(),
  refreshCollections: jest.fn(),
};

describe('CollectionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCollections.mockReturnValue(defaultHookReturn);
  });

  describe('loading state', () => {
    it('renders loading skeleton when isLoading is true', () => {
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, isLoading: true, collections: [] });
      render(<CollectionManager />);
      expect(screen.getByTestId('collections-loading')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message when error exists', () => {
      mockUseCollections.mockReturnValue({
        ...defaultHookReturn,
        error: 'Failed to load collections',
        collections: [],
      });
      render(<CollectionManager />);
      expect(screen.getByText('Failed to load collections')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state when no collections', () => {
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, collections: [] });
      render(<CollectionManager />);
      expect(screen.getByText(/no collections yet/i)).toBeInTheDocument();
    });

    it('renders create collection button in empty state', () => {
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, collections: [] });
      render(<CollectionManager />);
      expect(screen.getByRole('button', { name: /create collection/i })).toBeInTheDocument();
    });
  });

  describe('collection list', () => {
    it('renders all collection names', () => {
      render(<CollectionManager />);
      expect(screen.getByText('Chest Day')).toBeInTheDocument();
      expect(screen.getByText('Leg Day')).toBeInTheDocument();
    });

    it('renders exercise count for each collection', () => {
      render(<CollectionManager />);
      expect(screen.getByText(/3 exercise/i)).toBeInTheDocument();
      expect(screen.getByText(/1 exercise/i)).toBeInTheDocument();
    });

    it('renders collection descriptions', () => {
      render(<CollectionManager />);
      expect(screen.getByText('All chest exercises')).toBeInTheDocument();
    });

    it('renders links to collection detail pages', () => {
      render(<CollectionManager />);
      const links = screen.getAllByRole('link');
      const collectionLinks = links.filter(link =>
        (link as HTMLAnchorElement).href?.includes('/collections/col-')
      );
      expect(collectionLinks.length).toBeGreaterThan(0);
    });

    it('renders create collection button in header', () => {
      render(<CollectionManager />);
      expect(screen.getByRole('button', { name: /new collection/i })).toBeInTheDocument();
    });
  });

  describe('create collection modal', () => {
    it('opens create modal when create button is clicked', async () => {
      render(<CollectionManager />);
      const createBtn = screen.getByRole('button', { name: /new collection/i });
      await act(async () => { fireEvent.click(createBtn); });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/collection name/i)).toBeInTheDocument();
    });

    it('closes modal on cancel', async () => {
      render(<CollectionManager />);
      const createBtn = screen.getByRole('button', { name: /new collection/i });
      await act(async () => { fireEvent.click(createBtn); });
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await act(async () => { fireEvent.click(cancelBtn); });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls createCollection with name and description on submit', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ id: 'col-new', name: 'New One' });
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, createCollection: mockCreate });
      render(<CollectionManager />);

      const createBtn = screen.getByRole('button', { name: /new collection/i });
      await act(async () => { fireEvent.click(createBtn); });

      fireEvent.change(screen.getByPlaceholderText(/collection name/i), {
        target: { value: 'My New Collection' },
      });

      const submitBtn = screen.getByRole('button', { name: /create$/i });
      await act(async () => { fireEvent.click(submitBtn); });

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith('My New Collection', expect.any(String));
      });
    });

    it('does not submit when name is empty', async () => {
      const mockCreate = jest.fn();
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, createCollection: mockCreate });
      render(<CollectionManager />);

      const createBtn = screen.getByRole('button', { name: /new collection/i });
      await act(async () => { fireEvent.click(createBtn); });

      const submitBtn = screen.getByRole('button', { name: /create$/i });
      await act(async () => { fireEvent.click(submitBtn); });

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('delete collection', () => {
    it('calls deleteCollection when delete is confirmed', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, deleteCollection: mockDelete });

      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      render(<CollectionManager />);

      const deleteButtons = screen.getAllByTestId('icon-trash');
      await act(async () => { fireEvent.click(deleteButtons[0].closest('button')!); });

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('col-1');
      });

      confirmSpy.mockRestore();
    });

    it('does not delete when confirm is cancelled', async () => {
      const mockDelete = jest.fn();
      mockUseCollections.mockReturnValue({ ...defaultHookReturn, deleteCollection: mockDelete });

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      render(<CollectionManager />);

      const deleteButtons = screen.getAllByTestId('icon-trash');
      await act(async () => { fireEvent.click(deleteButtons[0].closest('button')!); });

      expect(mockDelete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });
});
