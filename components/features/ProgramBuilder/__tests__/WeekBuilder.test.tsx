/**
 * @jest-environment jsdom
 */
/**
 * WeekBuilder Component Tests
 * Story 005-02: Build Weekly Structure
 *
 * Following Ralph Loop TDD: RED → GREEN → REFACTOR
 *
 * Tests for existing WeekBuilder component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import WeekBuilder from '../WeekBuilder';
import { ProgramBuilderProvider } from '../ProgramBuilderContext';

// Helper to render component with provider
const renderWithProvider = (component: React.ReactChild) => {
  return render(
    <ProgramBuilderProvider>
      {component}
    </ProgramBuilderProvider>
  );
};

describe('WeekBuilder - Story 005-02: Build Weekly Structure', () => {
  // Cleanup after each test to prevent state pollution
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the week structure title', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const headings = screen.getAllByRole('heading');
      const mainHeading = headings.find(h => h.textContent?.includes('Week Structure'));
      expect(mainHeading).toBeInTheDocument();

      // Check for the subtitle/description
      expect(screen.getByText(/weekly structure of your/i)).toBeInTheDocument();
    });

    it('should display program summary with current info', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Program summary should show program info
      expect(screen.getByText(/weeks configured/i)).toBeInTheDocument();
    });

    it('should display week cards for the program', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show week cards - look for any text containing "Week"
      const weekTexts = screen.queryAllByText(/Week/i);
      expect(weekTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Week Management', () => {
    it('should allow adding a new week', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const initialWeekTexts = screen.queryAllByText(/Week/i);

      // Click "Add Another Week" button
      const addButton = screen.getByRole('button', { name: /Add Another Week/i });
      await user.click(addButton);

      // Wait for new week to be added
      await waitFor(() => {
        const newWeekTexts = screen.queryAllByText(/Week/i);
        expect(newWeekTexts.length).toBeGreaterThan(initialWeekTexts.length);
      });
    });

    it('should have an Add Another Week button', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const addButton = screen.getByRole('button', { name: /Add Another Week/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Week Information Display', () => {
    it('should show tips for week structure', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByText(/Week Structure Tips/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have a Back button to return to Program Info', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      expect(screen.getByRole('button', { name: /Back to Program Info/i })).toBeInTheDocument();
    });

    it('should have a Continue button to proceed to Workouts', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const continueButton = screen.getByRole('button', { name: /Continue to Workouts/i });
      expect(continueButton).toBeInTheDocument();
    });

    it('should call onPrev when Back button is clicked', async () => {
      const user = userEvent.setup();
      const handlePrev = jest.fn();

      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={handlePrev} />);

      const backButton = screen.getByRole('button', { name: /Back to Program Info/i });
      await user.click(backButton);

      expect(handlePrev).toHaveBeenCalled();
    });

    it('should call onNext when Continue button is clicked with valid weeks', async () => {
      const user = userEvent.setup();
      const handleNext = jest.fn();

      renderWithProvider(<WeekBuilder onNext={handleNext} onPrev={jest.fn()} />);

      const continueButton = screen.getByRole('button', { name: /Continue to Workouts/i });
      await user.click(continueButton);

      expect(handleNext).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const headings = screen.getAllByRole('heading');
      const mainHeading = headings.find(h => h.textContent?.includes('Week Structure'));
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Check navigation buttons are accessible
      expect(screen.getByRole('button', { name: /Back to Program Info/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to Workouts/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Another Week/i })).toBeInTheDocument();
    });
  });

  describe('Week Stats Display', () => {
    it('should display program duration and week count', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show the number of weeks configured
      expect(screen.getByText(/weeks configured/i)).toBeInTheDocument();
    });
  });
});
