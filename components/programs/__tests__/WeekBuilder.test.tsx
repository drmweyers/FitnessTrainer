/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-uuid-123' },
});

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash" />,
  Edit: () => <span data-testid="icon-edit" />,
  ChevronDown: () => <span data-testid="icon-down" />,
  ChevronUp: () => <span data-testid="icon-up" />,
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

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : <div>{typeof children === 'function' ? null : children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <>{children}</>,
}));

import { WeekBuilder } from '../WeekBuilder';

const mockWeeks = [
  {
    id: 'w1',
    weekNumber: 1,
    name: 'Foundation',
    description: 'Base building phase',
    isDeload: false,
    workouts: [
      { id: 'wo1', name: 'Day 1', dayNumber: 1 },
      { id: 'wo2', name: 'Day 2', dayNumber: 2 },
    ],
  },
  {
    id: 'w2',
    weekNumber: 2,
    name: 'Deload Week',
    description: 'Recovery',
    isDeload: true,
    workouts: [],
  },
] as any;

describe('WeekBuilder', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('renders title', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Program Weeks')).toBeInTheDocument();
  });

  it('renders add week button when not readOnly', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const addWeekBtns = screen.getAllByText('Add Week');
    expect(addWeekBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('hides add week button when readOnly', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryByText('Add Week')).not.toBeInTheDocument();
  });

  it('renders week names', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    // "Deload Week" might appear in both the week card and dialog label
    const deloadTexts = screen.getAllByText('Deload Week');
    expect(deloadTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders week numbers', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    expect(screen.getByText(/Week 1:/)).toBeInTheDocument();
    expect(screen.getByText(/Week 2:/)).toBeInTheDocument();
  });

  it('renders deload badge', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Deload')).toBeInTheDocument();
  });

  it('renders week descriptions', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Base building phase')).toBeInTheDocument();
    expect(screen.getByText('Recovery')).toBeInTheDocument();
  });

  it('renders workout count', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('2 workouts scheduled')).toBeInTheDocument();
  });

  it('renders empty state when no weeks', () => {
    render(<WeekBuilder weeks={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('No weeks added yet')).toBeInTheDocument();
  });

  it('renders add first week in empty state', () => {
    render(<WeekBuilder weeks={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Add First Week')).toBeInTheDocument();
  });

  it('hides add first week in empty readOnly state', () => {
    render(<WeekBuilder weeks={[]} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryByText('Add First Week')).not.toBeInTheDocument();
  });

  it('renders move up/down buttons', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const upIcons = screen.getAllByTestId('icon-up');
    const downIcons = screen.getAllByTestId('icon-down');
    expect(upIcons.length).toBe(2);
    expect(downIcons.length).toBe(2);
  });

  it('renders edit buttons', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const editIcons = screen.getAllByTestId('icon-edit');
    expect(editIcons.length).toBe(2);
  });

  it('renders delete buttons', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const trashIcons = screen.getAllByTestId('icon-trash');
    expect(trashIcons.length).toBe(2);
  });

  it('hides action buttons when readOnly', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryAllByTestId('icon-trash')).toHaveLength(0);
    expect(screen.queryAllByTestId('icon-edit')).toHaveLength(0);
  });

  it('calls onUpdate when deleting a week', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const trashBtns = screen.getAllByTestId('icon-trash');
    fireEvent.click(trashBtns[0].closest('button')!);
    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('does not delete when confirm cancelled', () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const trashBtns = screen.getAllByTestId('icon-trash');
    fireEvent.click(trashBtns[0].closest('button')!);
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('first week move up button is disabled', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const upBtns = screen.getAllByTestId('icon-up').map(i => i.closest('button')!);
    expect(upBtns[0]).toBeDisabled();
  });

  it('last week move down button is disabled', () => {
    render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
    const downBtns = screen.getAllByTestId('icon-down').map(i => i.closest('button')!);
    expect(downBtns[1]).toBeDisabled();
  });
});
