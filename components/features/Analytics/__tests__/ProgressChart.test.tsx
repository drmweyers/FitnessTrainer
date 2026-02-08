/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressChart from '../ProgressChart';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => <div data-testid="mock-line-chart">Chart</div>,
}));

const mockData = [
  { date: '2024-01-01', value: 80 },
  { date: '2024-01-15', value: 78 },
  { date: '2024-02-01', value: 77 },
  { date: '2024-02-15', value: 76 },
  { date: '2024-03-01', value: 75 },
];

describe('ProgressChart', () => {
  const mockOnTimeRangeChange = jest.fn();

  const defaultProps = {
    data: mockData,
    title: 'Weight',
    unit: 'kg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chart title', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });

  it('renders the chart component when data is present', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('shows current value in stats', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText(/Current: 75.0 kg/)).toBeInTheDocument();
  });

  it('shows statistics section', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('Total Change')).toBeInTheDocument();
    expect(screen.getByText('Data Points')).toBeInTheDocument();
  });

  it('shows data point count', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows total change value', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('-5.0')).toBeInTheDocument();
  });

  it('shows time range selector when callback is provided', () => {
    render(
      <ProgressChart
        {...defaultProps}
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('3 Months')).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
    expect(screen.getByText('1 Year')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when time range is clicked', () => {
    render(
      <ProgressChart
        {...defaultProps}
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );
    fireEvent.click(screen.getByText('7 Days'));
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('7d');
  });

  it('does not show time range selector when no callback', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.queryByText('7 Days')).not.toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(<ProgressChart {...defaultProps} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(
      screen.getByText('Start recording measurements to see your progress')
    ).toBeInTheDocument();
  });

  it('does not show statistics when data is empty', () => {
    render(<ProgressChart {...defaultProps} data={[]} />);
    expect(screen.queryByText('Average')).not.toBeInTheDocument();
  });
});
