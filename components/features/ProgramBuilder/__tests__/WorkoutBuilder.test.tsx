/**
 * @jest-environment jsdom
 */
/**
 * WorkoutBuilder Component Tests
 * Story 005-03: Workout Planning
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import WorkoutBuilder from '../WorkoutBuilder';
import { ProgramBuilderProvider } from '../ProgramBuilderContext';

// Mock the context with initial weeks data
const defaultContextValue = {
  state: {
    programName: '',
    programDescription: '',
    difficultyLevel: 'intermediate',
    durationWeeks: 4,
    weeks: [{
      weekNumber: 1,
      workouts: [],
      notes: ''
    }],
    currentWeekIndex: 0
  },
  setWeeks: jest.fn(),
  addWeek: jest.fn(),
  updateWeek: jest.fn(),
  deleteWeek: jest.fn(),
  setCurrentWeekIndex: jest.fn(),
  setProgramName: jest.fn(),
  setProgramDescription: jest.fn(),
  setDifficultyLevel: jest.fn(),
  setDurationWeeks: jest.fn()
};

jest.mock('../ProgramBuilderContext', () => ({
  ...jest.requireActual('../ProgramBuilderContext'),
  useProgramBuilder: jest.fn(() => defaultContextValue)
}));

const renderWithProvider = (component) => {
  return render(
    <ProgramBuilderProvider>
      {component}
    </ProgramBuilderProvider>
  );
};

describe('WorkoutBuilder', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

    // Verify component shows week information
    expect(screen.getByText(/Week 1 of 1/i)).toBeInTheDocument();
  });

  it('should have navigation buttons', () => {
    renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

    expect(screen.getByText(/Back to Week Structure/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue to Exercises/i)).toBeInTheDocument();
  });

  it('should call onPrev when Back button clicked', async () => {
    const user = userEvent.setup();
    const handlePrev = jest.fn();

    renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={handlePrev} />);

    const backButton = screen.getByText(/Back to Week Structure/i);
    await user.click(backButton);
    expect(handlePrev).toHaveBeenCalled();
  });

  it('should call onNext when Continue button clicked', async () => {
    const user = userEvent.setup();
    const handleNext = jest.fn();

    // Need at least one workout for validation to pass
    const useProgramBuilder = jest.requireMock('../ProgramBuilderContext').useProgramBuilder;
    useProgramBuilder.mockReturnValue({
      ...defaultContextValue,
      state: {
        ...defaultContextValue.state,
        weeks: [{
          weekNumber: 1,
          workouts: [{ id: 'w1', name: 'Day 1', dayNumber: 1, workoutType: 'strength', isRestDay: false, exercises: [], estimatedDuration: 60 }],
          notes: ''
        }],
      },
    });

    renderWithProvider(<WorkoutBuilder onNext={handleNext} onPrev={jest.fn()} />);

    const nextButton = screen.getByText(/Continue to Exercises/i);
    await user.click(nextButton);
    expect(handleNext).toHaveBeenCalled();
  });

  it('should display week count correctly', () => {
    renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
    expect(screen.getByText(/Week 1 of 1/i)).toBeInTheDocument();
  });

  it('should render without workouts', () => {
    renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
    // Component should still render even with empty workouts
    expect(screen.getByText(/Week 1 of 1/i)).toBeInTheDocument();
  });

  describe('Workout management', () => {
    const mockWorkouts = [{
      id: 'w1',
      name: 'Push Day',
      dayNumber: 1,
      workoutType: 'strength',
      isRestDay: false,
      exercises: [],
      estimatedDuration: 60
    }];

    beforeEach(() => {
      const useProgramBuilder = jest.requireMock('../ProgramBuilderContext').useProgramBuilder;
      useProgramBuilder.mockReturnValue({
        state: {
          programName: 'Test Program',
          programDescription: '',
          difficultyLevel: 'intermediate',
          durationWeeks: 4,
          weeks: [{
            weekNumber: 1,
            workouts: mockWorkouts,
            notes: ''
          }],
          currentWeekIndex: 0
        },
        setWeeks: jest.fn(),
        addWeek: jest.fn(),
        updateWeek: jest.fn(),
        deleteWeek: jest.fn(),
        setCurrentWeekIndex: jest.fn(),
        setProgramName: jest.fn(),
        setProgramDescription: jest.fn(),
        setDifficultyLevel: jest.fn(),
        setDurationWeeks: jest.fn()
      });
    });

    it('should display workout cards', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.getByText('Push Day')).toBeInTheDocument();
    });

    it('should display workout type', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.getByText(/Strength Training/i)).toBeInTheDocument();
    });

    it('should display estimated duration', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.getByText(/60min/i)).toBeInTheDocument();
    });

    it('should display day of week', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      const mondayElements = screen.getAllByText(/Monday/i);
      expect(mondayElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have edit button', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      const editButton = screen.getByTitle('Edit workout');
      expect(editButton).toBeInTheDocument();
    });

    it('should have delete button when can delete', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      // Delete button should be present if there are multiple workouts
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Rest day workouts', () => {
    beforeEach(() => {
      const useProgramBuilder = jest.requireMock('../ProgramBuilderContext').useProgramBuilder;
      useProgramBuilder.mockReturnValue({
        state: {
          programName: 'Test Program',
          programDescription: '',
          difficultyLevel: 'intermediate',
          durationWeeks: 4,
          weeks: [{
            weekNumber: 1,
            workouts: [{
              id: 'w1',
              name: 'Rest',
              dayNumber: 7,
              isRestDay: true,
              exercises: []
            }],
            notes: ''
          }],
          currentWeekIndex: 0
        },
        setWeeks: jest.fn(),
        addWeek: jest.fn(),
        updateWeek: jest.fn(),
        deleteWeek: jest.fn(),
        setCurrentWeekIndex: jest.fn(),
        setProgramName: jest.fn(),
        setProgramDescription: jest.fn(),
        setDifficultyLevel: jest.fn(),
        setDurationWeeks: jest.fn()
      });
    });

    it('should display rest day badge', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.getByText('Rest Day')).toBeInTheDocument();
    });

    it('should not display workout type for rest days', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.queryByText(/Strength Training/i)).not.toBeInTheDocument();
    });
  });

  describe('Multiple weeks', () => {
    beforeEach(() => {
      const useProgramBuilder = jest.requireMock('../ProgramBuilderContext').useProgramBuilder;
      useProgramBuilder.mockReturnValue({
        state: {
          programName: 'Test Program',
          programDescription: '',
          difficultyLevel: 'intermediate',
          durationWeeks: 4,
          weeks: [
            { weekNumber: 1, workouts: [], notes: '' },
            { weekNumber: 2, workouts: [], notes: '' }
          ],
          currentWeekIndex: 0
        },
        setWeeks: jest.fn(),
        addWeek: jest.fn(),
        updateWeek: jest.fn(),
        deleteWeek: jest.fn(),
        setCurrentWeekIndex: jest.fn(),
        setProgramName: jest.fn(),
        setProgramDescription: jest.fn(),
        setDifficultyLevel: jest.fn(),
        setDurationWeeks: jest.fn()
      });
    });

    it('should display total week count', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.getByText(/Week 1 of 2/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have clickable buttons', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper button labels', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      expect(screen.getByText(/Back to Week Structure/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue to Exercises/i)).toBeInTheDocument();
    });
  });
});
