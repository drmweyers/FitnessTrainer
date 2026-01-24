/**
 * WorkoutBuilder Component Tests
 * Story 005-03: Workout Planning
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutBuilder from '../WorkoutBuilder';
import { ProgramBuilderProvider } from '../ProgramBuilderContext';

// Mock the context with initial weeks data
jest.mock('../ProgramBuilderContext', () => ({
  ...jest.requireActual('../ProgramBuilderContext'),
  useProgramBuilder: () => ({
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
  })
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
});
