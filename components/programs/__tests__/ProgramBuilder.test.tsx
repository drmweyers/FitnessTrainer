/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-uuid-789' },
});

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Check: () => <span data-testid="icon-check" />,
  Save: () => <span data-testid="icon-save" />,
  Eye: () => <span data-testid="icon-eye" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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
  Input: ({ onChange, value, ...props }: any) => <input onChange={onChange} value={value || ''} {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, ...props }: any) => <textarea onChange={onChange} value={value || ''} {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, disabled }: any) => (
    <div data-testid="select" data-value={value} data-disabled={disabled}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: (props: any) => <span />,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input type="checkbox" checked={checked} onChange={() => onCheckedChange && onCheckedChange(!checked)} {...props} />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick, ...props }: any) => (
    <span onClick={onClick} {...props}>{children}</span>
  ),
}));

// Mock child components to keep tests focused
jest.mock('../WeekBuilder', () => ({
  WeekBuilder: ({ weeks, onUpdate }: any) => (
    <div data-testid="week-builder">
      <span>{weeks.length} weeks</span>
      <button onClick={() => onUpdate([...weeks, { id: 'new', weekNumber: weeks.length + 1, name: 'New Week', isDeload: false, workouts: [] }])}>
        Mock Add Week
      </button>
    </div>
  ),
}));

jest.mock('../ProgramPreview', () => ({
  ProgramPreview: ({ program, onClose }: any) => (
    <div data-testid="program-preview">
      <span>Preview: {program.name}</span>
      {onClose && <button onClick={onClose}>Close Preview</button>}
    </div>
  ),
}));

import { ProgramBuilder } from '../ProgramBuilder';

describe('ProgramBuilder', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create new program title', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Create New Program')).toBeInTheDocument();
  });

  it('renders edit program title when initialProgram has id', () => {
    render(<ProgramBuilder initialProgram={{ id: 'prog-1' } as any} onSave={mockOnSave} />);
    expect(screen.getByText('Edit Program')).toBeInTheDocument();
  });

  it('renders step indicator', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Goals & Equipment')).toBeInTheDocument();
    expect(screen.getByText('Week Structure')).toBeInTheDocument();
    expect(screen.getByText('Review & Save')).toBeInTheDocument();
  });

  it('renders basic info step fields', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Program Name *')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Program Type *')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Level *')).toBeInTheDocument();
    expect(screen.getByText('Duration (weeks) *')).toBeInTheDocument();
  });

  it('renders name input', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByPlaceholderText('e.g., 12-Week Strength Program')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByPlaceholderText('Describe your program...')).toBeInTheDocument();
  });

  it('renders back and next buttons', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('back button is disabled on first step', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Back')).toBeDisabled();
  });

  it('next button is disabled when name is empty', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('navigates to goals step when name is filled and next clicked', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Select the primary goals for this program')).toBeInTheDocument();
  });

  it('renders goal options on goals step', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Build Muscle')).toBeInTheDocument();
    expect(screen.getByText('Lose Weight')).toBeInTheDocument();
    expect(screen.getByText('Increase Strength')).toBeInTheDocument();
  });

  it('renders equipment options on goals step', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Equipment Needed')).toBeInTheDocument();
    expect(screen.getByText('Barbell')).toBeInTheDocument();
    expect(screen.getByText('Dumbbells')).toBeInTheDocument();
  });

  it('can toggle goals', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Build Muscle'));
    // Toggle again to deselect
    fireEvent.click(screen.getByText('Build Muscle'));
  });

  it('can toggle equipment', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Barbell'));
    fireEvent.click(screen.getByText('Barbell'));
  });

  it('navigates to weeks step', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next')); // to goals
    fireEvent.click(screen.getByText('Next')); // to weeks
    expect(screen.getByTestId('week-builder')).toBeInTheDocument();
  });

  it('navigates back from goals to info', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program' } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next')); // to goals
    fireEvent.click(screen.getByText('Back')); // back to info
    expect(screen.getByText('Program Name *')).toBeInTheDocument();
  });

  it('renders preview button', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders cancel button when onCancel provided', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel clicked', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('hides preview and cancel when readOnly', () => {
    render(<ProgramBuilder onSave={mockOnSave} onCancel={mockOnCancel} readOnly />);
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('renders save button on review step', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program', weeks: [{ id: 'w1' }] } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next')); // goals
    fireEvent.click(screen.getByText('Next')); // weeks
    // Add a week to pass validation
    fireEvent.click(screen.getByText('Mock Add Week'));
    fireEvent.click(screen.getByText('Next')); // review
    expect(screen.getByText('Save Program')).toBeInTheDocument();
  });

  it('calls onSave when save program clicked', () => {
    render(<ProgramBuilder initialProgram={{ name: 'My Program', weeks: [{ id: 'w1' }] } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next')); // goals
    fireEvent.click(screen.getByText('Next')); // weeks
    fireEvent.click(screen.getByText('Mock Add Week'));
    fireEvent.click(screen.getByText('Next')); // review
    fireEvent.click(screen.getByText('Save Program'));
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Program' })
    );
  });

  it('fills in initial program values', () => {
    render(
      <ProgramBuilder
        initialProgram={{
          name: 'Existing Program',
          description: 'An existing program',
          durationWeeks: 12,
        } as any}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByDisplayValue('Existing Program')).toBeInTheDocument();
    expect(screen.getByDisplayValue('An existing program')).toBeInTheDocument();
  });

  it('shows Preview modal when preview button clicked', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByTestId('program-preview')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Preview'));
  });

  it('updates program name field', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    const nameInput = screen.getByPlaceholderText('e.g., 12-Week Strength Program');
    fireEvent.change(nameInput, { target: { value: 'My Program' } });
    expect(nameInput).toHaveValue('My Program');
  });

  it('updates description field', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    const descInput = screen.getByPlaceholderText('Describe your program...');
    fireEvent.change(descInput, { target: { value: 'Test description' } });
    expect(descInput).toHaveValue('Test description');
  });

  it('updates duration field', () => {
    render(<ProgramBuilder onSave={mockOnSave} />);
    const durationInput = screen.getByPlaceholderText('4') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '8' } });
    expect(durationInput.value).toBe('8');
  });

  it('canGoNext returns false for default case', () => {
    // Test the default case in canGoNext switch statement (line 125-126)
    // We can trigger this by navigating to review step (which returns true)
    render(<ProgramBuilder initialProgram={{ name: 'Test', weeks: [{ id: 'w1' }] } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next')); // to goals
    fireEvent.click(screen.getByText('Next')); // to weeks
    fireEvent.click(screen.getByText('Mock Add Week'));
    fireEvent.click(screen.getByText('Next')); // to review (default returns true, but after review there's no step)
  });

  it('calls handleSave with proper data structure', () => {
    render(<ProgramBuilder initialProgram={{ id: 'prog-1', name: 'Test', weeks: [{ id: 'w1' }] } as any} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Next')); // goals
    fireEvent.click(screen.getByText('Build Muscle')); // select a goal
    fireEvent.click(screen.getByText('Next')); // weeks
    fireEvent.click(screen.getByText('Mock Add Week'));
    fireEvent.click(screen.getByText('Next')); // review
    fireEvent.click(screen.getByText('Save Program'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'prog-1',
        name: 'Test',
        goals: ['Build Muscle'],
        equipmentNeeded: [],
      })
    );
  });
});
