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
    // There may be multiple "Create Superset" references in the text
    const createButtons = screen.getAllByText(/Create Superset/);
    // The actual button should be disabled
    const button = createButtons.find(el => el.closest('button'));
    expect(button?.closest('button')).toBeDisabled();
  });

  it('enables create superset button when 2 exercises are selected', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const createButtons = screen.getAllByText(/Create Superset.*2/);
    const button = createButtons.find(el => el.closest('button'));
    expect(button?.closest('button')).not.toBeDisabled();
  });

  it('creates a superset when button is clicked', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const createButtons = screen.getAllByText(/Create Superset.*2/);
    const button = createButtons.find(el => el.closest('button'));
    if (button) fireEvent.click(button.closest('button')!);
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

  it('breaks apart a superset and creates ungrouped section', () => {
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

    const breakButton = screen.getByText('Break Apart');
    fireEvent.click(breakButton);

    expect(screen.queryByText('Superset A')).not.toBeInTheDocument();
    expect(screen.getByText('Individual Exercises')).toBeInTheDocument();
  });

  it('breaks apart a superset and adds to existing ungrouped section', () => {
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
      {
        exerciseId: 'ex-3',
        orderIndex: 2,
        configurations: [{ setNumber: 1, reps: 8 }],
      },
    ] as any;

    render(
      <SupersetBuilder
        exercises={exercises}
        onUpdateExercises={mockOnUpdateExercises}
        onClose={mockOnClose}
      />
    );

    const breakButton = screen.getByText('Break Apart');
    fireEvent.click(breakButton);

    expect(screen.queryByText('Superset A')).not.toBeInTheDocument();
    expect(screen.getByText('3 exercises')).toBeInTheDocument();
  });

  it('updates rest times between exercises', () => {
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

    const inputs = screen.getAllByRole('spinbutton');
    const betweenExercisesInput = inputs[0];
    fireEvent.change(betweenExercisesInput, { target: { value: '30' } });

    expect(betweenExercisesInput).toHaveValue(30);
  });

  it('updates rest times after superset', () => {
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

    const inputs = screen.getAllByRole('spinbutton');
    const afterSupersetInput = inputs[1];
    fireEvent.change(afterSupersetInput, { target: { value: '180' } });

    expect(afterSupersetInput).toHaveValue(180);
  });

  it('toggles exercise selection on and off', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('creates supersets with all available letters', () => {
    const manyExercises = Array.from({ length: 12 }, (_, i) => ({
      exerciseId: `ex-${i + 1}`,
      orderIndex: i,
      configurations: [{ setNumber: 1, reps: 10 }],
    }));

    const { rerender } = render(
      <SupersetBuilder
        exercises={manyExercises as any}
        onUpdateExercises={mockOnUpdateExercises}
        onClose={mockOnClose}
      />
    );

    // Create first superset
    let checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    let createButtons = screen.getAllByText(/Create Superset/);
    let button = createButtons.find(el => el.closest('button') && !el.closest('button')?.disabled);
    if (button) fireEvent.click(button.closest('button')!);

    expect(screen.getByText('Superset A')).toBeInTheDocument();

    // Create second superset
    checkboxes = screen.getAllByRole('checkbox');
    const unchecked = checkboxes.filter(cb => !cb.checked);
    if (unchecked.length >= 2) {
      fireEvent.click(unchecked[0]);
      fireEvent.click(unchecked[1]);

      createButtons = screen.getAllByText(/Create Superset/);
      button = createButtons.find(el => el.closest('button') && !el.closest('button')?.disabled);
      if (button) fireEvent.click(button.closest('button')!);

      expect(screen.getByText('Superset B')).toBeInTheDocument();
    }
  });

  it('shows rest time indicator between exercises in superset', () => {
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

    expect(screen.getByText(/↓ 0s/)).toBeInTheDocument();
  });

  it('does not create superset with less than 2 exercises', () => {
    render(<SupersetBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const createButtons = screen.getAllByText(/Create Superset.*1/);
    const button = createButtons.find(el => el.closest('button'));
    expect(button?.closest('button')).toBeDisabled();
  });

  it('renders without onClose prop', () => {
    const propsWithoutClose = {
      exercises: createMockExercises() as any,
      onUpdateExercises: mockOnUpdateExercises,
    };

    render(<SupersetBuilder {...propsWithoutClose} />);
    expect(screen.getByText('Superset Builder')).toBeInTheDocument();
    // Only one set of action buttons (no Cancel buttons)
    const applyButton = screen.getByText('Apply Superset Configuration');
    expect(applyButton).toBeInTheDocument();
  });

  it('handles unknown superset group letter', () => {
    const exercises = [
      {
        exerciseId: 'ex-1',
        orderIndex: 0,
        supersetGroup: 'Z',
        configurations: [{ setNumber: 1, reps: 10 }],
      },
      {
        exerciseId: 'ex-2',
        orderIndex: 1,
        supersetGroup: 'Z',
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

    expect(screen.getByText('Superset Z')).toBeInTheDocument();
  });
});
