/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import RPEIntegration from '../RPEIntegration';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const createMockExercises = () => [
  {
    exerciseId: 'ex-1',
    orderIndex: 0,
    configurations: [
      { setNumber: 1, reps: 10, weight: 100, restSeconds: 60 },
      { setNumber: 2, reps: 10, weight: 100, restSeconds: 60 },
    ],
  },
  {
    exerciseId: 'ex-2',
    orderIndex: 1,
    configurations: [
      { setNumber: 1, reps: 12, weight: 50, restSeconds: 60 },
    ],
  },
];

describe('RPEIntegration', () => {
  const mockOnUpdateExercises = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    exercises: createMockExercises() as any,
    onUpdateExercises: mockOnUpdateExercises,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(screen.getByText('RPE & RIR Integration')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(
      screen.getByText(
        'Configure Rate of Perceived Exertion and Reps in Reserve for precise training intensity'
      )
    ).toBeInTheDocument();
  });

  it('shows education section about RPE/RIR', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(screen.getByText('Understanding RPE & RIR')).toBeInTheDocument();
  });

  it('displays exercise list for selection', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(screen.getByText('Select Exercises (0)')).toBeInTheDocument();
    expect(screen.getByText('Exercise 1')).toBeInTheDocument();
    expect(screen.getByText('Exercise 2')).toBeInTheDocument();
  });

  it('shows empty configuration state when no exercises selected', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(screen.getByText('Select exercises to configure RPE and RIR')).toBeInTheDocument();
  });

  it('disables apply button when no exercises are selected', () => {
    render(<RPEIntegration {...defaultProps} />);
    const applyButtons = screen.getAllByText('Apply RPE Settings');
    expect(applyButtons[0]).toBeDisabled();
  });

  it('selects an exercise and shows configuration panel', () => {
    render(<RPEIntegration {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Select Exercises (1)')).toBeInTheDocument();
    expect(screen.getByText('Target RPE')).toBeInTheDocument();
    expect(screen.getByText('Reps in Reserve (RIR)')).toBeInTheDocument();
  });

  it('shows RPE scale reference at bottom', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(screen.getByText('RPE Scale Reference')).toBeInTheDocument();
    expect(screen.getByText('Light Intensity (RPE 6-7)')).toBeInTheDocument();
    expect(screen.getByText('Moderate Intensity (RPE 7-8)')).toBeInTheDocument();
    expect(screen.getByText('High Intensity (RPE 8-10)')).toBeInTheDocument();
  });

  it('shows exercise configuration count', () => {
    render(<RPEIntegration {...defaultProps} />);
    expect(screen.getByText('2 configurations will be updated')).toBeInTheDocument();
    expect(screen.getByText('1 configuration will be updated')).toBeInTheDocument();
  });

  it('enables apply button when exercise is selected', () => {
    render(<RPEIntegration {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const applyButtons = screen.getAllByText('Apply RPE Settings');
    expect(applyButtons[0]).not.toBeDisabled();
  });

  it('calls onUpdateExercises when apply is clicked', () => {
    render(<RPEIntegration {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const applyButton = screen.getAllByText('Apply RPE Settings')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateExercises).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<RPEIntegration {...defaultProps} />);
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows intensity guide visualization when exercise selected', () => {
    render(<RPEIntegration {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Intensity Guide')).toBeInTheDocument();
    expect(screen.getByText('RPE 7')).toBeInTheDocument();
  });

  it('shows Configure button for selected exercises', () => {
    render(<RPEIntegration {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Configure')).toBeInTheDocument();
  });

  it('shows autoregulation options when Configure is clicked', () => {
    render(<RPEIntegration {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    fireEvent.click(screen.getByText('Configure'));
    expect(
      screen.getByText('Enable autoregulation (adjust based on performance)')
    ).toBeInTheDocument();
  });
});
