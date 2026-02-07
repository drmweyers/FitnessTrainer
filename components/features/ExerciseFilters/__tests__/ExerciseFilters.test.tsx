/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExerciseFilters from '../ExerciseFilters';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  ChevronDown: (props: any) => <span data-testid="icon-chevron" {...props} />,
}));

describe('ExerciseFilters', () => {
  describe('Rendering', () => {
    it('renders all filter categories', () => {
      render(<ExerciseFilters />);
      expect(screen.getByText('Muscle Group')).toBeInTheDocument();
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
    });

    it('shows Muscle Group expanded by default', () => {
      render(<ExerciseFilters />);
      expect(screen.getByText('Chest')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Shoulders')).toBeInTheDocument();
      expect(screen.getByText('Arms')).toBeInTheDocument();
      expect(screen.getByText('Legs')).toBeInTheDocument();
      expect(screen.getByText('Core')).toBeInTheDocument();
    });

    it('shows Equipment expanded by default', () => {
      render(<ExerciseFilters />);
      expect(screen.getByText('Barbell')).toBeInTheDocument();
      expect(screen.getByText('Dumbbell')).toBeInTheDocument();
      expect(screen.getByText('Kettlebell')).toBeInTheDocument();
      expect(screen.getByText('Machine')).toBeInTheDocument();
      expect(screen.getByText('Bodyweight')).toBeInTheDocument();
      expect(screen.getByText('Resistance Band')).toBeInTheDocument();
    });

    it('keeps Difficulty collapsed by default', () => {
      render(<ExerciseFilters />);
      // Difficulty options should not be visible if the category is collapsed
      // But the label "Beginner" should only appear inside the category, not at top level
      const difficultySection = screen.getByText('Difficulty').closest('.border');
      expect(difficultySection).toBeTruthy();
      // Check that checkboxes for difficulty are not shown
      const checkboxes = difficultySection!.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });

    it('keeps Type collapsed by default', () => {
      render(<ExerciseFilters />);
      const typeSection = screen.getByText('Type').closest('.border');
      expect(typeSection).toBeTruthy();
      const checkboxes = typeSection!.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });
  });

  describe('Category Toggle', () => {
    it('collapses Muscle Group when header is clicked', () => {
      render(<ExerciseFilters />);
      expect(screen.getByText('Chest')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Muscle Group'));
      expect(screen.queryByText('Chest')).not.toBeInTheDocument();
    });

    it('expands Difficulty when header is clicked', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByText('Difficulty'));
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('expands Type when header is clicked', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByText('Type'));
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
      expect(screen.getByText('Flexibility')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
    });

    it('toggles category expansion on repeated clicks', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByText('Muscle Group'));
      expect(screen.queryByText('Chest')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Muscle Group'));
      expect(screen.getByText('Chest')).toBeInTheDocument();
    });
  });

  describe('Filter Selection', () => {
    it('selects a filter when checkbox is clicked', () => {
      render(<ExerciseFilters />);
      const chestCheckbox = screen.getByLabelText('Chest');
      expect(chestCheckbox).not.toBeChecked();
      fireEvent.click(chestCheckbox);
      expect(chestCheckbox).toBeChecked();
    });

    it('deselects a filter when checkbox is clicked again', () => {
      render(<ExerciseFilters />);
      const chestCheckbox = screen.getByLabelText('Chest');
      fireEvent.click(chestCheckbox);
      expect(chestCheckbox).toBeChecked();
      fireEvent.click(chestCheckbox);
      expect(chestCheckbox).not.toBeChecked();
    });

    it('shows Active Filters section when filters are selected', () => {
      render(<ExerciseFilters />);
      expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Chest'));
      expect(screen.getByText('Active Filters')).toBeInTheDocument();
    });

    it('shows selected filter label in Active Filters', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByLabelText('Chest'));
      // There will be 2 "Chest" texts: one in the active filter pill, one as the label
      const chestTexts = screen.getAllByText('Chest');
      expect(chestTexts.length).toBe(2);
    });

    it('can select multiple filters', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByLabelText('Chest'));
      fireEvent.click(screen.getByLabelText('Back'));
      expect(screen.getByLabelText('Chest')).toBeChecked();
      expect(screen.getByLabelText('Back')).toBeChecked();
      expect(screen.getByText('Active Filters')).toBeInTheDocument();
    });

    it('can select filters from different categories', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByLabelText('Chest'));
      fireEvent.click(screen.getByLabelText('Barbell'));
      expect(screen.getByLabelText('Chest')).toBeChecked();
      expect(screen.getByLabelText('Barbell')).toBeChecked();
    });
  });

  describe('Remove Filter', () => {
    it('removes filter when X is clicked on active filter pill', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByLabelText('Chest'));
      expect(screen.getByText('Active Filters')).toBeInTheDocument();

      // Find and click the X button next to "Chest" in the active filters section
      const xIcons = screen.getAllByTestId('icon-x');
      fireEvent.click(xIcons[0].closest('button')!);

      expect(screen.getByLabelText('Chest')).not.toBeChecked();
      expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
    });
  });

  describe('Clear All Filters', () => {
    it('shows Clear All button when filters are selected', () => {
      render(<ExerciseFilters />);
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Chest'));
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('clears all filters when Clear All is clicked', () => {
      render(<ExerciseFilters />);
      fireEvent.click(screen.getByLabelText('Chest'));
      fireEvent.click(screen.getByLabelText('Barbell'));
      expect(screen.getByLabelText('Chest')).toBeChecked();
      expect(screen.getByLabelText('Barbell')).toBeChecked();

      fireEvent.click(screen.getByText('Clear All'));

      expect(screen.getByLabelText('Chest')).not.toBeChecked();
      expect(screen.getByLabelText('Barbell')).not.toBeChecked();
      expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
    });
  });

  describe('Checkboxes', () => {
    it('renders checkboxes for all muscle group options', () => {
      render(<ExerciseFilters />);
      const muscleGroupSection = screen.getByText('Muscle Group').closest('.border');
      const checkboxes = muscleGroupSection!.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(6);
    });

    it('renders checkboxes for all equipment options', () => {
      render(<ExerciseFilters />);
      const equipmentSection = screen.getByText('Equipment').closest('.border');
      const checkboxes = equipmentSection!.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(6);
    });
  });
});
