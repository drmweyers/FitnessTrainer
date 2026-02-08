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

  it('renders metric selector buttons', () => {
    render(<MetricsDisplay {...defaultProps} />);
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Body Fat')).toBeInTheDocument();
    expect(screen.getByText('Muscle Mass')).toBeInTheDocument();
  });

  it('renders time range selector', () => {
    render(<MetricsDisplay {...defaultProps} />);
    expect(screen.getByText('1M')).toBeInTheDocument();
    expect(screen.getByText('3M')).toBeInTheDocument();
    expect(screen.getByText('6M')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
  });

  it('switches metric when button is clicked', () => {
    render(<MetricsDisplay {...defaultProps} />);
    fireEvent.click(screen.getByText('Body Fat'));
    // Chart should still render
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('switches time range when button is clicked', () => {
    render(<MetricsDisplay {...defaultProps} />);
    fireEvent.click(screen.getByText('1M'));
    // Chart should still render
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });
});
