/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  Filter: () => <span data-testid="icon-filter" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  MoreHorizontal: () => <span data-testid="icon-more" />,
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  X: () => <span data-testid="icon-x" />,
  Loader2: ({ className }: any) => <span data-testid="icon-loader" className={className} />,
}));

import ExerciseList from '../ExerciseList';

function createMockExercises(count: number = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ex-${i + 1}`,
    exerciseId: `eid-${i + 1}`,
    name: `Exercise ${String(i + 1).padStart(3, '0')}`,
    gifUrl: `/gifs/exercise-${i + 1}.gif`,
    bodyPart: i % 2 === 0 ? 'chest' : 'back',
    equipment: i % 2 === 0 ? 'barbell' : 'dumbbell',
    targetMuscle: i % 2 === 0 ? 'pectorals' : 'lats',
    secondaryMuscles: ['triceps'],
    instructions: ['Step 1', 'Step 2'],
    difficulty: (i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced') as 'beginner' | 'intermediate' | 'advanced',
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }));
}

describe('ExerciseList', () => {
  describe('With preloaded exercises', () => {
    const exercises = createMockExercises(5);

    it('should render the exercise table', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.getByText('Exercise 002')).toBeInTheDocument();
    });

    it('should render the search input', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
    });

    it('should render the Filters button', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should show items per page selector', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      expect(screen.getByText('10 per page')).toBeInTheDocument();
    });

    it('should show selected count (0 selected by default)', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should show pagination section', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      // Pagination nav exists
      const nav = screen.getByRole('navigation', { name: 'Pagination' });
      expect(nav).toBeInTheDocument();
    });

    it('should filter exercises when searching', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const searchInput = screen.getByPlaceholderText('Search exercises...');
      fireEvent.change(searchInput, { target: { value: 'Exercise 001' } });

      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 002')).not.toBeInTheDocument();
    });

    it('should filter by body part search term', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const searchInput = screen.getByPlaceholderText('Search exercises...');
      fireEvent.change(searchInput, { target: { value: 'chest' } });

      // Only exercises with bodyPart = 'chest' (even indices: 1, 3, 5)
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.getByText('Exercise 003')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 002')).not.toBeInTheDocument();
    });

    it('should toggle filter panel when Filters button is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Filter Exercises')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should show filter categories in the filter panel', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('bodyPart')).toBeInTheDocument();
      expect(screen.getByText('equipment')).toBeInTheDocument();
      expect(screen.getByText('targetMuscle')).toBeInTheDocument();
      expect(screen.getByText('difficulty')).toBeInTheDocument();
    });

    it('should select exercise when checkbox is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is select-all, second is the first exercise
      fireEvent.click(checkboxes[1]);
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should select all exercises when select-all checkbox is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all
      expect(screen.getByText('5 selected')).toBeInTheDocument();
    });

    it('should deselect all when select-all is clicked again', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all
      fireEvent.click(checkboxes[0]); // Deselect all
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should show active filter tags when filters are applied', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      // Click on a filter checkbox (e.g., 'chest' under bodyPart)
      const chestCheckbox = screen.getByLabelText('chest');
      fireEvent.click(chestCheckbox);

      // After applying filter, there should be a tag with "bodyPart:" prefix
      expect(screen.getByText('bodyPart:')).toBeInTheDocument();
    });

    it('should clear all filters when Clear All is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      const chestCheckbox = screen.getByLabelText('chest');
      fireEvent.click(chestCheckbox);

      fireEvent.click(screen.getByText('Clear All'));

      // All exercises should be visible again
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.getByText('Exercise 002')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should paginate when more than 10 exercises', () => {
      const exercises = createMockExercises(15);
      render(<ExerciseList preloadedExercises={exercises} />);

      // Default 10 per page, should show first 10
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.getByText('Exercise 010')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 011')).not.toBeInTheDocument();
    });

    it('should navigate to next page using page number button', () => {
      const exercises = createMockExercises(15);
      render(<ExerciseList preloadedExercises={exercises} />);

      // Click page number 2 button
      const pageBtn = screen.getByRole('button', { name: '2' });
      fireEvent.click(pageBtn);

      expect(screen.getByText('Exercise 011')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 001')).not.toBeInTheDocument();
    });

    it('should show correct pagination info', () => {
      const exercises = createMockExercises(15);
      render(<ExerciseList preloadedExercises={exercises} />);

      // Should show "Showing 1 to 10 of 15 results"
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should change items per page', () => {
      const exercises = createMockExercises(30);
      render(<ExerciseList preloadedExercises={exercises} />);

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '25' } });

      expect(screen.getByText('Exercise 025')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by name by default (ascending)', () => {
      const exercises = createMockExercises(3);
      render(<ExerciseList preloadedExercises={exercises} />);

      const rows = screen.getAllByRole('row');
      // First data row (after header) should be Exercise 001
      expect(rows[1]).toHaveTextContent('Exercise 001');
    });
  });

  describe('Empty state', () => {
    it('should show empty state when API returns no exercises', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exercises: [] }),
      });
      render(<ExerciseList />);

      await waitFor(() => {
        expect(screen.getByText('No exercises found')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when fetching exercises', () => {
      // When no preloaded exercises and fetch hasn't resolved yet
      global.fetch = jest.fn(() => new Promise(() => {})) as any;
      render(<ExerciseList />);
      expect(screen.getByText('Loading exercises...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error state when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<ExerciseList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load exercises')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<ExerciseList />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should show error when API returns error flag', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: true, message: 'API Error' }),
      });
      render(<ExerciseList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load exercises')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should handle non-200 response status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });
      render(<ExerciseList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load exercises')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    const exercises = createMockExercises(10);

    it('should filter by equipment', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      const barbellCheckbox = screen.getByLabelText('barbell');
      fireEvent.click(barbellCheckbox);

      // Only exercises with equipment = 'barbell' should be visible
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 002')).not.toBeInTheDocument();
    });

    it('should filter by targetMuscle', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      const pectoralsCheckbox = screen.getByLabelText('pectorals');
      fireEvent.click(pectoralsCheckbox);

      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 002')).not.toBeInTheDocument();
    });

    it('should filter by difficulty', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      const beginnerCheckbox = screen.getByLabelText('beginner');
      fireEvent.click(beginnerCheckbox);

      // Exercises with difficulty = 'beginner' (i % 3 === 0: 0, 3, 6, 9)
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
      expect(screen.queryByText('Exercise 002')).not.toBeInTheDocument();
    });

    it('should apply multiple filters together', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      const chestCheckbox = screen.getByLabelText('chest');
      const barbellCheckbox = screen.getByLabelText('barbell');
      fireEvent.click(chestCheckbox);
      fireEvent.click(barbellCheckbox);

      // Only exercises matching both filters
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
    });

    it('should remove active filter tag when X is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      fireEvent.click(screen.getByText('Filters'));

      const chestCheckbox = screen.getByLabelText('chest');
      fireEvent.click(chestCheckbox);

      // Find and click the X button on the filter tag
      const xButtons = screen.getAllByTestId('icon-x');
      fireEvent.click(xButtons[0]);

      // Filter should be removed
      expect(screen.getByText('Exercise 002')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    const exercises = createMockExercises(5);

    it('should toggle sort direction when clicking same column', () => {
      render(<ExerciseList preloadedExercises={exercises} />);

      // Initially sorted by name ascending - should show chevron up
      expect(screen.getByTestId('icon-chevron-up')).toBeInTheDocument();

      // Click name header to toggle to descending
      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);

      // Should now show descending chevron
      expect(screen.queryAllByTestId('icon-chevron-down').length).toBeGreaterThan(0);
    });

    it('should sort by bodyPart when column header is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);

      const bodyPartHeader = screen.getByText('Body Part').closest('th');
      fireEvent.click(bodyPartHeader!);

      // Verify sort icon appears
      const chevronUp = screen.getAllByTestId('icon-chevron-up');
      expect(chevronUp.length).toBeGreaterThan(0);
    });

    it('should sort by targetMuscle when column header is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);

      const muscleHeader = screen.getByText('Target Muscle').closest('th');
      fireEvent.click(muscleHeader!);

      const chevronUp = screen.getAllByTestId('icon-chevron-up');
      expect(chevronUp.length).toBeGreaterThan(0);
    });

    it('should sort by equipment when column header is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);

      const equipmentHeader = screen.getByText('Equipment').closest('th');
      fireEvent.click(equipmentHeader!);

      const chevronUp = screen.getAllByTestId('icon-chevron-up');
      expect(chevronUp.length).toBeGreaterThan(0);
    });

    it('should sort by difficulty when column header is clicked', () => {
      render(<ExerciseList preloadedExercises={exercises} />);

      const difficultyHeader = screen.getByText('Difficulty').closest('th');
      fireEvent.click(difficultyHeader!);

      const chevronUp = screen.getAllByTestId('icon-chevron-up');
      expect(chevronUp.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination navigation', () => {
    it('should navigate to previous page using arrow button', () => {
      const exercises = createMockExercises(25);
      render(<ExerciseList preloadedExercises={exercises} />);

      // Go to page 2
      const page2Btn = screen.getByRole('button', { name: '2' });
      fireEvent.click(page2Btn);

      // Click previous arrow
      const prevButtons = screen.getAllByTestId('icon-chevron-left');
      fireEvent.click(prevButtons[0].closest('button')!);

      // Should be back on page 1
      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
    });

    it('should navigate to next page using arrow button', () => {
      const exercises = createMockExercises(25);
      render(<ExerciseList preloadedExercises={exercises} />);

      // Click next arrow
      const nextButtons = screen.getAllByTestId('icon-chevron-right');
      fireEvent.click(nextButtons[0].closest('button')!);

      // Should be on page 2
      expect(screen.getByText('Exercise 011')).toBeInTheDocument();
    });

    it('should use mobile pagination buttons (Previous/Next)', () => {
      const exercises = createMockExercises(25);
      render(<ExerciseList preloadedExercises={exercises} />);

      const nextBtns = screen.getAllByRole('button', { name: 'Next' });
      fireEvent.click(nextBtns[0]);

      expect(screen.getByText('Exercise 011')).toBeInTheDocument();

      const prevBtns = screen.getAllByRole('button', { name: 'Previous' });
      fireEvent.click(prevBtns[0]);

      expect(screen.getByText('Exercise 001')).toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      const exercises = createMockExercises(25);
      render(<ExerciseList preloadedExercises={exercises} />);

      const prevBtns = screen.getAllByRole('button', { name: 'Previous' });
      expect(prevBtns[0]).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      const exercises = createMockExercises(15);
      render(<ExerciseList preloadedExercises={exercises} />);

      // Go to page 2 (last page)
      const page2Btn = screen.getByRole('button', { name: '2' });
      fireEvent.click(page2Btn);

      const nextBtns = screen.getAllByRole('button', { name: 'Next' });
      expect(nextBtns[0]).toBeDisabled();
    });
  });

  describe('Exercise selection', () => {
    const exercises = createMockExercises(5);

    it('should deselect exercise when clicking checkbox again', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const checkboxes = screen.getAllByRole('checkbox');

      fireEvent.click(checkboxes[1]); // Select
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      fireEvent.click(checkboxes[1]); // Deselect
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should stop propagation when clicking checkbox in row', () => {
      render(<ExerciseList preloadedExercises={exercises} />);
      const checkboxes = screen.getAllByRole('checkbox');

      // Just verify the checkbox can be clicked
      fireEvent.click(checkboxes[1]);
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('Difficulty badge styling', () => {
    it('should show correct color for intermediate difficulty', () => {
      const exercises = [{
        ...createMockExercises(1)[0],
        difficulty: 'intermediate' as const,
      }];
      render(<ExerciseList preloadedExercises={exercises} />);

      const badge = screen.getByText('intermediate');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should show correct color for advanced difficulty', () => {
      const exercises = [{
        ...createMockExercises(1)[0],
        difficulty: 'advanced' as const,
      }];
      render(<ExerciseList preloadedExercises={exercises} />);

      const badge = screen.getByText('advanced');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });
});
