/**
 * WorkoutBuilder Component Tests
 * Story 005-03: Workout Planning
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutBuilder from '../WorkoutBuilder';
import { ProgramBuilderProvider } from '../ProgramBuilderContext';

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
  });

  it('should render without crashing', () => {
    renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
    
    // Just verify component renders
    expect(screen.getByText(/Week \d+ of/i)).toBeInTheDocument();
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

    await user.click(screen.getByText(/Back to Week Structure/i));
    expect(handlePrev).toHaveBeenCalled();
  });
});
