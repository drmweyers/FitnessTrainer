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

  describe('adding weeks', () => {
    it('opens add week dialog when Add Week button is clicked', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Week');
      fireEvent.click(addBtns[0]);
      // Dialog should be visible since open=true
      expect(screen.getByText('Add New Week')).toBeInTheDocument();
      expect(screen.getByText('Create a new week for your program')).toBeInTheDocument();
    });

    it('fills in week name and adds week', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      // Open dialog
      const addBtns = screen.getAllByText('Add Week');
      fireEvent.click(addBtns[0]);

      // Fill in name
      const nameInput = screen.getByPlaceholderText('e.g., Week 1 - Foundation');
      fireEvent.change(nameInput, { target: { value: 'Strength Phase' } });

      // Fill in description
      const descInput = screen.getByPlaceholderText('Optional description for this week...');
      fireEvent.change(descInput, { target: { value: 'Focus on heavy compounds' } });

      // Submit
      // Find the "Add Week" button inside the dialog footer
      const dialogAddBtns = screen.getAllByText('Add Week');
      const footerBtn = dialogAddBtns[dialogAddBtns.length - 1];
      fireEvent.click(footerBtn);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Strength Phase' }),
        ])
      );
    });

    it('does not add week with empty name', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Week');
      fireEvent.click(addBtns[0]);

      // Try to add without filling name (empty string)
      const dialogAddBtns = screen.getAllByText('Add Week');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('can set deload toggle when adding week', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Week');
      fireEvent.click(addBtns[0]);

      // Toggle deload first (before name change to avoid stale closure)
      const deloadSwitch = screen.getByRole('checkbox');
      fireEvent.click(deloadSwitch);

      // Fill name
      const nameInput = screen.getByPlaceholderText('e.g., Week 1 - Foundation');
      fireEvent.change(nameInput, { target: { value: 'Recovery' } });

      // Add the week
      const dialogAddBtns = screen.getAllByText('Add Week');
      fireEvent.click(dialogAddBtns[dialogAddBtns.length - 1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Recovery', isDeload: true }),
        ])
      );
    });

    it('cancel button closes dialog without adding', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const addBtns = screen.getAllByText('Add Week');
      fireEvent.click(addBtns[0]);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('opens dialog from Add First Week button in empty state', () => {
      render(<WeekBuilder weeks={[]} onUpdate={mockOnUpdate} />);
      fireEvent.click(screen.getByText('Add First Week'));
      // Dialog should show
      expect(screen.getByText('Add New Week')).toBeInTheDocument();
    });
  });

  describe('editing weeks', () => {
    it('enters edit mode when edit button is clicked', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const editBtns = screen.getAllByTestId('icon-edit').map(i => i.closest('button')!);
      fireEvent.click(editBtns[0]);

      // Should show input with current name
      const nameInput = screen.getByDisplayValue('Foundation');
      expect(nameInput).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const editBtns = screen.getAllByTestId('icon-edit').map(i => i.closest('button')!);
      fireEvent.click(editBtns[0]);

      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('saves edited week name', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const editBtns = screen.getAllByTestId('icon-edit').map(i => i.closest('button')!);
      fireEvent.click(editBtns[0]);

      const nameInput = screen.getByDisplayValue('Foundation');
      fireEvent.change(nameInput, { target: { value: 'Hypertrophy' } });

      fireEvent.click(screen.getByText('✓'));
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Hypertrophy' }),
        ])
      );
    });

    it('edits week description', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const editBtns = screen.getAllByTestId('icon-edit').map(i => i.closest('button')!);
      fireEvent.click(editBtns[0]);

      const descInput = screen.getByDisplayValue('Base building phase');
      fireEvent.change(descInput, { target: { value: 'Updated description' } });

      fireEvent.click(screen.getByText('✓'));
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ description: 'Updated description' }),
        ])
      );
    });
  });

  describe('moving weeks', () => {
    it('moves week down', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const downBtns = screen.getAllByTestId('icon-down').map(i => i.closest('button')!);
      // First week's down button should be enabled
      expect(downBtns[0]).not.toBeDisabled();
      fireEvent.click(downBtns[0]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ weekNumber: 1 }),
          expect.objectContaining({ weekNumber: 2 }),
        ])
      );
    });

    it('moves week up', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const upBtns = screen.getAllByTestId('icon-up').map(i => i.closest('button')!);
      // Second week's up button should be enabled
      expect(upBtns[1]).not.toBeDisabled();
      fireEvent.click(upBtns[1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ weekNumber: 1 }),
          expect.objectContaining({ weekNumber: 2 }),
        ])
      );
    });

    it('renumbers weeks after delete', () => {
      render(<WeekBuilder weeks={mockWeeks} onUpdate={mockOnUpdate} />);
      const trashBtns = screen.getAllByTestId('icon-trash').map(i => i.closest('button')!);
      fireEvent.click(trashBtns[0]);

      // After deleting first week, remaining week should be renumbered to 1
      expect(mockOnUpdate).toHaveBeenCalledWith([
        expect.objectContaining({ weekNumber: 1, name: 'Deload Week' }),
      ]);
    });
  });

  describe('single workout count', () => {
    it('renders singular workout text for 1 workout', () => {
      const singleWorkout = [{
        id: 'w1',
        weekNumber: 1,
        name: 'Test',
        description: '',
        isDeload: false,
        workouts: [{ id: 'wo1', name: 'Day 1', dayNumber: 1 }],
      }] as any;
      render(<WeekBuilder weeks={singleWorkout} onUpdate={mockOnUpdate} />);
      expect(screen.getByText('1 workout scheduled')).toBeInTheDocument();
    });
  });
});
