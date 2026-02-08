/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressionBuilder from '../ProgressionBuilder';
import { ProgramWeekData } from '@/types/program';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const createMockWeeks = (): ProgramWeekData[] => [
  {
    weekNumber: 1,
    isDeload: false,
    workouts: [
      {
        name: 'Day 1',
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'ex-1',
            orderIndex: 0,
            configurations: [
              { setNumber: 1, reps: 10, weight: 100, restSeconds: 60 },
            ],
          },
          {
            exerciseId: 'ex-2',
            orderIndex: 1,
            configurations: [
              { setNumber: 1, reps: 12, weight: 50, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
  {
    weekNumber: 2,
    isDeload: false,
    workouts: [
      {
        name: 'Day 1',
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'ex-1',
            orderIndex: 0,
            configurations: [
              { setNumber: 1, reps: 10, weight: 100, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
];

describe('ProgressionBuilder', () => {
  const mockOnUpdateWeeks = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    weeks: createMockWeeks(),
    onUpdateWeeks: mockOnUpdateWeeks,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Exercise Progression Builder')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(
      screen.getByText('Configure progressive overload patterns for systematic strength gains')
    ).toBeInTheDocument();
  });

  it('shows instruction section', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('How Progressive Overload Works')).toBeInTheDocument();
  });

  it('displays exercises from weeks', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Select Exercises (0)')).toBeInTheDocument();
    expect(screen.getByText('Exercise 1')).toBeInTheDocument();
    expect(screen.getByText('Exercise 2')).toBeInTheDocument();
  });

  it('shows empty configuration state when no exercises are selected', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(
      screen.getByText('Select exercises to configure their progression')
    ).toBeInTheDocument();
  });

  it('disables apply button when no exercises are selected', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const applyButtons = screen.getAllByText('Apply Progressions');
    expect(applyButtons[0]).toBeDisabled();
  });

  it('renders Cancel button and calls onClose', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows exercise workout count', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Appears in 2 workouts')).toBeInTheDocument();
    expect(screen.getByText('Appears in 1 workout')).toBeInTheDocument();
  });

  it('shows progressive overload benefits section', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Progressive Overload Benefits')).toBeInTheDocument();
    expect(screen.getByText(/Continuous Adaptation/)).toBeInTheDocument();
    expect(screen.getByText(/Measurable Progress/)).toBeInTheDocument();
  });

  it('selects an exercise and shows configuration', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Select Exercises (1)')).toBeInTheDocument();
    expect(screen.getByText('Progression Type')).toBeInTheDocument();
  });

  it('shows progression type dropdown with all options', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    expect(select).toBeInTheDocument();
  });

  it('enables apply button when exercise is selected', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const applyButtons = screen.getAllByText('Apply Progressions');
    expect(applyButtons[0]).not.toBeDisabled();
  });

  it('calls onUpdateWeeks when apply is clicked', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
  });
});
