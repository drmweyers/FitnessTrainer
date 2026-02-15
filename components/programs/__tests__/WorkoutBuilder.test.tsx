/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-uuid-456' },
});

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Edit: () => <span data-testid="icon-edit" />,
  Dumbbell: () => <span data-testid="icon-dumbbell" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => <input onChange={onChange} {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, ...props }: any) => <textarea onChange={onChange} {...props} />,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input type="checkbox" checked={checked} onChange={() => onCheckedChange && onCheckedChange(!checked)} {...props} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: (props: any) => <span />,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <>{children}</>,
}));

import { WorkoutBuilder } from '../WorkoutBuilder';

const mockWorkouts = [
  {
    id: 'wo-1',
    dayNumber: 1,
    name: 'Upper Body Strength',
    description: 'Chest, shoulders, triceps',
    workoutType: 'strength',
    estimatedDuration: 60,
    isRestDay: false,
    exercises: [
      { id: 'e1', name: 'Bench Press' },
      { id: 'e2', name: 'OHP' },
    ],
  },
  {
    id: 'wo-2',
    dayNumber: 3,
    name: 'Rest & Recovery',
    isRestDay: true,
    exercises: [],
  },
  {
    id: 'wo-3',
    dayNumber: 5,
    name: 'Lower Body',
    description: 'Legs and glutes',
    workoutType: 'hypertrophy',
    estimatedDuration: 75,
    isRestDay: false,
    exercises: [],
  },
] as any;

describe('WorkoutBuilder', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('renders title', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Workouts')).toBeInTheDocument();
  });

  it('renders add workout button when not readOnly', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    const addBtns = screen.getAllByText('Add Workout');
    expect(addBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('hides add workout button when readOnly', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryByText('Add Workout')).not.toBeInTheDocument();
  });

  it('renders workout names', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Upper Body Strength')).toBeInTheDocument();
    expect(screen.getByText('Rest & Recovery')).toBeInTheDocument();
    expect(screen.getByText('Lower Body')).toBeInTheDocument();
  });

  it('renders day numbers', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(screen.getByText('Day 5')).toBeInTheDocument();
  });

  it('renders rest day badge', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    const restDayElements = screen.getAllByText('Rest Day');
    expect(restDayElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders workout type badges', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('hypertrophy')).toBeInTheDocument();
  });

  it('renders duration for non-rest days', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText(/60 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/75 minutes/)).toBeInTheDocument();
  });

  it('renders descriptions', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Chest, shoulders, triceps')).toBeInTheDocument();
    expect(screen.getByText('Legs and glutes')).toBeInTheDocument();
  });

  it('renders exercise count', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    expect(screen.getByText(/2 exercises/)).toBeInTheDocument();
  });

  it('renders empty state when no workouts', () => {
    render(<WorkoutBuilder workouts={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('No workouts scheduled')).toBeInTheDocument();
  });

  it('renders add workout button in empty state', () => {
    render(<WorkoutBuilder workouts={[]} onUpdate={mockOnUpdate} />);
    const addBtns = screen.getAllByText('Add Workout');
    expect(addBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('hides add workout in empty readOnly state', () => {
    render(<WorkoutBuilder workouts={[]} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryByText('Add Workout')).not.toBeInTheDocument();
  });

  it('renders delete buttons when not readOnly', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    const trashIcons = screen.getAllByTestId('icon-trash');
    expect(trashIcons).toHaveLength(3);
  });

  it('hides delete buttons when readOnly', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryAllByTestId('icon-trash')).toHaveLength(0);
  });

  it('calls onUpdate when deleting a workout', () => {
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    const trashBtns = screen.getAllByTestId('icon-trash');
    fireEvent.click(trashBtns[0].closest('button')!);
    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: 'wo-1' })])
    );
  });

  it('does not delete when confirm cancelled', () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
    const trashBtns = screen.getAllByTestId('icon-trash');
    fireEvent.click(trashBtns[0].closest('button')!);
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  describe('adding workouts via dialog', () => {
    it('opens add workout dialog when Add Workout button is clicked', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);
      expect(screen.getByText('Add a workout to this week')).toBeInTheDocument();
    });

    it('shows dialog form fields', () => {
      render(<WorkoutBuilder workouts={[]} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);
      expect(screen.getByText('Day *')).toBeInTheDocument();
      expect(screen.getByText('Workout Name *')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Duration (minutes)')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      // "Rest Day" label (no workout cards since empty, so no badge conflict)
      expect(screen.getByText('Rest Day')).toBeInTheDocument();
    });

    it('fills in workout name and adds workout', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      const nameInput = screen.getByPlaceholderText('e.g., Upper Body Strength');
      fireEvent.change(nameInput, { target: { value: 'Push Day' } });

      // Click "Add Workout" in dialog footer
      const dialogAddBtns = screen.getAllByText('Add Workout');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockWorkouts,
          expect.objectContaining({ name: 'Push Day', id: 'test-uuid-456' }),
        ])
      );
    });

    it('does not add workout with empty name', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      // Click Add without filling name
      const dialogAddBtns = screen.getAllByText('Add Workout');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('fills in description when adding workout', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      const nameInput = screen.getByPlaceholderText('e.g., Upper Body Strength');
      fireEvent.change(nameInput, { target: { value: 'Legs Day' } });

      const descInput = screen.getByPlaceholderText('Optional description...');
      fireEvent.change(descInput, { target: { value: 'Squat focus' } });

      const dialogAddBtns = screen.getAllByText('Add Workout');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Legs Day', description: 'Squat focus' }),
        ])
      );
    });

    it('changes duration when adding workout', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      const nameInput = screen.getByPlaceholderText('e.g., Upper Body Strength');
      fireEvent.change(nameInput, { target: { value: 'Quick Session' } });

      const durationInput = screen.getByDisplayValue('60');
      fireEvent.change(durationInput, { target: { value: '30' } });

      const dialogAddBtns = screen.getAllByText('Add Workout');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Quick Session', estimatedDuration: 30 }),
        ])
      );
    });

    it('sets rest day toggle when adding workout', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      // Toggle rest day first
      const restDaySwitch = screen.getAllByRole('checkbox');
      const restSwitch = restDaySwitch.find(cb => cb.getAttribute('id') === 'rest-day');
      if (restSwitch) {
        fireEvent.click(restSwitch);
      }

      const nameInput = screen.getByPlaceholderText('e.g., Upper Body Strength');
      fireEvent.change(nameInput, { target: { value: 'Recovery Day' } });

      const dialogAddBtns = screen.getAllByText('Add Workout');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Recovery Day', isRestDay: true }),
        ])
      );
    });

    it('cancel button closes dialog without adding', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('handles invalid duration input (NaN defaults to 60)', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      fireEvent.click(addBtns[0]);

      const nameInput = screen.getByPlaceholderText('e.g., Upper Body Strength');
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const durationInput = screen.getByDisplayValue('60');
      fireEvent.change(durationInput, { target: { value: 'abc' } });

      const dialogAddBtns = screen.getAllByText('Add Workout');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Test', estimatedDuration: 60 }),
        ])
      );
    });

    it('opens dialog from empty state Add Workout button', () => {
      render(<WorkoutBuilder workouts={[]} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Workout');
      // There should be both the header button and empty state button
      // Click empty state one (last one)
      fireEvent.click(addBtns[addBtns.length - 1]);
      expect(screen.getByText('Add a workout to this week')).toBeInTheDocument();
    });
  });

  describe('workout card details', () => {
    it('shows rest day styling', () => {
      render(<WorkoutBuilder workouts={mockWorkouts} onUpdate={mockOnUpdate} />);
      // Rest day card has green border class
      const restCard = screen.getByText('Rest & Recovery').closest('div[class*="border-green"]');
      expect(restCard).toBeTruthy();
    });

    it('shows singular exercise text for single exercise', () => {
      const singleExerciseWorkouts = [{
        id: 'wo-single',
        dayNumber: 1,
        name: 'Quick Workout',
        workoutType: 'strength',
        estimatedDuration: 30,
        isRestDay: false,
        exercises: [{ id: 'e1', name: 'Push Up' }],
      }] as any;
      render(<WorkoutBuilder workouts={singleExerciseWorkouts} onUpdate={mockOnUpdate} />);
      expect(screen.getByText(/1 exercise$/)).toBeInTheDocument();
    });

    it('does not show duration text in rest day card', () => {
      const restOnly = [{
        id: 'wo-rest',
        dayNumber: 1,
        name: 'Rest',
        isRestDay: true,
        estimatedDuration: 0,
        exercises: [],
      }] as any;
      render(<WorkoutBuilder workouts={restOnly} onUpdate={mockOnUpdate} readOnly />);
      // Rest day card should not show "X minutes" text
      expect(screen.queryByText(/\d+ minutes/)).not.toBeInTheDocument();
    });
  });
});
