/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import MetricsDisplay from '../MetricsDisplay';

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
}));

jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => <div data-testid="mock-chart">Chart</div>,
}));

const mockMetrics = {
  weight: [
    { date: '2024-01-01', value: 80 },
    { date: '2024-02-01', value: 78 },
    { date: '2024-03-01', value: 76 },
  ],
  bodyFat: [
    { date: '2024-01-01', value: 20 },
    { date: '2024-02-01', value: 18 },
    { date: '2024-03-01', value: 17 },
  ],
  muscleMass: [
    { date: '2024-01-01', value: 40 },
    { date: '2024-02-01', value: 41 },
    { date: '2024-03-01', value: 42 },
  ],
};

describe('MetricsDisplay', () => {
  const defaultProps = {
    metrics: mockMetrics,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component', () => {
    render(<MetricsDisplay {...defaultProps} />);
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<MetricsDisplay {...defaultProps} />);
    expect(screen.getByText('Body Metrics')).toBeInTheDocument();
  });

  it('renders metric selector as dropdown with options', () => {
    render(<MetricsDisplay {...defaultProps} />);
    // Metric selector is a <select> with options
    expect(screen.getByDisplayValue('Weight')).toBeInTheDocument();
  });

  it('renders time range selector as dropdown', () => {
    render(<MetricsDisplay {...defaultProps} />);
    // Time range selector defaults to "3 Months"
    expect(screen.getByDisplayValue('3 Months')).toBeInTheDocument();
  });

  it('switches metric when dropdown changes', () => {
    render(<MetricsDisplay {...defaultProps} />);
    const metricSelect = screen.getByDisplayValue('Weight');
    fireEvent.change(metricSelect, { target: { value: 'bodyFat' } });
    expect(screen.getByDisplayValue('Body Fat')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('switches time range when dropdown changes', () => {
    render(<MetricsDisplay {...defaultProps} />);
    const timeSelect = screen.getByDisplayValue('3 Months');
    fireEvent.change(timeSelect, { target: { value: '1m' } });
    expect(screen.getByDisplayValue('1 Month')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('displays current metric value', () => {
    render(<MetricsDisplay {...defaultProps} />);
    // Current weight is 76 (last entry)
    expect(screen.getByText('76')).toBeInTheDocument();
  });
});
