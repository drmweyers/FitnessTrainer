/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash" />,
  GripVertical: () => <span data-testid="icon-grip" />,
  Video: () => <span data-testid="icon-video" />,
}));

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn((arr: any[], from: number, to: number) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}));

import WorkoutBuilder from '../WorkoutBuilder';
import { Exercise } from '@/types/exercise';

function createMockExercises(): Exercise[] {
  return [
    {
      id: 'ex-1',
      name: 'Bench Press',
      gifUrl: '/gifs/bench-press.gif',
      bodyParts: ['chest'],
      targetMuscles: ['pectorals'],
      equipments: ['barbell'],
      secondaryMuscles: ['triceps'],
      instructions: ['Lie on bench', 'Press up'],
    },
    {
      id: 'ex-2',
      name: 'Squat',
      gifUrl: '/gifs/squat.gif',
      bodyParts: ['legs'],
      targetMuscles: ['quadriceps'],
      equipments: ['barbell'],
      secondaryMuscles: ['glutes'],
      instructions: ['Stand with barbell', 'Squat down'],
    },
  ];
}

describe('WorkoutBuilder', () => {
  const defaultProps = {
    exercises: createMockExercises(),
    onRemoveExercise: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component title', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('Build Your Workout')).toBeInTheDocument();
    });

    it('should render the workout name input', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByPlaceholderText('Name your workout...')).toBeInTheDocument();
    });

    it('should render the description textarea', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByPlaceholderText('Add a description...')).toBeInTheDocument();
    });

    it('should render default sections (Warm-up and Main Workout)', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByDisplayValue('Warm-up')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main Workout')).toBeInTheDocument();
    });

    it('should render Add Section button', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('Add Section')).toBeInTheDocument();
    });

    it('should render Save as Draft and Create Workout buttons', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      expect(screen.getByText('Save as Draft')).toBeInTheDocument();
      expect(screen.getByText('Create Workout')).toBeInTheDocument();
    });

    it('should render empty section placeholder text when exercises are provided', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      expect(placeholders.length).toBe(2); // One per section
    });

    it('should render "Drag exercises here" when no exercises are provided', () => {
      render(<WorkoutBuilder exercises={[]} onRemoveExercise={jest.fn()} />);
      const placeholders = screen.getAllByText('Drag exercises here');
      expect(placeholders.length).toBe(2);
    });
  });

  describe('Interactions', () => {
    it('should update workout name when typed', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText('Name your workout...');
      fireEvent.change(nameInput, { target: { value: 'My Workout' } });
      expect(nameInput).toHaveValue('My Workout');
    });

    it('should update description when typed', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const descInput = screen.getByPlaceholderText('Add a description...');
      fireEvent.change(descInput, { target: { value: 'A great workout' } });
      expect(descInput).toHaveValue('A great workout');
    });

    it('should add a new section when Add Section is clicked', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Add Section'));
      expect(screen.getByDisplayValue('New Section')).toBeInTheDocument();
    });

    it('should rename a section', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const warmUpInput = screen.getByDisplayValue('Warm-up');
      fireEvent.change(warmUpInput, { target: { value: 'Dynamic Warm-up' } });
      expect(screen.getByDisplayValue('Dynamic Warm-up')).toBeInTheDocument();
    });

    it('should remove a section when delete is clicked', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const trashIcons = screen.getAllByTestId('icon-trash');
      // Click the first section's delete button
      fireEvent.click(trashIcons[0].closest('button')!);
      expect(screen.queryByDisplayValue('Warm-up')).not.toBeInTheDocument();
    });

    it('should not show delete button when only one section remains', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      // Remove the first section
      const trashIcons = screen.getAllByTestId('icon-trash');
      fireEvent.click(trashIcons[0].closest('button')!);
      // Now only one section remains, trash should be gone
      expect(screen.queryAllByTestId('icon-trash').length).toBe(0);
    });

    it('should add exercise to section when clicking the placeholder', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      fireEvent.click(placeholders[0]);
      // Now the first exercise (Bench Press) should be in the section
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('should display exercise details after adding', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      fireEvent.click(placeholders[0]);

      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText(/pectorals/)).toBeInTheDocument();
      expect(screen.getByText(/barbell/)).toBeInTheDocument();
    });

    it('should show video button for added exercise', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      fireEvent.click(placeholders[0]);

      expect(screen.getByTestId('icon-video')).toBeInTheDocument();
    });

    it('should remove exercise from section and call onRemoveExercise', () => {
      const handleRemove = jest.fn();
      render(<WorkoutBuilder exercises={createMockExercises()} onRemoveExercise={handleRemove} />);

      // Add exercise to first section
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      fireEvent.click(placeholders[0]);

      expect(screen.getByText('Bench Press')).toBeInTheDocument();

      // Find the exercise item container (has the exercise name)
      const exerciseName = screen.getByText('Bench Press');
      const exerciseContainer = exerciseName.closest('.flex.items-center.bg-gray-50')!;
      // Find the trash icon within the exercise container
      const exerciseTrash = exerciseContainer.querySelector('[data-testid="icon-trash"]')!.closest('button')!;
      fireEvent.click(exerciseTrash);
      expect(handleRemove).toHaveBeenCalledWith('ex-1');
    });

    it('should show exercise image', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      fireEvent.click(placeholders[0]);

      const img = screen.getByAltText('Bench Press');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/gifs/bench-press.gif');
    });

    it('should show grip icon for drag handle', () => {
      render(<WorkoutBuilder {...defaultProps} />);
      const placeholders = screen.getAllByText('Click to add an exercise or drag exercises here');
      fireEvent.click(placeholders[0]);

      expect(screen.getByTestId('icon-grip')).toBeInTheDocument();
    });
  });
});
