/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="icon-search" />,
  X: () => <span data-testid="icon-x" />,
  Dumbbell: () => <span data-testid="icon-dumbbell" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, className, ...props }: any) => (
    <div onClick={onClick} className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => <input onChange={onChange} {...props} />,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input type="checkbox" checked={checked} onChange={() => onCheckedChange && onCheckedChange(!checked)} {...props} />
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

import { ExerciseSelector } from '../ExerciseSelector';

const mockExercises = [
  {
    id: 'ex-1',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    equipment: 'barbell',
    equipments: ['barbell', 'bench'],
    gifUrl: '/bench.gif',
    difficulty: 'intermediate',
  },
  {
    id: 'ex-2',
    name: 'Squat',
    muscleGroup: 'Legs',
    equipment: 'barbell',
    equipments: ['barbell', 'squat rack'],
    gifUrl: '/squat.gif',
    difficulty: 'advanced',
  },
  {
    id: 'ex-3',
    name: 'Push-ups',
    muscleGroup: 'Chest',
    equipment: 'bodyweight',
    equipments: [],
    difficulty: 'beginner',
  },
] as any;

describe('ExerciseSelector', () => {
  const mockOnSelectionChange = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    availableExercises: mockExercises,
    selectedExerciseIds: [] as string[],
    onSelectionChange: mockOnSelectionChange,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('Select Exercises')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
  });

  it('renders all exercises', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
  });

  it('renders muscle groups', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const chestElements = screen.getAllByText('Chest');
    expect(chestElements.length).toBeGreaterThanOrEqual(1);
    const legsElements = screen.getAllByText('Legs');
    expect(legsElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders exercise count', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('3 exercises found')).toBeInTheDocument();
  });

  it('renders singular exercise count', () => {
    render(<ExerciseSelector {...defaultProps} availableExercises={[mockExercises[0]]} />);
    expect(screen.getByText('1 exercise found')).toBeInTheDocument();
  });

  it('renders select all and clear all buttons', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText(/Select All/)).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('renders done button', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('done button is disabled when no exercises selected', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const doneBtn = screen.getByText('Done');
    expect(doneBtn).toBeDisabled();
  });

  it('done button is enabled when exercises are selected', () => {
    render(<ExerciseSelector {...defaultProps} selectedExerciseIds={['ex-1']} />);
    const doneBtn = screen.getByText('Done');
    expect(doneBtn).not.toBeDisabled();
  });

  it('renders selected count', () => {
    render(<ExerciseSelector {...defaultProps} selectedExerciseIds={['ex-1', 'ex-2']} />);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('renders selected count in results', () => {
    render(<ExerciseSelector {...defaultProps} selectedExerciseIds={['ex-1']} />);
    const selectedTexts = screen.getAllByText(/1 selected/);
    expect(selectedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSelectionChange when selecting an exercise', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['ex-1']);
  });

  it('calls onSelectionChange when deselecting an exercise', () => {
    render(<ExerciseSelector {...defaultProps} selectedExerciseIds={['ex-1']} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('calls onSelectionChange when select all is clicked', () => {
    render(<ExerciseSelector {...defaultProps} />);
    fireEvent.click(screen.getByText(/Select All/));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['ex-1', 'ex-2', 'ex-3']);
  });

  it('calls onSelectionChange when clear all is clicked', () => {
    render(<ExerciseSelector {...defaultProps} selectedExerciseIds={['ex-1']} />);
    fireEvent.click(screen.getByText('Clear All'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('calls onClose when close button is clicked', () => {
    render(<ExerciseSelector {...defaultProps} />);
    // Close button is the X icon button
    const closeBtn = screen.getByTestId('icon-x').closest('button');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('filters exercises by search', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(searchInput, { target: { value: 'bench' } });
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('1 exercise found')).toBeInTheDocument();
  });

  it('renders empty state when no exercises match', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No exercises found')).toBeInTheDocument();
  });

  it('renders difficulty badges', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('advanced')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('renders equipment tags', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getAllByText('barbell').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('bench')).toBeInTheDocument();
  });

  it('renders exercise images when gifUrl exists', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2); // ex-1 and ex-2 have gifUrl
  });

  it('renders muscle group filter', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('Muscle Group')).toBeInTheDocument();
  });

  it('renders equipment filter', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });
});
