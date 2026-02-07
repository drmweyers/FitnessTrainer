/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import ExerciseSelector from '../ExerciseSelector';

// Mock the context
const mockDispatch = jest.fn();

const defaultContextState = {
  weeks: [
    {
      weekNumber: 1,
      name: 'Week 1',
      workouts: [
        {
          dayNumber: 1,
          name: 'Push Day',
          workoutType: 'strength',
          exercises: [],
        },
      ],
    },
  ],
  currentWeekIndex: 0,
  currentWorkoutIndex: 0,
};

const mockUseProgramBuilder = jest.fn(() => ({
  state: { ...defaultContextState },
  dispatch: mockDispatch,
}));

jest.mock('../ProgramBuilderContext', () => ({
  useProgramBuilder: (...args: any[]) => mockUseProgramBuilder(...args),
}));

// Mock exercise service
jest.mock('@/services/exerciseService', () => ({
  searchExercises: jest.fn(() =>
    Promise.resolve({
      exercises: [
        {
          id: 'ex-1',
          exerciseId: 'ex-1',
          name: 'Bench Press',
          gifUrl: 'bench.gif',
          bodyParts: ['chest'],
          equipments: ['barbell'],
          targetMuscles: ['pectorals'],
          secondaryMuscles: ['triceps'],
          instructions: [],
        },
        {
          id: 'ex-2',
          exerciseId: 'ex-2',
          name: 'Shoulder Press',
          gifUrl: 'shoulder.gif',
          bodyParts: ['shoulders'],
          equipments: ['dumbbell'],
          targetMuscles: ['deltoids'],
          secondaryMuscles: ['triceps'],
          instructions: [],
        },
      ],
    })
  ),
  getFilterOptions: jest.fn(() =>
    Promise.resolve({
      bodyParts: ['chest', 'shoulders', 'back'],
      equipments: ['barbell', 'dumbbell', 'cable'],
      targetMuscles: ['pectorals', 'deltoids', 'lats'],
      secondaryMuscles: ['triceps', 'biceps'],
    })
  ),
}));

// Mock child components
jest.mock('../SupersetBuilder', () => {
  return function MockSupersetBuilder({ onClose }: any) {
    return (
      <div data-testid="superset-builder">
        Superset Builder
        <button onClick={onClose}>Close Superset</button>
      </div>
    );
  };
});

jest.mock('../RPEIntegration', () => {
  return function MockRPEIntegration({ onClose }: any) {
    return (
      <div data-testid="rpe-integration">
        RPE Integration
        <button onClick={onClose}>Close RPE</button>
      </div>
    );
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  GripVertical: () => <span data-testid="grip-icon" />,
  Target: () => <span data-testid="target-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Save: () => <span data-testid="save-icon" />,
  X: () => <span data-testid="x-icon" />,
  Dumbbell: () => <span data-testid="dumbbell-icon" />,
  Filter: () => <span data-testid="filter-icon" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  Star: () => <span data-testid="star-icon" />,
  Link: () => <span data-testid="link-icon" />,
}));

describe('ExerciseSelector', () => {
  const defaultProps = {
    onNext: jest.fn(),
    onPrev: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset mock to default state
    mockUseProgramBuilder.mockReturnValue({
      state: { ...defaultContextState },
      dispatch: mockDispatch,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Exercise Selection')).toBeInTheDocument();
  });

  it('displays current workout context', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText(/Week 1/)).toBeInTheDocument();
    expect(screen.getByText(/Push Day/)).toBeInTheDocument();
  });

  it('shows empty state when no exercises selected', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('No exercises selected')).toBeInTheDocument();
    expect(screen.getByText(/Search for exercises/)).toBeInTheDocument();
  });

  it('renders search bar', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
  });

  it('renders exercise library heading', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Exercise Library')).toBeInTheDocument();
  });

  it('shows exercises from search results', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
    });
  });

  it('shows filter toggle button', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders navigation buttons', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Back to Workouts')).toBeInTheDocument();
    expect(screen.getByText('Continue to Preview')).toBeInTheDocument();
  });

  it('calls onPrev when Back button is clicked', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByText('Back to Workouts'));
    expect(defaultProps.onPrev).toHaveBeenCalled();
  });

  it('shows 0 exercises selected count', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('Selected Exercises (0)')).toBeInTheDocument();
    expect(screen.getByText('0 exercises selected')).toBeInTheDocument();
  });

  it('renders No Workout Selected when no current workout', async () => {
    mockUseProgramBuilder.mockReturnValue({
      state: {
        weeks: [{ weekNumber: 1, name: 'Week 1', workouts: [] }],
        currentWeekIndex: 0,
        currentWorkoutIndex: 0,
      },
      dispatch: mockDispatch,
    });

    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByText('No Workout Selected')).toBeInTheDocument();
    expect(screen.getByText('Go Back to Workouts')).toBeInTheDocument();
  });

  it('disables Continue button when no exercises exist in any workout', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    const continueBtn = screen.getByText('Continue to Preview');
    expect(continueBtn).toBeDisabled();
  });

  it('shows exercise body parts as badges', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText('chest')).toBeInTheDocument();
      expect(screen.getByText('shoulders')).toBeInTheDocument();
    });
  });

  it('shows equipment badges excluding body weight', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText('barbell')).toBeInTheDocument();
      expect(screen.getByText('dumbbell')).toBeInTheDocument();
    });
  });

  it('shows Add buttons for exercises', async () => {
    render(<ExerciseSelector {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      const addButtons = screen.getAllByText('Add');
      expect(addButtons.length).toBe(2);
    });
  });
});
