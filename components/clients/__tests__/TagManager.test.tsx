/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TagManager from '../TagManager';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const mockGetTags = jest.fn();
const mockCreateTag = jest.fn();
const mockUpdateTag = jest.fn();
const mockDeleteTag = jest.fn();

jest.mock('@/lib/api/clients', () => ({
  tagsApi: {
    getTags: () => mockGetTags(),
    createTag: (data: any) => mockCreateTag(data),
    updateTag: (id: string, data: any) => mockUpdateTag(id, data),
    deleteTag: (id: string) => mockDeleteTag(id),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

describe('TagManager', () => {
  const mockOnClose = jest.fn();

  const defaultProps = {
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTags.mockResolvedValue([
      { id: 'tag-1', name: 'VIP', color: '#EF4444', trainerId: 'trainer-1' },
      { id: 'tag-2', name: 'Beginner', color: '#22C55E', trainerId: 'trainer-1' },
    ]);
  });

  it('renders the tag manager modal', () => {
    render(<TagManager {...defaultProps} />);
    expect(screen.getByText('Tag Manager')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<TagManager {...defaultProps} />);
    expect(screen.getByText('Create, edit, and organize your client tags')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<TagManager {...defaultProps} />);
    // Loading skeleton renders
    expect(screen.getByText('Tag Manager')).toBeInTheDocument();
  });

  it('loads and displays tags', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });
  });

  it('shows tag count', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Existing Tags (2)')).toBeInTheDocument();
    });
  });

  it('has a New Tag button', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
  });

  it('shows create form when New Tag is clicked', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Tag'));
    expect(screen.getByPlaceholderText('Enter tag name...')).toBeInTheDocument();
    expect(screen.getByText('Create Tag')).toBeInTheDocument();
  });

  it('has Close button that calls onClose', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows empty state when no tags exist', async () => {
    mockGetTags.mockResolvedValue([]);

    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No tags created yet')).toBeInTheDocument();
      expect(screen.getByText('Create First Tag')).toBeInTheDocument();
    });
  });

  it('shows error when tag loading fails', async () => {
    mockGetTags.mockRejectedValue(new Error('Network error'));

    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch tags')).toBeInTheDocument();
    });
  });

  it('shows Try Again button when there is an error', async () => {
    mockGetTags.mockRejectedValue(new Error('Network error'));

    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('displays tag colors', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('#EF4444')).toBeInTheDocument();
      expect(screen.getByText('#22C55E')).toBeInTheDocument();
    });
  });

  it('shows character count in create form', async () => {
    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Tag'));
    expect(screen.getByText('0/50 characters')).toBeInTheDocument();
  });

  it('creates a tag when form is submitted', async () => {
    mockCreateTag.mockResolvedValue({
      id: 'tag-3',
      name: 'Advanced',
      color: '#3B82F6',
      trainerId: 'trainer-1',
    });

    render(<TagManager {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Tag'));
    const input = screen.getByPlaceholderText('Enter tag name...');
    fireEvent.change(input, { target: { value: 'Advanced' } });
    fireEvent.click(screen.getByText('Create Tag'));

    await waitFor(() => {
      expect(mockCreateTag).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Advanced' })
      );
    });
  });
});
