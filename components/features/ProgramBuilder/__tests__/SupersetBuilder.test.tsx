/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import SupersetBuilder from '../SupersetBuilder';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const createMockExercises = () => [
  {
    exerciseId: 'ex-1',
    orderIndex: 0,
    configurations: [{ setNumber: 1, reps: 10, weight: 100 }],
  },
  {
    exerciseId: 'ex-2',
    orderIndex: 1,
    configurations: [{ setNumber: 1, reps: 12, weight: 50 }],
  },
  {
    exerciseId: 'ex-3',
    orderIndex: 2,
    configurations: [{ setNumber: 1, reps: 8, weight: 80 }],
  },
];

describe('SupersetBuilder', () => {
  const mockOnUpdateExercises = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    exercises: createMockExercises() as any,
    onUpdateExercises: mockOnUpdateExercises,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(screen.getByText('Superset Builder')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(
      screen.getByText('Group exercises into supersets and circuits for more efficient training')
    ).toBeInTheDocument();
  });

  it('shows instruction section', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(screen.getByText('How to Create Supersets')).toBeInTheDocument();
  });

  it('renders individual exercises section', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(screen.getByText('Individual Exercises')).toBeInTheDocument();
    expect(screen.getByText('3 exercises')).toBeInTheDocument();
  });

  it('shows exercise checkboxes', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('disables create superset button when less than 2 exercises are selected', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const createButton = screen.getByText(/Create Superset/);
    expect(createButton).toBeDisabled();
  });

  it('enables create superset button when 2 exercises are selected', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const createButton = screen.getByText('Create Superset (2)');
    expect(createButton).not.toBeDisabled();
  });

  it('creates a superset when button is clicked', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    fireEvent.click(screen.getByText('Create Superset (2)'));
    expect(screen.getByText('Superset A')).toBeInTheDocument();
  });

  it('shows superset benefits section', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(screen.getByText('Superset Benefits')).toBeInTheDocument();
    expect(screen.getByText(/Time Efficiency/)).toBeInTheDocument();
  });

  it('shows Save Changes and Cancel buttons', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    const cancelButtons = screen.getAllByText('Cancel');
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onUpdateExercises when Save Changes is clicked', () => {
    render(<SupersetBuilder {...defaultProps} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(mockOnUpdateExercises).toHaveBeenCalled();
  });

  it('shows 0 supersets configured initially', () => {
    render(<SupersetBuilder {...defaultProps} />);
    expect(screen.getByText('0 supersets configured')).toBeInTheDocument();
  });

  it('renders with existing superset groups', () => {
    const exercises = [
      {
        exerciseId: 'ex-1',
        orderIndex: 0,
        supersetGroup: 'A',
        configurations: [{ setNumber: 1, reps: 10 }],
      },
      {
        exerciseId: 'ex-2',
        orderIndex: 1,
        supersetGroup: 'A',
        configurations: [{ setNumber: 1, reps: 12 }],
      },
    ] as any;

    render(
      <SupersetBuilder
        exercises={exercises}
        onUpdateExercises={mockOnUpdateExercises}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Superset A')).toBeInTheDocument();
    expect(screen.getByText('Break Apart')).toBeInTheDocument();
  });
});
