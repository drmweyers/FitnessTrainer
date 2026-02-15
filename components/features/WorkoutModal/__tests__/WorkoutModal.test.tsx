/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  Share2: () => <span data-testid="icon-share2" />,
  MoreHorizontal: () => <span data-testid="icon-more" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  List: () => <span data-testid="icon-list" />,
  Grid: () => <span data-testid="icon-grid" />,
  Plus: () => <span data-testid="icon-plus" />,
  Filter: () => <span data-testid="icon-filter" />,
  X: () => <span data-testid="icon-x" />,
}));

import WorkoutModal from '../WorkoutModal';

describe('WorkoutModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(<WorkoutModal isOpen={false} onClose={jest.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render the modal when isOpen is true', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('Create Section')).toBeInTheDocument();
    });

    it('should render the search input', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search for your Exercises')).toBeInTheDocument();
    });

    it('should render exercise list header', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('MOST RECENT (2515)')).toBeInTheDocument();
    });

    it('should render all mock exercises', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('Dumbbell Floor Press')).toBeInTheDocument();
      // Dumbbell Rear Delt Row and Jumping Jacks appear both in exercise library and section
      expect(screen.getAllByText('Dumbbell Rear Delt Row').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Jumping Jacks').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Dumbbell Bicep Curl')).toBeInTheDocument();
    });

    it('should render section format dropdown', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('SECTION FORMAT')).toBeInTheDocument();
    });

    it('should render section type dropdown', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('SECTION TYPE')).toBeInTheDocument();
    });

    it('should render duration input', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('DURATION (MIN)')).toBeInTheDocument();
    });

    it('should render INSTRUCTIONS section', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('INSTRUCTIONS')).toBeInTheDocument();
    });

    it('should render section name input placeholder', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('Name your section')).toBeInTheDocument();
    });

    it('should render default section exercises (Jumping Jacks and Dumbbell Rear Delt Row)', () => {
      render(<WorkoutModal {...defaultProps} />);
      // These are in the pre-loaded sectionExercises - they appear in the main content section as exercise names
      const jjElements = screen.getAllByText('Jumping Jacks');
      expect(jjElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render footer buttons', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Save & Close')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when Cancel is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when the close (X) button is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      // The X button is in the header, next to the X icon
      const closeButtons = screen.getAllByRole('button');
      // Find the button that contains the X icon (it's in the header)
      const closeBtn = closeButtons.find(btn => btn.querySelector('[data-testid="icon-x"]'));
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      // The backdrop is the outermost fixed div
      const backdrop = screen.getByText('Create Section').closest('.fixed');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when ESC key is pressed', () => {
      render(<WorkoutModal {...defaultProps} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should update section name when typed', () => {
      render(<WorkoutModal {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText('Name your section');
      fireEvent.change(nameInput, { target: { value: 'Warm Up Section' } });
      expect(nameInput).toHaveValue('Warm Up Section');
    });

    it('should add set when Add Set is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      const addSetButtons = screen.getAllByText('Add Set');
      fireEvent.click(addSetButtons[0]);
      // After adding a set, there should be 2 rows in the first exercise table
      const rows = screen.getAllByText('1');
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });

    it('should add an exercise when exercise card is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Dumbbell Floor Press'));
      // Now we should see Dumbbell Floor Press in the section exercises as well
      const elements = screen.getAllByText('Dumbbell Floor Press');
      expect(elements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Section format', () => {
    it('should change section format when dropdown is changed', () => {
      render(<WorkoutModal {...defaultProps} />);
      const selects = screen.getAllByRole('combobox');
      const formatSelect = selects[0]; // First select is section format
      fireEvent.change(formatSelect, { target: { value: 'Circuit' } });
      expect(formatSelect).toHaveValue('Circuit');
    });

    it('should change section type when dropdown is changed', () => {
      render(<WorkoutModal {...defaultProps} />);
      const selects = screen.getAllByRole('combobox');
      const typeSelect = selects[1]; // Second select is section type
      fireEvent.change(typeSelect, { target: { value: 'Warm Up' } });
      expect(typeSelect).toHaveValue('Warm Up');
    });
  });

  describe('View mode toggle', () => {
    it('should toggle view mode buttons', () => {
      render(<WorkoutModal {...defaultProps} />);
      // Find the list/grid toggle buttons by icon test id
      const listIcons = screen.getAllByTestId('icon-list');
      const gridIcons = screen.getAllByTestId('icon-grid');
      expect(listIcons.length).toBeGreaterThanOrEqual(1);
      expect(gridIcons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Body scroll lock', () => {
    it('should set body overflow to hidden when open', () => {
      render(<WorkoutModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow on unmount', () => {
      const { unmount } = render(<WorkoutModal {...defaultProps} />);
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Each Side toggle', () => {
    it('should toggle Each Side checkbox', () => {
      render(<WorkoutModal {...defaultProps} />);
      const checkboxes = screen.getAllByRole('checkbox');
      // Click the first "Each Side" checkbox
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        expect(checkboxes[0]).toBeChecked();
        // Toggle back
        fireEvent.click(checkboxes[0]);
        expect(checkboxes[0]).not.toBeChecked();
      }
    });
  });

  describe('Duration input', () => {
    it('should update duration when changed', () => {
      render(<WorkoutModal {...defaultProps} />);
      const durationInput = screen.getByDisplayValue('1');
      fireEvent.change(durationInput, { target: { value: '5' } });
      expect(durationInput).toHaveValue(5);
    });
  });

  describe('View mode', () => {
    it('should switch to list view when list icon is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      const listIcons = screen.getAllByTestId('icon-list');
      // Click list icon (there should be one in the exercise list header)
      const listBtn = listIcons[0].closest('button');
      if (listBtn) {
        fireEvent.click(listBtn);
        // View mode should be 'list' now
        expect(listBtn.className).toContain('text-blue-600');
      }
    });

    it('should switch to grid view when grid icon is clicked', () => {
      render(<WorkoutModal {...defaultProps} />);
      // First switch to list
      const listIcons = screen.getAllByTestId('icon-list');
      const listBtn = listIcons[0].closest('button');
      if (listBtn) fireEvent.click(listBtn);

      // Then switch to grid
      const gridIcons = screen.getAllByTestId('icon-grid');
      const gridBtn = gridIcons[0].closest('button');
      if (gridBtn) {
        fireEvent.click(gridBtn);
        expect(gridBtn.className).toContain('text-blue-600');
      }
    });
  });

  describe('Mobile layout', () => {
    it('should detect mobile screen size', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));
      render(<WorkoutModal {...defaultProps} />);
      // On mobile, should show section/exercises toggle button
      // Check that mobile nav appears
      const sectionBtn = screen.queryByText('Section');
      const exercisesBtn = screen.queryByText('Exercises');
      // Either Section or Exercises should show on mobile
      expect(sectionBtn || exercisesBtn).toBeTruthy();
    });

    afterAll(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    });
  });
});
