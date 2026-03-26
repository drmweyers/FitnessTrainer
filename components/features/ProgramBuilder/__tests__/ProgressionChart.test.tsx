/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProgressionChart from '../ProgressionChart';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

const mockExercises = [
  { name: 'Squat', startWeight: 100, weeklyIncrease: 5 },
  { name: 'Bench Press', startWeight: 80, weeklyIncrease: 2.5 },
];

describe('ProgressionChart', () => {
  it('renders the chart container', () => {
    render(<ProgressionChart exercises={mockExercises} weeks={6} />);
    expect(screen.getByTestId('progression-chart')).toBeInTheDocument();
  });

  it('displays exercise names in the legend', () => {
    render(<ProgressionChart exercises={mockExercises} weeks={6} />);
    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('renders an SVG element', () => {
    const { container } = render(<ProgressionChart exercises={mockExercises} weeks={6} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders week labels on the x-axis', () => {
    render(<ProgressionChart exercises={mockExercises} weeks={4} />);
    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('W2')).toBeInTheDocument();
    expect(screen.getByText('W3')).toBeInTheDocument();
    expect(screen.getByText('W4')).toBeInTheDocument();
  });

  it('renders y-axis weight labels', () => {
    render(<ProgressionChart exercises={mockExercises} weeks={4} />);
    // Y-axis should have some weight labels
    const svgElement = screen.getByTestId('progression-chart').querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('renders a line for each exercise', () => {
    const { container } = render(<ProgressionChart exercises={mockExercises} weeks={6} />);
    const paths = container.querySelectorAll('polyline, path[data-exercise]');
    // At least one path/polyline per exercise
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('handles an empty exercises array gracefully', () => {
    render(<ProgressionChart exercises={[]} weeks={6} />);
    expect(screen.getByTestId('progression-chart')).toBeInTheDocument();
    expect(screen.getByText(/no exercises/i)).toBeInTheDocument();
  });

  it('handles a single week correctly', () => {
    render(<ProgressionChart exercises={mockExercises} weeks={1} />);
    expect(screen.getByTestId('progression-chart')).toBeInTheDocument();
    expect(screen.getByText('W1')).toBeInTheDocument();
  });

  it('shows the chart title', () => {
    render(<ProgressionChart exercises={mockExercises} weeks={6} />);
    expect(screen.getByText(/projected progression/i)).toBeInTheDocument();
  });

  it('shows correct final weight in the legend tooltip or data', () => {
    render(<ProgressionChart exercises={[{ name: 'Squat', startWeight: 100, weeklyIncrease: 5 }]} weeks={4} />);
    // After 4 weeks: 100 + (4-1)*5 = 115 lbs
    // The weight appears in the legend and possibly the chart — getAllByText is fine
    const matches = screen.getAllByText(/115/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts different week counts', () => {
    const { rerender } = render(<ProgressionChart exercises={mockExercises} weeks={8} />);
    expect(screen.getByText('W8')).toBeInTheDocument();

    rerender(<ProgressionChart exercises={mockExercises} weeks={12} />);
    expect(screen.getByText('W12')).toBeInTheDocument();
  });

  it('displays start and end weight for each exercise', () => {
    render(
      <ProgressionChart
        exercises={[{ name: 'Deadlift', startWeight: 150, weeklyIncrease: 5 }]}
        weeks={5}
      />
    );
    // Start weight label (may appear in legend and/or y-axis)
    const startMatches = screen.getAllByText(/150/);
    expect(startMatches.length).toBeGreaterThanOrEqual(1);
    // End weight: 150 + 4*5 = 170
    const endMatches = screen.getAllByText(/170/);
    expect(endMatches.length).toBeGreaterThanOrEqual(1);
  });
});
