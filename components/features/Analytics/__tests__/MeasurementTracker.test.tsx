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
});
