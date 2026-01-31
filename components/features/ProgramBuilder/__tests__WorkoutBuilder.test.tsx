/**
 * WorkoutBuilder Component Tests
 * Story 005-03: Add Exercises / Build Weekly Structure
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
    it('should render the workout planning title', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const headings = screen.getAllByRole('heading');
      const mainHeading = headings.find(h => h.textContent?.includes('Workout Planning'));
      expect(mainHeading).toBeInTheDocument();
    });

    it('should display week selector', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText(/Add and configure workouts/i)).toBeInTheDocument();
    });

    it('should show current week info', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show week info
      expect(screen.getByText(/Week \d+ of/i)).toBeInTheDocument();
    });
  });

  describe('Workout Management', () => {
    it('should have Add Workout buttons', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Could be "Add First Workout" or "Add Another Workout"
      const addButton = screen.queryByRole('button', { name: /Add.*Workout/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Week Navigation', () => {
    it('should display week selector', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should have clickable week buttons
      const weekButtons = screen.queryAllByText(/Week \d+/);
      expect(weekButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('should have Back and Continue buttons', () => {
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

    it('should have accessible buttons', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByRole('button', { name: /Back to Week Structure/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Exercises/i })).toBeInTheDocument();
    });

    it('should show workout stats accessibly', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show workout statistics
      expect(screen.getByText(/training days/i)).toBeInTheDocument();
      expect(screen.getByText(/rest days/i)).toBeInTheDocument();
    });
  });

  describe('User Guidance', () => {
    it('should provide helpful tips for workout planning', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show tips section
      const tipsText = screen.getByText(/Workout Planning Tips/i);
      expect(tipsText).toBeInTheDocument();
    });
  });

  describe('Workout Stats', () => {
    it('should display workout count for current week', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show number of workouts
      const workoutCount = screen.queryByText(/\d+ workouts?/i);
      expect(workoutCount).toBeInTheDocument();
    });

    it('should show training and rest day breakdown', () => {
      renderWithProvider(<WorkoutBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText(/training days/i)).toBeInTheDocument();
      expect(screen.getByText(/rest days/i)).toBeInTheDocument();
    });
  });
});
