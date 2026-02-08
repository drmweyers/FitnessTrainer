/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash" />,
  GripVertical: () => <span data-testid="icon-grip" />,
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

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, disabled }: any) => (
    <div data-testid="select" data-value={value} data-disabled={disabled}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: (props: any) => <span />,
}));

// Use the actual ExerciseConfiguration type
import { ExerciseConfiguration as ExerciseConfigComponent } from '../ExerciseConfiguration';
import { SetType } from '@/types/program';

const mockConfigs = [
  {
    setNumber: 1,
    setType: SetType.WORKING,
    reps: '8-12',
    restSeconds: 90,
    weightGuidance: '70% 1RM',
    rpe: 7,
    rir: 3,
    tempo: '3-0-1-0',
    notes: 'Control the eccentric',
  },
  {
    setNumber: 2,
    setType: SetType.DROP,
    reps: '12-15',
    restSeconds: 60,
  },
];

describe('ExerciseConfiguration', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Sets Configuration')).toBeInTheDocument();
  });

  it('renders add set button when not readOnly', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Add Set')).toBeInTheDocument();
  });

  it('does not render add set button when readOnly', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryByText('Add Set')).not.toBeInTheDocument();
  });

  it('calls onUpdate when adding a set', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    fireEvent.click(screen.getByText('Add Set'));
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ setNumber: 3, setType: SetType.WORKING }),
      ])
    );
  });

  it('renders empty state when no configurations', () => {
    render(<ExerciseConfigComponent configurations={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('No sets configured')).toBeInTheDocument();
  });

  it('renders add first set button in empty state', () => {
    render(<ExerciseConfigComponent configurations={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Add First Set')).toBeInTheDocument();
  });

  it('does not render add first set in empty readOnly state', () => {
    render(<ExerciseConfigComponent configurations={[]} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.queryByText('Add First Set')).not.toBeInTheDocument();
  });

  it('renders set type selects', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    const selects = screen.getAllByTestId('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('renders delete buttons when not readOnly', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    const trashIcons = screen.getAllByTestId('icon-trash');
    expect(trashIcons).toHaveLength(2);
  });

  it('renders expand/collapse buttons for each set', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    // Should have expand buttons (triangle icons as text)
    const expandBtns = screen.getAllByRole('button');
    expect(expandBtns.length).toBeGreaterThanOrEqual(4); // 2 expand + 2 delete + 1 add
  });

  it('calls onUpdate when deleting a set', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    const trashBtns = screen.getAllByTestId('icon-trash');
    // Click the parent button of the first trash icon
    fireEvent.click(trashBtns[0].closest('button')!);
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('shows readOnly set labels', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} readOnly />);
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
  });

  it('renders grip icons when not readOnly', () => {
    render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
    const grips = screen.getAllByTestId('icon-grip');
    expect(grips).toHaveLength(2);
  });
});
