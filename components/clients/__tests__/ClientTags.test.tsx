/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientTags from '../ClientTags';

// Mock the API module
const mockGetTags = jest.fn();
const mockGetClientById = jest.fn();
const mockCreateTag = jest.fn();
const mockAssignTags = jest.fn();
const mockRemoveTags = jest.fn();

jest.mock('@/lib/api/clients', () => ({
  tagsApi: {
    getTags: (...args: any[]) => mockGetTags(...args),
    createTag: (...args: any[]) => mockCreateTag(...args),
    assignTags: (...args: any[]) => mockAssignTags(...args),
    removeTags: (...args: any[]) => mockRemoveTags(...args),
  },
  clientsApi: {
    getClientById: (...args: any[]) => mockGetClientById(...args),
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
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Tag: (props: any) => <span data-testid="icon-tag" {...props} />,
  Palette: (props: any) => <span data-testid="icon-palette" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

const mockAllTags = [
  { id: 'tag-1', name: 'VIP', color: '#EF4444', trainerId: 'trainer-1' },
  { id: 'tag-2', name: 'Morning', color: '#22C55E', trainerId: 'trainer-1' },
  { id: 'tag-3', name: 'Weight Loss', color: '#3B82F6', trainerId: 'trainer-1' },
];

const mockClientTags = [
  { id: 'tag-1', name: 'VIP', color: '#EF4444', trainerId: 'trainer-1' },
];

describe('ClientTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTags.mockResolvedValue(mockAllTags);
    mockGetClientById.mockResolvedValue({
      data: { tags: mockClientTags },
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton initially', () => {
      mockGetTags.mockReturnValue(new Promise(() => {}));
      mockGetClientById.mockReturnValue(new Promise(() => {}));
      const { container } = render(<ClientTags clientId="client-1" />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('After Loading', () => {
    it('renders header with title "Client Tags"', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Client Tags')).toBeInTheDocument();
      });
    });

    it('renders client tags count badge', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('renders Create Tag button', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Create Tag')).toBeInTheDocument();
      });
    });

    it('renders Current Tags section', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Current Tags')).toBeInTheDocument();
      });
    });

    it('renders currently assigned tags', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        // VIP is a client tag
        const vipElements = screen.getAllByText('VIP');
        expect(vipElements.length).toBeGreaterThan(0);
      });
    });

    it('renders Available Tags section with unassigned tags', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Available Tags')).toBeInTheDocument();
        expect(screen.getByText('Morning')).toBeInTheDocument();
        expect(screen.getByText('Weight Loss')).toBeInTheDocument();
      });
    });

    it('renders tag management tips', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Tag Management Tips')).toBeInTheDocument();
      });
    });
  });

  describe('Empty Current Tags', () => {
    it('shows empty state when no tags assigned', async () => {
      mockGetClientById.mockResolvedValue({
        data: { tags: [] },
      });
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('No tags assigned yet')).toBeInTheDocument();
      });
    });
  });

  describe('Create Tag Form', () => {
    it('shows create form when Create Tag button is clicked', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Create Tag')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create Tag'));
      expect(screen.getByText('Create New Tag')).toBeInTheDocument();
      expect(screen.getByText('Tag Color')).toBeInTheDocument();
    });

    it('shows character count in create form', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Create Tag')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create Tag'));
      expect(screen.getByText('0/50 characters')).toBeInTheDocument();
    });

    it('hides create form when Cancel is clicked', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Create Tag')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create Tag'));
      expect(screen.getByText('Create New Tag')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Create New Tag')).not.toBeInTheDocument();
    });

    it('submits new tag', async () => {
      const newTag = { id: 'tag-4', name: 'Premium', color: '#EF4444', trainerId: 'trainer-1' };
      mockCreateTag.mockResolvedValue(newTag);

      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Create Tag')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create Tag'));

      const input = screen.getByPlaceholderText('Enter tag name...');
      fireEvent.change(input, { target: { value: 'Premium' } });

      // Find the "Create Tag" button inside the form (not the header one)
      const createButtons = screen.getAllByText('Create Tag');
      // The last one is the submit button in the form
      const submitButton = createButtons[createButtons.length - 1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateTag).toHaveBeenCalledWith({
          name: 'Premium',
          color: '#EF4444',
        });
      });
    });
  });

  describe('Assign Tag', () => {
    it('assigns tag when available tag is clicked', async () => {
      mockAssignTags.mockResolvedValue(undefined);
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Morning')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Morning'));
      await waitFor(() => {
        expect(mockAssignTags).toHaveBeenCalledWith('client-1', ['tag-2']);
      });
    });
  });

  describe('Remove Tag', () => {
    it('removes tag when X button on assigned tag is clicked', async () => {
      mockRemoveTags.mockResolvedValue(undefined);
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        // VIP is in currentTags section
        const vipElements = screen.getAllByText('VIP');
        expect(vipElements.length).toBeGreaterThan(0);
      });

      // The X icon next to VIP in the current tags
      const xIcons = screen.getAllByTestId('icon-x');
      // Click the first one which should be next to VIP in current tags
      fireEvent.click(xIcons[0].closest('button')!);

      await waitFor(() => {
        expect(mockRemoveTags).toHaveBeenCalledWith('client-1', ['tag-1']);
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetching fails', async () => {
      mockGetTags.mockRejectedValue(new Error('Network error'));
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch tags')).toBeInTheDocument();
      });
    });

    it('shows Try Again button on error', async () => {
      mockGetTags.mockRejectedValue(new Error('Network error'));
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('API Calls', () => {
    it('does not fetch data when clientId is empty', () => {
      render(<ClientTags clientId="" />);
      expect(mockGetTags).not.toHaveBeenCalled();
    });

    it('fetches both tags and client data on mount', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(mockGetTags).toHaveBeenCalled();
        expect(mockGetClientById).toHaveBeenCalledWith('client-1');
      });
    });
  });

  describe('Color Picker', () => {
    it('renders color palette in create form', async () => {
      render(<ClientTags clientId="client-1" />);
      await waitFor(() => {
        expect(screen.getByText('Create Tag')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Create Tag'));
      // Should render 20 color buttons
      const colorButtons = document.querySelectorAll('button[style]');
      expect(colorButtons.length).toBeGreaterThanOrEqual(20);
    });
  });
});
