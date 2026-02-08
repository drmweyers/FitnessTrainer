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

  describe('Expanded set card', () => {
    it('expands a set card when expand button is clicked', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      // Find expand buttons (they show triangle text)
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);
      // Should now show form fields
      expect(screen.getByLabelText('Reps *')).toBeInTheDocument();
      expect(screen.getByLabelText('Weight Guidance')).toBeInTheDocument();
      expect(screen.getByLabelText(/Rest/)).toBeInTheDocument();
      expect(screen.getByLabelText('RPE (1-10)')).toBeInTheDocument();
      expect(screen.getByLabelText('RIR (0-10)')).toBeInTheDocument();
      expect(screen.getByLabelText('Tempo')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });

    it('collapses an expanded set card', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn); // expand
      expect(screen.getByLabelText('Reps *')).toBeInTheDocument();

      const collapseBtn = screen.getByText('\u25B2').closest('button')!;
      fireEvent.click(collapseBtn); // collapse
      expect(screen.queryByLabelText('Reps *')).not.toBeInTheDocument();
    });

    it('shows pre-filled values in expanded set', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      expect(screen.getByDisplayValue('8-12')).toBeInTheDocument();
      expect(screen.getByDisplayValue('70% 1RM')).toBeInTheDocument();
      expect(screen.getByDisplayValue('90')).toBeInTheDocument();
      expect(screen.getByDisplayValue('7')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3-0-1-0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Control the eccentric')).toBeInTheDocument();
    });

    it('calls onUpdate when changing reps', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const repsInput = screen.getByDisplayValue('8-12');
      fireEvent.change(repsInput, { target: { value: '10-15' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('calls onUpdate when changing weight guidance', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const weightInput = screen.getByDisplayValue('70% 1RM');
      fireEvent.change(weightInput, { target: { value: '80% 1RM' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('calls onUpdate when changing rest seconds', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const restInput = screen.getByDisplayValue('90');
      fireEvent.change(restInput, { target: { value: '120' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('calls onUpdate when changing RPE', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const rpeInput = screen.getByDisplayValue('7');
      fireEvent.change(rpeInput, { target: { value: '8' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('calls onUpdate when changing RIR', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const rirInput = screen.getByDisplayValue('3');
      fireEvent.change(rirInput, { target: { value: '2' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('calls onUpdate when changing tempo', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const tempoInput = screen.getByDisplayValue('3-0-1-0');
      fireEvent.change(tempoInput, { target: { value: '4-0-2-0' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('calls onUpdate when changing notes', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const notesInput = screen.getByDisplayValue('Control the eccentric');
      fireEvent.change(notesInput, { target: { value: 'Slow and controlled' } });
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it('shows empty values for optional fields when not set', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      // Expand the second config (no weightGuidance, rpe, rir, tempo, notes)
      const expandBtns = screen.getAllByText('\u25BC');
      fireEvent.click(expandBtns[1].closest('button')!);

      // Reps and rest are set
      expect(screen.getByDisplayValue('12-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });

    it('disables fields when readOnly', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} readOnly />);
      // Expand button should still be available
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      const repsInput = screen.getByDisplayValue('8-12');
      expect(repsInput).toBeDisabled();
    });

    it('does not show delete button in readOnly mode', () => {
      render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} readOnly />);
      expect(screen.queryByTestId('icon-trash')).not.toBeInTheDocument();
    });

    it('adds border highlight when expanded', () => {
      const { container } = render(<ExerciseConfigComponent configurations={mockConfigs} onUpdate={mockOnUpdate} />);
      const expandBtn = screen.getAllByText('\u25BC')[0].closest('button')!;
      fireEvent.click(expandBtn);

      // The expanded card should have border-blue-300 class
      const cards = container.querySelectorAll('.border-blue-300');
      expect(cards.length).toBe(1);
    });
  });
});
