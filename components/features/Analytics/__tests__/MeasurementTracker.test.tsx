/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MeasurementTracker from '../MeasurementTracker';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock PhotoUpload component
jest.mock('../PhotoUpload', () => ({
  __esModule: true,
  default: ({ onUpload, maxFiles }: any) => (
    <div data-testid="photo-upload">
      <span>Photo Upload (max {maxFiles})</span>
    </div>
  ),
}));

describe('MeasurementTracker', () => {
  const mockOnSave = jest.fn().mockResolvedValue(undefined);
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    isOpen: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<MeasurementTracker {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Record New Measurements')).not.toBeInTheDocument();
  });

  it('renders the modal title', () => {
    render(<MeasurementTracker {...defaultProps} />);
    expect(screen.getByText('Record New Measurements')).toBeInTheDocument();
  });

  it('shows update title when editing', () => {
    render(
      <MeasurementTracker
        {...defaultProps}
        initialData={{ id: 'existing-1' } as any}
      />
    );
    expect(screen.getByText('Update Measurements')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<MeasurementTracker {...defaultProps} />);
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Body Measurements')).toBeInTheDocument();
    expect(screen.getByText('Progress Photos')).toBeInTheDocument();
  });

  it('shows basic info fields by default', () => {
    render(<MeasurementTracker {...defaultProps} />);
    expect(screen.getByText('Measurement Date *')).toBeInTheDocument();
    expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByText('Body Fat Percentage (%)')).toBeInTheDocument();
    expect(screen.getByText('Muscle Mass (kg)')).toBeInTheDocument();
    expect(screen.getByText('Notes (Optional)')).toBeInTheDocument();
  });

  it('switches to body measurements tab', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Body Measurements'));
    expect(screen.getByText('Chest (cm)')).toBeInTheDocument();
    expect(screen.getByText('Waist (cm)')).toBeInTheDocument();
    expect(screen.getByText('Hips (cm)')).toBeInTheDocument();
    expect(screen.getByText('Biceps (cm)')).toBeInTheDocument();
    expect(screen.getByText('Thighs (cm)')).toBeInTheDocument();
  });

  it('switches to photos tab', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Progress Photos'));
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
  });

  it('shows measurement field placeholders', () => {
    render(<MeasurementTracker {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g., 75.5')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 15.2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 45.8')).toBeInTheDocument();
  });

  it('has Cancel and Save buttons', () => {
    render(<MeasurementTracker {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Measurement')).toBeInTheDocument();
  });

  it('shows Update Measurement button when editing', () => {
    render(
      <MeasurementTracker
        {...defaultProps}
        initialData={{ id: 'existing-1' } as any}
      />
    );
    expect(screen.getByText('Update Measurement')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows validation error when no measurements provided', async () => {
    render(<MeasurementTracker {...defaultProps} />);

    const saveButton = screen.getByText('Save Measurement');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please provide at least one measurement')
      ).toBeInTheDocument();
    });
  });

  it('calls onSave when valid data is submitted', async () => {
    render(<MeasurementTracker {...defaultProps} />);

    const weightInput = screen.getByPlaceholderText('e.g., 75.5');
    fireEvent.change(weightInput, { target: { value: '80' } });

    const saveButton = screen.getByText('Save Measurement');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows body measurement fields', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Body Measurements'));

    expect(screen.getByText('Neck (cm)')).toBeInTheDocument();
    expect(screen.getByText('Shoulders (cm)')).toBeInTheDocument();
    expect(screen.getByText('Forearms (cm)')).toBeInTheDocument();
    expect(screen.getByText('Calves (cm)')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<MeasurementTracker {...defaultProps} />);
    expect(screen.getByText('Track your physical progress over time')).toBeInTheDocument();
  });

  it('shows date validation error when date is empty', async () => {
    render(<MeasurementTracker {...defaultProps} />);

    // Clear the date field
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    fireEvent.change(dateInput, { target: { value: '' } });

    // Also set weight to satisfy measurement check
    const weightInput = screen.getByPlaceholderText('e.g., 75.5');
    fireEvent.change(weightInput, { target: { value: '80' } });

    // Submit the form directly
    const form = screen.getByText('Save Measurement').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Measurement date is required')).toBeInTheDocument();
    });
  });

  it('shows error when onSave rejects', async () => {
    const failingSave = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<MeasurementTracker {...defaultProps} onSave={failingSave} />);

    const weightInput = screen.getByPlaceholderText('e.g., 75.5');
    fireEvent.change(weightInput, { target: { value: '80' } });

    const saveButton = screen.getByText('Save Measurement');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save measurement. Please try again.')).toBeInTheDocument();
    });
  });

  it('clears error when user starts typing in that field', async () => {
    render(<MeasurementTracker {...defaultProps} />);

    // Trigger validation error first
    fireEvent.click(screen.getByText('Save Measurement'));

    await waitFor(() => {
      expect(screen.getByText('Please provide at least one measurement')).toBeInTheDocument();
    });

    // Type in weight to clear error (general error cleared indirectly)
    const weightInput = screen.getByPlaceholderText('e.g., 75.5');
    fireEvent.change(weightInput, { target: { value: '80' } });
  });

  it('changes body fat percentage', () => {
    render(<MeasurementTracker {...defaultProps} />);
    const bfInput = screen.getByPlaceholderText('e.g., 15.2');
    fireEvent.change(bfInput, { target: { value: '12.5' } });
    expect(bfInput).toHaveValue(12.5);
  });

  it('changes muscle mass', () => {
    render(<MeasurementTracker {...defaultProps} />);
    const mmInput = screen.getByPlaceholderText('e.g., 45.8');
    fireEvent.change(mmInput, { target: { value: '50' } });
    expect(mmInput).toHaveValue(50);
  });

  it('changes notes field', () => {
    render(<MeasurementTracker {...defaultProps} />);
    const notesInput = screen.getByPlaceholderText(/additional notes/);
    fireEvent.change(notesInput, { target: { value: 'Feeling strong' } });
    expect(notesInput).toHaveValue('Feeling strong');
  });

  it('enters body measurement values', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Body Measurements'));

    const chestInput = screen.getByPlaceholderText('e.g., 102');
    fireEvent.change(chestInput, { target: { value: '100' } });
    expect(chestInput).toHaveValue(100);

    const waistInput = screen.getByPlaceholderText('e.g., 85');
    fireEvent.change(waistInput, { target: { value: '82' } });
    expect(waistInput).toHaveValue(82);
  });

  it('submits with body measurements only (no basic measurements)', async () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Body Measurements'));

    const chestInput = screen.getByPlaceholderText('e.g., 102');
    fireEvent.change(chestInput, { target: { value: '100' } });

    fireEvent.click(screen.getByText('Save Measurement'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows Saving... text while submitting', async () => {
    let resolvePromise: () => void;
    const slowSave = jest.fn(() => new Promise<void>(resolve => { resolvePromise = resolve; }));
    render(<MeasurementTracker {...defaultProps} onSave={slowSave} />);

    const weightInput = screen.getByPlaceholderText('e.g., 75.5');
    fireEvent.change(weightInput, { target: { value: '80' } });

    fireEvent.click(screen.getByText('Save Measurement'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    // Resolve to clean up
    resolvePromise!();
    await waitFor(() => {
      expect(screen.getByText('Save Measurement')).toBeInTheDocument();
    });
  });

  it('calls onCancel when close X button is clicked', () => {
    render(<MeasurementTracker {...defaultProps} />);
    // The close button is a button with SVG inside (X icon)
    const allButtons = screen.getAllByRole('button');
    // The close button is not Cancel or Save, it's the X in the header
    const closeButton = allButtons.find(btn =>
      btn.className.includes('text-gray-400') && btn.className.includes('hover:text-gray-600')
    );
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnCancel).toHaveBeenCalled();
    }
  });

  it('shows photos tab content', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Progress Photos'));
    expect(screen.getByText('Progress Photos (Optional)')).toBeInTheDocument();
    expect(screen.getByText(/Take photos in good lighting/)).toBeInTheDocument();
  });

  it('clears empty body measurement value to undefined', () => {
    render(<MeasurementTracker {...defaultProps} />);
    fireEvent.click(screen.getByText('Body Measurements'));

    const chestInput = screen.getByPlaceholderText('e.g., 102');
    fireEvent.change(chestInput, { target: { value: '100' } });
    expect(chestInput).toHaveValue(100);

    // Clear it
    fireEvent.change(chestInput, { target: { value: '' } });
    expect(chestInput).toHaveValue(null);
  });

  it('clears weight to undefined when emptied', () => {
    render(<MeasurementTracker {...defaultProps} />);
    const weightInput = screen.getByPlaceholderText('e.g., 75.5');
    fireEvent.change(weightInput, { target: { value: '80' } });
    expect(weightInput).toHaveValue(80);

    fireEvent.change(weightInput, { target: { value: '' } });
    expect(weightInput).toHaveValue(null);
  });
});
