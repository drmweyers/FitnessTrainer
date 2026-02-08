/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressionBuilder from '../ProgressionBuilder';
import { ProgramWeekData } from '@/types/program';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const createMockWeeks = (): ProgramWeekData[] => [
  {
    weekNumber: 1,
    isDeload: false,
    workouts: [
      {
        name: 'Day 1',
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'ex-1',
            orderIndex: 0,
            configurations: [
              { setNumber: 1, reps: 10, weight: 100, restSeconds: 60 },
            ],
          },
          {
            exerciseId: 'ex-2',
            orderIndex: 1,
            configurations: [
              { setNumber: 1, reps: 12, weight: 50, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
  {
    weekNumber: 2,
    isDeload: false,
    workouts: [
      {
        name: 'Day 1',
        dayOfWeek: 1,
        exercises: [
          {
            exerciseId: 'ex-1',
            orderIndex: 0,
            configurations: [
              { setNumber: 1, reps: 10, weight: 100, restSeconds: 60 },
            ],
          },
        ],
      },
    ],
  },
];

describe('ProgressionBuilder', () => {
  const mockOnUpdateWeeks = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    weeks: createMockWeeks(),
    onUpdateWeeks: mockOnUpdateWeeks,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Exercise Progression Builder')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(
      screen.getByText('Configure progressive overload patterns for systematic strength gains')
    ).toBeInTheDocument();
  });

  it('shows instruction section', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('How Progressive Overload Works')).toBeInTheDocument();
  });

  it('displays exercises from weeks', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Select Exercises (0)')).toBeInTheDocument();
    expect(screen.getByText('Exercise 1')).toBeInTheDocument();
    expect(screen.getByText('Exercise 2')).toBeInTheDocument();
  });

  it('shows empty configuration state when no exercises are selected', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(
      screen.getByText('Select exercises to configure their progression')
    ).toBeInTheDocument();
  });

  it('disables apply button when no exercises are selected', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const applyButtons = screen.getAllByText('Apply Progressions');
    expect(applyButtons[0]).toBeDisabled();
  });

  it('renders Cancel button and calls onClose', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const cancelButtons = screen.getAllByText('Cancel');
    fireEvent.click(cancelButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows exercise workout count', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Appears in 2 workouts')).toBeInTheDocument();
    expect(screen.getByText('Appears in 1 workout')).toBeInTheDocument();
  });

  it('shows progressive overload benefits section', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('Progressive Overload Benefits')).toBeInTheDocument();
    expect(screen.getByText(/Continuous Adaptation/)).toBeInTheDocument();
    expect(screen.getByText(/Measurable Progress/)).toBeInTheDocument();
  });

  it('selects an exercise and shows configuration', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Select Exercises (1)')).toBeInTheDocument();
    expect(screen.getByText('Progression Type')).toBeInTheDocument();
  });

  it('shows progression type dropdown with all options', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    expect(select).toBeInTheDocument();
  });

  it('enables apply button when exercise is selected', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const applyButtons = screen.getAllByText('Apply Progressions');
    expect(applyButtons[0]).not.toBeDisabled();
  });

  it('calls onUpdateWeeks when apply is clicked', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
  });

  it('deselects an exercise and removes its config', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Select
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('Select Exercises (1)')).toBeInTheDocument();
    // Deselect
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('Select Exercises (0)')).toBeInTheDocument();
    expect(screen.getByText('Select exercises to configure their progression')).toBeInTheDocument();
  });

  it('shows Configure button and toggles config panel', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const configureBtn = screen.getByText('Configure');
    fireEvent.click(configureBtn);
    // Should now show Hide
    expect(screen.getByText('Hide')).toBeInTheDocument();
    // Should show linear config inputs
    expect(screen.getByText('Weight increment (lbs/week)')).toBeInTheDocument();
    expect(screen.getByText('Rep increment (reps/week)')).toBeInTheDocument();

    // Click Hide to close
    fireEvent.click(screen.getByText('Hide'));
    expect(screen.getByText('Configure')).toBeInTheDocument();
  });

  it('changes progression type to double and shows config', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Change to double progression
    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'double' } });

    expect(screen.getByText(/Increase reps first, then weight/)).toBeInTheDocument();

    // Open config panel
    fireEvent.click(screen.getByText('Configure'));
    expect(screen.getByText('Min reps')).toBeInTheDocument();
    expect(screen.getByText('Max reps')).toBeInTheDocument();
    expect(screen.getByText('Weight increment')).toBeInTheDocument();
  });

  it('changes progression type to wave and shows preview', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'wave' } });

    expect(screen.getByText(/Cyclical intensity/)).toBeInTheDocument();
    // Wave preview should show percentage values
    expect(screen.getByText('Progression Preview')).toBeInTheDocument();
  });

  it('changes progression type to deload and shows preview', () => {
    const weeksWithDeload = createMockWeeks();
    weeksWithDeload[1].isDeload = true;
    render(<ProgressionBuilder weeks={weeksWithDeload} onUpdateWeeks={mockOnUpdateWeeks} onClose={mockOnClose} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'deload' } });

    expect(screen.getByText(/Planned recovery weeks/)).toBeInTheDocument();
    expect(screen.getByText('Deload week')).toBeInTheDocument();
  });

  it('changes progression type to autoregulation and shows config', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'autoregulation' } });

    expect(screen.getByText(/RPE-based progression/)).toBeInTheDocument();
    // Open config panel
    fireEvent.click(screen.getByText('Configure'));
    expect(screen.getByText('Target RPE')).toBeInTheDocument();
    expect(screen.getByText(/RPE 7 = 3 reps in reserve/)).toBeInTheDocument();
  });

  it('shows linear progression preview with baseline and increments', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Baseline')).toBeInTheDocument();
    expect(screen.getByText('+5lbs')).toBeInTheDocument();
  });

  it('shows double progression preview text', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'double' } });

    expect(screen.getAllByText('Rep progression').length).toBeGreaterThan(0);
  });

  it('shows wave progression preview with positive/negative values', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'wave' } });

    // Week 1 has wavePattern[0]=0, so +0%
    expect(screen.getByText('+0%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('shows autoregulation preview with RPE targets', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'autoregulation' } });

    expect(screen.getAllByText('Target intensity').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RPE 7').length).toBeGreaterThan(0);
  });

  it('applies double progression and calls onUpdateWeeks', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'double' } });

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('applies wave progression and calls onUpdateWeeks', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'wave' } });

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
    const updatedWeeks = mockOnUpdateWeeks.mock.calls[0][0];
    // Check notes contain wave loading info
    const ex1Config = updatedWeeks[0].workouts[0].exercises[0].configurations[0];
    expect(ex1Config.notes).toContain('[Wave loading:');
  });

  it('applies deload progression and calls onUpdateWeeks', () => {
    const weeksWithDeload = createMockWeeks();
    weeksWithDeload[1].isDeload = true;
    render(<ProgressionBuilder weeks={weeksWithDeload} onUpdateWeeks={mockOnUpdateWeeks} onClose={mockOnClose} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'deload' } });

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
    const updatedWeeks = mockOnUpdateWeeks.mock.calls[0][0];
    const week2Config = updatedWeeks[1].workouts[0].exercises[0].configurations[0];
    expect(week2Config.notes).toContain('[Deload: -30%]');
  });

  it('applies autoregulation progression and sets RPE', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'autoregulation' } });

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
    const updatedWeeks = mockOnUpdateWeeks.mock.calls[0][0];
    const ex1Config = updatedWeeks[0].workouts[0].exercises[0].configurations[0];
    expect(ex1Config.rpe).toBe(7);
    expect(ex1Config.notes).toContain('[Target RPE: 7]');
  });

  it('applies linear progression with weight and rep increments', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Open config
    fireEvent.click(screen.getByText('Configure'));

    // Update weight increment
    const weightInput = screen.getByPlaceholderText('5');
    fireEvent.change(weightInput, { target: { value: '10' } });

    // Update rep increment
    const repInput = screen.getByPlaceholderText('0');
    fireEvent.change(repInput, { target: { value: '2' } });

    const applyButton = screen.getAllByText('Apply Progressions')[0];
    fireEvent.click(applyButton);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
    const updatedWeeks = mockOnUpdateWeeks.mock.calls[0][0];
    // Week 2 should have increments
    const week2Config = updatedWeeks[1].workouts[0].exercises[0].configurations[0];
    expect(week2Config.notes).toContain('+10lbs');
    expect(week2Config.notes).toContain('+2 reps');
  });

  it('configures double progression min/max reps and weight increment', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'double' } });

    fireEvent.click(screen.getByText('Configure'));

    const minInput = screen.getByPlaceholderText('6');
    fireEvent.change(minInput, { target: { value: '8' } });

    const maxInput = screen.getByPlaceholderText('10');
    fireEvent.change(maxInput, { target: { value: '12' } });

    const weightInput = screen.getByPlaceholderText('5');
    fireEvent.change(weightInput, { target: { value: '10' } });
  });

  it('configures autoregulation target RPE', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const select = screen.getByDisplayValue('Linear Progression');
    fireEvent.change(select, { target: { value: 'autoregulation' } });

    fireEvent.click(screen.getByText('Configure'));

    const rpeInput = screen.getByPlaceholderText('7');
    fireEvent.change(rpeInput, { target: { value: '8' } });
  });

  it('shows exercise count in footer', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    expect(screen.getByText('0 exercises with progression configured')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('1 exercise with progression configured')).toBeInTheDocument();

    fireEvent.click(checkboxes[1]);
    expect(screen.getByText('2 exercises with progression configured')).toBeInTheDocument();
  });

  it('renders without onClose prop (no Cancel button)', () => {
    render(<ProgressionBuilder weeks={createMockWeeks()} onUpdateWeeks={mockOnUpdateWeeks} />);
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('shows +more weeks indicator for programs with more than 4 weeks', () => {
    const manyWeeks: ProgramWeekData[] = [];
    for (let i = 1; i <= 6; i++) {
      manyWeeks.push({
        weekNumber: i,
        isDeload: false,
        workouts: [{
          name: 'Day 1',
          dayOfWeek: 1,
          exercises: [{
            exerciseId: 'ex-1',
            orderIndex: 0,
            configurations: [{ setNumber: 1, reps: 10, weight: 100, restSeconds: 60 }],
          }],
        }],
      });
    }

    render(<ProgressionBuilder weeks={manyWeeks} onUpdateWeeks={mockOnUpdateWeeks} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('+2 more weeks')).toBeInTheDocument();
  });

  it('calls onClose when Apply Progressive Overload clicked', () => {
    render(<ProgressionBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Use the bottom Apply button
    const applyButtons = screen.getAllByText('Apply Progressive Overload');
    fireEvent.click(applyButtons[0]);

    expect(mockOnUpdateWeeks).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
