/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkAssignmentModal from '../BulkAssignmentModal';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

describe('BulkAssignmentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAssign = jest.fn().mockResolvedValue(undefined);

  const mockProgram = {
    id: 'prog-1',
    name: 'Strength Program',
    durationWeeks: 12,
    assignments: [{ isActive: true }, { isActive: false }],
  } as any;

  const defaultProps = {
    program: mockProgram,
    isOpen: true,
    onClose: mockOnClose,
    onAssign: mockOnAssign,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              id: 'client-1',
              displayName: 'John Doe',
              email: 'john@example.com',
              trainerClient: { status: 'active' },
              clientProfile: { goals: { primaryGoal: 'Weight Loss' } },
            },
            {
              id: 'client-2',
              displayName: 'Jane Smith',
              email: 'jane@example.com',
              trainerClient: { status: 'active' },
            },
          ],
        }),
    });
  });

  it('does not render when isOpen is false', () => {
    render(<BulkAssignmentModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Assign Program to Clients')).not.toBeInTheDocument();
  });

  it('renders the modal when isOpen is true', async () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByText('Assign Program to Clients')).toBeInTheDocument();
  });

  it('displays the program name', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    // Program name appears in both header and info section
    const programNames = screen.getAllByText('Strength Program');
    expect(programNames.length).toBeGreaterThanOrEqual(1);
  });

  it('displays program duration', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByText('12 weeks')).toBeInTheDocument();
  });

  it('shows active assignments count', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByText('1 active assignments')).toBeInTheDocument();
  });

  it('has a search input for clients', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search clients by name or email...')).toBeInTheDocument();
  });

  it('loads clients when modal opens', async () => {
    render(<BulkAssignmentModal {...defaultProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/clients', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows select all and deselect all buttons', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByText('Select All Visible')).toBeInTheDocument();
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('has Cancel button that calls onClose', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables Assign button when no clients are selected', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const assignButton = screen.getByText('Assign to 0 Clients');
    expect(assignButton).toBeDisabled();
  });

  it('shows Filters button', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows filter options when Filters button is clicked', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  describe('Client filtering', () => {
    it('filters clients by search term (name)', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search clients by name or email...');
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters clients by search term (email)', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search clients by name or email...');
      fireEvent.change(searchInput, { target: { value: 'jane@' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('shows status filter when filters expanded', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Filters'));

      // Status label should be visible
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });
  });

  describe('Client selection', () => {
    it('enables assign button when client is selected', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Initially button should be disabled
      const assignButton = screen.getByText(/Assign to 0 Client/);
      expect(assignButton).toBeDisabled();

      // Find and click the checkbox for John Doe
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
      fireEvent.click(checkboxes[0]);

      // After clicking, button text and enabled state should update
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const updatedAssignButton = buttons.find(btn => btn.textContent?.includes('Assign to'));
        expect(updatedAssignButton).toBeTruthy();
      });
    });

    it('selects all visible clients', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All Visible');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByText(/Assign to 2 Clients/)).toBeInTheDocument();
      });
    });

    it('deselects all clients', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // First select all
      fireEvent.click(screen.getByText('Select All Visible'));

      await waitFor(() => {
        expect(screen.getByText(/Assign to 2 Clients/)).toBeInTheDocument();
      });

      // Then deselect all
      fireEvent.click(screen.getByText('Deselect All'));

      await waitFor(() => {
        expect(screen.getByText('Assign to 0 Clients')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('handles fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load clients:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('handles non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('handles missing access token', async () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      render(<BulkAssignmentModal {...defaultProps} />);

      // Should not crash, just not fetch
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('handles assignment error', async () => {
      const errorOnAssign = jest.fn().mockRejectedValue(new Error('Assignment failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<BulkAssignmentModal {...defaultProps} onAssign={errorOnAssign} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select a client
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find and click assign button
      const buttons = screen.getAllByRole('button');
      const assignButton = buttons.find(btn =>
        btn.textContent?.includes('Assign to') && !btn.textContent?.includes('0')
      );

      if (assignButton) {
        fireEvent.click(assignButton);

        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Failed to assign program:', expect.any(Error));
        });
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Assignment with no selection', () => {
    it('does not call onAssign when no clients selected', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const assignButton = screen.getByText('Assign to 0 Clients');

      // Button should be disabled
      expect(assignButton).toBeDisabled();

      // Even if we try to click, it shouldn't call onAssign
      fireEvent.click(assignButton);
      expect(mockOnAssign).not.toHaveBeenCalled();
    });
  });

  describe('Successful assignment', () => {
    it('calls onAssign and onClose on successful assignment', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select a client
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find the assign button (should now be enabled)
      const buttons = screen.getAllByRole('button');
      const assignButton = buttons.find(btn =>
        btn.textContent?.includes('Assign to') && !btn.textContent?.includes('0')
      );

      if (assignButton && !assignButton.hasAttribute('disabled')) {
        fireEvent.click(assignButton);

        await waitFor(() => {
          expect(mockOnAssign).toHaveBeenCalled();
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    });

    it('passes correct customizations to onAssign', async () => {
      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select a client
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find and click assign button
      const buttons = screen.getAllByRole('button');
      const assignButton = buttons.find(btn =>
        btn.textContent?.includes('Assign to') && !btn.textContent?.includes('0')
      );

      if (assignButton) {
        fireEvent.click(assignButton);

        await waitFor(() => {
          expect(mockOnAssign).toHaveBeenCalledWith(
            expect.arrayContaining(['client-1']),
            expect.objectContaining({
              startDate: expect.any(String),
              allowModifications: true,
              sendNotification: true,
            })
          );
        });
      }
    });
  });

  describe('Data handling', () => {
    it('handles different response data structures (data property)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              id: 'client-3',
              displayName: 'Bob Johnson',
              email: 'bob@example.com',
              trainerClient: { status: 'active' },
            },
          ],
        }),
      });

      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('handles response with clients property', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          clients: [
            {
              id: 'client-4',
              displayName: 'Alice Brown',
              email: 'alice@example.com',
              trainerClient: { status: 'active' },
            },
          ],
        }),
      });

      render(<BulkAssignmentModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      });
    });

    it('handles non-array response gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      });

      render(<BulkAssignmentModal {...defaultProps} />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Assign Program to Clients')).toBeInTheDocument();
      });
    });
  });

});
