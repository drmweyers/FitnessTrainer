/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import PercentageCalculator from '../PercentageCalculator';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const mockOnApply = jest.fn();

beforeEach(() => {
  mockOnApply.mockClear();
});

describe('PercentageCalculator', () => {
  it('renders the component', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    expect(screen.getByTestId('percentage-calculator')).toBeInTheDocument();
  });

  it('displays the current weight', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('renders percentage increase slider', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('slider has default value of 2.5%', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('2.5');
  });

  it('slider has min 1% and max 10%', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '10');
  });

  it('renders a projection table', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows projections for 4, 8, and 12 weeks', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    expect(screen.getByText(/4 weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/8 weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/12 weeks/i)).toBeInTheDocument();
  });

  it('calculates projected weights correctly at 2.5%/week', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    // After 4 weeks: 100 * (1 + 0.025)^4 ≈ 110.4 lbs → rounded
    // After 4 weeks with 2.5%/week: simpler calc is 100 + 4 * 2.5 = 110.0
    // The component should show weights for weeks 4, 8, 12
    // With 2.5% per week (2.5 lbs at 100 starting): 4wk=110, 8wk=120, 12wk=130
    expect(screen.getByText(/110/)).toBeInTheDocument();
  });

  it('renders the Apply to Exercise button', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    expect(screen.getByRole('button', { name: /apply to exercise/i })).toBeInTheDocument();
  });

  it('calls onApply with the weekly weight increase when button clicked', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    fireEvent.click(screen.getByRole('button', { name: /apply to exercise/i }));
    // With 2.5% of 100 = 2.5 lbs/week
    expect(mockOnApply).toHaveBeenCalledWith(2.5);
  });

  it('updates projection when slider changes', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '5' } });
    // At 5%/week on 100 lbs: 5 lbs/week
    // 4 weeks = 120 lbs
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });

  it('updates projection when current weight input changes', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const weightInput = screen.getByDisplayValue('100');
    fireEvent.change(weightInput, { target: { value: '200' } });
    // At 2.5%/week on 200 lbs: 5 lbs/week
    // 4 weeks = 220 lbs
    expect(screen.getByText(/220/)).toBeInTheDocument();
  });

  it('calls onApply with updated increase when weight changes', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const weightInput = screen.getByDisplayValue('100');
    fireEvent.change(weightInput, { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /apply to exercise/i }));
    // 2.5% of 200 = 5 lbs/week
    expect(mockOnApply).toHaveBeenCalledWith(5);
  });

  it('shows the percentage label', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    // The label appears at least once (possibly in the label and the info text)
    const matches = screen.getAllByText(/2\.5%/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('updates percentage label when slider changes', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '7.5' } });
    const matches = screen.getAllByText(/7\.5%/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('table header has correct column names', () => {
    render(<PercentageCalculator currentWeight={100} onApply={mockOnApply} />);
    expect(screen.getByRole('columnheader', { name: /period/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /projected weight/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /total gain/i })).toBeInTheDocument();
  });
});
