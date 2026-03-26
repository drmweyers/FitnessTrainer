/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// --- Mocks ---
jest.mock('lucide-react', () => ({
  RefreshCw: () => <span data-testid="icon-refresh" />,
  X: () => <span data-testid="icon-x" />,
  Dumbbell: () => <span data-testid="icon-dumbbell" />,
  Target: () => <span data-testid="icon-target" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

jest.mock('@/components/shared/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant} {...rest}>
      {children}
    </button>
  ),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import ExerciseSubstitution from '../ExerciseSubstitution';

const mockAlternatives = [
  {
    id: 'alt-1',
    exerciseId: 'alt001',
    name: 'Dumbbell Bench Press',
    gifUrl: 'https://example.com/db-bench.gif',
    equipment: 'dumbbell',
    targetMuscle: 'pectorals',
    bodyPart: 'chest',
  },
  {
    id: 'alt-2',
    exerciseId: 'alt002',
    name: 'Cable Fly',
    gifUrl: 'https://example.com/cable-fly.gif',
    equipment: 'cable',
    targetMuscle: 'pectorals',
    bodyPart: 'chest',
  },
];

const defaultProps = {
  exerciseId: 'abc123',
  exerciseName: 'Bench Press',
  onSubstitute: jest.fn(),
  onClose: jest.fn(),
};

describe('ExerciseSubstitution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        alternatives: mockAlternatives,
        sourceExercise: { exerciseId: 'abc123', name: 'Bench Press' },
      }),
    });
  });

  it('renders the swap exercise modal title', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    expect(screen.getByText(/swap exercise/i)).toBeInTheDocument();
  });

  it('shows the source exercise name', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    expect(screen.getByText(/bench press/i)).toBeInTheDocument();
  });

  it('fetches alternatives on mount', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/exercises/alternatives?exerciseId=abc123')
      );
    });
  });

  it('displays fetched alternative exercises', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Dumbbell Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Cable Fly')).toBeInTheDocument();
    });
  });

  it('shows equipment and target muscle for each alternative', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => {
      // Multiple elements may show "dumbbell" (exercise name + equipment badge)
      const dumbellItems = screen.getAllByText(/dumbbell/i);
      expect(dumbellItems.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/cable/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/pectorals/i).length).toBeGreaterThan(0);
    });
  });

  it('calls onSubstitute with new exerciseId when alternative is selected', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => screen.getByText('Dumbbell Bench Press'));

    fireEvent.click(screen.getByText('Dumbbell Bench Press').closest('[data-testid="alt-alt001"]') || screen.getByText('Dumbbell Bench Press'));

    // Find and click the select button for first alternative
    const selectButtons = screen.getAllByRole('button', { name: /select|use this/i });
    fireEvent.click(selectButtons[0]);

    expect(defaultProps.onSubstitute).toHaveBeenCalledWith('alt001');
  });

  it('calls onClose when close button is clicked', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    // Use the header close button (aria-label="Close")
    const closeButton = screen.getByRole('button', { name: /^close$/i });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state while fetching', () => {
    // Keep fetch pending
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ExerciseSubstitution {...defaultProps} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/failed to load|error|try again/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no alternatives found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ alternatives: [], sourceExercise: { exerciseId: 'abc123' } }),
    });
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/no alternatives|no substitutes/i)).toBeInTheDocument();
    });
  });

  it('shows gif preview image for each alternative', async () => {
    render(<ExerciseSubstitution {...defaultProps} />);
    await waitFor(() => {
      const imgs = screen.getAllByRole('img');
      expect(imgs.length).toBeGreaterThan(0);
    });
  });
});
