/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Download: () => <span data-testid="icon-download" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  Target: () => <span data-testid="icon-target" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, onClick, className, ...props }: any) => <div onClick={onClick} className={className} {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, onClick, ...props }: any) => <div onClick={onClick} {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

import { ProgramPreview } from '../ProgramPreview';

const mockProgram = {
  id: 'prog-1',
  name: 'Test Program',
  description: 'A test program description',
  programType: 'strength',
  difficultyLevel: 'intermediate',
  durationWeeks: 8,
  goals: ['Build Strength', 'Gain Muscle'],
  equipmentNeeded: ['Barbell', 'Dumbbells'],
  weeks: [
    {
      id: 'w1',
      weekNumber: 1,
      name: 'Foundation',
      description: 'Base building',
      isDeload: false,
      workouts: [
        {
          id: 'wo1',
          dayNumber: 1,
          name: 'Upper Body',
          workoutType: 'strength',
          estimatedDuration: 60,
          isRestDay: false,
          exercises: [
            { id: 'ex1', exercise: { name: 'Bench Press' }, supersetGroup: 'A' },
            { id: 'ex2', exercise: { name: 'Rows' } },
          ],
        },
        {
          id: 'wo2',
          dayNumber: 3,
          name: 'Rest Day',
          isRestDay: true,
          exercises: [],
        },
      ],
    },
    {
      id: 'w2',
      weekNumber: 2,
      name: 'Deload',
      isDeload: true,
      workouts: [],
    },
  ],
} as any;

describe('ProgramPreview', () => {
  const mockOnEdit = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders program name and description', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('Test Program')).toBeInTheDocument();
    expect(screen.getByText('A test program description')).toBeInTheDocument();
  });

  it('renders duration stats', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('8 weeks')).toBeInTheDocument();
  });

  it('renders total workouts', () => {
    render(<ProgramPreview program={mockProgram} />);
    const workoutLabels = screen.getAllByText('2');
    expect(workoutLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders total exercises', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText(/Exercises/)).toBeInTheDocument();
  });

  it('renders program type badge', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('renders goals', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('Build Strength')).toBeInTheDocument();
    expect(screen.getByText('Gain Muscle')).toBeInTheDocument();
  });

  it('renders equipment needed section', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('Equipment Needed')).toBeInTheDocument();
    expect(screen.getByText('Barbell')).toBeInTheDocument();
    expect(screen.getByText('Dumbbells')).toBeInTheDocument();
  });

  it('renders week cards', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText(/Week 1:/)).toBeInTheDocument();
    // Foundation is part of week name, may be combined in heading
    expect(screen.getByText(/Foundation/)).toBeInTheDocument();
    expect(screen.getByText(/Week 2:/)).toBeInTheDocument();
  });

  it('renders deload badge', () => {
    render(<ProgramPreview program={mockProgram} />);
    const deloadBadges = screen.getAllByText('Deload');
    expect(deloadBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders workout count badges', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('2 workouts')).toBeInTheDocument();
    expect(screen.getByText('0 workouts')).toBeInTheDocument();
  });

  it('renders expand/collapse all buttons', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.getByText('Expand All')).toBeInTheDocument();
    expect(screen.getByText('Collapse All')).toBeInTheDocument();
  });

  it('expands week when clicked', () => {
    render(<ProgramPreview program={mockProgram} />);
    // Click on the week header to expand
    const weekHeader = screen.getByText(/Week 1:/).closest('div[class]');
    if (weekHeader?.parentElement) {
      fireEvent.click(weekHeader.parentElement);
    }
    // After expanding, workout details should show
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
  });

  it('expand all shows all workouts', () => {
    render(<ProgramPreview program={mockProgram} />);
    fireEvent.click(screen.getByText('Expand All'));
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    // Rest Day appears in both workout name and badge
    const restDayElements = screen.getAllByText('Rest Day');
    expect(restDayElements.length).toBeGreaterThanOrEqual(1);
  });

  it('collapse all hides all workouts', () => {
    render(<ProgramPreview program={mockProgram} />);
    fireEvent.click(screen.getByText('Expand All'));
    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Collapse All'));
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
  });

  it('renders edit button when onEdit is provided', () => {
    render(<ProgramPreview program={mockProgram} onEdit={mockOnEdit} />);
    expect(screen.getByText('Edit Program')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    render(<ProgramPreview program={mockProgram} onEdit={mockOnEdit} />);
    fireEvent.click(screen.getByText('Edit Program'));
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('renders close button', () => {
    render(<ProgramPreview program={mockProgram} onClose={mockOnClose} />);
    expect(screen.getByText('Close Preview')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<ProgramPreview program={mockProgram} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Close Preview'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders exercise names in expanded week', () => {
    render(<ProgramPreview program={mockProgram} />);
    fireEvent.click(screen.getByText('Expand All'));
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Rows')).toBeInTheDocument();
  });

  it('renders superset group badge', () => {
    render(<ProgramPreview program={mockProgram} />);
    fireEvent.click(screen.getByText('Expand All'));
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders rest day badge', () => {
    render(<ProgramPreview program={mockProgram} />);
    fireEvent.click(screen.getByText('Expand All'));
    const restDays = screen.getAllByText('Rest Day');
    expect(restDays.length).toBeGreaterThanOrEqual(1);
  });

  it('renders footer text', () => {
    render(<ProgramPreview program={mockProgram} />);
    const weekTexts = screen.getAllByText(/8 weeks/);
    expect(weekTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders without equipment section when empty', () => {
    const progNoEquip = { ...mockProgram, equipmentNeeded: [] };
    render(<ProgramPreview program={progNoEquip} />);
    expect(screen.queryByText('Equipment Needed')).not.toBeInTheDocument();
  });

  it('does not render edit button when onEdit not provided', () => {
    render(<ProgramPreview program={mockProgram} />);
    expect(screen.queryByText('Edit Program')).not.toBeInTheDocument();
  });
});
