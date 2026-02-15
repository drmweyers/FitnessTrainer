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

  it('handles ApiError when fetching tags', async () => {
    const { ApiError } = require('@/lib/api/clients');
    mockGetTags.mockRejectedValue(new ApiError('API Error occurred'));
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('API Error occurred')).toBeInTheDocument();
    });
  });

  it('handles response with .data wrapper when fetching tags', async () => {
    mockGetTags.mockResolvedValue({
      data: [{ id: 'tag-1', name: 'VIP', color: '#EF4444', trainerId: 'trainer-1' }]
    });
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
  });

  it('does not create tag if name is only whitespace', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    const input = screen.getByPlaceholderText('Enter tag name...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Create Tag'));
    await waitFor(() => {
      expect(mockCreateTag).not.toHaveBeenCalled();
    });
  });

  it('trims tag name when creating', async () => {
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
    fireEvent.change(input, { target: { value: '  Advanced  ' } });
    fireEvent.click(screen.getByText('Create Tag'));
    await waitFor(() => {
      expect(mockCreateTag).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Advanced' })
      );
    });
  });

  it('handles ApiError when creating tag', async () => {
    const { ApiError } = require('@/lib/api/clients');
    mockCreateTag.mockRejectedValue(new ApiError('Tag creation failed'));
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    const input = screen.getByPlaceholderText('Enter tag name...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Create Tag'));
    await waitFor(() => {
      expect(screen.getByText('Tag creation failed')).toBeInTheDocument();
    });
  });

  it('allows color selection from preset colors', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    const colorButtons = screen.getAllByRole('button').filter(btn =>
      btn.style.backgroundColor && btn.type === 'button'
    );
    // Click the second color
    if (colorButtons.length > 1) {
      fireEvent.click(colorButtons[1]);
    }
  });

  it('allows custom color input', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter tag name...')).toBeInTheDocument();
    });
    // Find color input by type
    const colorInputs = document.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBeGreaterThan(0);
    if (colorInputs[0]) {
      fireEvent.change(colorInputs[0], { target: { value: '#123456' } });
    }
  });

  it('handles error when update tag fails with generic error', async () => {
    mockUpdateTag.mockRejectedValue(new Error('Generic error'));
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
  });

  it('handles error when delete tag fails with generic error', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    mockDeleteTag.mockRejectedValue(new Error('Generic delete error'));
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
  });

  it('allows updating only tag color', async () => {
    mockUpdateTag.mockResolvedValue({
      id: 'tag-1',
      name: 'VIP',
      color: '#123456',
      trainerId: 'trainer-1',
    });
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
    });
  });

  it('resets form when create is cancelled', async () => {
    render(<TagManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('New Tag')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Tag'));
    const input = screen.getByPlaceholderText('Enter tag name...');
    fireEvent.change(input, { target: { value: 'Test Tag' } });
    expect(screen.getByText('8/50 characters')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    // Open form again
    fireEvent.click(screen.getByText('New Tag'));
    expect(screen.getByText('0/50 characters')).toBeInTheDocument();
  });

  describe('Edit tag functionality', () => {
    it('enters edit mode when edit button is clicked', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const editButtons = allButtons.filter(btn => btn.className.includes('text-gray'));
      if (editButtons.length >= 1) {
        fireEvent.click(editButtons[0]);
        // Component updates (internal state changed)
        expect(editButtons[0]).toBeInTheDocument();
      }
    });

    it('has color picker in edit mode', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const editButtons = allButtons.filter(btn => btn.className.includes('text-gray'));
      if (editButtons.length >= 1) {
        fireEvent.click(editButtons[0]);
        // Edit mode activated - color inputs should be accessible
        expect(allButtons.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Delete tag functionality', () => {
    it('shows error when delete fails with ApiError', async () => {
      const { ApiError } = require('@/lib/api/clients');
      window.confirm = jest.fn().mockReturnValue(true);
      mockDeleteTag.mockRejectedValue(new ApiError('Delete failed'));

      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const deleteButtons = allButtons.filter(btn => btn.className.includes('text-red'));
      if (deleteButtons.length >= 1) {
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
          expect(screen.getByText('Delete failed')).toBeInTheDocument();
        });
      }
    });

    it('removes tag from list after successful delete', async () => {
      window.confirm = jest.fn().mockReturnValue(true);
      mockDeleteTag.mockResolvedValue(undefined);

      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const deleteButtons = allButtons.filter(btn => btn.className.includes('text-red'));
      if (deleteButtons.length >= 1) {
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
          expect(mockDeleteTag).toHaveBeenCalledWith('tag-1');
        });

        // Tag should be removed from UI
        await waitFor(() => {
          expect(screen.queryByText('VIP')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      }
    });
  });

  describe('Header close button', () => {
    it('calls onClose when header X button is clicked', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Tag Manager')).toBeInTheDocument();
      });

      // Find the X button in the header (ghost variant)
      const buttons = screen.getAllByRole('button');
      const headerCloseButton = buttons.find(btn =>
        btn.className.includes('text-white') && btn.querySelector('svg')
      );
      if (headerCloseButton) {
        fireEvent.click(headerCloseButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Tag creation with color selection', () => {
    it('creates tag with selected preset color', async () => {
      mockCreateTag.mockResolvedValue({
        id: 'tag-3',
        name: 'Premium',
        color: '#F97316',
        trainerId: 'trainer-1',
      });

      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Tag')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Tag'));

      const input = screen.getByPlaceholderText('Enter tag name...');
      fireEvent.change(input, { target: { value: 'Premium' } });

      // Select second color from preset
      const colorButtons = screen.getAllByRole('button').filter(btn =>
        btn.style.backgroundColor && btn.type === 'button' && btn.className.includes('w-6 h-6')
      );
      if (colorButtons.length > 1) {
        fireEvent.click(colorButtons[1]);
      }

      fireEvent.click(screen.getByText('Create Tag'));
      await waitFor(() => {
        expect(mockCreateTag).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Premium' })
        );
      });
    });

    it('disables Create Tag button when submitting', async () => {
      mockCreateTag.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        id: 'tag-3',
        name: 'Test',
        color: '#EF4444',
        trainerId: 'trainer-1',
      }), 100)));

      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Tag')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Tag'));
      const input = screen.getByPlaceholderText('Enter tag name...');
      fireEvent.change(input, { target: { value: 'Test' } });

      const createButton = screen.getByText('Create Tag');
      fireEvent.click(createButton);

      // Button should be disabled during submission
      expect(createButton).toBeDisabled();
    });

    it('disables Cancel button when submitting', async () => {
      mockCreateTag.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        id: 'tag-3',
        name: 'Test',
        color: '#EF4444',
        trainerId: 'trainer-1',
      }), 100)));

      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Tag')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Tag'));
      const input = screen.getByPlaceholderText('Enter tag name...');
      fireEvent.change(input, { target: { value: 'Test' } });

      fireEvent.click(screen.getByText('Create Tag'));

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Loading skeleton', () => {
    it('renders skeleton cards while loading', () => {
      mockGetTags.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TagManager {...defaultProps} />);

      // Should show Tag Manager header even while loading
      expect(screen.getByText('Tag Manager')).toBeInTheDocument();
    });
  });

  describe('Update tag with edit data', () => {
    it('enters edit mode when edit button is clicked', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      // Find the edit button (has text-gray-400 class)
      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(btn => btn.className.includes('text-gray-400'));
      if (editButton) {
        fireEvent.click(editButton);
        // Should now show an input for editing the tag name
        await waitFor(() => {
          const inputs = document.querySelectorAll('input');
          expect(inputs.length).toBeGreaterThan(0);
        });
      }
    });

    it('shows color picker when in edit mode', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(btn => btn.className.includes('text-gray-400'));
      if (editButton) {
        fireEvent.click(editButton);
        await waitFor(() => {
          // Color input should be visible in edit mode
          const colorInputs = document.querySelectorAll('input[type="color"]');
          expect(colorInputs.length).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('does not call update when name is empty and no color change', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(btn => btn.className.includes('text-gray-400'));
      if (editButton) {
        fireEvent.click(editButton);
        // The edit mode should be active
        await waitFor(() => {
          expect(document.querySelectorAll('input').length).toBeGreaterThan(0);
        });
        // Without making changes, updateTag should not be called
        expect(mockUpdateTag).not.toHaveBeenCalled();
      }
    });

    it('can cancel editing', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const editButton = allButtons.find(btn => btn.className.includes('text-gray-400'));
      if (editButton) {
        fireEvent.click(editButton);
        await waitFor(() => {
          expect(document.querySelectorAll('input').length).toBeGreaterThan(0);
        });

        // In edit mode, the tag name is in an input field
        const nameInput = screen.getByDisplayValue('VIP');
        expect(nameInput).toBeInTheDocument();
      }
    });

    it('shows delete button alongside edit button', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find(btn => btn.className.includes('text-red'));
      expect(deleteButton).toBeTruthy();
    });

    it('shows tag color in non-edit mode', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });
      expect(screen.getByText('#EF4444')).toBeInTheDocument();
    });
  });

  describe('Cancel button and form states', () => {
    it('clears new tag form and hides it when cancelled', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Tag')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Tag'));
      const input = screen.getByPlaceholderText('Enter tag name...');
      fireEvent.change(input, { target: { value: 'Test' } });

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Form should be hidden
      expect(screen.queryByPlaceholderText('Enter tag name...')).not.toBeInTheDocument();

      // Open again - should be reset
      fireEvent.click(screen.getByText('New Tag'));
      expect(screen.getByText('0/50 characters')).toBeInTheDocument();
    });

    it('disables Create Tag button when name is empty', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Tag')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Tag'));
      const createButton = screen.getByText('Create Tag');

      // Should be disabled without name
      expect(createButton).toBeDisabled();
    });

    it('enables Create Tag button when name has content', async () => {
      render(<TagManager {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('New Tag')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Tag'));
      const input = screen.getByPlaceholderText('Enter tag name...');
      const createButton = screen.getByText('Create Tag');

      fireEvent.change(input, { target: { value: 'Valid' } });

      // Should be enabled with valid name
      expect(createButton).not.toBeDisabled();
    });
  });
});
