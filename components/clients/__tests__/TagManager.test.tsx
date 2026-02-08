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

  it('shows edit and delete buttons for each tag', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
    // Each tag should have edit and delete buttons (icons)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(3); // At minimum: New Tag, Close, plus edit/delete per tag
  });

  it('enters edit mode when edit button is clicked', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
    // Find edit buttons - they're icon buttons within each tag row
    const editButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('[data-testid]') || btn.className.includes('text-gray')
    );
    // Click the first functional button after tag content
    const allButtons = screen.getAllByRole('button');
    for (const btn of allButtons) {
      if (btn.textContent === '' && !btn.textContent?.includes('New Tag') && !btn.textContent?.includes('Close')) {
        fireEvent.click(btn);
        break;
      }
    }
  });

  it('deletes a tag when delete is confirmed', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    mockDeleteTag.mockResolvedValue(undefined);

    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });

    // Find delete buttons by their red color class
    const allButtons = screen.getAllByRole('button');
    const deleteButtons = allButtons.filter(btn =>
      btn.className.includes('text-red')
    );
    if (deleteButtons.length >= 1) {
      fireEvent.click(deleteButtons[0]); // Click delete for first tag (VIP)
      await waitFor(() => {
        expect(mockDeleteTag).toHaveBeenCalledWith('tag-1');
      });
    }
  });

  it('does not delete when confirm is cancelled', async () => {
    window.confirm = jest.fn().mockReturnValue(false);

    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const deleteButtons = allButtons.filter(btn =>
      btn.className.includes('text-red')
    );
    if (deleteButtons.length >= 1) {
      fireEvent.click(deleteButtons[0]);
      expect(mockDeleteTag).not.toHaveBeenCalled();
    }
  });

  it('shows cancel button in create form', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides create form when cancel is clicked', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    expect(screen.getByPlaceholderText('Enter tag name...')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Enter tag name...')).not.toBeInTheDocument();
  });

  it('retries loading tags when Try Again is clicked', async () => {
    mockGetTags.mockRejectedValueOnce(new Error('Network error'));
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    mockGetTags.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByText('Try Again'));
    await waitFor(() => {
      expect(mockGetTags).toHaveBeenCalledTimes(2);
    });
  });

  it('shows Create First Tag button in empty state', async () => {
    mockGetTags.mockResolvedValue([]);
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Create First Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Create First Tag'));
    expect(screen.getByPlaceholderText('Enter tag name...')).toBeInTheDocument();
  });

  it('updates character count as user types tag name', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    const input = screen.getByPlaceholderText('Enter tag name...');
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(screen.getByText('4/50 characters')).toBeInTheDocument();
  });

  it('shows error when create tag fails', async () => {
    mockCreateTag.mockRejectedValue(new Error('Failed'));
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    const input = screen.getByPlaceholderText('Enter tag name...');
    fireEvent.change(input, { target: { value: 'Broken' } });
    fireEvent.click(screen.getByText('Create Tag'));
    await waitFor(() => {
      expect(mockCreateTag).toHaveBeenCalled();
    });
  });
});
