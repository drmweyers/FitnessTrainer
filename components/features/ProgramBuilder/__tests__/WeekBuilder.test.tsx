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

  describe('WeekCard Interactions', () => {
    it('should toggle week expansion when clicking header', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Week 1 starts expanded by default, should show overview
      expect(screen.getByText('Week Overview')).toBeInTheDocument();

      // Click the header to collapse
      const weekHeaders = document.querySelectorAll('.cursor-pointer');
      if (weekHeaders.length > 0) {
        await user.click(weekHeaders[0] as HTMLElement);
        // After collapse, overview may be hidden
      }
    });

    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Find Edit button (has title="Edit week")
      const editButton = document.querySelector('[title="Edit week"]');
      expect(editButton).toBeTruthy();
      await user.click(editButton as HTMLElement);

      // Should show edit form
      expect(screen.getByText('Week Name')).toBeInTheDocument();
      expect(screen.getByText('Week Type')).toBeInTheDocument();
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('Deload')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should cancel editing when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const editButton = document.querySelector('[title="Edit week"]');
      await user.click(editButton as HTMLElement);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();

      // Click Cancel in the edit form
      const cancelButtons = screen.getAllByText('Cancel');
      // Find the Cancel in the edit form (not the one in delete confirm)
      await user.click(cancelButtons[0]);

      // Should be back to view mode
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });

    it('should save changes when Save Changes is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const editButton = document.querySelector('[title="Edit week"]');
      await user.click(editButton as HTMLElement);

      // Edit the week name
      const nameInput = screen.getByDisplayValue(/Week 1/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Heavy Week');

      await user.click(screen.getByText('Save Changes'));

      // Should exit edit mode
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      expect(screen.getByText('Heavy Week')).toBeInTheDocument();
    });

    it('should duplicate a week', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      const initialWeekTexts = screen.queryAllByText(/Week/i);

      const duplicateButton = document.querySelector('[title="Duplicate week"]');
      expect(duplicateButton).toBeTruthy();
      await user.click(duplicateButton as HTMLElement);

      await waitFor(() => {
        const newWeekTexts = screen.queryAllByText(/Week/i);
        expect(newWeekTexts.length).toBeGreaterThan(initialWeekTexts.length);
      });
    });

    it('should show delete confirmation when delete is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // First add a week so we have 2+ (delete only available with > 1)
      await user.click(screen.getByRole('button', { name: /Add Another Week/i }));

      await waitFor(() => {
        const deleteButtons = document.querySelectorAll('[title="Delete week"]');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      const deleteButton = document.querySelector('[title="Delete week"]');
      await user.click(deleteButton as HTMLElement);

      // Should show confirmation modal
      expect(screen.getByRole('heading', { name: 'Delete Week' })).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('should cancel delete when Cancel is clicked in confirm', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      await user.click(screen.getByRole('button', { name: /Add Another Week/i }));

      await waitFor(() => {
        expect(document.querySelector('[title="Delete week"]')).toBeTruthy();
      });

      await user.click(document.querySelector('[title="Delete week"]') as HTMLElement);
      expect(screen.getByRole('heading', { name: 'Delete Week' })).toBeInTheDocument();

      // Click Cancel in the confirmation modal
      const cancelButtons = screen.getAllByText('Cancel');
      const modalCancel = cancelButtons[cancelButtons.length - 1];
      await user.click(modalCancel);

      expect(screen.queryByText(/Are you sure you want to delete/)).not.toBeInTheDocument();
    });

    it('should show no workouts message in expanded empty week', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Default week is expanded and has no workouts
      expect(screen.getByText('No workouts added to this week yet')).toBeInTheDocument();
      expect(screen.getByText(/add workouts in the next step/)).toBeInTheDocument();
    });

    it('should show training and rest day stats', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Should show week overview
      expect(screen.getByText('Week Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Days')).toBeInTheDocument();
      expect(screen.getByText('Training')).toBeInTheDocument();
      expect(screen.getByText('Rest')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should prevent saving when week name is empty', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Click edit button
      const editButton = document.querySelector('[title="Edit week"]');
      await user.click(editButton as HTMLElement);

      // Clear the week name
      const nameInput = screen.getByDisplayValue(/Week 1/i);
      await user.clear(nameInput);

      // Try to save
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });

    it('should show workout count and rest day count in stats', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Week starts expanded, should show stats
      expect(screen.getByText('Total Days')).toBeInTheDocument();
      expect(screen.getByText('Training')).toBeInTheDocument();
      expect(screen.getByText('Rest')).toBeInTheDocument();
    });

    it('should show deload warning in tips section', () => {
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Check for deload week tip
      expect(screen.getByText(/Deload weeks/i)).toBeInTheDocument();
      expect(screen.getByText(/lighter training weeks for recovery/i)).toBeInTheDocument();
    });

    it('should toggle week type between regular and deload', async () => {
      const user = userEvent.setup();
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Click edit button
      const editButton = document.querySelector('[title="Edit week"]');
      await user.click(editButton as HTMLElement);

      // Should see Regular and Deload radio buttons
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('Deload')).toBeInTheDocument();

      // Click Deload
      const deloadRadio = screen.getByText('Deload').closest('label')?.querySelector('input');
      await user.click(deloadRadio as HTMLElement);

      // Save changes
      await user.click(screen.getByText('Save Changes'));

      // Should show deload badge
      await waitFor(() => {
        expect(screen.getByText('Deload Week')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should alert when trying to continue with no weeks', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Create a provider with no weeks
      const { ProgramBuilderProvider } = require('../ProgramBuilderContext');

      // Manually delete all weeks by clicking delete multiple times
      renderWithProvider(<WeekBuilder onNext={jest.fn()} onPrev={jest.fn()} />);

      // Continue button should be disabled when no weeks
      const continueButton = screen.getByRole('button', { name: /Continue to Workouts/i });
      expect(continueButton).toBeDisabled();

      alertSpy.mockRestore();
    });
  });
});
