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

describe('WorkoutBuilder - Story 005-03', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render component without crashing', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      
      // Should render main content
      const container = screen.getByText(/workouts/i);
      expect(container).toBeInTheDocument();
    });

    it('should show week information', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      
      const weekInfo = screen.getByText(/Week \d+ of/i);
      expect(weekInfo).toBeInTheDocument();
    });
  });

  describe('Workout Management', () => {
    it('should have Add Workout buttons', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      
      const addButton = screen.queryByRole('button', { name: /Add.*Workout/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have navigation buttons', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);
      
      expect(screen.getByRole('button', { name: /Back to Week Structure/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Exercises/i })).toBeInTheDocument();
    });

    it('should call onPrev when Back button is clicked', async () => {
      const user = userEvent.setup();
      const handlePrev = jest.fn();

      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={handlePrev} />);

      const backButton = screen.getByRole('button', { name: /Back to Week Structure/i });
      await user.click(backButton);

      expect(handlePrev).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const headings = screen.getAllByRole('heading');
      const mainHeading = headings.find(h => h.textContent?.includes('Workout Planning'));
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have accessible navigation buttons', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByRole('button', { name: /Back to Week Structure/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Exercises/i })).toBeInTheDocument();
    });

    it('should display workout statistics', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText(/training days/i)).toBeInTheDocument();
      expect(screen.getByText(/rest days/i)).toBeInTheDocument();
    });
  });

  describe('User Guidance', () => {
    it('should display tips section', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should have some user guidance
      const tipsSection = screen.queryByText(/Tips/i);
      expect(tipsSection).toBeInTheDocument();
    });
  });
});
