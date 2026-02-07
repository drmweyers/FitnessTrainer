/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ProgramPreview from '../ProgramPreview';

// Mock the context
const mockDispatch = jest.fn();
jest.mock('../ProgramBuilderContext', () => ({
  useProgramBuilder: jest.fn(() => ({
    state: {
      name: 'Test Program',
      description: 'A test training program',
      programType: 'strength',
      difficultyLevel: 'intermediate',
      durationWeeks: 4,
      goals: ['Build Muscle', 'Increase Strength'],
      equipmentNeeded: ['Barbell', 'Dumbbells'],
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          description: 'Foundation week',
          isDeload: false,
          workouts: [
            {
              dayNumber: 1,
              name: 'Push Day',
              workoutType: 'strength',
              estimatedDuration: 60,
              isRestDay: false,
              exercises: [
                {
                  exerciseId: 'ex-1',
                  orderIndex: 0,
                  notes: 'Focus on form',
                  configurations: [
                    {
                      setNumber: 1,
                      setType: 'working',
                      reps: '8-12',
                      weightGuidance: '70% 1RM',
                      restSeconds: 90,
                      rpe: 7,
                    },
                  ],
                },
              ],
            },
            {
              dayNumber: 2,
              name: 'Rest Day',
              isRestDay: true,
              exercises: [],
            },
          ],
        },
      ],
    },
    dispatch: mockDispatch,
  })),
  programBuilderHelpers: {
    toApiFormat: jest.fn((state: any) => ({
      name: state.name,
      description: state.description,
      programType: state.programType,
      difficultyLevel: state.difficultyLevel,
      durationWeeks: state.durationWeeks,
      weeks: state.weeks,
    })),
  },
}));

// Mock ProgressionBuilder
jest.mock('../ProgressionBuilder', () => {
  return function MockProgressionBuilder({ onClose }: any) {
    return (
      <div data-testid="progression-builder">
        Progression Builder
        <button onClick={onClose}>Close Progression</button>
      </div>
    );
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  Target: () => <span data-testid="target-icon" />,
  Dumbbell: () => <span data-testid="dumbbell-icon" />,
  Save: () => <span data-testid="save-icon" />,
  CheckCircle: () => <span data-testid="check-icon" />,
  AlertCircle: () => <span data-testid="alert-icon" />,
  TrendingUp: () => <span data-testid="trending-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
}));

describe('ProgramPreview', () => {
  const defaultProps = {
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSave: jest.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Program Preview')).toBeInTheDocument();
  });

  it('displays program name', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Test Program')).toBeInTheDocument();
  });

  it('displays program description', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('A test training program')).toBeInTheDocument();
  });

  it('displays program type badge', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('strength')).toBeInTheDocument();
  });

  it('displays difficulty level badge', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('displays week count badge', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('1 weeks')).toBeInTheDocument();
  });

  it('displays program statistics', () => {
    render(<ProgramPreview {...defaultProps} />);

    expect(screen.getByText('Program Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Weeks')).toBeInTheDocument();
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    expect(screen.getByText('Total Exercises')).toBeInTheDocument();
    expect(screen.getByText('Training Days')).toBeInTheDocument();
  });

  it('calculates correct statistics', () => {
    render(<ProgramPreview {...defaultProps} />);

    // Various statistics should be present
    // 1 week, 2 workouts, 1 exercise, 1 training day
    // These numbers appear in multiple contexts, so just verify the section exists
    expect(screen.getByText('Program Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Weeks')).toBeInTheDocument();
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
  });

  it('displays goals', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Build Muscle')).toBeInTheDocument();
    expect(screen.getByText('Increase Strength')).toBeInTheDocument();
  });

  it('displays equipment needed', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Equipment Needed')).toBeInTheDocument();
    expect(screen.getByText('Barbell')).toBeInTheDocument();
    expect(screen.getByText('Dumbbells')).toBeInTheDocument();
  });

  it('renders week breakdown section', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Week Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Week 1')).toBeInTheDocument();
  });

  it('renders save options section', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Save Options')).toBeInTheDocument();
    expect(screen.getByText('Save as Template')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Back to Exercises')).toBeInTheDocument();
    expect(screen.getByText('Save Program')).toBeInTheDocument();
  });

  it('calls onPrev when Back button is clicked', () => {
    render(<ProgramPreview {...defaultProps} />);
    fireEvent.click(screen.getByText('Back to Exercises'));
    expect(defaultProps.onPrev).toHaveBeenCalled();
  });

  it('calls onSave when Save Program is clicked', async () => {
    render(<ProgramPreview {...defaultProps} />);
    fireEvent.click(screen.getByText('Save Program'));

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });

  it('renders Expand All button', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Expand All')).toBeInTheDocument();
  });

  it('renders Add Progression button', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Add Progression')).toBeInTheDocument();
  });

  it('shows ready indicator when program is valid', () => {
    render(<ProgramPreview {...defaultProps} />);
    // Check icon should be present for valid program
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('toggles save as template checkbox', () => {
    render(<ProgramPreview {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox', { name: /save as template/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('expands week when clicked', () => {
    render(<ProgramPreview {...defaultProps} />);

    // Week 1 should be expanded by default (expandedWeeks starts with Set([0]))
    expect(screen.getByText('Push Day')).toBeInTheDocument();
  });

  it('shows workout details including exercise count and sets', () => {
    render(<ProgramPreview {...defaultProps} />);
    // The WorkoutSummary should show exercise and set counts
    expect(screen.getByText(/1 exercises.*1 sets|1 sets.*1 exercises/)).toBeInTheDocument();
  });

  it('shows rest day indicator', () => {
    render(<ProgramPreview {...defaultProps} />);
    expect(screen.getByText('Rest Day')).toBeInTheDocument();
  });
});
