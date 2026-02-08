/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PerformanceTab from '../PerformanceTab';
import { analyticsApi } from '@/lib/api/analytics';

jest.mock('@/lib/api/analytics');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/analytics',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Line Chart</div>,
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>,
}));

const mockPerformanceMetrics = [
  {
    id: '1',
    userId: 'user123',
    exerciseId: 'ex1',
    metricType: 'one_rm' as const,
    value: 100,
    unit: 'kg',
    recordedAt: '2024-01-01T00:00:00Z',
    notes: 'Good form',
  },
  {
    id: '2',
    userId: 'user123',
    exerciseId: 'ex1',
    metricType: 'one_rm' as const,
    value: 105,
    unit: 'kg',
    recordedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    userId: 'user123',
    exerciseId: 'ex2',
    metricType: 'volume' as const,
    value: 5000,
    unit: 'kg',
    recordedAt: '2024-01-10T00:00:00Z',
  },
];

const mockPersonalBests = [
  {
    exercise: 'Bench Press',
    metric: 'one_rm',
    value: 120,
    date: '2024-01-20',
  },
  {
    exercise: 'Squat',
    metric: 'one_rm',
    value: 150,
    date: '2024-01-18',
  },
];

describe('PerformanceTab', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <PerformanceTab />
      </QueryClientProvider>
    );

  it('shows loading state initially', () => {
    (analyticsApi.getPerformanceMetrics as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    (analyticsApi.getPersonalBests as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    renderComponent();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('shows empty state when no metrics', async () => {
    (analyticsApi.getPerformanceMetrics as jest.Mock).mockResolvedValue([]);
    (analyticsApi.getPersonalBests as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No performance data yet')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Complete workouts to track your performance over time.')
    ).toBeInTheDocument();
  });

  it('renders performance metrics table', async () => {
    (analyticsApi.getPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockPerformanceMetrics
    );
    (analyticsApi.getPersonalBests as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    expect(screen.getByText('100 kg')).toBeInTheDocument();
    expect(screen.getByText('105 kg')).toBeInTheDocument();
    expect(screen.getByText('Good form')).toBeInTheDocument();
  });

  it('renders personal bests section', async () => {
    (analyticsApi.getPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockPerformanceMetrics
    );
    (analyticsApi.getPersonalBests as jest.Mock).mockResolvedValue(
      mockPersonalBests
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Personal Bests')).toBeInTheDocument();
    });

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(screen.getByText('120 kg')).toBeInTheDocument();
    expect(screen.getByText('150 kg')).toBeInTheDocument();
  });

  it('renders charts when data is available', async () => {
    (analyticsApi.getPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockPerformanceMetrics
    );
    (analyticsApi.getPersonalBests as jest.Mock).mockResolvedValue(
      mockPersonalBests
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
  });

  it('shows performance progress chart title', async () => {
    (analyticsApi.getPerformanceMetrics as jest.Mock).mockResolvedValue(
      mockPerformanceMetrics
    );
    (analyticsApi.getPersonalBests as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Performance Progress')).toBeInTheDocument();
    });
  });

  it('limits table to 20 metrics', async () => {
    const manyMetrics = Array.from({ length: 30 }, (_, i) => ({
      id: `metric-${i}`,
      userId: 'user123',
      exerciseId: 'ex1',
      metricType: 'one_rm' as const,
      value: 100 + i,
      unit: 'kg',
      recordedAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }));

    (analyticsApi.getPerformanceMetrics as jest.Mock).mockResolvedValue(
      manyMetrics
    );
    (analyticsApi.getPersonalBests as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Showing 20 of 30 metrics')).toBeInTheDocument();
    });
  });
});
