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
    expect(screen.getByText('Strength Program')).toBeInTheDocument();
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
});
